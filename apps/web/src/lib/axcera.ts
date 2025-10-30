import { hashEmail } from "./hash-utils";
import { getPostHogServer } from "./posthog-server";

export interface WooOrderLineItem {
    name: string;
    product_id: number;
    variation_id: number;
    total: string;
}

export interface WooOrderWebhookPayload {
    id: number;
    status: "completed" | string;
    currency: string;
    date_created: string;
    total: string;
    account_id?: string;
    billing: {
        first_name: string;
        last_name: string;
        company?: string;
        address_1: string;
        address_2?: string;
        city: string;
        state: string;
        postcode: string;
        country: string;
        email: string;
        phone: string;
    };
    line_items: WooOrderLineItem[];
    fee_lines?: Array<{
        meta_data?: Array<{ id: number; key: string; value: string[] }>;
    }>;
    meta_data?: Array<{ key: string; value: string | number }>;
}

export async function postAxceraWooWebhook(
    payload: WooOrderWebhookPayload,
    context?: {
        gateway?: string;
        purchaseId?: string | number;
    },
) {
    const endpoint =
        process.env.AXCERA_WOO_WEBHOOK_URL ||
        "https://backoffice-api.a4zgrvg7o.app.axcera.io/api/hooks/woocommerce";

    // Always use USD for Axcera
    const axceraPayload = {
        ...payload,
        currency: "USD",
    };

    console.log("posting to axcera", JSON.stringify(axceraPayload, null, 2));

    const startTime = Date.now();
    let responseStatus = 0;
    let responseBody = "";

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(axceraPayload),
        });

        responseStatus = res.status;
        responseBody = await res.text().catch(() => "");

        if (!res.ok) {
            throw new Error(
                `Axcera webhook failed (${res.status}): ${responseBody || res.statusText}`,
            );
        }

        // Log successful Axcera webhook to PostHog
        try {
            const posthog = getPostHogServer();
            const duration = Date.now() - startTime;

            // Extract add-ons from fee_lines
            const addOns =
                payload.fee_lines?.[0]?.meta_data?.find(
                    (m) => m.key === "_wc_checkout_add_on_value",
                )?.value || [];

            // Extract purchase metadata
            const purchaseType = payload.meta_data?.find(
                (m) => m.key === "_purchase_type",
            )?.value;
            const accountId =
                payload.account_id ||
                payload.meta_data?.find((m) => m.key === "account_id")?.value;

            posthog.capture({
                distinctId: `axcera_${context?.gateway || "unknown"}_${payload.id}`,
                event: "axcera_webhook_sent",
                properties: {
                    // Request data
                    gateway: context?.gateway,
                    orderId: payload.id,
                    status: payload.status,
                    total: payload.total,
                    currency: "USD", // Always USD for Axcera
                    purchaseId: context?.purchaseId,
                    productId: payload.line_items[0]?.product_id,
                    variationId: payload.line_items[0]?.variation_id,
                    productName: payload.line_items[0]?.name,
                    addOns,
                    customerEmailHash: hashEmail(payload.billing.email),
                    customerCountry: payload.billing.country,
                    accountId: accountId?.toString(),
                    purchaseType: purchaseType?.toString(),

                    // Response data
                    responseStatus,
                    responseBody: responseBody.substring(0, 1000), // Limit to first 1000 chars
                    duration,
                    success: true,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (loggingError) {
            console.error(
                "Failed to log Axcera webhook to PostHog:",
                loggingError,
            );
        }
    } catch (error) {
        // Log failed Axcera webhook to PostHog
        try {
            const posthog = getPostHogServer();
            const duration = Date.now() - startTime;

            posthog.capture({
                distinctId: `axcera_${context?.gateway || "unknown"}_${payload.id}`,
                event: "axcera_webhook_failed",
                properties: {
                    // Request data
                    gateway: context?.gateway,
                    orderId: payload.id,
                    status: payload.status,
                    total: payload.total,
                    currency: "USD",
                    purchaseId: context?.purchaseId,
                    productId: payload.line_items[0]?.product_id,
                    variationId: payload.line_items[0]?.variation_id,
                    customerEmailHash: hashEmail(payload.billing.email),

                    // Error data
                    responseStatus,
                    responseBody: responseBody.substring(0, 1000),
                    errorMessage:
                        error instanceof Error ? error.message : String(error),
                    duration,
                    success: false,
                    timestamp: new Date().toISOString(),
                },
            });
        } catch (loggingError) {
            console.error(
                "Failed to log Axcera error to PostHog:",
                loggingError,
            );
        }

        throw error;
    }
}
