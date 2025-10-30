import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import type { Faq } from "@/payload-types";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
    const payload = await getPayload({ config });
    const baseUrl = "https://fundedtradermarkets.com";

    try {
        // Fetch all active FAQs
        const { docs: faqs } = await payload.find({
            collection: "faqs",
            where: {
                isActive: {
                    equals: true,
                },
            },
            limit: 1000,
            depth: 0,
        });

        const urls: string[] = [];

        // Generate URLs for each FAQ
        for (const faq of faqs as Faq[]) {
            const lastmod = faq.updatedAt
                ? new Date(faq.updatedAt).toISOString()
                : new Date().toISOString();

            const url = `    <url>
        <loc>${baseUrl}/faq/${faq.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
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
        console.error("Error generating FAQ sitemap:", error);
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
