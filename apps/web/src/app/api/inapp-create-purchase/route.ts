import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AFFILIATEWP_CONFIG } from "@/lib/affiliatewp-config";
import { validateCoupon } from "@/lib/coupons/validation";
import { storeHyrosMetadata, trackHyrosPurchase } from "@/lib/hyros";
import { trackStartedOrder } from "@/lib/klaviyo";
import { getPayloadClient } from "@/lib/payload";
import {
    type CheckoutPriceCalculationResult,
    calculateCheckoutPrices,
} from "@/lib/pricing/calculate-checkout-prices";
import { generateIncrementalOrderNumber } from "@/utils/orderNumber";

interface CreateInAppPurchaseRequest {
    programId: string;
    accountSize: string;
    platformId: string;
    platformName?: string;
    programName: string;
    programType: "1-step" | "2-step" | "instant";
    categoryLabel: string;
    currency: string;
    customerData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    isInAppPurchase: boolean;
    clientId?: string;
    tierId?: string | null;
    couponCode?: string | null;
    selectedAddOns?: Array<{
        addOnId: string;
        priceIncreasePercentage: number;
        metadata?: Record<string, unknown>;
    }>;
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateInAppPurchaseRequest = await request.json();

        const {
            programId,
            accountSize,
            platformId,
            platformName,
            programName,
            programType,
            categoryLabel,
            currency,
            customerData,
            clientId,
            tierId,
            couponCode,
            selectedAddOns = [],
        } = body;

        // Validate required fields
        if (!programId || !accountSize || !currency || !customerData?.email) {
            return NextResponse.json(
                {
                    error: "Missing required fields: programId, accountSize, currency, customerData.email",
                },
                { status: 400 },
            );
        }

        // Get affiliate_username from cookies
        const cookieStore = await cookies();
        const affiliateUsernameCookie = cookieStore.get(
            AFFILIATEWP_CONFIG.cookie.name,
        );
        const affiliateUsernameFromCookie = affiliateUsernameCookie?.value;

        console.log("[InApp Create Purchase] Cookie extraction:", {
            affiliateUsernameCookieName: AFFILIATEWP_CONFIG.cookie.name,
            affiliateUsernameFound: !!affiliateUsernameFromCookie,
            affiliateUsername: affiliateUsernameFromCookie,
        });

        const payload = await getPayloadClient();

        // CRITICAL SECURITY: Calculate all prices server-side to prevent manipulation
        let calculatedPrices: CheckoutPriceCalculationResult;
        try {
            calculatedPrices = await calculateCheckoutPrices(payload, {
                programId,
                accountSize,
                tierId: tierId || undefined,
                selectedAddOns: selectedAddOns.map((addon) => ({
                    addOnId: addon.addOnId,
                    priceIncreasePercentage: addon.priceIncreasePercentage || 0,
                    metadata: addon.metadata,
                })),
                couponCode: couponCode?.trim() || null,
                purchaseType: "original-order",
                userEmail: customerData.email,
            });

            console.log("[InApp Create Purchase] Server-calculated prices:", {
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
            });
        } catch (error) {
            console.error(
                "[InApp Create Purchase] Error calculating prices:",
                error,
            );
            return NextResponse.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to calculate prices",
                },
                { status: 400 },
            );
        }

        // Use calculated prices
        const purchasePrice = calculatedPrices.finalPurchasePrice;
        const totalPrice = calculatedPrices.totalPrice;
        const addOnValue = calculatedPrices.addOnValue;

        // Initialize affiliate data
        let affiliateId: string | null = null;
        let affiliateEmail: string | null = null;
        let affiliateUsername: string | null = null;

        // If coupon was applied successfully, extract affiliate info
        if (calculatedPrices.couponValid && couponCode?.trim()) {
            try {
                const validationResult = await validateCoupon({
                    code: couponCode,
                    programId: String(programId),
                    accountSize,
                    userEmail: customerData.email,
                    orderAmount: totalPrice,
                });

                if (validationResult.valid && validationResult.coupon) {
                    // Extract affiliate info from coupon
                    affiliateId = validationResult.coupon.affiliateId || null;
                    affiliateEmail =
                        validationResult.coupon.affiliateEmail || null;
                    affiliateUsername =
                        validationResult.coupon.affiliateUsername || null;
                }
            } catch (error) {
                console.error(
                    "Error extracting affiliate info from coupon:",
                    error,
                );
                // Continue without affiliate info if extraction fails
            }
        }

        // If affiliate username not set from coupon, use cookie value
        if (!affiliateUsername && affiliateUsernameFromCookie) {
            affiliateUsername = affiliateUsernameFromCookie;
            console.log(
                "[InApp Create Purchase] Using affiliate username from cookie:",
                affiliateUsername,
            );
        }

        const programDetails = `${accountSize} - ${programName} - ${categoryLabel} - ${platformName || platformId}`;

        // Generate order number
        const orderNumber = await generateIncrementalOrderNumber();

        // Create purchase record
        const purchase = await payload.create({
            collection: "purchases",
            data: {
                status: "pending",
                program: Number(programId),
                accountSize,
                purchasePrice,
                totalPrice,
                addOnValue,
                currency: currency as "USD" | "EUR" | "GBP",
                orderNumber,
                customerName: `${customerData.firstName} ${customerData.lastName}`,
                customerEmail: customerData.email,
                isInAppPurchase: true,
                // Add affiliate fields
                ...(affiliateId ? { affiliateId } : {}),
                ...(affiliateEmail ? { affiliateEmail } : {}),
                ...(affiliateUsername ? { affiliateUsername } : {}),
                ...(calculatedPrices.couponValid && couponCode?.trim()
                    ? { discountCode: couponCode }
                    : {}),
                billingAddress: {
                    address: customerData.address,
                    city: customerData.city,
                    state: customerData.state,
                    postalCode: customerData.postalCode,
                    country: customerData.country,
                },
                programDetails,
                platformSlug: platformId,
                platformName: platformName || platformId,
                programName,
                programType,
                metadata: {
                    source: "inapp-purchase",
                    isInAppPurchase: "true",
                    clientId: clientId || "",
                    ...(tierId ? { tierId } : {}),
                    platformId: platformId || "",
                    couponCode: couponCode || "",
                    customerEmail: customerData.email,
                    customerFirstName: customerData.firstName,
                    customerLastName: customerData.lastName,
                    customerPhone: customerData.phone,
                    // Store pricing details
                    originalPrice: calculatedPrices.originalPrice,
                    appliedDiscount: calculatedPrices.appliedDiscount,
                    totalPrice: totalPrice,
                    addOnValue: addOnValue,
                    // Store affiliate username for AffiliateWP conversion tracking
                    ...(affiliateUsername ? { affiliateUsername } : {}),
                },
                // biome-ignore lint/suspicious/noExplicitAny: Payload CMS type workaround
            } as any,
        });

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

            // Store Hyros tracking result
            await storeHyrosMetadata(
                payload,
                purchase.id,
                hyrosResult,
                "pending",
            );
        } catch (error) {
            console.error(
                "[Hyros] Error tracking in-app purchase creation:",
                error,
            );
            // Don't fail the purchase creation if Hyros tracking fails
        }

        // Track purchase creation in Klaviyo (Started Order)
        try {
            await trackStartedOrder({
                email: customerData.email,
                orderId: orderNumber,
                total: totalPrice,
                currency,
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
                "[Klaviyo] Error tracking in-app purchase creation:",
                error,
            );
            // Don't fail the purchase creation if Klaviyo tracking fails
        }

        return NextResponse.json({
            success: true,
            orderNumber: purchase.orderNumber,
            purchaseId: purchase.id,
        });
    } catch (error) {
        console.error("Error creating in-app purchase:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to create purchase",
            },
            { status: 500 },
        );
    }
}
