export interface SEOData {
    title: string;
    description: string;
    keywords?: string;
    image?: string;
    canonicalURL?: string;
    type?: string;
    publishedAt?: string;
    author?: string;
}

export interface PostSEOData {
    title: string;
    excerpt: string;
    slug: string;
    featuredImage?: {
        url?: string;
        filename?: string;
    };
    meta?: {
        title?: string;
        description?: string;
        keywords?: string;
        image?: {
            url?: string;
            filename?: string;
        };
    };
    postMeta?: {
        featured?: boolean;
        allowComments?: boolean;
    };
    publishedAt?: string;
    author?: {
        name?: string;
    };
}

export function extractSEOData(post: PostSEOData): SEOData {
    const seoData: SEOData = {
        title: post.meta?.title || post.title,
        description: post.meta?.description || post.excerpt,
        keywords: post.meta?.keywords,
        image: post.meta?.image?.url || post.featuredImage?.url,
        canonicalURL: `https://fundedtradermarkets.com/blog/${post.slug}`,
        type: "article",
        publishedAt: post.publishedAt,
        author: post.author?.name,
    };

    return seoData;
}

export function generateMetaTags(seoData: SEOData) {
    const metaTags = [
        // Basic SEO
        { name: "title", content: seoData.title },
        { name: "description", content: seoData.description },
        { name: "keywords", content: seoData.keywords },
        { name: "canonical", content: seoData.canonicalURL },

        // Open Graph
        { property: "og:title", content: seoData.title },
        { property: "og:description", content: seoData.description },
        { property: "og:type", content: seoData.type || "article" },
        { property: "og:url", content: seoData.canonicalURL },
        { property: "og:image", content: seoData.image },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:image:alt", content: seoData.title },

        // Twitter Card
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: seoData.title },
        { name: "twitter:description", content: seoData.description },
        { name: "twitter:image", content: seoData.image },
    ];

    // Add article-specific meta tags
    if (seoData.type === "article") {
        if (seoData.publishedAt) {
            metaTags.push({
                property: "article:published_time",
                content: seoData.publishedAt,
            });
        }
        if (seoData.author) {
            metaTags.push({
                property: "article:author",
                content: seoData.author,
            });
        }
    }

    return metaTags.filter((tag) => tag.content); // Remove empty tags
}

export function generateStructuredData(post: PostSEOData) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        image: post.featuredImage?.url,
        author: {
            "@type": "Person",
            name: post.author?.name,
        },
        publisher: {
            "@type": "Organization",
            name: "Funded Trader Markets",
            logo: {
                "@type": "ImageObject",
                url: "https://fundedtradermarkets.com/logo.png",
            },
        },
        datePublished: post.publishedAt,
        url: `https://fundedtradermarkets.com/blog/${post.slug}`,
    };

    return structuredData;
}
