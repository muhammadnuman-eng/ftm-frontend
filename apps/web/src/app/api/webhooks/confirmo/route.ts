import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { processAffiliateWPConversion } from "@/lib/affiliatewp";
import { postAxceraWooWebhook } from "@/lib/axcera";
import {
    type ConfirmoWebhookPayload,
    getConfirmoGateway,
    mapConfirmoStatusToInternal,
} from "@/lib/confirmo";
import { storeHyrosMetadata, trackHyrosPurchase } from "@/lib/hyros";
import { trackOrderFailed, trackPlacedOrder } from "@/lib/klaviyo";
import { getPayloadClient } from "@/lib/payload";
import { logWebhookError } from "@/lib/posthog-error";
import { getProgramMappings } from "@/lib/program-mappings";

// Helper function to create purchase record for Confirmo payments
async function createPurchaseRecord(webhookPayload: ConfirmoWebhookPayload) {
    const payload = await getPayloadClient();

    // Extract metadata from the reference field (format: ftm-{purchaseId}-{programId}-{accountSize}-{email}-{firstName}-{lastName}-{timestamp})
    const reference = webhookPayload.reference;
    if (!reference || !reference.startsWith("ftm-")) {
        throw new Error("Invalid reference format in webhook payload");
    }

    const parts = reference.split("-");
    if (parts.length < 7) {
        throw new Error("Invalid reference format in webhook payload");
    }

    const purchaseId = parts[1];
    const _programId = parts[2];
    const _accountSize = parts[3];
    const customerEmail = decodeURIComponent(parts[4]);
    const firstName = parts[5];
    const lastName = parts[6];
    const customerName = `${firstName} ${lastName}`;

    if (!purchaseId) {
        console.error("Missing purchaseId in payment metadata");
        throw new Error("Missing purchaseId in payment metadata");
    }

    // Find existing purchase record
    try {
        const existingPurchase = await payload.findByID({
            collection: "purchases",
            id: String(purchaseId),
            depth: 0, // Don't populate relationships, we only need IDs
        });

        if (!existingPurchase) {
            console.error("Purchase record not found with ID:", purchaseId);
            throw new Error(`Purchase record not found with ID: ${purchaseId}`);
        }

        // CRITICAL: Validate price consistency between root-level and metadata
        const metadata =
            (existingPurchase.metadata as Record<string, unknown>) || {};
        const rootPurchasePrice =
            (existingPurchase as unknown as { purchasePrice?: number })
                .purchasePrice || 0;
        const rootTotalPrice =
            (existingPurchase as unknown as { totalPrice?: number })
                .totalPrice || 0;
        const metaTotalPrice = Number(metadata.totalPrice || 0);
        const metaOriginalPrice = Number(metadata.originalPrice || 0);

        // Check for critical price mismatch
        if (
            metaTotalPrice > 0 &&
            Math.abs(rootTotalPrice - metaTotalPrice) > 1
        ) {
            console.error(
                "[Confirmo Webhook] CRITICAL PRICE MISMATCH DETECTED!",
                {
                    purchaseId: existingPurchase.id,
                    orderNumber: webhookPayload.reference,
                    rootTotalPrice,
                    metaTotalPrice,
                    rootPurchasePrice,
                    metaOriginalPrice,
                    difference: rootTotalPrice - metaTotalPrice,
                },
            );

            // Fix the mismatch by updating metadata to match root values
            await payload.update({
                collection: "purchases",
                id: existingPurchase.id,
                data: {
                    metadata: {
                        ...(existingPurchase.metadata as object),
                        totalPrice: rootTotalPrice,
                        originalPrice: rootPurchasePrice,
                        priceFixedAt: new Date().toISOString(),
                        priceFixedBy: "confirmo-webhook",
                    },
                },
            });

            console.log(
                "[Confirmo Webhook] Price mismatch auto-corrected in metadata",
                {
                    purchaseId: existingPurchase.id,
                    correctedTotalPrice: rootTotalPrice,
                    correctedOriginalPrice: rootPurchasePrice,
                },
            );
        }

        // Update the purchase record with payment details
        const updatedPurchase = await payload.update({
            collection: "purchases",
            id: existingPurchase.id,
            data: {
                status: mapConfirmoStatusToInternal(webhookPayload.status),
                paymentMethod: "crypto",
                transactionId: webhookPayload.id,
                discountCode: existingPurchase.discountCode, // Preserve discount code
                // Preserve existing isInAppPurchase value
                isInAppPurchase: (
                    existingPurchase as unknown as { isInAppPurchase?: boolean }
                ).isInAppPurchase,
                metadata: {
                    ...((existingPurchase.metadata as object) || {}),
                    gateway: "confirmo",
                    cryptoCurrency: webhookPayload.rate?.currencyTo || "-",
                    cryptoAmount: webhookPayload.paid?.amount || 0,
                    exchangeRate: webhookPayload.rate?.value || 0,
                    cryptoTransactions:
                        webhookPayload.cryptoTransactions?.map(
                            (tx) => tx.txid,
                        ) || [],
                    customerData: {
                        email: customerEmail,
                        name: customerName,
                    },
                    webhookProcessedAt: new Date().toISOString(),
                },
            },
        });

        // Process AffiliateWP conversion if payment succeeded
        if (webhookPayload.status === "paid") {
            // Process AffiliateWP conversion if payment succeeded
            try {
                await processAffiliateWPConversion(payload, existingPurchase);
            } catch (error) {
                // Log error but don't fail the webhook
                console.error(
                    "[Confirmo Webhook] Error processing AffiliateWP conversion:",
                    error,
                );
                logWebhookError({
                    source: "confirmo-webhook-affiliatewp-conversion",
                    error,
                    gateway: "confirmo",
                    webhookType: webhookPayload.status,
                    purchaseId: existingPurchase.id,
                    orderNumber: webhookPayload.reference,
                    status: webhookPayload.status,
                    amount: webhookPayload.customerAmount?.amount,
                    currency: webhookPayload.customerAmount?.currency,
                    customerEmail: customerEmail,
                });
            }

            // Track completed purchase in Hyros
            try {
                const hyrosResult = await trackHyrosPurchase({
                    purchase: updatedPurchase,
                    eventType: "completed",
                });

                await storeHyrosMetadata(
                    payload,
                    existingPurchase.id,
                    hyrosResult,
                    "completed",
                );
            } catch (error) {
                console.error(
                    "[Confirmo Webhook] Error tracking Hyros conversion:",
                    error,
                );
                logWebhookError({
                    source: "confirmo-webhook-hyros-tracking",
                    error,
                    gateway: "confirmo",
                    webhookType: webhookPayload.status,
                    purchaseId: existingPurchase.id,
                    orderNumber: webhookPayload.reference,
                    status: webhookPayload.status,
                    amount: webhookPayload.customerAmount?.amount,
                    currency: webhookPayload.customerAmount?.currency,
                    customerEmail: customerEmail,
                });
            }

            // Track completed purchase in Klaviyo
            try {
                const programId =
                    typeof updatedPurchase.program === "number"
                        ? updatedPurchase.program
                        : updatedPurchase.program?.id;

                await trackPlacedOrder({
                    email: updatedPurchase.customerEmail,
                    orderId: updatedPurchase.orderNumber,
                    total: updatedPurchase.totalPrice || 0,
                    currency: updatedPurchase.currency || "USD",
                    discountCode: updatedPurchase.discountCode || null,
                    items: [
                        {
                            product_id: programId,
                            sku: `${programId}-${updatedPurchase.accountSize}`,
                            name:
                                updatedPurchase.programName ||
                                `${updatedPurchase.platformName} - ${updatedPurchase.accountSize}`,
                            quantity: 1,
                            price:
                                updatedPurchase.purchasePrice ||
                                updatedPurchase.totalPrice ||
                                0,
                        },
                    ],
                });
            } catch (error) {
                console.error(
                    "[Confirmo Webhook] Error tracking Klaviyo conversion:",
                    error,
                );
                logWebhookError({
                    source: "confirmo-webhook-klaviyo-tracking",
                    error,
                    gateway: "confirmo",
                    webhookType: webhookPayload.status,
                    purchaseId: existingPurchase.id,
                    orderNumber: webhookPayload.reference,
                    status: webhookPayload.status,
                    amount: webhookPayload.customerAmount?.amount,
                    currency: webhookPayload.customerAmount?.currency,
                    customerEmail: updatedPurchase.customerEmail,
                });
            }
        } else if (
            webhookPayload.status === "expired" ||
            webhookPayload.status === "error"
        ) {
            // Track declined/cancelled purchase in Hyros
            try {
                const hyrosResult = await trackHyrosPurchase({
                    purchase: updatedPurchase,
                    eventType: "declined",
                });

                await storeHyrosMetadata(
                    payload,
                    existingPurchase.id,
                    hyrosResult,
                    "declined",
                );
            } catch (error) {
                console.error(
                    "[Confirmo Webhook] Error tracking Hyros decline:",
                    error,
                );
                logWebhookError({
                    source: "confirmo-webhook-hyros-decline",
                    error,
                    gateway: "confirmo",
                    webhookType: webhookPayload.status,
                    purchaseId: existingPurchase.id,
                    orderNumber: webhookPayload.reference,
                    status: webhookPayload.status,
                    amount: webhookPayload.customerAmount?.amount,
                    currency: webhookPayload.customerAmount?.currency,
                    customerEmail: updatedPurchase.customerEmail,
                });
            }

            // Track failed purchase in Klaviyo
            try {
                const programId =
                    typeof updatedPurchase.program === "number"
                        ? updatedPurchase.program
                        : updatedPurchase.program?.id;

                await trackOrderFailed({
                    email: updatedPurchase.customerEmail,
                    orderId: updatedPurchase.orderNumber,
                    total: updatedPurchase.totalPrice || 0,
                    currency: updatedPurchase.currency || "USD",
                    discountCode: updatedPurchase.discountCode || null,
                    items: [
                        {
                            product_id: programId,
                            sku: `${programId}-${updatedPurchase.accountSize}`,
                            name:
                                updatedPurchase.programName ||
                                `${updatedPurchase.platformName} - ${updatedPurchase.accountSize}`,
                            quantity: 1,
                            price:
                                updatedPurchase.purchasePrice ||
                                updatedPurchase.totalPrice ||
                                0,
                        },
                    ],
                    reason: webhookPayload.status,
                });
            } catch (error) {
                console.error(
                    "[Confirmo Webhook] Error tracking Klaviyo decline:",
                    error,
                );
                logWebhookError({
                    source: "confirmo-webhook-klaviyo-decline",
                    error,
                    gateway: "confirmo",
                    webhookType: webhookPayload.status,
                    purchaseId: existingPurchase.id,
                    orderNumber: webhookPayload.reference,
                    status: webhookPayload.status,
                    amount: webhookPayload.customerAmount?.amount,
                    currency: webhookPayload.customerAmount?.currency,
                    customerEmail: updatedPurchase.customerEmail,
                });
            }
        }

        // If paid, notify Axcera webhook
        try {
            if (webhookPayload.status === "paid") {
                console.log(
                    "[Confirmo Webhook] Starting Axcera webhook for completed order:",
                    {
                        purchaseId: existingPurchase.id,
                        orderNumber: (
                            existingPurchase as unknown as {
                                orderNumber?: string;
                            }
                        ).orderNumber,
                        hasProgramField: "program" in existingPurchase,
                        hasPlatformSlug:
                            "platformSlug" in
                            (existingPurchase as unknown as Record<
                                string,
                                unknown
                            >),
                        hasMetadata: "metadata" in existingPurchase,
                        programName: existingPurchase.programName,
                    },
                );

                // Use purchasePrice from the purchase record (base price without add-ons)
                const total = String(
                    (existingPurchase as unknown as { purchasePrice?: number })
                        .purchasePrice || 0,
                );

                // Resolve product/variation via mappings
                let productIdNum = 0;
                let variationIdNum = 0;

                // Extract purchaseType and account_id for reset/activation orders
                const purchaseType = (
                    existingPurchase as unknown as {
                        purchaseType?:
                            | "original-order"
                            | "reset-order"
                            | "activation-order";
                    }
                ).purchaseType;
                const existingMeta =
                    (existingPurchase.metadata as
                        | Record<string, unknown>
                        | null
                        | undefined) || {};
                const accountId = existingMeta.account_id as string | undefined;

                try {
                    // Handle both populated relationship and ID
                    // When depth:0, program is the ID directly (string or number)
                    const rawProgram = existingPurchase.program;
                    const programId =
                        typeof rawProgram === "string"
                            ? rawProgram
                            : typeof rawProgram === "number"
                              ? String(rawProgram)
                              : typeof rawProgram === "object" &&
                                  rawProgram !== null
                                ? String(
                                      (
                                          rawProgram as {
                                              id?: string | number;
                                          }
                                      ).id || "",
                                  )
                                : "";
                    const platformSlug =
                        (
                            existingPurchase as unknown as {
                                platformSlug?: string;
                            }
                        ).platformSlug || "";
                    let tierId = (existingMeta.tierId as string) || "";

                    const accountSize =
                        (
                            existingPurchase as unknown as {
                                accountSize?: string;
                            }
                        ).accountSize || "";

                    console.log(
                        "[Confirmo Webhook] Purchase data for mapping:",
                        {
                            purchaseId: existingPurchase.id,
                            rawProgram: existingPurchase.program,
                            programId,
                            platformSlug,
                            tierId,
                            accountSize,
                            programName: existingPurchase.programName,
                            metadata: existingMeta,
                        },
                    );

                    if (!programId) {
                        console.error(
                            "[Confirmo Webhook] Missing programId - cannot resolve mapping",
                            {
                                purchaseId: existingPurchase.id,
                                program: existingPurchase.program,
                                programType: typeof existingPurchase.program,
                            },
                        );
                    }

                    if (programId && platformSlug) {
                        // If tierId is missing, try to derive it from the program's pricing tiers
                        if (!tierId && programId && accountSize) {
                            try {
                                const program = await payload.findByID({
                                    collection: "programs",
                                    id: Number(programId),
                                });
                                const tiers = (
                                    program as {
                                        pricingTiers?: Array<{
                                            id?: string;
                                            accountSize?: string;
                                        }>;
                                    }
                                )?.pricingTiers;
                                if (Array.isArray(tiers)) {
                                    const normalizeSize = (size: string) =>
                                        size
                                            .replace(/[\s$,]/g, "")
                                            .toUpperCase();
                                    const targetSize =
                                        normalizeSize(accountSize);
                                    const matchingTier = tiers.find(
                                        (t) =>
                                            normalizeSize(
                                                String(t.accountSize || ""),
                                            ) === targetSize,
                                    );
                                    if (matchingTier?.id) {
                                        tierId = matchingTier.id;
                                        console.log(
                                            "[Confirmo Webhook] Derived tierId from program tiers:",
                                            tierId,
                                        );
                                    }
                                }
                            } catch (err) {
                                console.warn(
                                    "[Confirmo Webhook] Failed to derive tierId:",
                                    err,
                                );
                            }
                        }

                        // First try: use tierId from metadata if available
                        if (tierId) {
                            console.log(
                                "[Confirmo Webhook] Looking up mapping with:",
                                {
                                    programId: String(programId),
                                    tierId,
                                    platformId: platformSlug,
                                    purchaseType,
                                },
                            );

                            // Fetch full mapping from global to access reset/activation product IDs
                            const mappingsGlobal = await payload.findGlobal({
                                slug: "program-product-mappings",
                            });
                            const mappings = mappingsGlobal?.mappings || [];

                            const fullMapping = mappings.find(
                                (m: {
                                    program?: number | { id?: number };
                                    tierId?: string;
                                    platformId?: string;
                                    productId?: string | null;
                                    variationId?: string | null;
                                    reset_fee_product_id?: string | null;
                                    activation_product_id?: string | null;
                                }) => {
                                    const mappingProgramId =
                                        typeof m.program === "number"
                                            ? m.program
                                            : typeof m.program === "object" &&
                                                m.program !== null
                                              ? m.program.id
                                              : null;
                                    return (
                                        String(mappingProgramId) ===
                                            String(programId) &&
                                        m.tierId === tierId &&
                                        m.platformId === platformSlug
                                    );
                                },
                            );

                            console.log(
                                "[Confirmo Webhook] Full mapping result:",
                                fullMapping,
                            );

                            if (fullMapping) {
                                // Use appropriate product ID based on order type
                                if (purchaseType === "reset-order") {
                                    // Check reset_product_type from metadata
                                    const resetProductType =
                                        existingMeta.reset_product_type as
                                            | "evaluation"
                                            | "funded"
                                            | undefined;

                                    if (
                                        resetProductType === "funded" &&
                                        fullMapping.reset_fee_funded_product_id
                                    ) {
                                        productIdNum = Number(
                                            fullMapping.reset_fee_funded_product_id,
                                        );
                                        // Use reset_fee_funded_variation_id if available, otherwise fall back to variationId
                                        variationIdNum = Number(
                                            (fullMapping as any)
                                                .reset_fee_funded_variation_id ||
                                                fullMapping.variationId,
                                        );
                                        console.log(
                                            "[Confirmo Webhook] Using reset fee funded product ID:",
                                            productIdNum,
                                            "variation ID:",
                                            variationIdNum,
                                        );
                                    } else if (
                                        fullMapping.reset_fee_product_id
                                    ) {
                                        // Default to evaluation (backwards compatibility)
                                        productIdNum = Number(
                                            fullMapping.reset_fee_product_id,
                                        );
                                        variationIdNum = Number(
                                            fullMapping.variationId,
                                        );
                                        console.log(
                                            "[Confirmo Webhook] Using reset fee product ID:",
                                            productIdNum,
                                            "variation ID:",
                                            variationIdNum,
                                        );
                                    }
                                } else if (
                                    purchaseType === "activation-order" &&
                                    fullMapping.activation_product_id
                                ) {
                                    productIdNum = Number(
                                        fullMapping.activation_product_id,
                                    );
                                    variationIdNum = Number(
                                        fullMapping.variationId,
                                    );
                                    console.log(
                                        "[Confirmo Webhook] Using activation product ID:",
                                        productIdNum,
                                        "variation ID:",
                                        variationIdNum,
                                    );
                                } else if (
                                    fullMapping.productId &&
                                    fullMapping.variationId
                                ) {
                                    // Original order or fallback
                                    productIdNum = Number(
                                        fullMapping.productId,
                                    );
                                    variationIdNum = Number(
                                        fullMapping.variationId,
                                    );
                                }
                            }
                        } else {
                            // Fallback: try matching by accountSize (legacy method)
                            if (accountSize) {
                                const mappings = await getProgramMappings(
                                    Number(programId) || 0,
                                );
                                const sanitized = accountSize
                                    .replace(/[^a-zA-Z0-9]/g, "-")
                                    .toLowerCase();
                                const match = mappings.find(
                                    (m) =>
                                        m.platformId === platformSlug &&
                                        m.tierId
                                            ?.toLowerCase()
                                            .endsWith(sanitized),
                                );
                                if (match) {
                                    productIdNum = Number(match.productId || 0);
                                    variationIdNum = Number(
                                        match.variationId || 0,
                                    );
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error(
                        "Failed to resolve product/variation mapping (confirmo):",
                        e,
                    );
                }

                // Resolve billing info from purchase
                const billingAddress =
                    (
                        existingPurchase as unknown as {
                            billingAddress?: {
                                address?: string;
                                city?: string;
                                state?: string;
                                postalCode?: string;
                                country?: string;
                            };
                        }
                    ).billingAddress || {};
                const countryUpper = (billingAddress.country || "")
                    .toString()
                    .toUpperCase();

                // Resolve add-on keys -> fee_lines
                const selectedAddOns =
                    (
                        existingPurchase as unknown as {
                            selectedAddOns?: Array<{ addOn?: number | string }>;
                        }
                    ).selectedAddOns || [];
                const addOnKeys: string[] = [];
                try {
                    for (const item of selectedAddOns) {
                        const addOnId =
                            typeof item.addOn === "object"
                                ? (item.addOn as { id?: number | string })?.id
                                : item.addOn;
                        if (!addOnId) continue;
                        try {
                            const addOnDoc = await payload.findByID({
                                collection: "add-ons",
                                id: String(addOnId),
                            });
                            const key = (addOnDoc as { key?: string }).key;
                            if (typeof key === "string" && key) {
                                addOnKeys.push(key);
                            }
                        } catch {
                            // ignore missing add-on
                        }
                    }
                } catch {
                    console.error("Failed to collect add-on keys (confirmo)");
                }

                const orderNumber =
                    (existingPurchase as unknown as { orderNumber?: string })
                        .orderNumber || String(existingPurchase.id);

                // Build metadata array for reset/activation orders
                const orderMetadata: Array<{
                    key: string;
                    value: string | number;
                }> = [];
                if (
                    (purchaseType === "reset-order" ||
                        purchaseType === "activation-order") &&
                    accountId
                ) {
                    orderMetadata.push({
                        key: "account_id",
                        value: accountId,
                    });
                }

                await postAxceraWooWebhook(
                    {
                        id: Number(orderNumber),
                        status: "completed",
                        currency:
                            webhookPayload.customerAmount.currency.toUpperCase(),
                        date_created: new Date().toISOString(),
                        total,
                        billing: {
                            first_name: firstName,
                            last_name: lastName,
                            company: "",
                            address_1: (billingAddress.address as string) || "",
                            address_2: "",
                            city: (billingAddress.city as string) || "",
                            state: (billingAddress.state as string) || "",
                            postcode:
                                (billingAddress.postalCode as string) || "",
                            country: countryUpper,
                            email: customerEmail,
                            phone: "",
                        },
                        line_items: [
                            {
                                name: existingPurchase.programName || "Program",
                                product_id: variationIdNum,
                                variation_id: productIdNum,
                                total,
                            },
                        ],
                        fee_lines: addOnKeys.length
                            ? [
                                  {
                                      meta_data: [
                                          {
                                              id: 4182315,
                                              key: "_wc_checkout_add_on_value",
                                              value: addOnKeys,
                                          },
                                      ],
                                  },
                              ]
                            : [],
                        ...(orderMetadata.length > 0
                            ? { meta_data: orderMetadata }
                            : {}),
                    },
                    {
                        gateway: "confirmo",
                        purchaseId: existingPurchase.id,
                    },
                );
            }
        } catch (webhookError) {
            console.error(
                "Axcera webhook post (confirmo) failed:",
                webhookError,
            );
            logWebhookError({
                source: "confirmo-webhook-axcera-post",
                error: webhookError,
                gateway: "confirmo",
                webhookType: webhookPayload.status,
                purchaseId: existingPurchase.id,
                orderNumber: webhookPayload.reference,
                status: webhookPayload.status,
                amount: webhookPayload.customerAmount?.amount,
                currency: webhookPayload.customerAmount?.currency,
                customerEmail: customerEmail,
            });
        }

        return updatedPurchase;
    } catch (error) {
        console.error("Error updating purchase record:", error);
        logWebhookError({
            source: "confirmo-webhook-purchase-update",
            error,
            gateway: "confirmo",
            webhookType: webhookPayload.status,
            orderNumber: webhookPayload.reference,
            status: webhookPayload.status,
            amount: webhookPayload.customerAmount?.amount,
            currency: webhookPayload.customerAmount?.currency,
        });
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("bp-signature");

        // Validate webhook signature if callback password is configured
        const confirmoGateway = getConfirmoGateway();
        if (
            signature &&
            !confirmoGateway.validateWebhookSignature(body, signature)
        ) {
            console.error("Invalid webhook signature");
            logWebhookError({
                source: "confirmo-webhook-invalid-signature",
                error: new Error("Invalid webhook signature"),
                gateway: "confirmo",
                additionalContext: {
                    hasSignature: !!signature,
                },
            });
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 },
            );
        }

        const webhookPayload: ConfirmoWebhookPayload = JSON.parse(body);

        // Verify invoice status from API for security (recommended by Confirmo docs)
        let verifiedPayload = webhookPayload;
        if (webhookPayload.status === "paid") {
            try {
                const verifiedInvoice = await confirmoGateway.getPayment(
                    webhookPayload.id,
                );
                console.log(
                    "[Confirmo Webhook] Verified invoice status from API:",
                    {
                        webhookStatus: webhookPayload.status,
                        apiStatus: verifiedInvoice.status,
                    },
                );
                // Use verified status from API
                verifiedPayload = {
                    ...webhookPayload,
                    status: verifiedInvoice.status,
                };
            } catch (error) {
                console.error(
                    "[Confirmo Webhook] Failed to verify invoice status:",
                    error,
                );
                logWebhookError({
                    source: "confirmo-webhook-invoice-verification",
                    error,
                    gateway: "confirmo",
                    webhookType: webhookPayload.status,
                    transactionId: webhookPayload.id,
                    orderNumber: webhookPayload.reference,
                    status: webhookPayload.status,
                    amount: webhookPayload.customerAmount?.amount,
                    currency: webhookPayload.customerAmount?.currency,
                });
                // Continue with webhook data but log the error
            }
        }

        // Handle different webhook events based on status
        switch (verifiedPayload.status) {
            case "paid": {
                // Update purchase record
                try {
                    await createPurchaseRecord(verifiedPayload);
                } catch (error) {
                    console.error(
                        "Error processing successful payment:",
                        error,
                    );
                    logWebhookError({
                        source: "confirmo-webhook-successful-payment",
                        error,
                        gateway: "confirmo",
                        webhookType: verifiedPayload.status,
                        transactionId: verifiedPayload.id,
                        orderNumber: verifiedPayload.reference,
                        status: verifiedPayload.status,
                        amount: verifiedPayload.customerAmount?.amount,
                        currency: verifiedPayload.customerAmount?.currency,
                    });
                    // Don't return an error response here as payment already succeeded
                    // Log the error and handle it separately
                }

                break;
            }

            case "expired":
            case "error": {
                // Update purchase record if it exists
                try {
                    await createPurchaseRecord(verifiedPayload);
                } catch (error) {
                    console.error("Error updating failed payment:", error);
                    logWebhookError({
                        source: "confirmo-webhook-failed-payment",
                        error,
                        gateway: "confirmo",
                        webhookType: verifiedPayload.status,
                        transactionId: verifiedPayload.id,
                        orderNumber: verifiedPayload.reference,
                        status: verifiedPayload.status,
                        amount: verifiedPayload.customerAmount?.amount,
                        currency: verifiedPayload.customerAmount?.currency,
                    });
                }

                break;
            }

            case "active":
            case "prepared":
            case "confirming": {
                // Update purchase record in pending state
                try {
                    await createPurchaseRecord(verifiedPayload);
                } catch (error) {
                    console.error(
                        "Error updating pending payment record:",
                        error,
                    );
                    logWebhookError({
                        source: "confirmo-webhook-pending-payment",
                        error,
                        gateway: "confirmo",
                        webhookType: verifiedPayload.status,
                        transactionId: verifiedPayload.id,
                        orderNumber: verifiedPayload.reference,
                        status: verifiedPayload.status,
                        amount: verifiedPayload.customerAmount?.amount,
                        currency: verifiedPayload.customerAmount?.currency,
                    });
                }

                break;
            }

            default:
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error processing Confirmo webhook:", error);
        logWebhookError({
            source: "confirmo-webhook-main",
            error,
            gateway: "confirmo",
        });
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 },
        );
    }
}
