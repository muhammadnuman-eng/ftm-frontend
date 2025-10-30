import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { getPayloadClient } from "@/lib/payload";
import type { Media } from "@/payload-types";

type PageType =
    | "homePage"
    | "programsPage"
    | "blogPage"
    | "faqPage"
    | "oneStepPage"
    | "twoStepPage"
    | "instantPage"
    | "howItWorksPage"
    | "affiliatesPage";

interface GenerateGlobalMetadataOptions {
    locale: string;
    pageType?: PageType;
    pageTitle?: string;
    pageDescription?: string;
    pageKeywords?: string;
    pageImage?: string | null;
    pageCanonicalUrl?: string;
    pagePath?: string; // The current page path (e.g., "/programs")
}

export interface GlobalMetadataResult {
    metadata: Metadata;
    jsonLdSchema?: string;
}

interface GlobalSEODefaults {
    siteName?: string;
    titleTemplate?: string;
    description?: string;
    keywords?: string;
    ogImage?: string | Media;
    twitterHandle?: string;
    canonicalBaseUrl?: string;
    defaultRobots?: {
        index?: boolean;
        follow?: boolean;
    };
    organizationSchema?: string;
}

interface GlobalSEOPageConfig {
    enabled?: boolean;
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string | Media;
    canonicalUrl?: string;
    robots?: {
        index?: boolean;
        follow?: boolean;
    };
    jsonLdSchema?: string;
}

interface GlobalSEOType {
    defaults?: GlobalSEODefaults;
    homePage?: GlobalSEOPageConfig;
    programsPage?: GlobalSEOPageConfig;
    blogPage?: GlobalSEOPageConfig;
    faqPage?: GlobalSEOPageConfig;
    oneStepPage?: GlobalSEOPageConfig;
    twoStepPage?: GlobalSEOPageConfig;
    instantPage?: GlobalSEOPageConfig;
    howItWorksPage?: GlobalSEOPageConfig;
    affiliatesPage?: GlobalSEOPageConfig;
}

/**
 * Fetches the global SEO configuration from Payload CMS
 */
export async function getGlobalSEO(
    locale: string,
): Promise<GlobalSEOType | null> {
    try {
        const { isEnabled: isDraftMode } = await draftMode();
        const payload = await getPayloadClient();

        const globalSEO = (await payload.findGlobal({
            slug: "global-seo" as "homepage",
            draft: isDraftMode,
            locale: locale as "en",
        })) as unknown as GlobalSEOType;

        return globalSEO;
    } catch (error) {
        console.error("Error fetching global SEO:", error);
        return null;
    }
}

/**
 * Generates Next.js metadata using global SEO settings
 * Falls back to default values if global SEO is not configured
 */
export async function generateGlobalMetadata(
    options: GenerateGlobalMetadataOptions,
): Promise<Metadata> {
    const {
        locale,
        pageType,
        pageTitle,
        pageDescription,
        pageKeywords,
        pageImage,
        pageCanonicalUrl,
        pagePath,
    } = options;

    // Fetch global SEO config
    const globalSEO = await getGlobalSEO(locale);

    // Get defaults
    const defaults = globalSEO?.defaults || {};
    const siteName = defaults.siteName || "Funded Trader Markets";
    const titleTemplate =
        defaults.titleTemplate || "%s | Funded Trader Markets";
    const defaultDescription =
        defaults.description ||
        "Funded Trader Markets: Faster payouts, better conditions, transparent rules.";
    const defaultKeywords = defaults.keywords || "";
    const defaultOgImage =
        typeof defaults.ogImage === "object"
            ? (defaults.ogImage as Media)?.url
            : undefined;
    const twitterHandle = defaults.twitterHandle || undefined;
    const canonicalBaseUrl =
        defaults.canonicalBaseUrl || "https://fundedtradermarkets.com";
    const defaultRobots = defaults.defaultRobots || {
        index: true,
        follow: true,
    };

    // Get page-specific overrides if pageType is specified
    let pageSEO: GlobalSEOPageConfig | null = null;
    if (pageType && globalSEO?.[pageType]?.enabled) {
        pageSEO = globalSEO[pageType] as GlobalSEOPageConfig;
    }

    // Determine final values (priority: page-specific > pageType override > global defaults)
    const finalTitle =
        pageTitle || (pageSEO?.title as string | undefined) || siteName;
    const finalDescription =
        pageDescription ||
        (pageSEO?.description as string | undefined) ||
        defaultDescription;
    const finalKeywords =
        pageKeywords ||
        (pageSEO?.keywords as string | undefined) ||
        defaultKeywords;
    const finalOgImage =
        pageImage ||
        (pageSEO?.ogImage
            ? typeof pageSEO.ogImage === "object"
                ? (pageSEO.ogImage as Media)?.url
                : undefined
            : undefined) ||
        defaultOgImage;

    // Canonical URL: use custom > page-specific > auto-generated from page path
    // Priority: pageCanonicalUrl > pageSEO?.canonicalUrl > auto-generate from pagePath
    let finalCanonicalUrl = pageCanonicalUrl || pageSEO?.canonicalUrl;

    // Clean up the canonical URL: trim whitespace and ensure it's not just the base URL
    if (finalCanonicalUrl) {
        finalCanonicalUrl = finalCanonicalUrl.trim();
        // If it's empty after trimming or equals just the base URL, treat it as not set
        if (
            !finalCanonicalUrl ||
            finalCanonicalUrl === canonicalBaseUrl ||
            finalCanonicalUrl === `${canonicalBaseUrl}/`
        ) {
            finalCanonicalUrl = undefined;
        }
    }

    // If no canonical URL is set in SEO section and we have a pagePath, auto-generate it (self-referencing)
    if (!finalCanonicalUrl && pagePath) {
        const localePrefix = locale === "en" ? "" : `/${locale}`;
        finalCanonicalUrl = `${canonicalBaseUrl}${localePrefix}${pagePath}`;
    }

    const finalRobots = pageSEO?.robots || defaultRobots;

    // Generate the title using template
    const formattedTitle =
        pageTitle && titleTemplate
            ? titleTemplate.replace("%s", pageTitle)
            : finalTitle;

    // Build metadata object
    const metadata: Metadata = {
        title: formattedTitle,
        description: finalDescription,
        ...(finalKeywords && { keywords: finalKeywords }),
        // Always include canonical URL if we have one
        alternates: finalCanonicalUrl
            ? {
                  canonical: finalCanonicalUrl,
              }
            : undefined,
        robots: {
            index: finalRobots.index ?? true,
            follow: finalRobots.follow ?? true,
        },
        openGraph: {
            title: pageTitle || finalTitle,
            description: finalDescription,
            siteName,
            type: "website",
            ...(finalOgImage && {
                images: [
                    {
                        url: finalOgImage,
                        width: 1200,
                        height: 630,
                        alt: pageTitle || finalTitle,
                    },
                ],
            }),
        },
        twitter: {
            card: "summary_large_image",
            title: pageTitle || finalTitle,
            description: finalDescription,
            ...(finalOgImage && { images: [finalOgImage] }),
            ...(twitterHandle && { site: twitterHandle }),
        },
    };

    return metadata;
}

/**
 * Gets the JSON-LD schema for a page
 */
export async function getPageJsonLdSchema(
    locale: string,
    pageType?: PageType,
): Promise<string | null> {
    const globalSEO = await getGlobalSEO(locale);

    if (!pageType || !globalSEO?.[pageType]?.enabled) {
        return null;
    }

    const pageSEO = globalSEO[pageType] as GlobalSEOPageConfig;
    return pageSEO?.jsonLdSchema || null;
}

/**
 * Gets the global organization JSON-LD schema
 */
export async function getOrganizationSchema(
    locale: string,
): Promise<string | null> {
    const globalSEO = await getGlobalSEO(locale);
    return globalSEO?.defaults?.organizationSchema || null;
}

/**
 * Helper to merge custom metadata with global SEO metadata
 */
export function mergeMetadata(
    globalMetadata: Metadata,
    customMetadata: Partial<Metadata>,
): Metadata {
    return {
        ...globalMetadata,
        ...customMetadata,
        openGraph: {
            ...(globalMetadata.openGraph || {}),
            ...(customMetadata.openGraph || {}),
        },
        twitter: {
            ...(globalMetadata.twitter || {}),
            ...(customMetadata.twitter || {}),
        },
    };
}

/**
 * Helper to construct a canonical URL for a given path
 * Creates a self-referencing canonical URL based on the base URL, locale, and path
 */
export function constructCanonicalUrl(
    path: string,
    locale = "en",
    baseUrl = "https://fundedtradermarkets.com",
): string {
    const localePrefix = locale === "en" ? "" : `/${locale}`;
    // Ensure path starts with /
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${localePrefix}${cleanPath}`;
}
