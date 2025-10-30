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
import { getProgramMappings } from "@/lib/program-mappings";
import { getRegionFromCountryCode } from "@/lib/utils";
import { generateIncrementalOrderNumber } from "@/utils/orderNumber";

// Order number generation moved to utils/orderNumber.ts

interface SelectedAddOnPayload {
    addOnId: string;
    priceIncreasePercentage?: number;
    metadata?: Record<string, unknown>;
}

interface CreatePurchaseRequest {
    // DEPRECATED: These fields are calculated server-side for security
    // Keeping them optional for backwards compatibility but they will be ignored
    purchasePrice?: number;
    totalPrice?: number;
    addOnValue?: number;

    // Required fields
    programId: string;
    accountSize: string;
    currency: string;
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
    tierId?: string;
    customerData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: CreatePurchaseRequest = await request.json();
        const {
            programId,
            accountSize,
            purchasePrice: clientPurchasePrice,
            totalPrice: clientTotalPrice,
            currency,
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
            tierId,
        } = body;

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

        console.log("[Create Purchase] Cookie extraction:", {
            affiliateUsernameCookieName: AFFILIATEWP_CONFIG.cookie.name,
            affiliateUsernameFound: !!affiliateUsernameFromCookie,
            affiliateUsername: affiliateUsernameFromCookie,
            allCookies: cookieStore.getAll().map((c) => c.name),
        });

        const payload = await getPayloadClient();

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

            console.log("[Create Purchase] Server-calculated prices:", {
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
                    "[Create Purchase] CRITICAL: Price manipulation detected!",
                    {
                        programId,
                        accountSize,
                        customerEmail: customerData.email,
                        serverCalculated: calculatedPrices.totalPrice,
                        clientSentTotalPrice: clientTotalPrice,
                        difference:
                            calculatedPrices.totalPrice - clientTotalPrice,
                    },
                );
                // Continue with server prices, don't reject (for backwards compatibility)
            }
        } catch (error) {
            console.error("[Create Purchase] Error calculating prices:", error);
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
                        "[Create Purchase] Coupon validation failed:",
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
                    // Extract affiliate info from coupon
                    affiliateId = validationResult.coupon.affiliateId || null;
                    affiliateEmail =
                        validationResult.coupon.affiliateEmail || null;
                    affiliateUsername =
                        validationResult.coupon.affiliateUsername || null;
                }
            } catch (error) {
                console.error(
                    "Error validating coupon for affiliate info:",
                    error,
                );
                // Continue without affiliate info if validation fails
            }
        }

        // If affiliate username not set from coupon, use cookie value
        if (!affiliateUsername && affiliateUsernameFromCookie) {
            affiliateUsername = affiliateUsernameFromCookie;
            console.log(
                "[Create Purchase] Using affiliate username from cookie:",
                affiliateUsername,
            );
        }

        try {
            const calculatedRegion =
                region || getRegionFromCountryCode(customerData.country);

            // Generate order number if not provided
            const generatedOrderNumber: number = orderNumber
                ? Number(orderNumber)
                : await generateIncrementalOrderNumber();

            const purchase = await payload.create({
                collection: "purchases",
                data: {
                    program: Number(programId),
                    accountSize,
                    purchasePrice,
                    totalPrice,
                    currency: currency.toUpperCase() as "USD" | "EUR" | "GBP",
                    status: "pending",
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
                            phone: customerData.phone || "",
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
                        // Store affiliate username for AffiliateWP conversion tracking
                        ...(affiliateUsername ? { affiliateUsername } : {}),
                    },
                    // biome-ignore lint/suspicious/noExplicitAny: Payload CMS type workaround
                } as any,
            });

            console.log("[Create Purchase] Purchase created:", {
                purchaseId: purchase.id,
                orderNumber: purchase.orderNumber,
                affiliateId: purchase.affiliateId || null,
                affiliateEmail: purchase.affiliateEmail || null,
                affiliateUsername: purchase.affiliateUsername || null,
            });

            // Persist product/variation mapping into metadata for regular orders
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
            }

            // Track purchase creation in Hyros (pending conversion)
            try {
                const ipAddress =
                    request.headers.get("x-forwarded-for") ||
                    request.headers.get("x-real-ip") ||
                    undefined;
                const userAgent =
                    request.headers.get("user-agent") || undefined;
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
                    "[Hyros] Error tracking purchase creation:",
                    error,
                );
                // Don't fail the purchase creation if Hyros tracking fails
            }

            // Track purchase creation in Klaviyo (Started Order)
            try {
                await trackStartedOrder({
                    email: customerData.email,
                    orderId: generatedOrderNumber,
                    total: totalPrice,
                    currency,
                    discountCode: couponCode || null,
                    items: [
                        {
                            product_id: programId,
                            sku: `${programId}-${accountSize}`,
                            name:
                                programName ||
                                `${platformName} - ${accountSize}`,
                            quantity: 1,
                            price: purchasePrice,
                        },
                    ],
                });
            } catch (error) {
                console.error(
                    "[Klaviyo] Error tracking purchase creation:",
                    error,
                );
                // Don't fail the purchase creation if Klaviyo tracking fails
            }

            return NextResponse.json({
                success: true,
                purchase: {
                    id: purchase.id,
                    status: purchase.status,
                },
            });
        } catch (error) {
            console.error("Error creating purchase record:", error);
            throw error;
        }
    } catch (error) {
        console.error("Error in create-purchase API:", error);
        return NextResponse.json(
            {
                error: "Failed to create purchase record",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
