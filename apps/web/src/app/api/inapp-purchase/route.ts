import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

interface InAppPurchaseRequest {
    first_name: string;
    last_name: string;
    address_1?: string;
    phone?: string;
    email: string;
    client_id?: string;
    country?: string;
    town_city?: string;
    state?: string;
    postcode?: string;
    ip?: string;
}

// Create response with CORS headers
function createCorsResponse(
    body: unknown,
    status = 200,
    origin: string | null = null,
) {
    const headers = new Headers();

    // Set CORS headers
    headers.set("Access-Control-Allow-Origin", origin || "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    );
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Max-Age", "86400");

    // Add cache control to prevent caching of API responses
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

    if (body === null) {
        return new NextResponse(null, { status, headers });
    }

    return NextResponse.json(body, { status, headers });
}

// Handle all HTTP methods
export async function GET(request: NextRequest) {
    const origin = request.headers.get("origin");
    return createCorsResponse(
        {
            message: "InApp Purchase API is working",
            timestamp: new Date().toISOString(),
        },
        200,
        origin,
    );
}

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");
    console.log("[InApp Purchase API] OPTIONS request from:", origin);
    return createCorsResponse(null, 204, origin);
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get("origin");

    console.log("[InApp Purchase API] POST request from:", origin);

    try {
        const body: InAppPurchaseRequest = await request.json();

        if (!body?.email) {
            return createCorsResponse(
                { error: "Missing required field: email" },
                400,
                origin,
            );
        }

        const requestOrigin = request.nextUrl.origin;
        const locale = DEFAULT_LOCALE || "en";

        // Build a URL that opens the in-app purchase flow
        const url = new URL(`${requestOrigin}/${locale}/inapp-purchase`);
        url.searchParams.set("embed", "1");

        // Pass through context that could be useful for prefill/analytics
        url.searchParams.set("email", body.email);
        if (body.first_name) url.searchParams.set("firstName", body.first_name);
        if (body.last_name) url.searchParams.set("lastName", body.last_name);
        if (body.client_id) url.searchParams.set("client_id", body.client_id);
        if (body.country) url.searchParams.set("country", body.country);
        if (body.address_1) url.searchParams.set("address", body.address_1);
        if (body.town_city) url.searchParams.set("city", body.town_city);
        if (body.phone) url.searchParams.set("phone", body.phone);
        if (body.state) url.searchParams.set("state", body.state);
        if (body.postcode) url.searchParams.set("postalCode", body.postcode);
        if (body.ip) url.searchParams.set("ip", body.ip);

        return createCorsResponse({ iframe_link: url.toString() }, 200, origin);
    } catch (error) {
        console.error("Error in inapp-purchase API:", error);
        return createCorsResponse(
            { error: "Failed to generate Challenge UI URL" },
            500,
            origin,
        );
    }
}
