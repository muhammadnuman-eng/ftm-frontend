"use server";

import Decimal from "decimal.js";
import { requireAffiliateAuth } from "./affiliate-auth";
import {
    getAffiliateById,
    getAffiliatePayouts,
    getAffiliateReferrals,
    getAffiliateStatistics,
    getAffiliateVisits,
} from "./affiliatewp";
import type {
    AffiliateWPAffiliate,
    AffiliateWPReferral,
} from "./affiliatewp-config";

/**
 * Get current affiliate profile
 */
export async function getAffiliateProfile(): Promise<AffiliateWPAffiliate | null> {
    const session = await requireAffiliateAuth();
    return getAffiliateById(session.affiliateId);
}

/**
 * Get affiliate referrals with optional filters
 */
export async function getReferrals(params?: {
    status?: string;
    number?: number;
    offset?: number;
    orderby?: string;
    order?: "asc" | "desc";
}): Promise<AffiliateWPReferral[]> {
    const session = await requireAffiliateAuth();
    return getAffiliateReferrals(session.affiliateId, params);
}

/**
 * Get affiliate visits
 */
export async function getVisits(params?: {
    number?: number;
    offset?: number;
    orderby?: string;
    order?: "asc" | "desc";
}): Promise<any[]> {
    const session = await requireAffiliateAuth();
    return getAffiliateVisits(session.affiliateId, params);
}

/**
 * Get affiliate payouts
 */
export async function getPayouts(params?: {
    number?: number;
    offset?: number;
    orderby?: string;
    order?: "asc" | "desc";
}): Promise<any[]> {
    const session = await requireAffiliateAuth();
    return getAffiliatePayouts(session.affiliateId, params);
}

/**
 * Get affiliate statistics using the custom server-side endpoint
 * This is MUCH faster than fetching all data and filtering client-side
 */
export async function getStatistics(options?: { days?: number }): Promise<{
    unpaidReferrals: number;
    paidReferrals: number;
    visits: number;
    conversionRate: number;
    unpaidEarnings: number;
    paidEarnings: number;
    commissionRate: number;
    lifetimeCustomers: number;
} | null> {
    const session = await requireAffiliateAuth();

    // Use the new custom endpoint that does all calculations server-side
    const stats = await getAffiliateStatistics(
        session.affiliateId,
        options?.days,
    );

    if (!stats) return null;

    return {
        unpaidReferrals: stats.unpaid_referrals,
        paidReferrals: stats.paid_referrals,
        visits: stats.visits,
        conversionRate: stats.conversion_rate,
        unpaidEarnings: stats.unpaid_earnings,
        paidEarnings: stats.paid_earnings,
        commissionRate: stats.commission_rate,
        lifetimeCustomers: stats.lifetime_customers,
    };
}

/**
 * Get graph data for earnings over time
 */
export async function getGraphData(): Promise<{
    labels: string[];
    unpaid: number[];
    pending: number[];
    rejected: number[];
    paid: number[];
}> {
    const session = await requireAffiliateAuth();
    // Get recent referrals for graph (limited to 2000 for performance)
    const referrals = await getAffiliateReferrals(session.affiliateId, {
        number: 2000,
    });

    // Group by month using Decimal.js for precise calculations
    const monthlyData = new Map<
        string,
        {
            unpaid: Decimal;
            pending: Decimal;
            rejected: Decimal;
            paid: Decimal;
        }
    >();

    for (const referral of referrals) {
        const date = new Date(referral.date);
        const monthKey = `${date.toLocaleString("en-US", { month: "long" })}/${date.getFullYear()}`;

        if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
                unpaid: new Decimal(0),
                pending: new Decimal(0),
                rejected: new Decimal(0),
                paid: new Decimal(0),
            });
        }

        const data = monthlyData.get(monthKey);
        if (!data) continue;

        const amount = new Decimal(referral.amount || 0);

        if (referral.status === "unpaid")
            data.unpaid = data.unpaid.plus(amount);
        else if (referral.status === "pending")
            data.pending = data.pending.plus(amount);
        else if (referral.status === "rejected")
            data.rejected = data.rejected.plus(amount);
        else if (referral.status === "paid") data.paid = data.paid.plus(amount);
    }

    // Convert to arrays, rounding Decimal values to 2 decimal places
    const labels: string[] = [];
    const unpaid: number[] = [];
    const pending: number[] = [];
    const rejected: number[] = [];
    const paid: number[] = [];

    for (const [month, data] of monthlyData) {
        labels.push(month);
        unpaid.push(data.unpaid.toDecimalPlaces(2).toNumber());
        pending.push(data.pending.toDecimalPlaces(2).toNumber());
        rejected.push(data.rejected.toDecimalPlaces(2).toNumber());
        paid.push(data.paid.toDecimalPlaces(2).toNumber());
    }

    return { labels, unpaid, pending, rejected, paid };
}

/**
 * Get available coupons for affiliate
 */
export async function getCoupons(): Promise<
    Array<{
        code: string;
        amount: string;
        description?: string;
        status: string;
    }>
> {
    const session = await requireAffiliateAuth();

    try {
        const { getPayloadClient } = await import("@/lib/payload");
        const payload = await getPayloadClient();

        // Fetch coupons assigned to this affiliate (by username or email)
        const { docs: coupons } = await payload.find({
            collection: "coupons",
            where: {
                and: [
                    {
                        or: [
                            {
                                affiliateUsername: {
                                    equals: session.username,
                                },
                            },
                            {
                                affiliateEmail: {
                                    equals: session.email,
                                },
                            },
                        ],
                    },
                    {
                        status: {
                            in: ["active", "scheduled"],
                        },
                    },
                ],
            },
            limit: 100,
            sort: "-createdAt",
        });

        return coupons.map((coupon) => ({
            code: coupon.code,
            amount:
                coupon.discountType === "percentage"
                    ? `${coupon.discountValue}%`
                    : `$${coupon.discountValue}`,
            description: coupon.description || undefined,
            status: coupon.status,
        }));
    } catch (error) {
        console.error("[Affiliate Actions] Error fetching coupons:", error);
        return [];
    }
}

/**
 * Get campaigns data (derived from referrals)
 */
export async function getCampaigns(options?: {
    page?: number;
    perPage?: number;
}): Promise<{
    campaigns: Array<{
        campaign: string;
        visits: number;
        uniqueLinks: number;
        converted: number;
        conversionRate: string;
    }>;
    totalPages: number;
    currentPage: number;
}> {
    const session = await requireAffiliateAuth();
    const page = options?.page ?? 1;
    const perPage = options?.perPage ?? 15;

    // Limit to recent data for performance (last 1000 items)
    const referrals = await getAffiliateReferrals(session.affiliateId, {
        number: 1000,
    });
    const visits = await getAffiliateVisits(session.affiliateId, {
        number: 1000,
    });

    // Group by campaign
    const campaignMap = new Map<
        string,
        {
            visits: number;
            uniqueLinks: Set<string>;
            converted: number;
        }
    >();

    // Process referrals
    for (const referral of referrals) {
        const campaign = referral.campaign || "Direct";

        if (!campaignMap.has(campaign)) {
            campaignMap.set(campaign, {
                visits: 0,
                uniqueLinks: new Set(),
                converted: 0,
            });
        }

        const data = campaignMap.get(campaign);
        if (!data) continue;

        if (referral.status === "paid" || referral.status === "unpaid") {
            data.converted++;
        }
    }

    // Process visits
    for (const visit of visits) {
        const campaign = visit.campaign || "Direct";

        if (!campaignMap.has(campaign)) {
            campaignMap.set(campaign, {
                visits: 0,
                uniqueLinks: new Set(),
                converted: 0,
            });
        }

        const data = campaignMap.get(campaign);
        if (!data) continue;

        data.visits++;
        if (visit.url) {
            data.uniqueLinks.add(visit.url);
        }
    }

    // Convert to array using Decimal.js for conversion rate calculation
    const allCampaigns = Array.from(campaignMap.entries()).map(
        ([campaign, data]) => ({
            campaign,
            visits: data.visits,
            uniqueLinks: data.uniqueLinks.size || 1,
            converted: data.converted,
            conversionRate:
                data.visits > 0
                    ? `${new Decimal(data.converted).div(data.visits).times(100).toDecimalPlaces(2).toNumber()}%`
                    : "0%",
        }),
    );

    // Sort by visits (descending)
    allCampaigns.sort((a, b) => b.visits - a.visits);

    // Paginate
    const totalPages = Math.ceil(allCampaigns.length / perPage);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const campaigns = allCampaigns.slice(startIndex, endIndex);

    return {
        campaigns,
        totalPages,
        currentPage: page,
    };
}
