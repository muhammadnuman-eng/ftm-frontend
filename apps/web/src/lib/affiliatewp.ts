import type { Payload } from "payload";
import type { Purchase } from "@/payload-types";
import type {
    AffiliateWPAffiliate,
    AffiliateWPRateInfo,
    AffiliateWPReferral,
    AffiliateWPReferralParams,
} from "./affiliatewp-config";
import { getPostHogServer } from "./posthog-server";

/**
 * Get AffiliateWP configuration from environment variables
 */
export function getAffiliateWPConfig() {
    const apiUrl = process.env.AFFILIATEWP_API_URL?.trim();
    const publicKey = process.env.AFFILIATEWP_API_PUBLIC_KEY?.trim();
    const token = process.env.AFFILIATEWP_API_TOKEN?.trim();

    if (!apiUrl || !publicKey || !token) {
        const missingVars = [];
        if (!apiUrl) missingVars.push("AFFILIATEWP_API_URL");
        if (!publicKey) missingVars.push("AFFILIATEWP_API_PUBLIC_KEY");
        if (!token) missingVars.push("AFFILIATEWP_API_TOKEN");

        console.error(
            `[AffiliateWP] Configuration missing. Required environment variables: ${missingVars.join(", ")}`,
        );

        throw new Error(
            `AffiliateWP configuration missing. Required: ${missingVars.join(", ")}`,
        );
    }

    return { apiUrl, publicKey, token };
}

/**
 * Create Basic Auth header for AffiliateWP API
 */
function getAuthHeader(publicKey: string, token: string): string {
    const credentials = `${publicKey}:${token}`;
    const encoded = Buffer.from(credentials).toString("base64");
    return `Basic ${encoded}`;
}

/**
 * Wrapper for fetch with timeout
 */
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 15000,
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
        }
        throw error;
    }
}

/**
 * Check if a customer has any previous affiliate association
 */
export async function getCustomerAffiliateInfo(
    payload: Payload,
    customerEmail: string,
    currentOrderNumber?: number,
) {
    try {
        // Find all previous purchases by email, excluding current order
        const purchases = await payload.find({
            collection: "purchases",
            where: {
                and: [
                    { customerEmail: { equals: customerEmail } },
                    ...(currentOrderNumber
                        ? [{ orderNumber: { not_equals: currentOrderNumber } }]
                        : []),
                    // Only consider purchases that aren't failed
                    {
                        status: {
                            in: ["pending", "completed", "refunded"],
                        },
                    },
                ],
            },
            sort: "createdAt", // Oldest first to find the original affiliate
            limit: 100,
        });

        // Check if customer has any previous purchases
        const hasPreviousPurchases = purchases.totalDocs > 0;

        // Helper function to check if purchase has affiliate data
        const hasAffiliateData = (purchase: Purchase) => {
            // Check root level affiliateId/affiliateEmail/affiliateUsername
            if (
                purchase.affiliateId ||
                purchase.affiliateEmail ||
                purchase.affiliateUsername
            ) {
                return true;
            }

            return false;
        };

        // Find the first (oldest) purchase with an affiliate association
        const firstAffiliatedPurchase = purchases.docs.find(hasAffiliateData);

        // Find the most recent purchase with an affiliate association
        const mostRecentAffiliatedPurchase = [...purchases.docs]
            .reverse()
            .find(hasAffiliateData);

        // Extract affiliate data from first affiliated purchase
        let extractedAffiliateId: string | null = null;
        let extractedAffiliateEmail: string | null = null;
        let extractedAffiliateUsername: string | null = null;

        if (firstAffiliatedPurchase) {
            extractedAffiliateId = firstAffiliatedPurchase.affiliateId || null;
            extractedAffiliateEmail =
                firstAffiliatedPurchase.affiliateEmail || null;
            extractedAffiliateUsername =
                firstAffiliatedPurchase.affiliateUsername || null;
        }

        console.log("[AffiliateWP] Customer affiliate history:", {
            customerEmail,
            totalPreviousPurchases: purchases.totalDocs,
            firstAffiliatedPurchase: firstAffiliatedPurchase
                ? {
                      orderNumber: firstAffiliatedPurchase.orderNumber,
                      affiliateId: firstAffiliatedPurchase.affiliateId,
                      affiliateEmail: firstAffiliatedPurchase.affiliateEmail,
                      affiliateUsername:
                          firstAffiliatedPurchase.affiliateUsername,
                  }
                : null,
        });

        // Calculate 60-day lifetime window based on most recent affiliated purchase
        let isWithinLifetimeWindow = false;
        let daysSinceLastPurchase: number | null = null;
        let lastPurchaseDate: string | null = null;

        if (mostRecentAffiliatedPurchase?.createdAt) {
            lastPurchaseDate = mostRecentAffiliatedPurchase.createdAt;
            const lastPurchaseDateObj = new Date(lastPurchaseDate);
            const daysSince =
                (Date.now() - lastPurchaseDateObj.getTime()) /
                (1000 * 60 * 60 * 24);
            daysSinceLastPurchase = daysSince;
            isWithinLifetimeWindow = daysSince <= 60;
        }

        console.log("[AffiliateWP] Lifetime window calculation:", {
            customerEmail,
            mostRecentAffiliatedPurchase: mostRecentAffiliatedPurchase
                ? {
                      orderNumber: mostRecentAffiliatedPurchase.orderNumber,
                      createdAt: mostRecentAffiliatedPurchase.createdAt,
                  }
                : null,
            daysSinceLastPurchase,
            isWithinLifetimeWindow,
            lifetimeWindowDays: 60,
        });

        return {
            isNewCustomer: !hasPreviousPurchases,
            hasPreviousPurchases,
            existingAffiliateId: extractedAffiliateId,
            existingAffiliateEmail: extractedAffiliateEmail,
            existingAffiliateUsername: extractedAffiliateUsername,
            firstAffiliatedOrderNumber:
                firstAffiliatedPurchase?.orderNumber || null,
            hasAnyAffiliateAssociation: !!firstAffiliatedPurchase,
            isWithinLifetimeWindow,
            daysSinceLastPurchase,
            lastPurchaseDate,
        };
    } catch (error) {
        console.error(
            "[AffiliateWP] Error checking customer affiliate info:",
            error,
        );
        // On error, be conservative and assume they're not a new customer
        return {
            isNewCustomer: false,
            hasPreviousPurchases: true,
            existingAffiliateId: null,
            existingAffiliateEmail: null,
            existingAffiliateUsername: null,
            firstAffiliatedOrderNumber: null,
            hasAnyAffiliateAssociation: false,
            isWithinLifetimeWindow: false,
            daysSinceLastPurchase: null,
            lastPurchaseDate: null,
        };
    }
}

/**
 * Look up an affiliate by their username
 * Returns the affiliate data if found, null if not found
 * Uses custom WordPress endpoint to avoid pagination issues with short usernames
 */
export async function lookupAffiliateByUsername(
    username: string,
): Promise<AffiliateWPAffiliate | null> {
    try {
        const config = getAffiliateWPConfig();

        // Use custom search endpoint that handles short usernames correctly
        const searchUrl = `${config.apiUrl}/wp-json/affwp/v1/affiliates/search?username=${encodeURIComponent(username)}`;

        console.log("[AffiliateWP] Looking up affiliate by username:", {
            username,
            searchUrl,
        });

        const response = await fetch(searchUrl, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                "[AffiliateWP] Failed to lookup affiliate:",
                response.status,
                response.statusText,
                errorText,
            );
            return null;
        }

        const data = await response.json();

        if (!data || !data.affiliate_id) {
            console.log(
                "[AffiliateWP] No affiliate found with username:",
                username,
            );
            return null;
        }

        // Map the response to AffiliateWPAffiliate format
        const affiliate: AffiliateWPAffiliate = {
            affiliate_id: data.affiliate_id,
            id: data.affiliate_id,
            user_id: data.user_id,
            rate: data.rate || "",
            rate_type: data.rate_type || "",
            payment_email: data.payment_email || "",
            status: data.status || "inactive",
            earnings: data.earnings || 0,
            unpaid_earnings: data.unpaid_earnings || 0,
            referrals: data.referrals || 0,
            visits: data.visits || 0,
            date_registered: data.date_registered || "",
        };

        // Add WordPress username to the affiliate object
        (affiliate as any).wp_username = data.username || data.user_nicename;

        console.log("[AffiliateWP] Found affiliate:", {
            affiliate_id: affiliate.affiliate_id,
            wp_username: data.username,
            status: affiliate.status,
        });

        return affiliate;
    } catch (error) {
        console.error("[AffiliateWP] Error looking up affiliate:", error);
        return null;
    }
}

/**
 * Create a referral/conversion in AffiliateWP
 */
export async function recordReferral(
    params: AffiliateWPReferralParams,
): Promise<{
    success: boolean;
    referral?: AffiliateWPReferral;
    error?: string;
}> {
    try {
        const config = getAffiliateWPConfig();
        const url = `${config.apiUrl}/wp-json/affwp/v1/referrals`;

        console.log("[AffiliateWP] Creating referral:", {
            affiliate_id: params.affiliate_id,
            amount: params.amount,
            description: params.description,
            reference: params.reference,
        });

        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                affiliate_id: params.affiliate_id,
                amount: params.amount,
                description: params.description,
                reference: params.reference,
                status: params.status || "unpaid",
                custom: params.custom,
                context: params.context || "ftm-nextjs",
                campaign: params.campaign,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[AffiliateWP] Failed to create referral:", {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
            });
            return {
                success: false,
                error: `API error: ${response.status} ${response.statusText}`,
            };
        }

        const referral = (await response.json()) as AffiliateWPReferral;

        console.log("[AffiliateWP] Referral created successfully:", {
            referral_id: referral.referral_id,
            affiliate_id: referral.affiliate_id,
            amount: referral.amount,
            status: referral.status,
        });

        return { success: true, referral };
    } catch (error) {
        console.error("[AffiliateWP] Error creating referral:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Record a visit in AffiliateWP
 */
export async function recordVisit(params: {
    affiliate_id: number;
    url: string;
    referrer?: string;
    campaign?: string;
    ip?: string;
}): Promise<{ success: boolean; visit_id?: number; error?: string }> {
    try {
        const config = getAffiliateWPConfig();
        const endpoint = `${config.apiUrl}/wp-json/affwp/v1/visits`;

        const queryParams = new URLSearchParams({
            affiliate_id: String(params.affiliate_id),
            url: params.url,
            ...(params.referrer ? { referrer: params.referrer } : {}),
            ...(params.campaign ? { campaign: params.campaign } : {}),
            ...(params.ip ? { ip: params.ip } : {}),
        });

        const response = await fetchWithTimeout(`${endpoint}?${queryParams}`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return { success: false, error: `HTTP ${response.status}` };
        }

        const result = await response.json();
        return { success: true, visit_id: result.visit_id };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Process AffiliateWP conversion when a purchase is completed
 */
export async function processAffiliateWPConversion(
    payload: Payload,
    purchase: Purchase,
): Promise<{
    processed: boolean;
    referralSent?: boolean;
    reason?: string;
    error?: string;
}> {
    const posthog = getPostHogServer();

    try {
        console.log("[AffiliateWP] Starting conversion processing:", {
            purchaseId: purchase.id,
            orderNumber: purchase.orderNumber,
            hasMetadata: !!purchase.metadata,
        });

        posthog.capture({
            distinctId: `purchase_${purchase.orderNumber}`,
            event: "affiliatewp_conversion_processing_started",
            properties: {
                purchaseId: purchase.id,
                orderNumber: purchase.orderNumber,
                timestamp: new Date().toISOString(),
            },
        });

        // Check if referral has already been created for this purchase
        const metadata = purchase.metadata;
        const existingAffiliateWPData =
            typeof metadata === "object" &&
            metadata !== null &&
            !Array.isArray(metadata) &&
            "affiliatewp" in metadata
                ? (metadata as Record<string, unknown>).affiliatewp
                : null;

        if (
            existingAffiliateWPData &&
            typeof existingAffiliateWPData === "object" &&
            "referralSent" in existingAffiliateWPData &&
            (existingAffiliateWPData as Record<string, unknown>)
                .referralSent === true
        ) {
            console.log(
                "[AffiliateWP] Referral already created for this order, skipping",
            );
            return {
                processed: false,
                reason: "referral_already_exists",
            };
        }

        const customerEmail = purchase.customerEmail;
        if (!customerEmail) {
            console.log("[AffiliateWP] No customer email, skipping");
            return { processed: false, reason: "no_customer_email" };
        }

        // Skip for reset orders and activation orders
        if (
            purchase.purchaseType === "reset-order" ||
            purchase.purchaseType === "activation-order"
        ) {
            console.log(
                "[AffiliateWP] Skipping for non-original order type:",
                purchase.purchaseType,
            );
            return {
                processed: false,
                reason: `skip_${purchase.purchaseType}`,
            };
        }

        // Get affiliate username from purchase metadata
        const affiliateUsername =
            typeof metadata === "object" &&
            metadata !== null &&
            !Array.isArray(metadata) &&
            "affiliateUsername" in metadata
                ? ((metadata as Record<string, unknown>).affiliateUsername as
                      | string
                      | undefined)
                : undefined;

        if (!affiliateUsername) {
            console.log("[AffiliateWP] No affiliate username in metadata");
            return { processed: false, reason: "no_affiliate_username" };
        }

        // Get customer affiliate info for lifetime tracking
        const affiliateInfo = await getCustomerAffiliateInfo(
            payload,
            customerEmail,
            purchase.orderNumber,
        );

        // Determine if we should send the referral
        let shouldSendReferral = false;
        let referralReason = "";

        if (affiliateInfo.isNewCustomer) {
            shouldSendReferral = true;
            referralReason = "new_customer_with_affiliate";
        } else if (affiliateInfo.hasAnyAffiliateAssociation) {
            // Only send referral if within 60-day lifetime window
            shouldSendReferral = affiliateInfo.isWithinLifetimeWindow;
            referralReason = affiliateInfo.isWithinLifetimeWindow
                ? "returning_customer_within_lifetime"
                : "returning_customer_outside_lifetime_window";
        } else {
            referralReason = "existing_customer_no_affiliate";
            shouldSendReferral = false;
        }

        console.log("[AffiliateWP] Conversion decision:", {
            shouldSendReferral,
            referralReason,
            isNewCustomer: affiliateInfo.isNewCustomer,
            hasAnyAffiliateAssociation:
                affiliateInfo.hasAnyAffiliateAssociation,
            isWithinLifetimeWindow: affiliateInfo.isWithinLifetimeWindow,
            daysSinceLastPurchase: affiliateInfo.daysSinceLastPurchase,
            lastPurchaseDate: affiliateInfo.lastPurchaseDate,
        });

        // Look up affiliate by username
        const affiliate = await lookupAffiliateByUsername(affiliateUsername);

        if (!affiliate) {
            console.error(
                "[AffiliateWP] Affiliate not found for username:",
                affiliateUsername,
            );

            posthog.capture({
                distinctId: `purchase_${purchase.orderNumber}`,
                event: "affiliatewp_conversion_failed",
                properties: {
                    purchaseId: purchase.id,
                    orderNumber: purchase.orderNumber,
                    error: "affiliate_not_found",
                    affiliateUsername,
                    timestamp: new Date().toISOString(),
                },
            });

            // Store failed attempt in metadata
            const existingMetadata =
                typeof purchase.metadata === "object" &&
                purchase.metadata !== null &&
                !Array.isArray(purchase.metadata)
                    ? purchase.metadata
                    : {};

            await payload.update({
                collection: "purchases",
                id: purchase.id,
                data: {
                    metadata: {
                        ...existingMetadata,
                        affiliatewp: {
                            referralSent: false,
                            referralReason,
                            error: "affiliate_not_found",
                            timestamp: new Date().toISOString(),
                            affiliateUsername,
                        },
                    },
                },
            });

            return {
                processed: true,
                referralSent: false,
                reason: "affiliate_not_found",
            };
        }

        // Only send if affiliate is active and we determined we should send
        if (affiliate.status !== "active") {
            console.log(
                "[AffiliateWP] Affiliate not active:",
                affiliate.status,
            );
            shouldSendReferral = false;
            referralReason = `affiliate_status_${affiliate.status}`;
        }

        let referralResult = null;

        if (shouldSendReferral) {
            // Create referral in AffiliateWP
            referralResult = await recordReferral({
                affiliate_id: affiliate.affiliate_id,
                amount: purchase.totalPrice || purchase.purchasePrice || 0,
                description: `Order #${purchase.orderNumber} - ${purchase.programDetails || purchase.programName || "Purchase"}`,
                reference: String(purchase.orderNumber),
                status: "unpaid",
                context: "ftm-nextjs",
                customer_email: customerEmail,
                customer_first_name: purchase.customerName?.split(" ")[0],
                customer_last_name: purchase.customerName
                    ?.split(" ")
                    .slice(1)
                    .join(" "),
            });

            if (!referralResult.success) {
                console.error(
                    "[AffiliateWP] Failed to create referral:",
                    referralResult.error,
                );

                posthog.capture({
                    distinctId: `purchase_${purchase.orderNumber}`,
                    event: "affiliatewp_referral_creation_failed",
                    properties: {
                        purchaseId: purchase.id,
                        orderNumber: purchase.orderNumber,
                        affiliateId: affiliate.affiliate_id,
                        affiliateUsername,
                        error: referralResult.error,
                        amount:
                            purchase.totalPrice || purchase.purchasePrice || 0,
                        timestamp: new Date().toISOString(),
                    },
                });
            } else {
                posthog.capture({
                    distinctId: `purchase_${purchase.orderNumber}`,
                    event: "affiliatewp_referral_created",
                    properties: {
                        purchaseId: purchase.id,
                        orderNumber: purchase.orderNumber,
                        affiliateId: affiliate.affiliate_id,
                        affiliateUsername,
                        referralId: referralResult.referral?.referral_id,
                        amount:
                            purchase.totalPrice || purchase.purchasePrice || 0,
                        isNewCustomer: affiliateInfo.isNewCustomer,
                        timestamp: new Date().toISOString(),
                    },
                });
            }
        } else {
            posthog.capture({
                distinctId: `purchase_${purchase.orderNumber}`,
                event: "affiliatewp_referral_skipped",
                properties: {
                    purchaseId: purchase.id,
                    orderNumber: purchase.orderNumber,
                    affiliateId: affiliate.affiliate_id,
                    affiliateUsername,
                    reason: referralReason,
                    isNewCustomer: affiliateInfo.isNewCustomer,
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // Store result in purchase metadata
        const existingMetadata =
            typeof purchase.metadata === "object" &&
            purchase.metadata !== null &&
            !Array.isArray(purchase.metadata)
                ? purchase.metadata
                : {};

        await payload.update({
            collection: "purchases",
            id: purchase.id,
            data: {
                metadata: {
                    ...existingMetadata,
                    affiliatewp: {
                        referralSent:
                            shouldSendReferral && referralResult?.success,
                        referralReason,
                        referralId: referralResult?.referral?.referral_id,
                        affiliateId: affiliate.affiliate_id,
                        affiliateUsername,
                        timestamp: new Date().toISOString(),
                        error: referralResult?.error,
                        isNewCustomer: affiliateInfo.isNewCustomer,
                        existingAffiliateInfo:
                            affiliateInfo.hasAnyAffiliateAssociation
                                ? {
                                      affiliateId:
                                          affiliateInfo.existingAffiliateId,
                                      firstOrderNumber:
                                          affiliateInfo.firstAffiliatedOrderNumber,
                                  }
                                : null,
                    },
                },
            },
        });

        return {
            processed: true,
            referralSent: shouldSendReferral && referralResult?.success,
            reason: referralReason,
        };
    } catch (error) {
        console.error("[AffiliateWP] Error processing conversion:", error);

        posthog.capture({
            distinctId: `purchase_${purchase.orderNumber}`,
            event: "affiliatewp_conversion_error",
            properties: {
                purchaseId: purchase.id,
                orderNumber: purchase.orderNumber,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
        });

        return {
            processed: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Get affiliate data by affiliate ID
 */
export async function getAffiliateById(
    affiliateId: number,
): Promise<AffiliateWPAffiliate | null> {
    try {
        const config = getAffiliateWPConfig();
        const url = `${config.apiUrl}/wp-json/affwp/v1/affiliates/${affiliateId}`;

        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                "[AffiliateWP] Failed to get affiliate:",
                response.status,
            );
            return null;
        }

        const affiliate = (await response.json()) as AffiliateWPAffiliate;
        console.log("affiliate", affiliate);

        return affiliate;
    } catch (error) {
        console.error("[AffiliateWP] Error getting affiliate:", error);
        return null;
    }
}

/**
 * Get affiliate's commission rate info (custom endpoint)
 */
export async function getAffiliateRateInfo(
    affiliateId: number,
): Promise<AffiliateWPRateInfo | null> {
    try {
        const config = getAffiliateWPConfig();
        const url = `${config.apiUrl}/wp-json/affwp/v1/affiliates/${affiliateId}/rate`;

        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                "[AffiliateWP] Failed to get affiliate rate info:",
                response.status,
            );
            return null;
        }

        const rateInfo = (await response.json()) as AffiliateWPRateInfo;
        console.log("affiliate rate info", rateInfo);

        return rateInfo;
    } catch (error) {
        console.error(
            "[AffiliateWP] Error getting affiliate rate info:",
            error,
        );
        return null;
    }
}

/**
 * Get referrals for an affiliate
 */
export async function getAffiliateReferrals(
    affiliateId: number,
    params?: {
        status?: string;
        number?: number;
        offset?: number;
        orderby?: string;
        order?: "asc" | "desc";
    },
): Promise<AffiliateWPReferral[]> {
    try {
        const config = getAffiliateWPConfig();
        const queryParams = new URLSearchParams({
            affiliate_id: String(affiliateId),
            number: String(params?.number || 100),
            offset: String(params?.offset || 0),
            orderby: params?.orderby || "date",
            order: params?.order || "desc", // Latest to newest by default
        });

        if (params?.status) {
            queryParams.set("status", params.status);
        }

        const url = `${config.apiUrl}/wp-json/affwp/v1/referrals?${queryParams}`;

        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                "[AffiliateWP] Failed to get referrals:",
                response.status,
                response,
            );
            return [];
        }

        const referrals = (await response.json()) as AffiliateWPReferral[];

        return referrals;
    } catch (error) {
        console.error("[AffiliateWP] Error getting referrals:", error);
        return [];
    }
}

/**
 * Get visits for an affiliate
 */
export async function getAffiliateVisits(
    affiliateId: number,
    params?: {
        number?: number;
        offset?: number;
        orderby?: string;
        order?: "asc" | "desc";
    },
): Promise<any[]> {
    try {
        const config = getAffiliateWPConfig();
        const queryParams = new URLSearchParams({
            affiliate_id: String(affiliateId),
            number: String(params?.number || 100),
            offset: String(params?.offset || 0),
            orderby: params?.orderby || "date",
            order: params?.order || "desc",
        });

        const url = `${config.apiUrl}/wp-json/affwp/v1/visits?${queryParams}`;

        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                "[AffiliateWP] Failed to get visits:",
                response.status,
            );
            return [];
        }

        const visits = await response.json();
        return Array.isArray(visits) ? visits : [];
    } catch (error) {
        console.error("[AffiliateWP] Error getting visits:", error);
        return [];
    }
}

/**
 * Get payouts for an affiliate
 */
export async function getAffiliatePayouts(
    affiliateId: number,
    params?: {
        number?: number;
        offset?: number;
        orderby?: string;
        order?: "asc" | "desc";
    },
): Promise<any[]> {
    try {
        const config = getAffiliateWPConfig();
        const queryParams = new URLSearchParams({
            affiliate_id: String(affiliateId),
            number: String(params?.number || 100),
            offset: String(params?.offset || 0),
            orderby: params?.orderby || "date",
            order: params?.order || "desc",
        });

        const url = `${config.apiUrl}/wp-json/affwp/v1/payouts?${queryParams}`;

        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                "[AffiliateWP] Failed to get payouts:",
                response.status,
            );
            return [];
        }

        const payouts = await response.json();
        return Array.isArray(payouts) ? payouts : [];
    } catch (error) {
        console.error("[AffiliateWP] Error getting payouts:", error);
        return [];
    }
}

/**
 * Get affiliate statistics from custom endpoint (server-side filtered)
 * This is much faster than fetching all data and filtering client-side
 */
export async function getAffiliateStatistics(
    affiliateId: number,
    days?: number,
): Promise<{
    affiliate_id: number;
    date_range: string;
    paid_referrals: number;
    unpaid_referrals: number;
    pending_referrals: number;
    rejected_referrals: number;
    total_referrals: number;
    visits: number;
    conversion_rate: number;
    paid_earnings: number;
    unpaid_earnings: number;
    commission_rate: number;
    rate_type: string;
    lifetime_customers: number;
} | null> {
    try {
        const config = getAffiliateWPConfig();
        const queryParams = new URLSearchParams();
        if (days) {
            queryParams.set("days", String(days));
        }

        const url = `${config.apiUrl}/wp-json/affwp/v1/affiliates/${affiliateId}/statistics${queryParams.toString() ? `?${queryParams}` : ""}`;

        const response = await fetchWithTimeout(url, {
            method: "GET",
            headers: {
                Authorization: getAuthHeader(config.publicKey, config.token),
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                "[AffiliateWP] Failed to get statistics:",
                response.status,
            );
            return null;
        }

        const stats = await response.json();
        console.log("[AffiliateWP] Statistics fetched:", stats);

        return stats;
    } catch (error) {
        console.error("[AffiliateWP] Error getting statistics:", error);
        return null;
    }
}
