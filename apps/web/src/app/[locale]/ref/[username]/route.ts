import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AFFILIATEWP_CONFIG } from "@/lib/affiliatewp-config";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ locale: string; username: string }> },
) {
    const { locale, username } = await params;

    // Set affiliate username cookie
    const cookieStore = await cookies();
    cookieStore.set(AFFILIATEWP_CONFIG.cookie.name, username, {
        maxAge: AFFILIATEWP_CONFIG.cookie.maxAge,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });

    console.log("[AffiliateWP] Referral link visited:", {
        username,
        locale,
        cookieName: AFFILIATEWP_CONFIG.cookie.name,
    });

    // Redirect to homepage with locale
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
