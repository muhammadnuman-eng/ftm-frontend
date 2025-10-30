"use server";

import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET =
    process.env.AFFILIATE_JWT_SECRET || "your-secret-key-change-in-production";
const JWT_COOKIE_NAME = "affiliate_session";
const JWT_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

interface AffiliateSession {
    userId: number;
    affiliateId: number;
    username: string;
    email: string;
}

/**
 * Create JWT token for affiliate session
 */
export async function createAffiliateSession(
    session: AffiliateSession,
): Promise<string> {
    const secret = new TextEncoder().encode(JWT_SECRET);

    const token = await new SignJWT({ ...session })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    return token;
}

/**
 * Verify and decode JWT token
 */
export async function verifyAffiliateSession(
    token: string,
): Promise<AffiliateSession | null> {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        return {
            userId: payload.userId as number,
            affiliateId: payload.affiliateId as number,
            username: payload.username as string,
            email: payload.email as string,
        };
    } catch (error) {
        console.error("[Affiliate Auth] Token verification failed:", error);
        return null;
    }
}

/**
 * Get current affiliate session from cookies
 */
export async function getAffiliateSession(): Promise<AffiliateSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(JWT_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    return verifyAffiliateSession(token);
}

/**
 * Set affiliate session cookie
 */
export async function setAffiliateSessionCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(JWT_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: JWT_MAX_AGE,
        path: "/",
    });
}

/**
 * Clear affiliate session cookie
 */
export async function clearAffiliateSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(JWT_COOKIE_NAME);
}

/**
 * Check if user is authenticated, throw redirect if not
 */
export async function requireAffiliateAuth(): Promise<AffiliateSession> {
    const session = await getAffiliateSession();

    if (!session) {
        throw new Error("Unauthorized");
    }

    return session;
}
