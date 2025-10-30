export const runtime = "nodejs";

import { Decimal } from "decimal.js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AFFILIATEWP_CONFIG } from "@/lib/affiliatewp-config";
import { createBridgerPaySession, getBridgerPayConfig } from "@/lib/bridgerpay";
import { validateCoupon } from "@/lib/coupons/validation";
import { storeHyrosMetadata, trackHyrosPurchase } from "@/lib/hyros";
import { trackStartedOrder } from "@/lib/klaviyo";
import { getPayloadClient } from "@/lib/payload";
import { logApiError } from "@/lib/posthog-error";
import {
    type CheckoutPriceCalculationResult,
    calculateCheckoutPrices,
} from "@/lib/pricing/calculate-checkout-prices";
import { getProgramMappings } from "@/lib/program-mappings";
import { getRegionFromCountryCode, toCountryCode } from "@/lib/utils";
import { generateIncrementalOrderNumber } from "@/utils/orderNumber";

interface SelectedAddOnPayload {
    addOnId: string;
    priceIncreasePercentage?: number;
    metadata?: Record<string, unknown>;
}

interface BridgerPayCheckoutRequest {
    // DEPRECATED: These fields are calculated server-side for security
    // Keeping them optional for backwards compatibility but they will be ignored
    amount?: number;
    purchasePrice?: number;
    totalPrice?: number;
    addOnValue?: number;

    // Required fields
    currency?: string; // default USD
    programId: string;
    accountSize: string;
    tierId?: string;
    selectedAddOns?: SelectedAddOnPayload[];
    couponCode?: string | null;
    purchaseType?: "original-order" | "reset-order" | "activation-order";
    resetProductType?: "evaluation" | "funded"; // For reset orders
    programDetails?: string;
    platformId?: string;
    platformName?: string;
    programName?: string;
    programType?: "1-step" | "2-step" | "instant" | "reset";
    region?: string;
    orderNumber?: string;
    isInAppPurchase?: boolean;
    existingPurchaseId?: string; // If provided, update existing purchase instead of creating new
    customerData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string; // ISO 3166-1 alpha-2
    };
}

export async function POST(request: NextRequest) {
    try {
        // Read body once safely using a cloned request to allow raw logging if needed
        const contentType = request.headers.get("content-type") || "";
        const rawBody = await request
            .clone()
            .text()
            .catch(() => "");
        if (!rawBody || rawBody.trim() === "") {
            return NextResponse.json(
                { error: "Empty request body" },
                { status: 400 },
            );
        }

        let body: BridgerPayCheckoutRequest;
        try {
            body = JSON.parse(rawBody) as BridgerPayCheckoutRequest;
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON body" },
                { status: 400 },
            );
        }

        if (process.env.BRIDGERPAY_DEBUG === "1") {
            console.log("[BridgerPay] Incoming checkout request", {
                contentType,
                bodySize: rawBody.length,
            });
        }

        const {
            amount: clientAmount,
            currency = "usd",
            programId,
            accountSize,
            tierId,
            purchasePrice: clientPurchasePrice,
            totalPrice: clientTotalPrice,
            customerData,
            selectedAddOns = [],
            couponCode,
            addOnValue: clientAddOnValue,
            purchaseType = "original-order",
            resetProductType,
            programDetails,
            platformId,
            platformName,
            programName,
            programType,
            region,
            orderNumber,
            isInAppPurchase = false,
            existingPurchaseId,
        } = body;

        // Basic validation
        if (
            !programId ||
            !accountSize ||
            !customerData?.email ||
            !customerData?.firstName ||
            !customerData?.lastName ||
            !customerData?.phone
        ) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    details:
                        "Required: programId, accountSize, customer first/last name, email, phone.",
                },
                { status: 400 },
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
            return NextResponse.json(
                {
                    error: "Invalid email",
                    details: "Please provide a valid email address.",
                },
                { status: 400 },
            );
        }

        const payload = await getPayloadClient();
        const config = getBridgerPayConfig();

        // CRITICAL SECURITY: Calculate all prices server-side to prevent manipulation
        let calculatedPrices: CheckoutPriceCalculationResult;
        try {
            calculatedPrices = await calculateCheckoutPrices(payload, {
                programId,
                accountSize,
                tierId,
                selectedAddOns: selectedAddOns.map((addon) => ({
                    addOnId: addon.addOnId,
                    priceIncreasePercentage: addon.priceIncreasePercentage || 0,
                    metadata: addon.metadata,
                })),
                couponCode: couponCode?.trim() || null,
                purchaseType,
                resetProductType,
                userEmail: customerData.email,
            });

            console.log("[BridgerPay] Server-calculated prices:", {
                programId,
                accountSize,
                tierId,
                couponCode: couponCode?.trim() || null,
                calculated: {
                    tierPrice: calculatedPrices.tierPrice,
                    originalPrice: calculatedPrices.originalPrice,
                    appliedDiscount: calculatedPrices.appliedDiscount,
                    finalPurchasePrice: calculatedPrices.finalPurchasePrice,
                    addOnValue: calculatedPrices.addOnValue,
                    totalPrice: calculatedPrices.totalPrice,
                },
                clientSent: {
                    amount: clientAmount,
                    purchasePrice: clientPurchasePrice,
                    totalPrice: clientTotalPrice,
                    addOnValue: clientAddOnValue,
                },
            });

            // SECURITY CHECK: Detect price manipulation attempts
            if (
                clientTotalPrice &&
                Math.abs(calculatedPrices.totalPrice - clientTotalPrice) > 1
            ) {
                console.error(
                    "[BridgerPay] CRITICAL: Price manipulation detected!",
                    {
                        programId,
                        accountSize,
                        customerEmail: customerData.email,
                        serverCalculated: calculatedPrices.totalPrice,
                        clientSentTotalPrice: clientTotalPrice,
                        clientSentAmount: clientAmount,
                        difference:
                            calculatedPrices.totalPrice - clientTotalPrice,
                    },
                );
                // Continue with server prices, don't reject (for backwards compatibility)
            }

            // Also check if client sent amount matches our calculated total
            if (
                clientAmount &&
                Math.abs(calculatedPrices.totalPrice - clientAmount) > 1
            ) {
                console.warn(
                    "[BridgerPay] WARNING: Client amount differs from calculated price",
                    {
                        programId,
                        serverCalculated: calculatedPrices.totalPrice,
                        clientSentAmount: clientAmount,
                        difference: calculatedPrices.totalPrice - clientAmount,
                    },
                );
            }
        } catch (error) {
            console.error("[BridgerPay] Error calculating prices:", error);
            logApiError({
                endpoint: "bridgerpay-checkout-price-calculation",
                error,
                method: "POST",
                statusCode: 500,
                additionalContext: {
                    programId,
                    accountSize,
                },
            });
            return NextResponse.json(
                {
                    error: "Failed to calculate prices",
                    details:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                { status: 400 },
            );
        }

        // Use server-calculated prices from now on
        const purchasePrice = calculatedPrices.finalPurchasePrice;
        const totalPrice = calculatedPrices.totalPrice;
        const addOnValue = calculatedPrices.addOnValue;
        const amount = calculatedPrices.totalPrice;

        // Get affiliate_username from cookies
        const cookieStore = await cookies();
        const affiliateUsernameCookie = cookieStore.get(
            AFFILIATEWP_CONFIG.cookie.name,
        );
        const affiliateUsernameFromCookie = affiliateUsernameCookie?.value;

        console.log("[BridgerPay Checkout] Cookie extraction:", {
            affiliateUsernameCookieName: AFFILIATEWP_CONFIG.cookie.name,
            affiliateUsernameFound: !!affiliateUsernameFromCookie,
            affiliateUsername: affiliateUsernameFromCookie,
        });

        // Initialize affiliate data
        let affiliateId: string | null = null;
        let affiliateEmail: string | null = null;
        let affiliateUsername: string | null = null;

        // If coupon code is provided, validate it and check for affiliate info
        if (couponCode?.trim()) {
            try {
                const validationResult = await validateCoupon({
                    code: couponCode,
                    programId: String(programId),
                    accountSize,
                    userEmail: customerData.email,
                    orderAmount: totalPrice,
                });

                if (!validationResult.valid) {
                    console.error(
                        "[BridgerPay Checkout] Coupon validation failed:",
                        {
                            couponCode,
                            error: validationResult.error,
                            userEmail: customerData.email,
                        },
                    );
                    return NextResponse.json(
                        {
                            error:
                                validationResult.error || "Invalid coupon code",
                        },
                        { status: 400 },
                    );
                }

                if (validationResult.coupon) {
                    affiliateId = validationResult.coupon.affiliateId || null;
                    affiliateEmail =
                        validationResult.coupon.affiliateEmail || null;
                    affiliateUsername =
                        validationResult.coupon.affiliateUsername || null;
                }
            } catch (error) {
                console.error(
                    "[BridgerPay Checkout] Error validating coupon:",
                    error,
                );
                logApiError({
                    endpoint: "bridgerpay-checkout-coupon-validation",
                    error,
                    method: "POST",
                    additionalContext: {
                        couponCode,
                        programId,
                        accountSize,
                    },
                });
            }
        }

        // If affiliate username not set from coupon, use cookie value
        if (!affiliateUsername && affiliateUsernameFromCookie) {
            affiliateUsername = affiliateUsernameFromCookie;
            console.log(
                "[BridgerPay Checkout] Using affiliate username from cookie:",
                affiliateUsername,
            );
        }

        const idempotencyKey = `${customerData.email}-${programId}-${accountSize}-${Date.now()}`;

        // Create or update purchase record
        const calculatedRegion =
            region || getRegionFromCountryCode(customerData.country);

        let purchase: any; // Type workaround for Payload CMS
        let generatedOrderNumber: number;

        // If existingPurchaseId is provided, update the existing purchase
        if (existingPurchaseId) {
            // Fetch the existing purchase
            const existingPurchase = await payload.findByID({
                collection: "purchases",
                id: existingPurchaseId,
            });

            if (!existingPurchase) {
                return NextResponse.json(
                    { error: "Purchase not found" },
                    { status: 404 },
                );
            }

            generatedOrderNumber = existingPurchase.orderNumber || 0;

            // Update existing purchase with new metadata AND root-level prices
            await payload.update({
                collection: "purchases",
                id: existingPurchaseId,
                data: {
                    // CRITICAL: Update root-level prices to prevent price mismatch
                    purchasePrice,
                    totalPrice,
                    addOnValue,
                    ...(couponCode?.trim() ? { discountCode: couponCode } : {}),
                    metadata: {
                        ...((existingPurchase.metadata as object) || {}),
                        ...(tierId ? { tierId } : {}),
                        platformId,
                        customerDetails: {
                            firstName: customerData.firstName,
                            lastName: customerData.lastName,
                            email: customerData.email,
                            phone: customerData.phone,
                            address: {
                                line1: customerData.address || "",
                                city: customerData.city || "",
                                state: customerData.state || "",
                                postalCode: customerData.postalCode || "",
                                country: customerData.country || "",
                            },
                        },
                        couponCode,
                        originalPrice: calculatedPrices.originalPrice,
                        appliedDiscount: calculatedPrices.appliedDiscount,
                        totalPrice,
                        addOnValue,
                        purchaseType,
                        programDetails,
                        platform: platformName || platformId,
                        lastUpdated: new Date().toISOString(),
                        idempotencyKey,
                        // Store affiliate username for AffiliateWP conversion tracking
                        ...(affiliateUsername ? { affiliateUsername } : {}),
                    },
                    // Don't update selectedAddOns for existing purchases - they're already set
                    // Preserve isInAppPurchase from existing purchase
                    isInAppPurchase: existingPurchase.isInAppPurchase,
                },
            });

            // Use the existing purchase data directly
            purchase = existingPurchase;
        } else {
            // Create new purchase
            let newOrderNumber: number;
            if (!orderNumber || orderNumber.trim() === "") {
                newOrderNumber = await generateIncrementalOrderNumber();
            } else {
                newOrderNumber = Number(orderNumber);
            }
            generatedOrderNumber = newOrderNumber;

            const purchaseData = {
                program: Number(programId),
                accountSize,
                purchasePrice,
                totalPrice,
                currency: currency.toUpperCase() as "USD" | "EUR" | "GBP",
                status: "pending" as const,
                purchaseType,
                hasAddOn: selectedAddOns.length > 0,
                addOnValue,
                ...(couponCode?.trim() ? { discountCode: couponCode } : {}),
                // Add affiliate fields
                ...(affiliateId ? { affiliateId } : {}),
                ...(affiliateEmail ? { affiliateEmail } : {}),
                ...(affiliateUsername ? { affiliateUsername } : {}),
                platformSlug: platformId,
                platformName,
                programDetails,
                programName,
                programType,
                region: calculatedRegion as
                    | "africa"
                    | "asia"
                    | "europe"
                    | "latin-america"
                    | "middle-east"
                    | "north-america"
                    | "oceania"
                    | "south-asia"
                    | "other",
                orderNumber: generatedOrderNumber,
                customerName: `${customerData.firstName} ${customerData.lastName}`,
                customerEmail: customerData.email,
                isInAppPurchase,
                billingAddress: {
                    address: customerData.address || "",
                    city: customerData.city || "",
                    state: customerData.state || "",
                    postalCode: customerData.postalCode || "",
                    country: customerData.country || "",
                },
                selectedAddOns: selectedAddOns.map((item) => ({
                    addOn: Number(item.addOnId),
                    priceIncreasePercentage: item.priceIncreasePercentage,
                    ...(item.metadata ? { metadata: item.metadata } : {}),
                })),
                metadata: {
                    ...(tierId ? { tierId } : {}),
                    platformId,
                    customerDetails: {
                        firstName: customerData.firstName,
                        lastName: customerData.lastName,
                        email: customerData.email,
                        phone: customerData.phone,
                        address: {
                            line1: customerData.address || "",
                            city: customerData.city || "",
                            state: customerData.state || "",
                            postalCode: customerData.postalCode || "",
                            country: customerData.country || "",
                        },
                    },
                    couponCode,
                    originalPrice: calculatedPrices.originalPrice,
                    appliedDiscount: calculatedPrices.appliedDiscount,
                    totalPrice,
                    addOnValue,
                    purchaseType,
                    programDetails,
                    platform: platformName || platformId,
                    createdAt: new Date().toISOString(),
                    idempotencyKey,
                    // Store affiliate username for AffiliateWP conversion tracking
                    ...(affiliateUsername ? { affiliateUsername } : {}),
                },
            };

            purchase = await payload.create({
                collection: "purchases",
                // @ts-expect-error - Type mismatch due to dynamic field population
                data: purchaseData,
            });
        }

        // Track created purchase id for debugging and potential future usage
        const _createdPurchaseId = purchase.id;

        // Build BridgerPay checkout payload
        const bridgerPayCurrency = (currency || "USD").toUpperCase();
        const normalizedCountry = toCountryCode(customerData.country);
        if (!normalizedCountry) {
            return NextResponse.json(
                {
                    error: "Invalid country",
                    details:
                        "A valid 2-letter country code or recognizable country name is required.",
                },
                { status: 400 },
            );
        }
        const countryCode = normalizedCountry.toUpperCase();

        const sessionRequest = {
            cashier_key: config.cashierKey,
            order_id: String(purchase.orderNumber || purchase.id),
            currency: bridgerPayCurrency,
            country: countryCode,
            amount: new Decimal(amount).toDecimalPlaces(2).toNumber(),
            theme: "bright" as const,
            first_name: customerData.firstName,
            last_name: customerData.lastName,
            email: customerData.email,
            phone: customerData.phone,
            address: customerData.address || "",
            city: customerData.city || "",
            state: customerData.state || "",
            zip_code: customerData.postalCode || "",
            language: "en",
            currency_lock: true,
            amount_lock: true,
            payload: String(purchase.id), // Store purchase ID for webhook reference
            custom_data: {
                platform_id: platformId || "",
                affiliate_id: "",
                tracking_id: "",
            },
        };

        if (process.env.BRIDGERPAY_DEBUG === "1") {
            console.log("[BridgerPay] Outbound session request (sanitized)", {
                orderId: sessionRequest.order_id,
                currency: sessionRequest.currency,
                country: sessionRequest.country,
                amount: sessionRequest.amount,
                hasEmail: Boolean(sessionRequest.email),
                hasPhone: Boolean(sessionRequest.phone),
            });
        }

        // Minimal diagnostic logging (no PII / no secrets)
        console.log("[BridgerPay] Creating session", {
            apiUrl: config.apiUrl,
            env: config.environment,
            orderId: String(purchase.orderNumber || purchase.id),
            currency: bridgerPayCurrency,
            country: countryCode,
        });

        const checkout = await createBridgerPaySession(sessionRequest);

        if (process.env.BRIDGERPAY_DEBUG === "1") {
            console.log("[BridgerPay] Raw checkout response", {
                ok: checkout.ok,
                data: checkout.ok ? JSON.stringify(checkout.data) : null,
                error: !checkout.ok ? checkout.error : null,
            });
        }

        if (!checkout.ok) {
            console.error("[BridgerPay] Session creation failed", {
                error: checkout.error,
                status: checkout.status,
            });

            // Mark purchase failed on error from BridgerPay
            try {
                await payload.update({
                    collection: "purchases",
                    id: purchase.id,
                    data: {
                        status: "failed",
                        notes: `BridgerPay session failed: ${checkout.error}`,
                        metadata: {
                            ...(purchase.metadata as object),
                            bridgerPayCheckoutError: checkout.error,
                            bridgerPayStatusCode: checkout.status,
                            failedAt: new Date().toISOString(),
                        },
                    },
                });
            } catch (updateError) {
                console.error(
                    "Failed to mark purchase as failed:",
                    updateError,
                );
                logApiError({
                    endpoint: "bridgerpay-checkout-mark-failed",
                    error: updateError,
                    method: "POST",
                    additionalContext: {
                        purchaseId: purchase.id,
                        orderNumber: generatedOrderNumber,
                    },
                });
            }

            return NextResponse.json(
                {
                    error: "Failed to initialize BridgerPay checkout",
                    details: checkout.error || "Unknown error",
                },
                { status: 502 },
            );
        }

        // Persist mapping info if available
        try {
            const programNumericId = Number(programId);
            const platformSlug = platformId || "";
            const size = accountSize || "";
            if (programNumericId && platformSlug && size) {
                const mappings = await getProgramMappings(programNumericId);
                const sanitized = size
                    .replace(/[^a-zA-Z0-9]/g, "-")
                    .toLowerCase();
                const match = mappings.find(
                    (m) =>
                        m.platformId === platformSlug &&
                        (m.tierId || "").toLowerCase().endsWith(sanitized),
                );
                if (match?.productId && match?.variationId) {
                    await payload.update({
                        collection: "purchases",
                        id: purchase.id,
                        data: {
                            metadata: {
                                ...(purchase.metadata as object),
                                productId: match.productId,
                                variationId: match.variationId,
                            },
                        },
                    });
                }
            }
        } catch (e) {
            console.error("Failed to persist mapping for purchase:", e);
            logApiError({
                endpoint: "bridgerpay-checkout-persist-mapping",
                error: e,
                method: "POST",
                additionalContext: {
                    purchaseId: purchase.id,
                    programId,
                    accountSize,
                },
            });
        }

        // Track purchase creation in Hyros (pending conversion)
        try {
            const ipAddress =
                request.headers.get("x-forwarded-for") ||
                request.headers.get("x-real-ip") ||
                undefined;
            const userAgent = request.headers.get("user-agent") || undefined;
            const pageUrl = request.headers.get("referer") || undefined;

            const hyrosResult = await trackHyrosPurchase({
                purchase,
                eventType: "pending",
                ipAddress,
                userAgent,
                pageUrl,
            });

            await storeHyrosMetadata(
                payload,
                purchase.id,
                hyrosResult,
                "pending",
            );
        } catch (error) {
            console.error("[Hyros] Error tracking BridgerPay checkout:", error);
            logApiError({
                endpoint: "bridgerpay-checkout-hyros-tracking",
                error,
                method: "POST",
                additionalContext: {
                    purchaseId: purchase.id,
                    orderNumber: generatedOrderNumber,
                    programId,
                    accountSize,
                },
            });
            // Don't fail the checkout if Hyros tracking fails
        }

        // Track purchase creation in Klaviyo (Started Order)
        try {
            await trackStartedOrder({
                email: customerData.email,
                orderId: generatedOrderNumber,
                total: totalPrice,
                currency: currency.toUpperCase(),
                discountCode: couponCode || null,
                items: [
                    {
                        product_id: programId,
                        sku: `${programId}-${accountSize}`,
                        name: programName || `${platformName} - ${accountSize}`,
                        quantity: 1,
                        price: purchasePrice,
                    },
                ],
            });
        } catch (error) {
            console.error(
                "[Klaviyo] Error tracking BridgerPay checkout:",
                error,
            );
            logApiError({
                endpoint: "bridgerpay-checkout-klaviyo-tracking",
                error,
                method: "POST",
                additionalContext: {
                    purchaseId: purchase.id,
                    orderNumber: generatedOrderNumber,
                    programId,
                    accountSize,
                },
            });
            // Don't fail the checkout if Klaviyo tracking fails
        }

        // Extract token from nested result
        const cashierToken = checkout.data.result?.cashier_token;

        if (!cashierToken) {
            console.error("[BridgerPay] No cashier token in response", {
                response: checkout.data,
            });
            return NextResponse.json(
                {
                    error: "BridgerPay did not return a cashier token",
                    details: "Invalid response from payment provider",
                },
                { status: 502 },
            );
        }

        console.log("[BridgerPay] Returning response:", {
            hasToken: !!cashierToken,
            hasKey: !!config.cashierKey,
            keyLength: config.cashierKey?.length,
            orderId: String(purchase.orderNumber || purchase.id),
        });

        return NextResponse.json({
            success: true,
            cashierToken: cashierToken,
            cashierKey: config.cashierKey, // Use the key we sent in the request
            orderId: String(purchase.orderNumber || purchase.id),
            purchase: {
                id: purchase.id,
                status: purchase.status,
                orderNumber: purchase.orderNumber,
            },
        });
    } catch (error) {
        console.error("Error in BridgerPay checkout API:", error);
        logApiError({
            endpoint: "bridgerpay-checkout-main",
            error,
            method: "POST",
            statusCode: 500,
        });
        return NextResponse.json(
            {
                error: "Failed to initialize BridgerPay checkout",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
