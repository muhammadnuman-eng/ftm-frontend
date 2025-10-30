import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import type { Category } from "@/payload-types";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
    const payload = await getPayload({ config });
    const baseUrl = "https://fundedtradermarkets.com";

    try {
        // Fetch all categories
        const { docs: categories } = await payload.find({
            collection: "categories",
            limit: 1000,
            depth: 0,
        });

        const urls: string[] = [];

        // Generate URLs for each category
        for (const category of categories as Category[]) {
            const lastmod = category.updatedAt
                ? new Date(category.updatedAt).toISOString()
                : new Date().toISOString();

            const url = `    <url>
        <loc>${baseUrl}/category/${category.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
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
    } catch (error) {
        console.error("Error generating category sitemap:", error);
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
            {
                headers: {
                    "Content-Type": "application/xml",
                },
                status: 500,
            },
        );
    }
}
