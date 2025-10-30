import { NextResponse } from "next/server";
import { getAffiliateSession } from "@/lib/affiliate-auth";

/**
 * Check if user has an active affiliate session
 * Used by client components to verify authentication status
 */
export async function GET() {
    try {
        const session = await getAffiliateSession();

        if (session) {
            return NextResponse.json({
                authenticated: true,
                affiliateId: session.affiliateId,
                username: session.username,
            });
        }

        return NextResponse.json({ authenticated: false });
    } catch (error) {
        console.error("[Affiliate Session Check] Error:", error);
        return NextResponse.json({ authenticated: false });
    }
}
