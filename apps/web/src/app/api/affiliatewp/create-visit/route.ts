import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { lookupAffiliateByUsername, recordVisit } from "@/lib/affiliatewp";
import { getPostHogServer } from "@/lib/posthog-server";

export async function POST(request: NextRequest) {
    const posthog = getPostHogServer();

    try {
        const body = await request.json();
        const { affiliateUsername, url, referrer, campaign } = body;

        // Track visit creation attempt
        posthog.capture({
            distinctId: `affiliate_visit_${affiliateUsername || "unknown"}`,
            event: "affiliatewp_visit_creation_started",
            properties: {
                affiliateUsername,
                url,
                hasCampaign: !!campaign,
                campaign: campaign || undefined,
                timestamp: new Date().toISOString(),
            },
        });

        if (!affiliateUsername) {
            posthog.capture({
                distinctId: `affiliate_visit_${affiliateUsername || "unknown"}`,
                event: "affiliatewp_visit_creation_failed",
                properties: {
                    error: "missing_username",
                    timestamp: new Date().toISOString(),
                },
            });

            return NextResponse.json(
                { success: false, error: "Missing affiliate username" },
                { status: 400 },
            );
        }

        // Lookup affiliate by username
        const affiliate = await lookupAffiliateByUsername(affiliateUsername);

        if (!affiliate) {
            posthog.capture({
                distinctId: `affiliate_visit_${affiliateUsername}`,
                event: "affiliatewp_visit_creation_failed",
                properties: {
                    error: "affiliate_not_found",
                    affiliateUsername,
                    timestamp: new Date().toISOString(),
                },
            });

            return NextResponse.json(
                { success: false, error: "Affiliate not found" },
                { status: 404 },
            );
        }

        // Extract IP address from request headers
        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0] ||
            request.headers.get("x-real-ip") ||
            "";

        // Create visit
        const result = await recordVisit({
            affiliate_id: affiliate.affiliate_id,
            url: url || request.headers.get("referer") || "",
            referrer: referrer || "",
            campaign: campaign || "",
            ip: ip,
        });

        if (result.success) {
            posthog.capture({
                distinctId: `affiliate_visit_${affiliateUsername}`,
                event: "affiliatewp_visit_created",
                properties: {
                    affiliateUsername,
                    affiliateId: affiliate.affiliate_id,
                    visitId: result.visit_id,
                    url,
                    campaign: campaign || undefined,
                    hasReferrer: !!referrer,
                    hasIp: !!ip,
                    timestamp: new Date().toISOString(),
                },
            });

            return NextResponse.json({
                success: true,
                visit_id: result.visit_id,
            });
        }

        posthog.capture({
            distinctId: `affiliate_visit_${affiliateUsername}`,
            event: "affiliatewp_visit_creation_failed",
            properties: {
                error: result.error,
                affiliateUsername,
                affiliateId: affiliate.affiliate_id,
                timestamp: new Date().toISOString(),
            },
        });

        return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
        );
    } catch (error) {
        console.error("[AffiliateWP Visit] Error:", error);

        posthog.capture({
            distinctId: "affiliatewp_visit_error",
            event: "affiliatewp_visit_creation_error",
            properties: {
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
        });

        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 },
        );
    }
}
