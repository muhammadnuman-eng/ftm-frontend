import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { processAffiliateWPConversion } from "@/lib/affiliatewp";
import { postAxceraWooWebhook } from "@/lib/axcera";
import { storeHyrosMetadata, trackHyrosPurchase } from "@/lib/hyros";
import { trackOrderFailed, trackPlacedOrder } from "@/lib/klaviyo";
import { getPayloadClient } from "@/lib/payload";
import {
    mapPaytikoStatusToInternal,
    verifyWebhookSignature,
} from "@/lib/paytiko";
import { logWebhookError } from "@/lib/posthog-error";
import { getProgramMappings } from "@/lib/program-mappings";

interface PaytikoWebhookPayload {
    Action: string;
    ActionId: string;
    OrderId: string;
    AccountId: string;
    AccountDetails?: Record<string, unknown>;
    TransactionType?: string; // PayIn / PayOut / Refund
    TransactionStatus:
        | "Success"
        | "Rejected"
        | "Failed"
        | "SubscriptionCancelled";
    InitialAmount?: number;
    Currency?: string;
    TransactionId?: number;
    ExternalTransactionId?: string;
    PaymentProcessor?: string;
    DeclineReasonText?: string | null;
    CardType?: string;
    LastCcDigits?: string;
    CascadingInfo?: unknown;
    IssueDate?: string;
    InternalPspId?: string;
    MaskedPan?: string;
    Signature: string;
}

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text();
        const payloadJson: PaytikoWebhookPayload = JSON.parse(bodyText);

        const orderId = String(payloadJson.OrderId || "").trim();
        const signature =
            payloadJson.Signature || request.headers.get("x-paytiko-signature");

        if (!orderId || !signature) {
            return NextResponse.json(
                { error: "Missing orderId or signature" },
                { status: 400 },
            );
        }

        const merchantSecret = process.env.PAYTIKO_MERCHANT_SECRET || "";
        const valid = verifyWebhookSignature(
            orderId,
            signature,
            merchantSecret,
        );
        if (!valid) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 401 },
            );
        }

        const payload = await getPayloadClient();

        // Find purchase by orderNumber first, fallback to id numeric
        const purchases = await payload.find({
            collection: "purchases",
            where: {
                orderNumber: { equals: orderId },
            },
            limit: 1,
        });

        let purchase = purchases.docs[0];
        if (!purchase) {
            // try by numeric id
            try {
                const byId = await payload.findByID({
                    collection: "purchases",
                    id: Number(orderId),
                });
                if (!byId) {
                    return NextResponse.json({ received: true });
                }
                purchase = byId;
            } catch {
                return NextResponse.json({ received: true });
            }
        }

        // CRITICAL: Validate price consistency between root-level and metadata
        if (purchase) {
            const metadata =
                (purchase.metadata as Record<string, unknown>) || {};
            const rootPurchasePrice =
                (purchase as unknown as { purchasePrice?: number })
                    .purchasePrice || 0;
            const rootTotalPrice =
                (purchase as unknown as { totalPrice?: number }).totalPrice ||
                0;
            const metaTotalPrice = Number(metadata.totalPrice || 0);
            const metaOriginalPrice = Number(metadata.originalPrice || 0);

            // Check for critical price mismatch
            if (
                metaTotalPrice > 0 &&
                Math.abs(rootTotalPrice - metaTotalPrice) > 1
            ) {
                console.error(
                    "[Paytiko Webhook] CRITICAL PRICE MISMATCH DETECTED!",
                    {
                        purchaseId: purchase.id,
                        orderNumber: orderId,
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
                    id: purchase.id,
                    data: {
                        metadata: {
                            ...(purchase.metadata as object),
                            totalPrice: rootTotalPrice,
                            originalPrice: rootPurchasePrice,
                            priceFixedAt: new Date().toISOString(),
                            priceFixedBy: "paytiko-webhook",
                        },
                    },
                });

                console.log(
                    "[Paytiko Webhook] Price mismatch auto-corrected in metadata",
                    {
                        purchaseId: purchase.id,
                        correctedTotalPrice: rootTotalPrice,
                        correctedOriginalPrice: rootPurchasePrice,
                    },
                );
            }
        }

        const nextStatus = mapPaytikoStatusToInternal(
            payloadJson.TransactionStatus,
        );

        const updateData: Record<string, unknown> = {
            status: nextStatus,
            paymentMethod: "paytiko",
            transactionId: String(
                payloadJson.ExternalTransactionId ||
                    payloadJson.TransactionId ||
                    "",
            ),
            // Preserve existing isInAppPurchase value
            isInAppPurchase: (
                purchase as unknown as { isInAppPurchase?: boolean }
            )?.isInAppPurchase,
            metadata: {
                ...(purchase?.metadata as object),
                paytiko: {
                    transactionType: payloadJson.TransactionType,
                    transactionStatus: payloadJson.TransactionStatus,
                    initialAmount: payloadJson.InitialAmount,
                    currency: payloadJson.Currency,
                    transactionId: payloadJson.TransactionId,
                    externalTransactionId: payloadJson.ExternalTransactionId,
                    paymentProcessor: payloadJson.PaymentProcessor,
                    declineReason: payloadJson.DeclineReasonText,
                    cardType: payloadJson.CardType,
                    lastCcDigits: payloadJson.LastCcDigits,
                    internalPspId: payloadJson.InternalPspId,
                    maskedPan: payloadJson.MaskedPan,
                    issueDate: payloadJson.IssueDate,
                    cascadingInfo: payloadJson.CascadingInfo,
                    webhookProcessedAt: new Date().toISOString(),
                },
            },
        };

        if (purchase) {
            await payload.update({
                collection: "purchases",
                id: purchase.id,
                data: updateData,
            });

            // Send completed order to Axcera
            if (nextStatus === "completed") {
                // Send completed order to Axcera
                try {
                    console.log(
                        "[Paytiko Webhook] Starting Axcera webhook for completed order:",
                        {
                            purchaseId: purchase.id,
                            orderNumber: purchase.orderNumber,
                            programName: purchase.programName,
                        },
                    );

                    // Use purchasePrice from the purchase record (base price without add-ons)
                    const total = String(purchase.purchasePrice || 0);

                    // Resolve product/variation via mappings
                    let productIdNum = 0;
                    let variationIdNum = 0;

                    // Extract purchaseType and account_id for reset/activation orders
                    const purchaseType = purchase.purchaseType;
                    const existingMeta =
                        (purchase.metadata as
                            | Record<string, unknown>
                            | null
                            | undefined) || {};
                    const accountId = existingMeta.account_id as
                        | string
                        | undefined;

                    try {
                        const programId =
                            typeof purchase.program === "number"
                                ? purchase.program
                                : (
                                      purchase.program as
                                          | { id: number }
                                          | undefined
                                  )?.id;

                        if (!programId) {
                            console.error(
                                "[Paytiko Webhook] Program ID not found for purchase",
                            );
                            throw new Error("Program ID not found");
                        }

                        const mappings = await getProgramMappings(programId);
                        const mapping = mappings.find((m) => {
                            const mappingProgramId =
                                typeof m.program === "object" && m.program
                                    ? (m.program as { id: number }).id
                                    : m.program;
                            return (
                                String(mappingProgramId) ===
                                    String(programId) &&
                                m.tierId === existingMeta.tierId &&
                                m.platformId === purchase.platformSlug
                            );
                        });

                        const fullMapping = mapping;

                        if (fullMapping) {
                            // Use appropriate product ID based on order type
                            if (purchaseType === "reset-order") {
                                // For reset orders, prefer productId and variationId from metadata
                                // (already correctly set during order creation)
                                // Fall back to mapping if not available
                                const metaProductId = Number(
                                    existingMeta.productId || 0,
                                );
                                const metaVariationId = Number(
                                    existingMeta.variationId || 0,
                                );

                                if (metaProductId && metaVariationId) {
                                    // Use values from metadata
                                    productIdNum = metaProductId;
                                    variationIdNum = metaVariationId;
                                    console.log(
                                        "[Paytiko Webhook] Using product/variation from metadata for reset order:",
                                        {
                                            productId: productIdNum,
                                            variationId: variationIdNum,
                                            resetProductType:
                                                existingMeta.reset_product_type,
                                        },
                                    );
                                } else {
                                    // Fallback to mapping resolution
                                    const resetProductType =
                                        existingMeta.reset_product_type as
                                            | "evaluation"
                                            | "funded"
                                            | undefined;

                                    const resetFeeFundedId = (
                                        fullMapping as any
                                    ).reset_fee_funded_product_id;
                                    const resetFeeId = (fullMapping as any)
                                        .reset_fee_product_id;

                                    if (
                                        resetProductType === "funded" &&
                                        resetFeeFundedId
                                    ) {
                                        productIdNum = Number(resetFeeFundedId);
                                        variationIdNum = Number(
                                            (fullMapping as any)
                                                .reset_fee_funded_variation_id ||
                                                fullMapping.variationId,
                                        );
                                        console.log(
                                            "[Paytiko Webhook] Using reset fee funded product ID from mapping:",
                                            productIdNum,
                                            "variation ID:",
                                            variationIdNum,
                                        );
                                    } else if (resetFeeId) {
                                        productIdNum = Number(resetFeeId);
                                        variationIdNum = Number(
                                            fullMapping.variationId,
                                        );
                                        console.log(
                                            "[Paytiko Webhook] Using reset fee product ID from mapping:",
                                            productIdNum,
                                            "variation ID:",
                                            variationIdNum,
                                        );
                                    }
                                }
                            } else if (purchaseType === "activation-order") {
                                const activationId = (fullMapping as any)
                                    .activation_product_id;
                                if (activationId) {
                                    productIdNum = Number(activationId);
                                    variationIdNum = Number(
                                        fullMapping.variationId,
                                    );
                                    console.log(
                                        "[Paytiko Webhook] Using activation product ID:",
                                        productIdNum,
                                        "variation ID:",
                                        variationIdNum,
                                    );
                                }
                            } else {
                                // Default to variation for original orders
                                productIdNum = Number(fullMapping.productId);
                                variationIdNum = Number(
                                    fullMapping.variationId,
                                );
                            }
                        }
                    } catch (mappingError) {
                        console.error(
                            "[Paytiko Webhook] Error resolving product mapping:",
                            mappingError,
                        );
                        logWebhookError({
                            source: "paytiko-webhook-product-mapping",
                            error: mappingError,
                            gateway: "paytiko",
                            webhookType: payloadJson.TransactionStatus,
                            purchaseId: purchase.id,
                            orderNumber: orderId,
                            status: nextStatus,
                            amount: payloadJson.InitialAmount,
                            currency: payloadJson.Currency,
                        });
                        // Continue with default values
                    }

                    // Add-on handling
                    const addOnKeys: string[] = [];
                    if (
                        purchase.selectedAddOns &&
                        Array.isArray(purchase.selectedAddOns)
                    ) {
                        for (const item of purchase.selectedAddOns) {
                            const addOnId =
                                typeof item.addOn === "number"
                                    ? item.addOn
                                    : item.addOn?.id;
                            if (addOnId) {
                                const addOnDoc = await payload.findByID({
                                    collection: "add-ons",
                                    id: addOnId,
                                });
                                if (addOnDoc?.key) {
                                    addOnKeys.push(addOnDoc.key);
                                }
                            }
                        }
                    }

                    // Build order metadata
                    const orderMetadata = [
                        {
                            key: "_purchase_id",
                            value: String(purchase.id),
                        },
                        {
                            key: "_platform_name",
                            value: purchase.platformName || "",
                        },
                        {
                            key: "_platform_slug",
                            value: purchase.platformSlug || "",
                        },
                    ];

                    // Add account_id for reset/activation orders
                    if (accountId) {
                        orderMetadata.push({
                            key: "account_id",
                            value: accountId,
                        });
                    }

                    // Add purchase type for non-original orders
                    if (purchaseType && purchaseType !== "original-order") {
                        orderMetadata.push({
                            key: "_purchase_type",
                            value: purchaseType,
                        });
                    }

                    // Add coupon code if present
                    if (purchase.discountCode) {
                        orderMetadata.push({
                            key: "_discount_code",
                            value: purchase.discountCode,
                        });
                    }

                    // Add affiliate username if present
                    if (purchase.affiliateUsername) {
                        orderMetadata.push({
                            key: "_affiliate_username",
                            value: purchase.affiliateUsername,
                        });
                    }

                    const orderNumber =
                        (purchase as unknown as { orderNumber?: string })
                            .orderNumber || String(purchase.id);

                    await postAxceraWooWebhook(
                        {
                            id: Number(orderNumber),
                            status: "completed",
                            currency: purchase.currency || "USD",
                            date_created: new Date().toISOString(),
                            total,
                            billing: {
                                first_name:
                                    purchase.customerName?.split(" ")[0] || "",
                                last_name:
                                    purchase.customerName
                                        ?.split(" ")
                                        .slice(1)
                                        .join(" ") || "",
                                company: "",
                                address_1:
                                    purchase.billingAddress?.address || "",
                                address_2: "",
                                city: purchase.billingAddress?.city || "",
                                state: purchase.billingAddress?.state || "",
                                postcode:
                                    purchase.billingAddress?.postalCode || "",
                                country: purchase.billingAddress?.country || "",
                                email: purchase.customerEmail || "",
                                phone: "",
                            },
                            line_items: [
                                {
                                    name:
                                        purchase.programDetails ||
                                        `${purchase.accountSize} - ${purchase.programName}`,
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
                            meta_data: orderMetadata,
                        },
                        {
                            gateway: "paytiko",
                            purchaseId: purchase.id,
                        },
                    );

                    console.log(
                        "[Paytiko Webhook] Axcera webhook sent successfully",
                    );

                    // Process affiliate commission for AffiliateWP
                    if (purchase.affiliateUsername) {
                        try {
                            await processAffiliateWPConversion(
                                payload,
                                purchase,
                            );
                            console.log(
                                "[Paytiko Webhook] AffiliateWP conversion processed",
                            );
                        } catch (affError) {
                            console.error(
                                "[Paytiko Webhook] AffiliateWP conversion failed:",
                                affError,
                            );
                            logWebhookError({
                                source: "paytiko-webhook-affiliatewp-conversion",
                                error: affError,
                                gateway: "paytiko",
                                webhookType: payloadJson.TransactionStatus,
                                purchaseId: purchase.id,
                                orderNumber: orderId,
                                status: nextStatus,
                                amount: payloadJson.InitialAmount,
                                currency: payloadJson.Currency,
                                customerEmail: purchase.customerEmail,
                            });
                        }
                    }
                } catch (axceraError) {
                    console.error(
                        "[Paytiko Webhook] Axcera webhook post failed:",
                        axceraError,
                    );
                    logWebhookError({
                        source: "paytiko-webhook-axcera-post",
                        error: axceraError,
                        gateway: "paytiko",
                        webhookType: payloadJson.TransactionStatus,
                        purchaseId: purchase.id,
                        orderNumber: orderId,
                        status: nextStatus,
                        amount: payloadJson.InitialAmount,
                        currency: payloadJson.Currency,
                        customerEmail: purchase.customerEmail,
                    });
                    // Don't fail the webhook, just log the error
                }

                // Track completed purchase in Hyros
                try {
                    const updatedPurchase = await payload.findByID({
                        collection: "purchases",
                        id: purchase.id,
                    });

                    const hyrosResult = await trackHyrosPurchase({
                        purchase: updatedPurchase,
                        eventType: "completed",
                    });

                    await storeHyrosMetadata(
                        payload,
                        purchase.id,
                        hyrosResult,
                        "completed",
                    );
                } catch (error) {
                    console.error(
                        "[Paytiko Webhook] Error tracking Hyros conversion:",
                        error,
                    );
                    logWebhookError({
                        source: "paytiko-webhook-hyros-tracking",
                        error,
                        gateway: "paytiko",
                        webhookType: payloadJson.TransactionStatus,
                        purchaseId: purchase.id,
                        orderNumber: orderId,
                        status: nextStatus,
                        amount: payloadJson.InitialAmount,
                        currency: payloadJson.Currency,
                        customerEmail: purchase.customerEmail,
                    });
                }

                // Track completed purchase in Klaviyo
                try {
                    const updatedPurchase = await payload.findByID({
                        collection: "purchases",
                        id: purchase.id,
                    });

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
                        "[Paytiko Webhook] Error tracking Klaviyo conversion:",
                        error,
                    );
                    logWebhookError({
                        source: "paytiko-webhook-klaviyo-tracking",
                        error,
                        gateway: "paytiko",
                        webhookType: payloadJson.TransactionStatus,
                        purchaseId: purchase.id,
                        orderNumber: orderId,
                        status: nextStatus,
                        amount: payloadJson.InitialAmount,
                        currency: payloadJson.Currency,
                        customerEmail: purchase.customerEmail,
                    });
                }
            } else if (nextStatus === "failed") {
                // Track declined purchase in Hyros
                try {
                    const updatedPurchase = await payload.findByID({
                        collection: "purchases",
                        id: purchase.id,
                    });

                    const hyrosResult = await trackHyrosPurchase({
                        purchase: updatedPurchase,
                        eventType: "declined",
                    });

                    await storeHyrosMetadata(
                        payload,
                        purchase.id,
                        hyrosResult,
                        "declined",
                    );
                } catch (error) {
                    console.error(
                        "[Paytiko Webhook] Error tracking Hyros decline:",
                        error,
                    );
                    logWebhookError({
                        source: "paytiko-webhook-hyros-decline",
                        error,
                        gateway: "paytiko",
                        webhookType: payloadJson.TransactionStatus,
                        purchaseId: purchase.id,
                        orderNumber: orderId,
                        status: nextStatus,
                        amount: payloadJson.InitialAmount,
                        currency: payloadJson.Currency,
                        customerEmail: purchase.customerEmail,
                    });
                }

                // Track failed purchase in Klaviyo
                try {
                    const updatedPurchase = await payload.findByID({
                        collection: "purchases",
                        id: purchase.id,
                    });

                    const declineReason =
                        payloadJson.DeclineReasonText || "Payment declined";
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
                        reason: declineReason,
                    });
                } catch (error) {
                    console.error(
                        "[Paytiko Webhook] Error tracking Klaviyo decline:",
                        error,
                    );
                    logWebhookError({
                        source: "paytiko-webhook-klaviyo-decline",
                        error,
                        gateway: "paytiko",
                        webhookType: payloadJson.TransactionStatus,
                        purchaseId: purchase.id,
                        orderNumber: orderId,
                        status: nextStatus,
                        amount: payloadJson.InitialAmount,
                        currency: payloadJson.Currency,
                        customerEmail: purchase.customerEmail,
                        additionalContext: {
                            declineReason: payloadJson.DeclineReasonText,
                        },
                    });
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Error processing Paytiko webhook:", error);
        logWebhookError({
            source: "paytiko-webhook-main",
            error,
            gateway: "paytiko",
        });
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 },
        );
    }
}
