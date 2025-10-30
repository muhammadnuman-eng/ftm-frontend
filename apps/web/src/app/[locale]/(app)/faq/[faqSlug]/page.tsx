import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { ChevronLeftIcon, ChevronRightIcon, HomeIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";

import { getPayloadClient } from "@/lib/payload";
import { constructCanonicalUrl } from "@/lib/seo/global-seo";
// Enable ISR with 30 minute revalidation for individual FAQ pages
export const revalidate = 1800; // 30 minutes in seconds

interface FaqDetailPageProps {
    params: Promise<{
        faqSlug: string;
        locale?: string;
    }>;
}

async function getFaqBySlug(faqSlug: string) {
    const payload = await getPayloadClient();

    // Find the FAQ by slug
    const faqResult = await payload.find({
        collection: "faqs",
        where: {
            and: [
                {
                    slug: {
                        equals: faqSlug,
                    },
                },
                {
                    isActive: {
                        equals: true,
                    },
                },
            ],
        },
        depth: 2,
    });

    return faqResult.docs[0] || null;
}

async function getRelatedFaqs(categoryId: string, currentFaqId: string) {
    const payload = await getPayloadClient();

    const { docs } = await payload.find({
        collection: "faqs",
        where: {
            and: [
                {
                    category: {
                        equals: categoryId,
                    },
                },
                {
                    id: {
                        not_equals: currentFaqId,
                    },
                },
                {
                    isActive: {
                        equals: true,
                    },
                },
            ],
        },
        limit: 5,
        sort: "displayOrder",
        depth: 1,
    });

    return docs;
}

export async function generateMetadata({
    params,
}: FaqDetailPageProps): Promise<Metadata> {
    const { faqSlug, locale = "en" } = await params;
    const faq = await getFaqBySlug(faqSlug);

    if (!faq) {
        return {
            title: "FAQ Not Found",
        };
    }

    const title = faq.metaTitle || faq.question;
    const description =
        faq.metaDescription || `Find the answer to: ${faq.question}`;

    // Self-referencing canonical URL
    const canonicalUrl = constructCanonicalUrl(`/faq/${faqSlug}`, locale);

    return {
        title: `${title} | FTM FAQ`,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            type: "article",
            url: canonicalUrl,
        },
    };
}

export default async function FaqDetailPage({ params }: FaqDetailPageProps) {
    const { faqSlug } = await params;
    const faq = await getFaqBySlug(faqSlug);

    if (!faq) {
        notFound();
    }

    const relatedFaqs = await getRelatedFaqs(
        typeof faq.category === "object"
            ? faq.category.id.toString()
            : faq.category.toString(),
        faq.id.toString(),
    );

    const categoryName =
        typeof faq.category === "object" ? faq.category.name : "FAQ";
    const faqCategorySlug =
        typeof faq.category === "object" ? faq.category.slug : "";

    return (
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-12 md:px-6 lg:px-8">
            {/* FAQ Content */}
            <div className="space-y-8">
                <h1 className="font-bold text-2xl text-white lg:text-4xl">
                    {faq.question}
                </h1>

                {/* Breadcrumb */}
                <nav className="flex items-center justify-center space-x-2 text-sm text-stone-400">
                    <Link
                        href="/"
                        className="transition-colors hover:text-white"
                    >
                        <HomeIcon className="h-4 w-4" />
                    </Link>
                    <ChevronRightIcon className="h-4 w-4" />
                    <Link
                        href="/faq"
                        className="transition-colors hover:text-white"
                    >
                        FAQ
                    </Link>
                    <ChevronRightIcon className="h-4 w-4" />
                    <Link
                        href={`/faq/category/${faqCategorySlug}`}
                        className="transition-colors hover:text-white"
                    >
                        {categoryName}
                    </Link>
                    <ChevronRightIcon className="h-4 w-4" />
                    <span className="truncate text-white">{faq.question}</span>
                </nav>

                {/* Answer */}
                <div className="prose prose-invert prose-lg max-w-none prose-blockquote:border-indigo-500 prose-blockquote:bg-slate-800/50 prose-code:bg-slate-800 prose-pre:bg-slate-900 prose-a:text-blue-400 prose-blockquote:text-stone-300 prose-code:text-indigo-300 prose-em:text-stone-200 prose-headings:text-white prose-li:text-stone-300 prose-ol:text-stone-300 prose-p:text-stone-300 prose-strong:text-white prose-ul:text-stone-300 hover:prose-a:text-blue-300 [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-stone-400 [&_td]:border [&_td]:border-stone-400 [&_td]:p-3 [&_th]:border [&_th]:border-stone-400 [&_th]:p-3">
                    {faq.answer && typeof faq.answer === "object" ? (
                        <div
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: Payload CMS rich text conversion is safe
                            dangerouslySetInnerHTML={{
                                __html: convertLexicalToHTML({
                                    data: faq.answer,
                                }),
                            }}
                        />
                    ) : typeof faq.answer === "string" ? (
                        <div
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: FAQ content is controlled by admin users
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                        />
                    ) : (
                        <p className="text-stone-400 italic">
                            Content not available
                        </p>
                    )}
                </div>

                {/* Tags */}
                {faq.tags && faq.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 border-white/10 border-t pt-6">
                        <span className="text-sm text-stone-400">Tags:</span>
                        {faq.tags.map((tagObj, tagIndex) => (
                            <span
                                key={`tag-${tagIndex}-${tagObj.tag}`}
                                className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-white text-xs"
                            >
                                {tagObj.tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Related FAQs */}
            {relatedFaqs.length > 0 && (
                <div className="space-y-6 border-white/10 border-t pt-12">
                    <h3 className="font-semibold text-white text-xl">
                        More from {categoryName}
                    </h3>
                    <div className="grid gap-4">
                        {relatedFaqs.map((relatedFaq) => (
                            <Link
                                key={relatedFaq.id}
                                href={`/faq/${relatedFaq.slug}`}
                                className="group block rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                            >
                                <h4 className="text-white transition-colors group-hover:text-blue-400">
                                    {relatedFaq.question}
                                </h4>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-8">
                <Button variant="ghost" asChild>
                    <Link
                        href={`/faq/category/${faqCategorySlug}`}
                        className="flex items-center gap-2"
                    >
                        <ChevronLeftIcon className="h-4 w-4" />
                        Back to {categoryName}
                    </Link>
                </Button>

                <Button variant="ghost" asChild>
                    <Link href="/faq" className="flex items-center gap-2">
                        All FAQs
                        <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
