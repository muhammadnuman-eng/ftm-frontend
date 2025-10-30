import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AFFILIATEWP_CONFIG } from "@/lib/affiliatewp-config";
import { getBestAutoApplyCoupon } from "@/lib/coupons/auto-apply";
import { calculateDiscount } from "@/lib/coupons/calculation";
import { validateCoupon } from "@/lib/coupons/validation";
import { hashEmail } from "@/lib/hash-utils";
import { storeHyrosMetadata, trackHyrosPurchase } from "@/lib/hyros";
import { trackStartedOrder } from "@/lib/klaviyo";
import { getPayloadClient } from "@/lib/payload";
import { logApiError } from "@/lib/posthog-error";
import { getPostHogServer } from "@/lib/posthog-server";
import { findMappingByProductId } from "@/lib/program-mappings";
import { getRegionFromCountryCode } from "@/lib/utils";
import type { Platform, Program } from "@/payload-types";
import { generateIncrementalOrderNumber } from "@/utils/orderNumber";

interface BillingDetails {
    first_name: string;
    last_name: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    postcode?: string;
    country?: string;
    email: string;
    phone?: string;
}

interface CreatePendingOrderRequest {
    billing_details: BillingDetails;
    product_id: number; // external product/variation id from Axcera checkout
    account_id: string; // external account reference to echo back in metadata
    secret_key?: string; // authentication key - TEMPORARILY OPTIONAL
}

function getCorsHeaders(origin: string | null) {
    // Allow all origins by echoing back the origin
    // This is required when using credentials
    const allowedOrigin = origin || "*";

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With, Accept, Origin",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
    };
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");
    const headers = getCorsHeaders(origin);
    return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);
    const posthog = getPostHogServer();
    const startTime = Date.now();

    // Store these for error logging if needed
    let product_id: number | undefined;
    let account_id: string | undefined;
    let billing: BillingDetails | undefined;

    try {
        const body: CreatePendingOrderRequest = await request.json();
        ({
            billing_details: billing,
            product_id,
            account_id,
        } = body || ({} as CreatePendingOrderRequest));
        const { secret_key: _secret_key } = body || {}; // Temporarily disabled, prefixed with _ to indicate unused

        // Track API call start
        try {
            posthog.capture({
                distinctId: `pending_order_${account_id || Date.now()}`,
                event: "pending_order_request_started",
                properties: {
                    productId: product_id,
                    accountId: account_id,
                    customerEmailHash: hashEmail(billing?.email),
                    hasSecretKey: !!_secret_key,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (loggingError) {
            console.error("Failed to log to PostHog:", loggingError);
        }

        if (!billing?.email || !product_id || !account_id) {
            // Track validation error
            try {
                posthog.capture({
                    distinctId: `pending_order_${account_id || Date.now()}`,
                    event: "pending_order_validation_failed",
                    properties: {
                        missingFields: {
                            email: !billing?.email,
                            productId: !product_id,
                            accountId: !account_id,
                        },
                        timestamp: new Date().toISOString(),
                    },
                });
            } catch (loggingError) {
                console.error("Failed to log to PostHog:", loggingError);
            }

            return NextResponse.json(
                {
                    error: "Missing required fields: billing_details.email, product_id, account_id",
                },
                { status: 400, headers: corsHeaders },
            );
        }

        // Validate secret key - TEMPORARILY DISABLED
        // TODO: Re-enable secret key validation after testing
        /*
        const expectedSecretKey = process.env.INAPP_ORDERS_SECRET_KEY;
        if (!expectedSecretKey || secret_key !== expectedSecretKey) {
            return NextResponse.json(
                { error: "Invalid secret_key" },
                { status: 401, headers: corsHeaders },
            );
        }
        */

        // Get affiliate_username from cookies
        const cookieStore = await cookies();
        const affiliateUsernameCookie = cookieStore.get(
            AFFILIATEWP_CONFIG.cookie.name,
        );
        const affiliateUsernameFromCookie = affiliateUsernameCookie?.value;

        console.log("[Orders Create Pending] Cookie extraction:", {
            affiliateUsernameCookieName: AFFILIATEWP_CONFIG.cookie.name,
            affiliateUsernameFound: !!affiliateUsernameFromCookie,
            affiliateUsername: affiliateUsernameFromCookie,
        });

        const payload = await getPayloadClient();

        // Find mapping by product_id and determine purchase type
        const result = await findMappingByProductId(String(product_id));
        if (!result) {
            // Track mapping not found
            try {
                posthog.capture({
                    distinctId: `pending_order_${account_id}`,
                    event: "pending_order_mapping_not_found",
                    properties: {
                        productId: product_id,
                        accountId: account_id,
                        customerEmailHash: hashEmail(billing.email),
                        timestamp: new Date().toISOString(),
                    },
                });
            } catch (loggingError) {
                console.error("Failed to log to PostHog:", loggingError);
            }

            return NextResponse.json(
                {
                    error: "No mapping found for product_id. Product may not be configured.",
                },
                { status: 400, headers: corsHeaders },
            );
        }

        const { mapping, purchaseType } = result;

        // Determine reset product type for reset orders and fetch full mapping
        let resetProductType: "evaluation" | "funded" | undefined;
        let fullMapping: any = null; // Store full mapping for later use
        if (purchaseType === "reset-order") {
            // Need to fetch the full mapping to check which reset product ID matched
            const mappingsGlobal = await payload.findGlobal({
                slug: "program-product-mappings",
            });
            const mappings = mappingsGlobal?.mappings || [];
            fullMapping = mappings.find(
                (m: {
                    program?: number | { id?: number };
                    tierId?: string;
                    platformId?: string;
                    reset_fee_product_id?: string | null;
                    reset_fee_funded_product_id?: string | null;
                    reset_fee_funded_variation_id?: string | null;
                }) => {
                    const mappingProgramId =
                        typeof m.program === "number"
                            ? m.program
                            : typeof m.program === "object" &&
                                m.program !== null
                              ? m.program.id
                              : null;
                    return (
                        String(mappingProgramId) === String(mapping.program) &&
                        m.tierId === mapping.tierId &&
                        m.platformId === mapping.platformId
                    );
                },
            );

            if (fullMapping) {
                if (fullMapping.reset_fee_product_id === String(product_id)) {
                    resetProductType = "evaluation";
                } else if (
                    fullMapping.reset_fee_funded_product_id ===
                    String(product_id)
                ) {
                    resetProductType = "funded";
                }
            }
        }

        // Fetch program details
        const program = (await payload.findByID({
            collection: "programs",
            id: String(mapping.program),
        })) as Program;

        if (!program) {
            return NextResponse.json(
                { error: "Program not found" },
                { status: 400, headers: corsHeaders },
            );
        }

        // Fetch platform details
        const platforms = await payload.find({
            collection: "platforms",
            where: { slug: { equals: mapping.platformId } },
            limit: 1,
        });
        const platform = platforms.docs[0] as Platform | undefined;

        // Find pricing tier by matching tier.id or generated ID
        const pricingTier = program.pricingTiers?.find((tier, index) => {
            // Match by tier.id if it exists
            if (tier.id && tier.id === mapping.tierId) {
                return true;
            }
            // Match by generated ID format: tier-{index}-{accountSize}
            const generatedId = `tier-${index}-${tier.accountSize?.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;
            return generatedId === mapping.tierId;
        });

        // Use the actual accountSize from the tier or format the tierId
        const formattedAccountSize =
            pricingTier?.accountSize ||
            (mapping.tierId.startsWith("$")
                ? mapping.tierId
                : `$${mapping.tierId.toUpperCase()}`);

        // For reset orders, use the resetFee from the pricing tier (no discounts applied)
        // For activation orders, use the activationFeeValue from the program (no discounts applied)
        // For regular orders, use the regular price and apply discounts if available
        let finalPurchasePrice: number;
        let finalTotalPrice: number;
        let appliedCouponCode: string | undefined;
        let affiliateId: string | null = null;
        let affiliateEmail: string | null = null;
        let affiliateUsername: string | null = null;

        if (purchaseType === "reset-order") {
            // Use resetFeeFunded for funded reset orders, resetFee for evaluation reset orders
            const resetFeePrice =
                resetProductType === "funded"
                    ? pricingTier?.resetFeeFunded || pricingTier?.resetFee || 0
                    : pricingTier?.resetFee || 0;
            finalPurchasePrice = resetFeePrice;
            finalTotalPrice = resetFeePrice;

            console.log(
                `Reset order (${resetProductType || "evaluation"}): Using ${resetProductType === "funded" ? "resetFeeFunded" : "resetFee"} of ${resetFeePrice} (no discounts applied)`,
            );
        } else if (purchaseType === "activation-order") {
            // Use activationFeeValue for activation orders (no discounts)
            const activationFeePrice = program.activationFeeValue || 0;
            finalPurchasePrice = activationFeePrice;
            finalTotalPrice = activationFeePrice;

            console.log(
                `Activation order: Using activationFeeValue of ${activationFeePrice} (no discounts applied)`,
            );
        } else {
            // For non-reset orders, use regular price and check for auto-apply coupons
            const tierPrice = pricingTier?.price || 0;
            finalPurchasePrice = tierPrice;
            finalTotalPrice = tierPrice;

            try {
                const autoApplyResult = await getBestAutoApplyCoupon({
                    userId: undefined,
                    userEmail: billing.email,
                    programId: String(mapping.program),
                    accountSize: formattedAccountSize,
                    orderAmount: tierPrice,
                    urlParams: new URLSearchParams(),
                });

                if (autoApplyResult.success && autoApplyResult.coupon) {
                    const coupon = autoApplyResult.coupon;

                    // Calculate discounted price
                    const discountCalc = calculateDiscount({
                        originalPrice: tierPrice,
                        discountType: coupon.discount.type,
                        discountValue: coupon.discount.value,
                    });

                    finalPurchasePrice = discountCalc.finalPrice;
                    finalTotalPrice = discountCalc.finalPrice;
                    appliedCouponCode = coupon.code;

                    // Extract affiliate info from coupon
                    const validationResult = await validateCoupon({
                        code: coupon.code,
                        programId: String(mapping.program),
                        accountSize: formattedAccountSize,
                        userEmail: billing.email,
                        orderAmount: tierPrice,
                    });

                    if (validationResult.valid && validationResult.coupon) {
                        affiliateId =
                            validationResult.coupon.affiliateId || null;
                        affiliateEmail =
                            validationResult.coupon.affiliateEmail || null;
                        affiliateUsername =
                            validationResult.coupon.affiliateUsername || null;
                    }

                    // Track auto-applied coupon
                    try {
                        posthog.capture({
                            distinctId: `pending_order_${account_id}`,
                            event: "pending_order_auto_coupon_applied",
                            properties: {
                                couponCode: coupon.code,
                                discountType: coupon.discount.type,
                                discountValue: coupon.discount.value,
                                originalPrice: tierPrice,
                                finalPrice: finalTotalPrice,
                                discountAmount: tierPrice - finalTotalPrice,
                                programId: String(mapping.program),
                                accountSize: formattedAccountSize,
                                customerEmailHash: hashEmail(billing.email),
                                hasAffiliate: !!affiliateId,
                                affiliateUsername:
                                    affiliateUsername || undefined,
                                timestamp: new Date().toISOString(),
                            },
                        });
                    } catch (loggingError) {
                        console.error(
                            "Failed to log to PostHog:",
                            loggingError,
                        );
                    }

                    console.log(
                        `Auto-applied coupon ${coupon.code}: ${tierPrice} -> ${finalTotalPrice}`,
                    );
                }
            } catch (error) {
                console.error("Error applying auto-apply coupon:", error);
                // Continue without coupon if there's an error
            }
        }

        // If affiliate username not set from coupon, use cookie value
        if (!affiliateUsername && affiliateUsernameFromCookie) {
            affiliateUsername = affiliateUsernameFromCookie;
            console.log(
                "[Orders Create Pending] Using affiliate username from cookie:",
                affiliateUsername,
            );
        }

        // Calculate region from country code
        const region = getRegionFromCountryCode(billing.country);

        // Build program details string
        const programDetails = `${formattedAccountSize} - ${program.name}${platform ? ` - ${platform.name}` : ""}`;

        // Generate order number
        const orderNumber = await generateIncrementalOrderNumber();

        // Create a pending purchase record
        const purchase = await payload.create({
            collection: "purchases",
            data: {
                program: Number(mapping.program),
                accountSize: formattedAccountSize,
                purchasePrice: finalPurchasePrice,
                totalPrice: finalTotalPrice,
                currency: "USD",
                status: "pending",
                purchaseType: purchaseType,
                orderNumber,
                programName: program.name,
                programType: program.category,
                platformSlug: mapping.platformId,
                platformName: platform?.name || mapping.platformId,
                programDetails: programDetails,
                customerName:
                    `${billing.first_name || ""} ${billing.last_name || ""}`.trim() ||
                    "Unknown",
                customerEmail: billing.email,
                region: region as
                    | "africa"
                    | "asia"
                    | "europe"
                    | "latin-america"
                    | "middle-east"
                    | "north-america"
                    | "oceania"
                    | "south-asia"
                    | "other",
                discountCode: appliedCouponCode,
                // Add affiliate fields
                ...(affiliateId ? { affiliateId } : {}),
                ...(affiliateEmail ? { affiliateEmail } : {}),
                ...(affiliateUsername ? { affiliateUsername } : {}),
                billingAddress: {
                    address: billing.address_1 || "",
                    city: billing.city || "",
                    state: "",
                    postalCode: billing.postcode || "",
                    country: billing.country || "",
                },
                metadata: {
                    account_id,
                    source: "inapp-orders:create-pending",
                    customerEmail: billing.email,
                    customerFirstName: billing.first_name,
                    customerLastName: billing.last_name,
                    customerPhone: billing.phone,
                    tierId: mapping.tierId,
                    platformId: mapping.platformId,
                    // For reset/activation orders: store the fee product ID as productId
                    // For original orders: store mapping.productId
                    productId:
                        purchaseType === "reset-order" ||
                        purchaseType === "activation-order"
                            ? String(product_id)
                            : mapping.productId,
                    // For funded reset orders: use reset_fee_funded_variation_id if available
                    // For other orders: use mapping.variationId
                    variationId:
                        purchaseType === "reset-order" &&
                        resetProductType === "funded" &&
                        fullMapping?.reset_fee_funded_variation_id
                            ? fullMapping.reset_fee_funded_variation_id
                            : mapping.variationId,
                    originalPrice:
                        purchaseType === "reset-order"
                            ? resetProductType === "funded"
                                ? pricingTier?.resetFeeFunded ||
                                  pricingTier?.resetFee ||
                                  0
                                : pricingTier?.resetFee || 0
                            : purchaseType === "activation-order"
                              ? program.activationFeeValue || 0
                              : pricingTier?.price || 0,
                    appliedDiscount:
                        purchaseType === "reset-order" ||
                        purchaseType === "activation-order"
                            ? 0
                            : appliedCouponCode
                              ? (pricingTier?.price || 0) - finalTotalPrice
                              : 0,
                    // Store reset product type for reset orders
                    ...(resetProductType
                        ? { reset_product_type: resetProductType }
                        : {}),
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
                "[Hyros] Error tracking pending order creation:",
                error,
            );
            // Don't fail the purchase creation if Hyros tracking fails
        }

        // Track purchase creation in Klaviyo (Started Order)
        try {
            await trackStartedOrder({
                email: billing.email,
                orderId: orderNumber,
                total: finalTotalPrice,
                currency: "USD",
                discountCode: appliedCouponCode || null,
                items: [
                    {
                        product_id: mapping.program,
                        sku: `${mapping.program}-${formattedAccountSize}`,
                        name:
                            program.name ||
                            `${platform?.name || mapping.platformId} - ${formattedAccountSize}`,
                        quantity: 1,
                        price: finalPurchasePrice,
                    },
                ],
            });
        } catch (error) {
            console.error(
                "[Klaviyo] Error tracking pending order creation:",
                error,
            );
            // Don't fail the purchase creation if Klaviyo tracking fails
        }

        // Build internal payment page URL (without locale prefix for English)
        const requestOrigin = request.nextUrl.origin;
        const paymentUrl = new URL(
            `${requestOrigin}/orders/${purchase.orderNumber}/pay`,
        );
        paymentUrl.searchParams.set("checkout-login-token", "1");
        paymentUrl.searchParams.set("email", billing.email);
        paymentUrl.searchParams.set("product_id", String(product_id));

        // Track successful order creation
        try {
            const duration = Date.now() - startTime;
            posthog.capture({
                distinctId: `pending_order_${account_id}`,
                event: "pending_order_created",
                properties: {
                    orderId: purchase.id,
                    orderNumber: purchase.orderNumber,
                    programId: String(mapping.program),
                    programName: program.name,
                    programType: program.category,
                    platformSlug: mapping.platformId,
                    platformName: platform?.name || mapping.platformId,
                    accountSize: formattedAccountSize,
                    purchaseType: purchaseType,
                    resetProductType: resetProductType || undefined,
                    purchasePrice: finalPurchasePrice,
                    totalPrice: finalTotalPrice,
                    currency: "USD",
                    region: region,
                    customerEmailHash: hashEmail(billing.email),
                    customerCountry: billing.country,
                    discountCode: appliedCouponCode || undefined,
                    hasDiscount: !!appliedCouponCode,
                    affiliateId: affiliateId || undefined,
                    affiliateUsername: affiliateUsername || undefined,
                    productId: product_id,
                    accountId: account_id,
                    duration,
                    success: true,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (loggingError) {
            console.error("Failed to log to PostHog:", loggingError);
        }

        return NextResponse.json(
            {
                success: true,
                order_id: purchase.id,
                payment_url: paymentUrl.toString(),
            },
            { headers: corsHeaders },
        );
    } catch (error) {
        console.error("Error in create-pending order API:", error);

        // Log error to PostHog
        try {
            logApiError({
                endpoint: "/api/orders/create-pending",
                error,
                method: "POST",
                statusCode: 500,
                additionalContext: {
                    productId: product_id,
                    accountId: account_id,
                    customerEmailHash: hashEmail(billing?.email),
                    duration: Date.now() - startTime,
                },
            });
        } catch (loggingError) {
            console.error("Failed to log error to PostHog:", loggingError);
        }

        return NextResponse.json(
            { error: "Failed to create pending order" },
            { status: 500, headers: corsHeaders },
        );
    }
}
