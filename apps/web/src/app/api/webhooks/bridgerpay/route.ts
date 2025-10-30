export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { processAffiliateWPConversion } from "@/lib/affiliatewp";
import { postAxceraWooWebhook } from "@/lib/axcera";
import { mapBridgerPayStatusToInternal } from "@/lib/bridgerpay";
import { storeHyrosMetadata, trackHyrosPurchase } from "@/lib/hyros";
import { trackOrderFailed, trackPlacedOrder } from "@/lib/klaviyo";
import { getPayloadClient } from "@/lib/payload";
import { logWebhookError } from "@/lib/posthog-error";
import { getProgramMappings } from "@/lib/program-mappings";

/**
 * BridgerPay Webhook Handler
 *
 * This endpoint receives webhook notifications from BridgerPay about transaction status updates.
 * You'll need to configure this webhook URL in your BridgerPay dashboard.
 *
 * Example webhook URL: https://yourdomain.com/api/webhooks/bridgerpay
 */

export async function POST(request: NextRequest) {
    try {
        // Get raw body for signature verification
        const rawBody = await request.text();

        if (!rawBody || rawBody.trim() === "") {
            console.error("[BridgerPay Webhook] Empty request body");
            logWebhookError({
                source: "bridgerpay-webhook-empty-body",
                error: new Error("Empty request body"),
                gateway: "bridgerpay",
            });
            return NextResponse.json(
                { error: "Empty request body" },
                { status: 400 },
            );
        }

        // Parse the webhook payload
        let webhookData: Record<string, unknown>;
        try {
            webhookData = JSON.parse(rawBody);
        } catch (parseError) {
            console.error("[BridgerPay Webhook] Invalid JSON body");
            logWebhookError({
                source: "bridgerpay-webhook-invalid-json",
                error: parseError,
                gateway: "bridgerpay",
            });
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 },
            );
        }

        // Log full payload for debugging
        console.log(
            "[BridgerPay Webhook] Raw webhook payload:",
            JSON.stringify(webhookData, null, 2),
        );
        console.log("[BridgerPay Webhook] Headers:", {
            contentType: request.headers.get("content-type"),
            signature: request.headers.get("x-bridgerpay-signature"),
            userAgent: request.headers.get("user-agent"),
        });

        // Helper function to safely extract string value
        const extractString = (
            obj: unknown,
            ...keys: string[]
        ): string | undefined => {
            if (!obj || typeof obj !== "object") return undefined;
            for (const key of keys) {
                const value = (obj as Record<string, unknown>)[key];
                if (typeof value === "string" && value) return value;
            }
            return undefined;
        };

        // Helper function to safely extract number value
        const extractNumber = (
            obj: unknown,
            ...keys: string[]
        ): number | undefined => {
            if (!obj || typeof obj !== "object") return undefined;
            for (const key of keys) {
                const value = (obj as Record<string, unknown>)[key];
                if (typeof value === "number") return value;
            }
            return undefined;
        };

        // Extract webhook type
        const webhookType =
            extractString(webhookData, "type") ||
            extractString(
                webhookData.webhook as Record<string, unknown>,
                "type",
            );

        // BridgerPay structure: data.charge contains the transaction info
        let order_id: string | undefined;
        let status: string | undefined;
        let transaction_id: string | undefined;
        let amount: number | undefined;
        let currency: string | undefined;

        // Extract from data object
        if (webhookData.data && typeof webhookData.data === "object") {
            const dataObj = webhookData.data as Record<string, unknown>;

            // First check data level (for "approved" webhooks)
            order_id = extractString(
                dataObj,
                "order_id",
                "orderId",
                "reference",
            );

            console.log("[BridgerPay Webhook] Checking data object:", {
                dataOrderId: order_id,
                hasCharge: !!dataObj.charge,
                chargeType: typeof dataObj.charge,
            });

            // Then check charge object (for "cashier.session.close" webhooks)
            if (dataObj.charge && typeof dataObj.charge === "object") {
                const charge = dataObj.charge as Record<string, unknown>;

                // Use charge.order_id if data.order_id wasn't found
                if (!order_id) {
                    order_id = extractString(charge, "order_id", "orderId");
                }

                transaction_id = extractString(
                    charge,
                    "psp_order_id",
                    "id",
                    "uuid",
                    "transaction_id",
                    "transactionId",
                );

                console.log("[BridgerPay Webhook] Charge extraction:", {
                    order_id,
                    transaction_id,
                    chargeType: charge.type,
                });

                // Extract status and amount from attributes
                if (
                    charge.attributes &&
                    typeof charge.attributes === "object"
                ) {
                    const attributes = charge.attributes as Record<
                        string,
                        unknown
                    >;
                    status = extractString(
                        attributes,
                        "status",
                        "transaction_status",
                    );
                    amount = extractNumber(
                        attributes,
                        "amount",
                        "total_amount",
                    );
                    currency = extractString(attributes, "currency");
                }

                // Also check at charge level
                if (!status) status = extractString(charge, "status", "type");
                if (!amount) amount = extractNumber(charge, "amount");
                if (!currency) currency = extractString(charge, "currency");
            }
        }

        // Fallback: try top level
        if (!order_id)
            order_id = extractString(
                webhookData,
                "order_id",
                "orderId",
                "reference",
            );
        if (!status)
            status = extractString(
                webhookData,
                "status",
                "transaction_status",
                "state",
            );
        if (!transaction_id)
            transaction_id = extractString(
                webhookData,
                "transaction_id",
                "transactionId",
                "id",
            );
        if (!amount)
            amount = extractNumber(webhookData, "amount", "transaction_amount");
        if (!currency)
            currency = extractString(
                webhookData,
                "currency",
                "transaction_currency",
            );

        console.log("[BridgerPay Webhook] Extracted fields:", {
            webhookType,
            order_id,
            status,
            transaction_id,
            amount,
            currency,
        });

        // Only process "approved" and "declined" webhooks
        if (webhookType !== "approved" && webhookType !== "declined") {
            console.log(
                "[BridgerPay Webhook] Ignoring webhook type:",
                webhookType,
            );
            return NextResponse.json(
                {
                    message: "Webhook received",
                    note: `Webhook type '${webhookType}' is not processed (only 'approved' and 'declined')`,
                },
                { status: 200 },
            );
        }

        if (!order_id) {
            console.error("[BridgerPay Webhook] Missing order_id", {
                webhookType,
                availableKeys: Object.keys(webhookData),
            });

            // Return 200 to acknowledge receipt even if we can't process
            return NextResponse.json(
                {
                    message: "Webhook received",
                    note: "Could not extract order_id from payload",
                },
                { status: 200 },
            );
        }

        // Use webhook type as status if not explicitly set
        if (!status && webhookType) {
            status = webhookType;
            console.log(
                "[BridgerPay Webhook] Using webhook type as status:",
                status,
            );
        }

        const payload = await getPayloadClient();

        // Find the purchase by order number
        const purchases = await payload.find({
            collection: "purchases",
            where: {
                orderNumber: {
                    equals: order_id,
                },
            },
            limit: 1,
            depth: 0, // Don't populate relationships, we only need IDs
        });

        if (!purchases.docs || purchases.docs.length === 0) {
            console.error("[BridgerPay Webhook] Purchase not found", {
                orderId: order_id,
            });
            logWebhookError({
                source: "bridgerpay-webhook-purchase-not-found",
                error: new Error("Purchase not found"),
                gateway: "bridgerpay",
                orderNumber: order_id,
                webhookType,
                transactionId: transaction_id,
                status,
                amount,
                currency,
            });
            return NextResponse.json(
                { error: "Purchase not found" },
                { status: 404 },
            );
        }

        const purchase = purchases.docs[0];

        // CRITICAL: Validate price consistency between root-level and metadata
        const metadata = (purchase.metadata as Record<string, unknown>) || {};
        const rootPurchasePrice =
            (purchase as unknown as { purchasePrice?: number }).purchasePrice ||
            0;
        const rootTotalPrice =
            (purchase as unknown as { totalPrice?: number }).totalPrice || 0;
        const metaTotalPrice = Number(metadata.totalPrice || 0);
        const metaOriginalPrice = Number(metadata.originalPrice || 0);

        // Check for critical price mismatch
        if (
            metaTotalPrice > 0 &&
            Math.abs(rootTotalPrice - metaTotalPrice) > 1
        ) {
            console.error(
                "[BridgerPay Webhook] CRITICAL PRICE MISMATCH DETECTED!",
                {
                    purchaseId: purchase.id,
                    orderNumber: order_id,
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
                        priceFixedBy: "bridgerpay-webhook",
                    },
                },
            });

            console.log(
                "[BridgerPay Webhook] Price mismatch auto-corrected in metadata",
                {
                    purchaseId: purchase.id,
                    correctedTotalPrice: rootTotalPrice,
                    correctedOriginalPrice: rootPurchasePrice,
                },
            );
        }

        // Ensure status is defined
        if (!status) {
            console.error(
                "[BridgerPay Webhook] Status is missing after extraction",
            );
            return NextResponse.json(
                {
                    message:
                        "Webhook received but status could not be determined",
                },
                { status: 200 },
            );
        }

        const internalStatus = mapBridgerPayStatusToInternal(status);

        // Extract additional payment details from webhook
        const chargeData =
            webhookData.data && typeof webhookData.data === "object"
                ? ((webhookData.data as Record<string, unknown>).charge as
                      | Record<string, unknown>
                      | undefined)
                : undefined;

        const attributes =
            chargeData?.attributes && typeof chargeData.attributes === "object"
                ? (chargeData.attributes as Record<string, unknown>)
                : undefined;

        const sourceInfo =
            attributes?.source && typeof attributes.source === "object"
                ? (attributes.source as Record<string, unknown>)
                : undefined;

        // Update purchase status with comprehensive payment details
        const updateData: Record<string, unknown> = {
            status: internalStatus,
            paymentMethod:
                extractString(attributes, "payment_method") || "credit_card",
            // Preserve existing isInAppPurchase value
            isInAppPurchase: (
                purchase as unknown as { isInAppPurchase?: boolean }
            ).isInAppPurchase,
            metadata: {
                ...(purchase.metadata as object),
                // BridgerPay transaction details
                bridgerPayTransactionId: transaction_id,
                bridgerPayChargeId: extractString(chargeData, "id", "uuid"),
                bridgerPayStatus: status,
                bridgerPayAmount: amount,
                bridgerPayCurrency: currency,
                bridgerPayPspName: extractString(
                    webhookData.data as Record<string, unknown>,
                    "psp_name",
                ),
                bridgerPayMidAlias: extractString(attributes, "mid_alias"),

                // Card details (if applicable)
                bridgerPayCardBrand: extractString(attributes, "card_brand"),
                bridgerPayCardLast4: extractString(attributes, "card_number"),
                bridgerPayCardMasked: extractString(
                    attributes,
                    "card_masked_number",
                ),

                // Customer verification
                bridgerPayCustomerEmail: extractString(sourceInfo, "email"),
                bridgerPayCustomerIp: extractString(sourceInfo, "ip_address"),

                // Timestamps
                bridgerPayCreatedAt: extractNumber(attributes, "created_at"),
                bridgerPayUpdatedAt: new Date().toISOString(),
                bridgerPayWebhookReceived: true,
                bridgerPayWebhookType: webhookType,
            },
        };

        // Add transaction ID if completed
        if (internalStatus === "completed" && transaction_id) {
            updateData.transactionId = transaction_id;
        }

        // Add notes for status changes
        const cardInfo = attributes?.card_brand
            ? ` (${attributes.card_brand} ending in ${attributes.card_number})`
            : "";

        if (internalStatus === "completed") {
            updateData.notes = `Payment approved via BridgerPay${cardInfo}. Transaction ID: ${transaction_id}`;
        } else if (internalStatus === "failed") {
            const declineReason =
                extractString(attributes, "decline_reason") || status;
            updateData.notes = `Payment declined via BridgerPay. Reason: ${declineReason}`;
        } else if (internalStatus === "cancelled") {
            updateData.notes = `Payment cancelled via BridgerPay. Status: ${status}`;
        }

        await payload.update({
            collection: "purchases",
            id: purchase.id,
            data: updateData,
        });

        console.log("[BridgerPay Webhook] Purchase updated", {
            purchaseId: purchase.id,
            orderId: order_id,
            status: internalStatus,
            transactionId: transaction_id,
        });

        // Process AffiliateWP conversion if payment succeeded
        if (internalStatus === "completed") {
            // Process AffiliateWP conversion if payment succeeded
            try {
                await processAffiliateWPConversion(payload, purchase);
            } catch (error) {
                // Log error but don't fail the webhook
                console.error(
                    "[BridgerPay Webhook] Error processing AffiliateWP conversion:",
                    error,
                );
                logWebhookError({
                    source: "bridgerpay-webhook-affiliatewp-conversion",
                    error,
                    gateway: "bridgerpay",
                    webhookType,
                    purchaseId: purchase.id,
                    orderNumber: order_id,
                    status: internalStatus,
                    amount,
                    currency,
                    transactionId: transaction_id,
                });
            }

            // Track completed purchase in Hyros
            try {
                const ipAddress = extractString(sourceInfo, "ip_address");
                const updatedPurchase = await payload.findByID({
                    collection: "purchases",
                    id: purchase.id,
                });

                const hyrosResult = await trackHyrosPurchase({
                    purchase: updatedPurchase,
                    eventType: "completed",
                    ipAddress,
                });

                await storeHyrosMetadata(
                    payload,
                    purchase.id,
                    hyrosResult,
                    "completed",
                );
            } catch (error) {
                console.error(
                    "[BridgerPay Webhook] Error tracking Hyros conversion:",
                    error,
                );
                logWebhookError({
                    source: "bridgerpay-webhook-hyros-tracking",
                    error,
                    gateway: "bridgerpay",
                    webhookType,
                    purchaseId: purchase.id,
                    orderNumber: order_id,
                    status: internalStatus,
                    amount,
                    currency,
                    transactionId: transaction_id,
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
                    "[BridgerPay Webhook] Error tracking Klaviyo conversion:",
                    error,
                );
                logWebhookError({
                    source: "bridgerpay-webhook-klaviyo-tracking",
                    error,
                    gateway: "bridgerpay",
                    webhookType,
                    purchaseId: purchase.id,
                    orderNumber: order_id,
                    status: internalStatus,
                    amount,
                    currency,
                    transactionId: transaction_id,
                });
            }
        } else if (internalStatus === "failed") {
            // Track declined purchase in Hyros
            try {
                const ipAddress = extractString(sourceInfo, "ip_address");
                const updatedPurchase = await payload.findByID({
                    collection: "purchases",
                    id: purchase.id,
                });

                const hyrosResult = await trackHyrosPurchase({
                    purchase: updatedPurchase,
                    eventType: "declined",
                    ipAddress,
                });

                await storeHyrosMetadata(
                    payload,
                    purchase.id,
                    hyrosResult,
                    "declined",
                );
            } catch (error) {
                console.error(
                    "[BridgerPay Webhook] Error tracking Hyros decline:",
                    error,
                );
                logWebhookError({
                    source: "bridgerpay-webhook-hyros-decline",
                    error,
                    gateway: "bridgerpay",
                    webhookType,
                    purchaseId: purchase.id,
                    orderNumber: order_id,
                    status: internalStatus,
                    amount,
                    currency,
                    transactionId: transaction_id,
                });
            }

            // Track failed purchase in Klaviyo
            try {
                const updatedPurchase = await payload.findByID({
                    collection: "purchases",
                    id: purchase.id,
                });

                const declineReason =
                    extractString(attributes, "decline_reason") || status;
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
                    "[BridgerPay Webhook] Error tracking Klaviyo decline:",
                    error,
                );
                logWebhookError({
                    source: "bridgerpay-webhook-klaviyo-decline",
                    error,
                    gateway: "bridgerpay",
                    webhookType,
                    purchaseId: purchase.id,
                    orderNumber: order_id,
                    status: internalStatus,
                    amount,
                    currency,
                    transactionId: transaction_id,
                });
            }
        }

        // Send completed order to Axcera
        try {
            if (internalStatus === "completed") {
                console.log(
                    "[BridgerPay Webhook] Starting Axcera webhook for completed order:",
                    {
                        purchaseId: purchase.id,
                        orderNumber: (
                            purchase as unknown as { orderNumber?: string }
                        ).orderNumber,
                        hasProgramField: "program" in purchase,
                        hasPlatformSlug:
                            "platformSlug" in
                            (purchase as unknown as Record<string, unknown>),
                        hasMetadata: "metadata" in purchase,
                        programName: purchase.programName,
                    },
                );

                // Use purchasePrice from the purchase record (base price without add-ons)
                const total = String(
                    (purchase as unknown as { purchasePrice?: number })
                        .purchasePrice || 0,
                );

                // Resolve product/variation via mappings
                let productIdNum = 0;
                let variationIdNum = 0;

                // Extract purchaseType and account_id for reset/activation orders
                const purchaseType = (
                    purchase as unknown as {
                        purchaseType?:
                            | "original-order"
                            | "reset-order"
                            | "activation-order";
                    }
                ).purchaseType;
                const existingMeta =
                    (purchase.metadata as
                        | Record<string, unknown>
                        | null
                        | undefined) || {};
                const accountId = existingMeta.account_id as string | undefined;

                try {
                    // Handle both populated relationship and ID
                    // When depth:0, program is the ID directly (string or number)
                    const rawProgram = purchase.program;
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
                            purchase as unknown as {
                                platformSlug?: string;
                            }
                        ).platformSlug || "";
                    let tierId = (existingMeta.tierId as string) || "";

                    const accountSize =
                        (
                            purchase as unknown as {
                                accountSize?: string;
                            }
                        ).accountSize || "";

                    console.log(
                        "[BridgerPay Webhook] Purchase data for mapping:",
                        {
                            purchaseId: purchase.id,
                            rawProgram: purchase.program,
                            programId,
                            platformSlug,
                            tierId,
                            accountSize,
                            programName: purchase.programName,
                            metadata: existingMeta,
                        },
                    );

                    if (!programId) {
                        console.error(
                            "[BridgerPay Webhook] Missing programId - cannot resolve mapping",
                            {
                                purchaseId: purchase.id,
                                program: purchase.program,
                                programType: typeof purchase.program,
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
                                            "[BridgerPay Webhook] Derived tierId from program tiers:",
                                            tierId,
                                        );
                                    }
                                }
                            } catch (err) {
                                console.warn(
                                    "[BridgerPay Webhook] Failed to derive tierId:",
                                    err,
                                );
                            }
                        }

                        // First try: use tierId from metadata if available
                        if (tierId) {
                            console.log(
                                "[BridgerPay Webhook] Looking up mapping with:",
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
                                "[BridgerPay Webhook] Full mapping result:",
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
                                            "[BridgerPay Webhook] Using reset fee funded product ID:",
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
                                            "[BridgerPay Webhook] Using reset fee product ID:",
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
                                        "[BridgerPay Webhook] Using activation product ID:",
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
                        "[BridgerPay Webhook] Failed to resolve product/variation mapping:",
                        e,
                    );
                    logWebhookError({
                        source: "bridgerpay-webhook-product-mapping",
                        error: e,
                        gateway: "bridgerpay",
                        webhookType,
                        purchaseId: purchase.id,
                        orderNumber: order_id,
                        status: internalStatus,
                        amount,
                        currency,
                        transactionId: transaction_id,
                    });
                }

                // Resolve billing info from purchase
                const billingAddress =
                    (
                        purchase as unknown as {
                            billingAddress?: {
                                address?: string;
                                city?: string;
                                state?: string;
                                postalCode?: string;
                                country?: string;
                            };
                        }
                    ).billingAddress || {};

                // Extract customer name from purchase
                const customerEmail =
                    (purchase as unknown as { customerEmail?: string })
                        .customerEmail || "";
                const customerName =
                    (purchase as unknown as { customerName?: string })
                        .customerName || "";
                const nameParts = customerName.split(" ");
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";

                const countryUpper = (billingAddress.country || "")
                    .toString()
                    .toUpperCase();

                // Resolve add-on keys -> fee_lines
                const selectedAddOns =
                    (
                        purchase as unknown as {
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
                    console.error(
                        "[BridgerPay Webhook] Failed to collect add-on keys",
                    );
                }

                const orderNumber =
                    (purchase as unknown as { orderNumber?: string })
                        .orderNumber || String(purchase.id);

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
                        currency: currency || "USD",
                        date_created: new Date().toISOString(),
                        total,
                        ...(accountId ? { account_id: accountId } : {}),
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
                                name: purchase.programName || "Program",
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
                        gateway: "bridgerpay",
                        purchaseId: purchase.id,
                    },
                );

                console.log(
                    "[BridgerPay Webhook] Axcera webhook sent successfully",
                    {
                        orderId: orderNumber,
                        productIdNum,
                        variationIdNum,
                    },
                );
            }
        } catch (webhookError) {
            console.error(
                "[BridgerPay Webhook] Axcera webhook post failed:",
                webhookError,
            );
            logWebhookError({
                source: "bridgerpay-webhook-axcera-post",
                error: webhookError,
                gateway: "bridgerpay",
                webhookType,
                purchaseId: purchase.id,
                orderNumber: order_id,
                status: internalStatus,
                amount,
                currency,
                transactionId: transaction_id,
            });
        }

        // Return success response
        return NextResponse.json(
            {
                success: true,
                message: "Webhook processed successfully",
                purchaseId: purchase.id,
                status: internalStatus,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("[BridgerPay Webhook] Error processing webhook:", error);
        logWebhookError({
            source: "bridgerpay-webhook-main",
            error,
            gateway: "bridgerpay",
        });
        return NextResponse.json(
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}

// Support GET requests for webhook verification (if BridgerPay requires it)
export async function GET(request: NextRequest) {
    // Some payment providers send verification requests via GET
    // Implement based on BridgerPay's requirements
    const challenge = request.nextUrl.searchParams.get("challenge");

    if (challenge) {
        return NextResponse.json({ challenge }, { status: 200 });
    }

    return NextResponse.json(
        { message: "BridgerPay webhook endpoint is active" },
        { status: 200 },
    );
}
