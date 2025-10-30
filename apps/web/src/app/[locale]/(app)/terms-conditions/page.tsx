import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { SectionHeader } from "@/components/section-header";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import { constructCanonicalUrl } from "@/lib/seo/global-seo";
import type { Media, Policy } from "@/payload-types";

export const revalidate = 86400;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { isEnabled: isDraftMode } = await draftMode();
    const payload = await getPayloadClient();
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);

    const policies = (await payload.findGlobal({
        slug: "policies",
        draft: isDraftMode,
        locale,
    })) as Policy;

    const group = policies?.termsOfService;
    const title = group?.seo?.title || group?.title || "";
    const description = group?.seo?.description || "";
    const ogImage =
        typeof group?.seo?.ogImage === "object"
            ? (group.seo.ogImage as Media)
            : null;

    // Self-referencing canonical URL
    const canonicalUrl = constructCanonicalUrl("/terms-conditions", locale);

    return {
        title: `${title} | Funded Trader Markets`,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            images: ogImage?.url ? [ogImage.url] : undefined,
        },
    };
}

export default async function TermsConditionsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { isEnabled: isDraftMode } = await draftMode();
    const payload = await getPayloadClient();
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);

    const policies = (await payload.findGlobal({
        slug: "policies",
        draft: isDraftMode,
        locale,
    })) as Policy;

    const group = policies?.termsOfService;

    const html = group?.content
        ? convertLexicalToHTML({ data: group.content })
        : "";

    return (
        <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader showVideo={false} title={group?.title || ""} />

            <article className="prose prose-invert max-w-none">
                <div
                    className="text-stone-100/90 leading-relaxed"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Content comes from CMS
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </article>
        </div>
    );
}
