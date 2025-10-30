import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [new URL("https://fundedtradermarkets.com/**")],
    },
    async headers() {
        return [
            {
                // Apply CORS headers to all API routes
                source: "/api/:path*",
                headers: [
                    {
                        key: "Access-Control-Allow-Origin",
                        value: "*",
                    },
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET, POST, PUT, DELETE, OPTIONS",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value: "Content-Type, Authorization, X-Requested-With, Accept, Origin",
                    },
                    {
                        key: "Access-Control-Max-Age",
                        value: "86400",
                    },
                ],
            },
        ];
    },
    async redirects() {
        return [
            // Instruments specification trading update index → holidays/market hours
            {
                source: "/instruments-specification/trading-update",
                destination:
                    "/instruments-specification/trading-update/holidays-market-hours",
                permanent: false,
            },
            {
                source: "/:locale(en|tr|de|ar|ms|es)/instruments-specification/trading-update",
                destination:
                    "/:locale/instruments-specification/trading-update/holidays-market-hours",
                permanent: false,
            },
        ];
    },
};

export default withPayload(withNextIntl(nextConfig));
