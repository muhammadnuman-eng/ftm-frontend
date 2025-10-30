export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { authenticateBridgerPay, getBridgerPayConfig } from "@/lib/bridgerpay";
import { logApiError } from "@/lib/posthog-error";

/**
 * Test endpoint to verify BridgerPay configuration
 * Access at: /api/bridgerpay/test
 *
 * This will check if your credentials are configured and can authenticate
 */
export async function GET() {
    try {
        // Check if environment variables are set
        const hasApiKey = !!process.env.BRIDGERPAY_API_KEY;
        const hasCashierKey = !!process.env.BRIDGERPAY_CASHIER_KEY;
        const hasUsername = !!process.env.BRIDGERPAY_USERNAME;
        const hasPassword = !!process.env.BRIDGERPAY_PASSWORD;

        const configStatus = {
            hasApiKey,
            hasCashierKey,
            hasUsername,
            hasPassword,
            environment: process.env.BRIDGERPAY_ENV || "production",
            apiUrl:
                process.env.BRIDGERPAY_API_URL || "https://api.bridgerpay.com",
        };

        console.log("[BridgerPay Test] Configuration check:", configStatus);

        if (!hasApiKey || !hasCashierKey || !hasUsername || !hasPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Missing required environment variables",
                    config: configStatus,
                    hint: "Check your .env file and ensure all BridgerPay credentials are set",
                },
                { status: 400 },
            );
        }

        // Try to get config (this will throw if vars are missing)
        let _config: ReturnType<typeof getBridgerPayConfig> | undefined;
        try {
            _config = getBridgerPayConfig();
        } catch (error) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to load BridgerPay configuration",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    config: configStatus,
                },
                { status: 500 },
            );
        }

        // Try to authenticate
        let authToken: string | undefined;
        try {
            console.log("[BridgerPay Test] Attempting authentication...");
            authToken = await authenticateBridgerPay();
            console.log("[BridgerPay Test] Authentication successful!");
        } catch (error) {
            console.error("[BridgerPay Test] Authentication failed:", error);
            return NextResponse.json(
                {
                    success: false,
                    message: "Authentication failed",
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                    config: configStatus,
                    hint: "Check if your username and password are correct, and that your BridgerPay account is active",
                },
                { status: 401 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                message:
                    "BridgerPay configuration is valid and authentication successful!",
                config: {
                    ...configStatus,
                    tokenReceived: !!authToken,
                    tokenPrefix: authToken
                        ? `${authToken.slice(0, 8)}...`
                        : null,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("[BridgerPay Test] Unexpected error:", error);
        logApiError({
            endpoint: "bridgerpay-test",
            error,
            method: "GET",
            statusCode: 500,
        });
        return NextResponse.json(
            {
                success: false,
                message: "Unexpected error during test",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
