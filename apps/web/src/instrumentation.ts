import type { NextRequest } from "next/server";

export function register() {}

export const onRequestError = async (err: Error, request: NextRequest) => {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { getPostHogServer } = require("./lib/posthog-server");
        const posthog = getPostHogServer();

        let distinctId = "anonymous";
        if (request.headers.get("cookie")) {
            const cookieString = request.headers.get("cookie") || "";
            const postHogCookieMatch = cookieString.match(
                /ph_phc_.*?_posthog=([^;]+)/,
            );

            if (postHogCookieMatch?.[1]) {
                try {
                    const decodedCookie = decodeURIComponent(
                        postHogCookieMatch[1],
                    );
                    const postHogData = JSON.parse(decodedCookie);
                    distinctId = postHogData.distinct_id || "anonymous";
                } catch (e) {
                    console.error("Error parsing PostHog cookie:", e);
                }
            }
        }

        posthog.capture({
            distinctId,
            event: "request_error",
            properties: {
                error_message: err.message,
                error_stack: err.stack,
                error_name: err.name,
                request_url: request.url,
                request_method: request.method,
                timestamp: new Date().toISOString(),
            },
        });
    }
};
