import type { Payload } from "payload";
import type { Purchase } from "@/payload-types";
import {
    HYROS_CONFIG,
    HYROS_EVENTS,
    type HyrosApiResponse,
    type HyrosBaseEvent,
    type HyrosLeadEvent,
    type HyrosPurchaseEvent,
    type HyrosTrackingResult,
} from "./hyros-config";

/**
 * Send an event to Hyros API
 */
async function sendHyrosEvent(
    endpoint: string,
    eventData: HyrosBaseEvent | HyrosPurchaseEvent | HyrosLeadEvent,
): Promise<HyrosTrackingResult> {
    // Skip if tracking is disabled
    if (!HYROS_CONFIG.enabled) {
        console.log("[Hyros] Tracking disabled, skipping event");
        return {
            success: true,
            timestamp: new Date().toISOString(),
            error: "tracking_disabled",
        };
    }

    // Validate API key
    if (!HYROS_CONFIG.apiKey) {
        console.error("[Hyros] API key not configured");
        return {
            success: false,
            error: "missing_api_key",
            timestamp: new Date().toISOString(),
        };
    }

    try {
        const url = `${HYROS_CONFIG.apiUrl}${endpoint}`;

        console.log("[Hyros] Sending event:", {
            endpoint,
            email: eventData.email || "none",
            hasApiKey: !!HYROS_CONFIG.apiKey,
        });

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "FundedTraderMarkets/1.0",
                "API-Key": HYROS_CONFIG.apiKey,
            },
            body: JSON.stringify(eventData),
        });

        // Try to parse response as JSON, handle non-JSON responses
        let responseData: HyrosApiResponse;
        const responseText = await response.text();

        try {
            responseData = JSON.parse(responseText);
        } catch (_parseError) {
            console.error("[Hyros] Non-JSON response received:", {
                status: response.status,
                statusText: response.statusText,
                body: responseText.substring(0, 200),
            });
            return {
                success: false,
                error: `Invalid response: ${response.status} ${responseText.substring(0, 100)}`,
                timestamp: new Date().toISOString(),
            };
        }

        if (!response.ok) {
            console.error("[Hyros] API request failed:", {
                status: response.status,
                statusText: response.statusText,
                data: responseData,
            });
            return {
                success: false,
                error: responseData.error || `HTTP ${response.status}`,
                timestamp: new Date().toISOString(),
            };
        }

        console.log("[Hyros] Event sent successfully:", {
            eventId: responseData.event_id,
            endpoint,
        });

        return {
            success: true,
            eventId: responseData.event_id,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error("[Hyros] Error sending event:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "unknown_error",
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Track a purchase event (pending or completed)
 */
export async function trackHyrosPurchase(params: {
    purchase: Purchase;
    eventType: "pending" | "completed" | "declined";
    ipAddress?: string;
    userAgent?: string;
    pageUrl?: string;
    referrerUrl?: string;
}): Promise<HyrosTrackingResult> {
    const { purchase, eventType, ipAddress, userAgent, pageUrl, referrerUrl } =
        params;

    // Determine order status based on type
    let _orderStatus: string;

    switch (eventType) {
        case "pending":
            _orderStatus = "pending";
            break;
        case "declined":
            _orderStatus = "declined";
            break;
        default:
            _orderStatus = "completed";
            break;
    }

    // Extract customer name
    const nameParts = (purchase.customerName || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Build purchase event data following Hyros schema
    const eventData: HyrosPurchaseEvent = {
        // Customer identification
        email: purchase.customerEmail,
        firstName: firstName || undefined,
        lastName: lastName || undefined,

        // Order details
        orderId: String(purchase.orderNumber || purchase.id),
        date: new Date().toISOString().slice(0, 19), // Format: "2021-04-16T20:35:00"
        currency: purchase.currency || "USD",
        priceFormat: "DECIMAL",

        // Stage based on order status
        stage: eventType === "completed" ? "Customer" : "Lead",

        // Tracking data
        ...(ipAddress ? { leadIps: [ipAddress] } : {}),
        ...(ipAddress ? { ip_address: ipAddress } : {}),
        ...(userAgent ? { user_agent: userAgent } : {}),
        ...(pageUrl ? { page_url: pageUrl } : {}),
        ...(referrerUrl ? { referrer_url: referrerUrl } : {}),

        // Discounts if applicable
        ...(purchase.discountCode
            ? {
                  orderDiscount:
                      (purchase.purchasePrice ?? 0) -
                      (purchase.totalPrice ?? 0),
              }
            : {}),

        // Required: Items array
        items: [
            {
                name: purchase.programName || "Trading Program",
                price: purchase.totalPrice ?? 0,
                externalId: String(purchase.program),
                quantity: 1,
                tag: purchase.platformName || undefined,
                categoryName: purchase.programType || "trading-program",
            },
        ],
    };

    console.log("[Hyros] Tracking purchase:", {
        orderId: eventData.orderId,
        eventType,
        email: eventData.email,
        totalPrice: eventData.items[0]?.price,
        stage: eventData.stage,
    });

    return sendHyrosEvent("/orders", eventData);
}

/**
 * Track a lead event (contact form, newsletter, etc.)
 */
export async function trackHyrosLead(params: {
    email: string;
    leadType: "contact" | "newsletter";
    firstName?: string;
    lastName?: string;
    phone?: string;
    message?: string;
    ipAddress?: string;
    userAgent?: string;
    pageUrl?: string;
    referrerUrl?: string;
}): Promise<HyrosTrackingResult> {
    const {
        email,
        leadType,
        firstName,
        lastName,
        phone,
        message,
        ipAddress,
        userAgent,
        pageUrl,
        referrerUrl,
    } = params;

    // Determine event name
    const hyrosEvent =
        leadType === "newsletter"
            ? HYROS_EVENTS.NEWSLETTER
            : HYROS_EVENTS.CONTACT_FORM;

    // Build lead event data following Hyros schema
    const eventData: HyrosLeadEvent = {
        // Customer identification
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,

        // Lead tracking
        stage: "Lead",
        tags: [hyrosEvent, leadType, "website"],

        // Session data
        ...(ipAddress ? { leadIps: [ipAddress] } : {}),
        ...(phone ? { phoneNumbers: phone } : {}),
        ...(ipAddress ? { ip_address: ipAddress } : {}),
        ...(userAgent ? { user_agent: userAgent } : {}),
        ...(pageUrl ? { page_url: pageUrl } : {}),
        ...(referrerUrl ? { referrer_url: referrerUrl } : {}),
    };

    console.log("[Hyros] Tracking lead:", {
        email,
        leadType,
        hasMessage: !!message,
    });

    return sendHyrosEvent("/leads", eventData);
}

/**
 * Store Hyros tracking result in purchase metadata
 */
export async function storeHyrosMetadata(
    payload: Payload,
    purchaseId: string | number,
    trackingResult: HyrosTrackingResult,
    eventType: string,
): Promise<void> {
    try {
        // Get current purchase
        const purchase = await payload.findByID({
            collection: "purchases",
            id: purchaseId,
        });

        // Get existing metadata
        const existingMetadata =
            typeof purchase.metadata === "object" &&
            purchase.metadata !== null &&
            !Array.isArray(purchase.metadata)
                ? purchase.metadata
                : {};

        // Get existing Hyros metadata
        const existingHyrosMetadata = (
            existingMetadata as Record<string, unknown>
        ).hyros;
        const existingHyros =
            typeof existingHyrosMetadata === "object" &&
            existingHyrosMetadata !== null &&
            !Array.isArray(existingHyrosMetadata)
                ? (existingHyrosMetadata as Record<string, unknown>)
                : {};

        // Update purchase with Hyros tracking data
        await payload.update({
            collection: "purchases",
            id: purchaseId,
            data: {
                metadata: {
                    ...existingMetadata,
                    hyros: {
                        ...existingHyros,
                        [`${eventType}_sent`]: trackingResult.success,
                        [`${eventType}_timestamp`]: trackingResult.timestamp,
                        [`${eventType}_event_id`]:
                            trackingResult.eventId || null,
                        [`${eventType}_error`]: trackingResult.error || null,
                    },
                },
            },
        });

        console.log("[Hyros] Metadata stored:", {
            purchaseId,
            eventType,
            success: trackingResult.success,
        });
    } catch (error) {
        console.error("[Hyros] Error storing metadata:", error);
        // Don't throw - metadata storage failure shouldn't block the flow
    }
}
