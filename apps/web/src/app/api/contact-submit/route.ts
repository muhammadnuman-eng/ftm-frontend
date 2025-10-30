import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { trackHyrosLead } from "@/lib/hyros";
import { getPayloadClient } from "@/lib/payload";
import { logApiError } from "@/lib/posthog-error";

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayloadClient();
        const body = await request.json();
        const { name, phone, email, message } = body;

        // Validate required fields
        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 },
            );
        }

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 },
            );
        }

        if (!message) {
            return NextResponse.json(
                { error: "Message is required" },
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

        // Validate name length
        if (name.length < 2) {
            return NextResponse.json(
                { error: "Name must be at least 2 characters long" },
                { status: 400 },
            );
        }

        // Validate message length
        if (message.length < 10) {
            return NextResponse.json(
                { error: "Message must be at least 10 characters long" },
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
            // Create the contact message
            const contactMessage = await payload.create({
                collection: "contact-messages",
                data: {
                    name: name.trim(),
                    phone: phone?.trim() || "",
                    email: email.toLowerCase().trim(),
                    message: message.trim(),
                    status: "unread",
                    ipAddress,
                    userAgent,
                },
            });

            // Track contact form submission in Hyros
            try {
                const nameParts = name.trim().split(" ");
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";
                const referer = request.headers.get("referer") || undefined;

                await trackHyrosLead({
                    email: email.toLowerCase().trim(),
                    leadType: "contact",
                    firstName,
                    lastName,
                    phone: phone?.trim(),
                    message: message.trim(),
                    ipAddress,
                    userAgent,
                    pageUrl: referer,
                });
            } catch (error) {
                console.error("[Hyros] Error tracking contact lead:", error);
                // Don't fail the contact form submission if Hyros tracking fails
            }

            return NextResponse.json(
                {
                    message:
                        "Message sent successfully! We'll get back to you within 24 business hours.",
                    contactMessage: {
                        id: contactMessage.id,
                    },
                },
                { status: 201 },
            );
        } catch (error: unknown) {
            console.error("Contact message creation error:", error);
            throw error;
        }
    } catch (error: unknown) {
        console.error("Contact submission error:", error);
        logApiError({
            endpoint: "contact-submit",
            error,
            method: "POST",
            statusCode: 500,
        });
        return NextResponse.json(
            { error: "Failed to send message. Please try again." },
            { status: 500 },
        );
    }
}
