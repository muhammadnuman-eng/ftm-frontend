import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { trackHyrosLead } from "@/lib/hyros";
import { subscribeToNewsletter, upsertProfile } from "@/lib/klaviyo";
import { getPayloadClient } from "@/lib/payload";
import { logApiError } from "@/lib/posthog-error";

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayloadClient();
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 },
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 },
            );
        }

        // Get client IP and user agent
        const ipAddress =
            request.headers.get("x-forwarded-for") ||
            request.headers.get("x-real-ip") ||
            "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        try {
            // Try to create the subscription
            const subscription = await payload.create({
                collection: "newsletter-subscriptions",
                data: {
                    email: email.toLowerCase().trim(),
                    status: "subscribed",
                    source: "footer",
                    ipAddress,
                    userAgent,
                },
            });

            // Track newsletter subscription in Hyros
            try {
                const referer = request.headers.get("referer") || undefined;

                await trackHyrosLead({
                    email: email.toLowerCase().trim(),
                    leadType: "newsletter",
                    ipAddress,
                    userAgent,
                    pageUrl: referer,
                });
            } catch (error) {
                console.error("[Hyros] Error tracking newsletter lead:", error);
                // Don't fail the newsletter subscription if Hyros tracking fails
            }

            // Track newsletter subscription in Klaviyo
            try {
                await upsertProfile(email.toLowerCase().trim());
                await subscribeToNewsletter(email.toLowerCase().trim());
            } catch (error) {
                console.error(
                    "[Klaviyo] Error tracking newsletter subscription:",
                    error,
                );
                // Don't fail the newsletter subscription if Klaviyo tracking fails
            }

            return NextResponse.json(
                {
                    message: "Successfully subscribed to newsletter!",
                    subscription: {
                        id: subscription.id,
                        email: subscription.email,
                    },
                },
                { status: 201 },
            );
        } catch (error: unknown) {
            // Check if it's a duplicate email error
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            const errorCode = (error as { code?: string })?.code;

            if (errorMessage?.includes("duplicate") || errorCode === "23505") {
                return NextResponse.json(
                    {
                        error: "This email is already subscribed to our newsletter",
                    },
                    { status: 409 },
                );
            }
            throw error;
        }
    } catch (error: unknown) {
        console.error("Newsletter subscription error:", error);
        logApiError({
            endpoint: "newsletter-subscribe",
            error,
            method: "POST",
            statusCode: 500,
        });
        return NextResponse.json(
            { error: "Failed to subscribe to newsletter. Please try again." },
            { status: 500 },
        );
    }
}
