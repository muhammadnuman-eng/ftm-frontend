/**
 * AffiliateWP integration configuration
 */
export const AFFILIATEWP_CONFIG = {
    // Cookie settings for affiliate username tracking
    cookie: {
        name: "affiliate_username",
        visitIdName: "affwp_visit_id",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    },
} as const;

// Type for affiliate lookup response
export interface AffiliateWPAffiliate {
    affiliate_id: number;
    user_id: number;
    rate: string;
    rate_type: string;
    flat_rate_basis?: string;
    payment_email: string;
    status: "active" | "inactive" | "pending" | "rejected";
    earnings: number;
    unpaid_earnings: number;
    referrals: number;
    visits: number;
    date_registered: string;
    id: number;
}

// Type for affiliate rate response from custom endpoint
export interface AffiliateWPRateInfo {
    affiliate_id: number;
    effective_rate: string;
    effective_rate_type: string;
    rate_source: "custom" | "group" | "global";
    custom: {
        rate: string;
        rate_type: string;
    };
    group: {
        id: number | null;
        name: string | null;
        rate: string | null;
        rate_type: string | null;
    };
    global: {
        rate: string;
        rate_type: string;
    };
}

// Type for referral creation parameters
export interface AffiliateWPReferralParams {
    // Required fields
    affiliate_id: number;
    amount: number;
    description: string;
    reference?: string;

    // Optional fields
    status?: "pending" | "unpaid" | "paid" | "rejected";
    custom?: string;
    context?: string;
    campaign?: string;

    // Customer information
    customer_email?: string;
    customer_first_name?: string;
    customer_last_name?: string;
}

// Type for referral creation response
export interface AffiliateWPReferral {
    referral_id: number;
    affiliate_id: number;
    visit_id: number;
    rest_id: string;
    customer_id: number;
    parent_id: number;
    description: string;
    status: string;
    amount: string;
    currency: string;
    custom: string | Record<string, unknown>;
    context: string;
    campaign: string;
    reference: string;
    products: string;
    date: string;
    type: string;
    payout_id: number;
    id: number;
}

// Type for visit response
export interface AffiliateWPVisit {
    visit_id: number;
    affiliate_id: number;
    referral_id: number;
    url: string;
    referrer: string;
    campaign: string;
    ip: string;
    date: string;
    id: number;
}

// Type for visit creation parameters
export interface AffiliateWPVisitParams {
    affiliate_id: number;
    referral_id?: number;
    url: string;
    referrer?: string;
    campaign?: string;
    ip?: string;
}
