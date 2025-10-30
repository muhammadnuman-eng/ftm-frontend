/**
 * Klaviyo tracking integration for Next.js
 * Handles profile management, list subscriptions, and event tracking
 * Based on Klaviyo API v2024-07-15
 */

const KLAVIYO_API = "https://a.klaviyo.com/api";
const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY || "";
const KLAVIYO_NEWSLETTER_LIST_ID = process.env.KLAVIYO_NEWSLETTER_LIST_ID || "";

// Check if Klaviyo is enabled (similar to Hyros pattern)
const KLAVIYO_ENABLED =
    process.env.NODE_ENV === "production" ||
    process.env.KLAVIYO_ENABLE_TEST === "true";

interface KlaviyoApiError {
    errors?: Array<{
        id: string;
        status: number;
        code: string;
        title: string;
        detail: string;
    }>;
}

/**
 * Make a POST request to Klaviyo API
 */
async function post(path: string, body: unknown): Promise<unknown> {
    if (!KLAVIYO_ENABLED) {
        console.log("[Klaviyo] Tracking disabled, skipping request:", path);
        return { success: true, disabled: true };
    }

    if (!KLAVIYO_API_KEY) {
        console.error("[Klaviyo] API key not configured");
        throw new Error("Klaviyo API key not configured");
    }

    const url = `${KLAVIYO_API}${path}`;

    console.log("[Klaviyo] Sending request:", {
        path,
        hasApiKey: !!KLAVIYO_API_KEY,
    });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
            "Content-Type": "application/json",
            revision: "2024-07-15",
            "User-Agent": "FundedTraderMarkets/1.0",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorDetail = errorText;

        try {
            const errorJson: KlaviyoApiError = JSON.parse(errorText);
            if (errorJson.errors && errorJson.errors.length > 0) {
                errorDetail = errorJson.errors
                    .map((e) => `${e.code}: ${e.detail}`)
                    .join(", ");
            }
        } catch {
            // If JSON parsing fails, use the raw text
        }

        console.error("[Klaviyo] API request failed:", {
            path,
            status: response.status,
            error: errorDetail,
        });

        throw new Error(
            `Klaviyo ${path} failed: ${response.status} - ${errorDetail}`,
        );
    }

    // Handle response body safely - some endpoints return empty responses
    const responseText = await response.text();

    // If response is empty or whitespace only, return success object
    if (!responseText || responseText.trim() === "") {
        console.log("[Klaviyo] Request successful (empty response):", { path });
        return { success: true };
    }

    // Try to parse JSON response
    try {
        const data = JSON.parse(responseText);
        console.log("[Klaviyo] Request successful:", { path });
        return data;
    } catch (parseError) {
        console.error("[Klaviyo] Failed to parse response:", {
            path,
            responseText: responseText.substring(0, 100),
            error: parseError,
        });
        // Return success since the HTTP request succeeded
        return { success: true, rawResponse: responseText };
    }
}

/**
 * Create or update a customer profile in Klaviyo
 */
export async function upsertProfile(
    email: string,
    attrs: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        [key: string]: unknown;
    } = {},
): Promise<void> {
    try {
        await post("/profiles/", {
            data: {
                type: "profile",
                attributes: {
                    email: email.toLowerCase().trim(),
                    ...attrs,
                },
            },
        });

        console.log("[Klaviyo] Profile upserted:", { email });
    } catch (error) {
        console.error("[Klaviyo] Error upserting profile:", error);
        throw error;
    }
}

/**
 * Subscribe a profile to a Klaviyo list
 */
export async function subscribeToList(
    listId: string,
    email: string,
): Promise<void> {
    try {
        await post(`/lists/${listId}/relationships/profiles/`, {
            data: [
                {
                    type: "profile",
                    attributes: {
                        email: email.toLowerCase().trim(),
                    },
                },
            ],
        });

        console.log("[Klaviyo] Profile subscribed to list:", { email, listId });
    } catch (error) {
        console.error("[Klaviyo] Error subscribing to list:", error);
        throw error;
    }
}

/**
 * Subscribe to the default newsletter list (if configured)
 */
export async function subscribeToNewsletter(email: string): Promise<void> {
    if (!KLAVIYO_NEWSLETTER_LIST_ID) {
        console.log(
            "[Klaviyo] Newsletter list ID not configured, skipping subscription",
        );
        return;
    }

    await subscribeToList(KLAVIYO_NEWSLETTER_LIST_ID, email);
}

/**
 * Track a custom event in Klaviyo
 */
async function trackEvent(
    metricName: string,
    email: string,
    properties: Record<string, unknown>,
    uniqueId?: string,
): Promise<void> {
    try {
        const eventData: {
            type: "event";
            attributes: {
                metric: {
                    data: {
                        type: "metric";
                        attributes: {
                            name: string;
                        };
                    };
                };
                properties: Record<string, unknown>;
                time: string;
                profile: {
                    data: {
                        type: "profile";
                        attributes: { email: string };
                    };
                };
                unique_id?: string;
            };
        } = {
            type: "event",
            attributes: {
                metric: {
                    data: {
                        type: "metric",
                        attributes: {
                            name: metricName,
                        },
                    },
                },
                properties,
                time: new Date().toISOString(),
                profile: {
                    data: {
                        type: "profile",
                        attributes: { email: email.toLowerCase().trim() },
                    },
                },
            },
        };

        // Add unique_id if provided (for deduplication)
        if (uniqueId) {
            eventData.attributes.unique_id = uniqueId;
        }

        await post("/events/", { data: eventData });

        console.log("[Klaviyo] Event tracked:", {
            metricName,
            email,
            uniqueId,
        });
    } catch (error) {
        console.error("[Klaviyo] Error tracking event:", error);
        throw error;
    }
}

/**
 * Track "Started Checkout" event (when customer enters contact/shipping info)
 */
export async function trackStartedCheckout(args: {
    email: string;
    itemName: string;
    total: number;
    currency?: string;
    discountCode?: string | null;
    items?: Array<{
        product_id?: string | number;
        sku?: string;
        name: string;
        quantity: number;
        price: number;
    }>;
}): Promise<void> {
    try {
        await trackEvent(
            "Started Checkout",
            args.email,
            {
                $value: args.total,
                item_name: args.itemName,
                currency: args.currency || "USD",
                discount_code: args.discountCode || undefined,
                items: args.items || [],
            },
            `checkout_${args.email}_${args.itemName}_${args.total}`,
        );
    } catch (error) {
        console.error("[Klaviyo] Error tracking Started Checkout:", error);
        // Don't throw - we don't want to fail the checkout flow
    }
}

/**
 * Track "Started Order" event (pending/initiated order)
 */
export async function trackStartedOrder(args: {
    email: string;
    orderId: string | number;
    total: number;
    currency?: string;
    discountCode?: string | null;
    items?: Array<{
        product_id?: string | number;
        sku?: string;
        name: string;
        quantity: number;
        price: number;
    }>;
}): Promise<void> {
    try {
        await trackEvent(
            "Started Order",
            args.email,
            {
                $value: args.total,
                order_id: String(args.orderId),
                currency: args.currency || "USD",
                discount_code: args.discountCode || undefined,
                items: args.items || [],
            },
            `started_${args.orderId}`,
        );
    } catch (error) {
        console.error("[Klaviyo] Error tracking Started Order:", error);
        // Don't throw - we don't want to fail the purchase creation
    }
}

/**
 * Track "Placed Order" event (completed/confirmed order)
 */
export async function trackPlacedOrder(args: {
    email: string;
    orderId: string | number;
    total: number;
    currency?: string;
    discountCode?: string | null;
    items: Array<{
        product_id?: string | number;
        sku?: string;
        name: string;
        quantity: number;
        price: number;
    }>;
}): Promise<void> {
    try {
        // Track main "Placed Order" event
        await trackEvent(
            "Placed Order",
            args.email,
            {
                $value: args.total,
                order_id: String(args.orderId),
                currency: args.currency || "USD",
                discount_code: args.discountCode || undefined,
                items: args.items.map((item) => ({
                    product_id: item.product_id,
                    sku: item.sku,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                })),
            },
            `placed_${args.orderId}`,
        );

        // Track individual "Ordered Product" events for each line item
        for (const item of args.items) {
            await trackEvent(
                "Ordered Product",
                args.email,
                {
                    $value: item.price * item.quantity,
                    order_id: String(args.orderId),
                    name: item.name,
                    sku: item.sku,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price: item.price,
                },
                `placed_${args.orderId}_${item.sku || item.product_id || item.name}`,
            );
        }
    } catch (error) {
        console.error("[Klaviyo] Error tracking Placed Order:", error);
        // Don't throw - we don't want to fail the webhook processing
    }
}

/**
 * Track "Order Failed" event (declined/failed payment)
 */
export async function trackOrderFailed(args: {
    email: string;
    orderId: string | number;
    total: number;
    currency?: string;
    discountCode?: string | null;
    items?: Array<{
        product_id?: string | number;
        sku?: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    reason?: string;
}): Promise<void> {
    try {
        await trackEvent(
            "Order Failed",
            args.email,
            {
                $value: args.total,
                order_id: String(args.orderId),
                currency: args.currency || "USD",
                discount_code: args.discountCode || undefined,
                items: args.items || [],
                reason: args.reason || "Payment declined",
            },
            `failed_${args.orderId}`,
        );
    } catch (error) {
        console.error("[Klaviyo] Error tracking Order Failed:", error);
        // Don't throw - we don't want to fail the webhook processing
    }
}
