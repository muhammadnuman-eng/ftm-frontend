import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import type { Post } from "@/payload-types";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
    const payload = await getPayload({ config });
    const baseUrl = "https://fundedtradermarkets.com";

    try {
        // Fetch all published posts
        const { docs: posts } = await payload.find({
            collection: "posts",
            where: {
                status: {
                    equals: "published",
                },
            },
            limit: 1000,
            depth: 0,
        });

        const urls: string[] = [];

        // Generate URLs for each post
        for (const post of posts as Post[]) {
            const lastmod = post.publishedAt
                ? new Date(post.publishedAt).toISOString()
                : post.updatedAt
                  ? new Date(post.updatedAt).toISOString()
                  : new Date().toISOString();

            const url = `    <url>
        <loc>${baseUrl}/${post.slug}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
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
        console.error("Error generating post sitemap:", error);
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
