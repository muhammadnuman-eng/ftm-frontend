import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
    const baseUrl = "https://fundedtradermarkets.com";

    // Define static pages with their priorities and change frequencies
    const staticPages = [
        { path: "", priority: "1.0", changefreq: "daily" }, // Homepage
        { path: "programs", priority: "0.9", changefreq: "weekly" },
        { path: "1-step", priority: "0.9", changefreq: "weekly" },
        { path: "2-step", priority: "0.9", changefreq: "weekly" },
        { path: "ftm-instant-funding", priority: "0.9", changefreq: "weekly" },
        { path: "how-it-works", priority: "0.8", changefreq: "monthly" },
        { path: "affiliates", priority: "0.8", changefreq: "monthly" },
        { path: "blog", priority: "0.8", changefreq: "daily" },
        { path: "faq", priority: "0.8", changefreq: "weekly" },
        { path: "contact", priority: "0.7", changefreq: "monthly" },
        { path: "tools", priority: "0.7", changefreq: "monthly" },
        {
            path: "instruments-specification",
            priority: "0.7",
            changefreq: "monthly",
        },
        {
            path: "instruments-specification/trading-update",
            priority: "0.6",
            changefreq: "weekly",
        },
        {
            path: "instruments-specification/trading-update/holidays-market-hours",
            priority: "0.6",
            changefreq: "weekly",
        },
        {
            path: "instruments-specification/trading-update/instrument-updates",
            priority: "0.6",
            changefreq: "weekly",
        },
        {
            path: "instruments-specification/trading-update/platform-updates",
            priority: "0.6",
            changefreq: "weekly",
        },
        { path: "privacy-policy", priority: "0.5", changefreq: "yearly" },
        { path: "terms-conditions", priority: "0.5", changefreq: "yearly" },
        { path: "refund-policy", priority: "0.5", changefreq: "yearly" },
        { path: "cookie-policy", priority: "0.5", changefreq: "yearly" },
        { path: "aml-policy", priority: "0.5", changefreq: "yearly" },
        { path: "affiliate-policy", priority: "0.5", changefreq: "yearly" },
    ];

    const urls: string[] = [];

    // Generate URLs for each static page
    for (const page of staticPages) {
        const path = page.path ? `/${page.path}` : "";
        const url = `    <url>
        <loc>${baseUrl}${path}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
        urls.push(url);
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new NextResponse(sitemap, {
        headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
    });
}
