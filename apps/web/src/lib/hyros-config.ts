/**
 * Hyros tracking configuration and types
 * Based on Hyros API documentation: https://hyros.docs.apiary.io
 */

export const HYROS_CONFIG = {
    // API base URL - Updated to match Hyros API structure
    apiUrl: "https://api.hyros.com/v1/api/v1.0",

    // API key from environment
    apiKey: process.env.HYROS_API_KEY || "",

    // Enable/disable tracking (useful for development)
    enabled:
        process.env.NODE_ENV === "production" ||
        process.env.HYROS_ENABLE_TEST === "true",
} as const;

/**
 * Hyros event types
 */
export const HYROS_EVENTS = {
    // Page view event
    PAGE_VIEW: "pageview",

    // Purchase events
    PURCHASE_PENDING: "purchase_pending",
    PURCHASE_COMPLETE: "purchase",
    PURCHASE_DECLINED: "purchase_declined",

    // Lead events
    LEAD: "lead",
    CONTACT_FORM: "contact_form",
    NEWSLETTER: "newsletter_signup",
} as const;

/**
 * Base structure for Hyros API calls
 * Note: API key is sent in headers, not in the request body
 */
export interface HyrosBaseEvent {
    // User identification (at least one required)
    email?: string;
    phone?: string;

    // Session/tracking data
    session_id?: string;
    ip_address?: string;
    user_agent?: string;

    // URL information
    page_url?: string;
    referrer_url?: string;

    // UTM parameters
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
}

/**
 * Purchase event data (Hyros Orders API format)
 */
export interface HyrosPurchaseEvent extends HyrosBaseEvent {
    // Customer data
    firstName?: string;
    lastName?: string;

    // Lead/tracking data
    leadIps?: string[];
    stage?: string;
    phoneNumbers?: string[];

    // Order details
    orderId: string;
    externalSubscriptionId?: string;
    cartId?: string;
    date?: string; // ISO format: "2021-04-16T20:35:00"

    // Pricing
    shippingCost?: number;
    taxes?: number;
    orderDiscount?: number;
    priceFormat?: string; // "DECIMAL"
    currency?: string;

    // Required: Items array
    items: Array<{
        name: string;
        price: number;
        costOfGoods?: number;
        externalId?: string;
        quantity?: number;
        taxes?: number;
        itemDiscount?: number;
        packages?: string[];
        tag?: string;
        categoryName?: string;
    }>;
}

/**
 * Lead event data (Hyros Leads API format)
 */
export interface HyrosLeadEvent extends HyrosBaseEvent {
    // Customer data
    firstName?: string;
    lastName?: string;

    // Lead tracking
    tags?: string[];
    leadIps?: string[];
    phoneNumbers?: string;
    stage?: string;
}

/**
 * Response from Hyros API
 */
export interface HyrosApiResponse {
    success: boolean;
    message?: string;
    event_id?: string;
    error?: string;
}

/**
 * Internal tracking result
 */
export interface HyrosTrackingResult {
    success: boolean;
    eventId?: string;
    error?: string;
    timestamp: string;
}
