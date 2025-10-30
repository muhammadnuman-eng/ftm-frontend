import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { DEFAULT_LOCALE, LOCALE_CODES } from "@/lib/i18n/locales";

const intlMiddleware = createMiddleware({
    locales: LOCALE_CODES,
    defaultLocale: DEFAULT_LOCALE,
    localePrefix: "as-needed",
});

export default function middleware(request: NextRequest) {
    // Run the next-intl middleware first
    const response = intlMiddleware(request);

    // Check if embed mode is active
    const isEmbed = request.nextUrl.searchParams.get("embed") === "1";

    // Set a custom header to indicate embed mode
    if (isEmbed) {
        response.headers.set("x-embed-mode", "true");
    }

    // Set pathname header for layout to check
    response.headers.set("x-pathname", request.nextUrl.pathname);

    return response;
}

export const config = {
    // Only run middleware on routes that need i18n
    // Exclude: api routes, Next.js internals, static files, and Payload admin
    matcher: [
        // Match root
        "/",
        // Match all routes except those starting with:
        // - api (API routes)
        // - admin (Payload admin)
        // - _next (all Next.js internals)
        // - Files with extensions (static assets in /public like images, gifs, webm, mp4, etc.)
        //   Using ".*\\..*" excludes any path segment that contains a dot
        "/((?!api|admin|_next|.*\\..*).*)",
    ],
};
