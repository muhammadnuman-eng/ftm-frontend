import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { ChevronRightIcon, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/section-header";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import { generateGlobalMetadata } from "@/lib/seo/global-seo";
import type { Faq } from "@/payload-types";
import type { AppLocale } from "../../../../../i18n.config";

// Enable ISR with 30 minute revalidation for FAQ pages
export const revalidate = 1800; // 30 minutes in seconds

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);

    // Don't pass pageTitle/pageDescription so Global SEO config takes precedence
    return generateGlobalMetadata({
        locale,
        pageType: "faqPage",
        pagePath: "/faq",
    });
}

// Types for FAQ answer structure
interface FaqAnswerChild {
    type: string;
    text?: string;
    children?: FaqAnswerChild[];
    [key: string]: unknown;
}

// Type guard to check if answer is a string
function isStringAnswer(answer: unknown): answer is string {
    return typeof answer === "string";
}

// Type guard to check if answer has the rich text structure
function isRichTextAnswer(
    answer: unknown,
): answer is { root: { children: FaqAnswerChild[] } } {
    if (typeof answer !== "object" || answer === null) {
        return false;
    }

    const root = (answer as { root?: unknown }).root;
    if (typeof root !== "object" || root === null) {
        return false;
    }

    const children = (root as { children?: unknown }).children;
    return Array.isArray(children);
}

// Extract plain text from a Lexical rich text JSON structure
function extractPlainTextFromAnswer(answer: unknown): string {
    if (isStringAnswer(answer)) {
        return answer;
    }
    if (!isRichTextAnswer(answer)) {
        return "";
    }

    function collect(children: FaqAnswerChild[] | undefined): string {
        if (!Array.isArray(children)) return "";
        let text = "";
        for (const node of children) {
            if (typeof node !== "object" || node === null) continue;
            if (typeof node.text === "string") {
                text += node.text;
            }
            if (Array.isArray(node.children) && node.children.length > 0) {
                text += collect(node.children);
            }
        }
        return text;
    }

    return collect(answer.root.children);
}

function getPaginationModel(
    currentPage: number,
    totalPages: number,
    paginationItemsToDisplay = 5,
) {
    const showLeftEllipsis = currentPage - 1 > paginationItemsToDisplay / 2;
    const showRightEllipsis =
        totalPages - currentPage + 1 > paginationItemsToDisplay / 2;

    if (totalPages <= paginationItemsToDisplay) {
        return {
            pages: Array.from({ length: totalPages }, (_, i) => i + 1),
            showLeftEllipsis: false,
            showRightEllipsis: false,
        } as const;
    }

    const halfDisplay = Math.floor(paginationItemsToDisplay / 2);
    const initialStart = currentPage - halfDisplay;
    const initialEnd = currentPage + halfDisplay;

    const adjustedStart = Math.max(1, initialStart);
    const adjustedEnd = Math.min(totalPages, initialEnd);

    let start = adjustedStart;
    let end = adjustedEnd;

    if (start === 1) {
        end = paginationItemsToDisplay;
    }
    if (end === totalPages) {
        start = totalPages - paginationItemsToDisplay + 1;
    }

    if (showLeftEllipsis) start++;
    if (showRightEllipsis) end--;

    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    return { pages, showLeftEllipsis, showRightEllipsis } as const;
}

async function getAllCategories(locale: AppLocale) {
    const payload = await getPayloadClient();

    const { docs } = await payload.find({
        collection: "faq-categories",
        where: {
            isActive: {
                equals: true,
            },
        },
        limit: 100,
        sort: "displayOrder",
        locale,
    });

    return docs;
}

async function getFaqsPaginated(locale: AppLocale, page = 1, limit = 10) {
    const payload = await getPayloadClient();

    const result = await payload.find({
        collection: "faqs",
        where: {
            isActive: {
                equals: true,
            },
        },
        // Keep a sensible ordering
        sort: ["isFeatured", "displayOrder", "question"],
        depth: 2,
        locale,
        page,
        limit,
    });

    return {
        docs: result.docs,
        totalPages: result.totalPages,
        totalDocs: result.totalDocs,
    } as const;
}

async function searchFaqs(locale: AppLocale, query: string) {
    const payload = await getPayloadClient();

    // Fetch active FAQs and then filter by question, tags, or answer text
    const { docs } = await payload.find({
        collection: "faqs",
        where: {
            isActive: {
                equals: true,
            },
        },
        // Keep a sensible ordering to make slicing deterministic
        sort: ["isFeatured", "displayOrder", "question"],
        depth: 2,
        locale,
        // Reasonable cap to avoid excessive payload while allowing answer-only matches
        limit: 500,
    });

    const q = query.toLowerCase();

    const filtered = docs.filter((faq: Faq) => {
        const question: string =
            typeof faq?.question === "string" ? faq.question : "";
        const tags = Array.isArray(faq?.tags) ? faq.tags : [];
        const answerText = extractPlainTextFromAnswer(faq?.answer);

        return (
            question.toLowerCase().includes(q) ||
            tags.some((t) => (t?.tag || "").toLowerCase().includes(q)) ||
            answerText.toLowerCase().includes(q)
        );
    });

    // Limit to 50 results for UI consistency
    return filtered.slice(0, 50);
}

const FAQPage = async ({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ page?: string; q?: string }>;
}) => {
    const { locale: localeParam } = await params;
    const { page: pageParam, q: searchQueryParam } = await searchParams;
    const locale: AppLocale = normalizeLocale(localeParam);
    const currentPage = Number.parseInt(pageParam || "1", 10);
    const pageSize = 10;

    const searchQuery = (searchQueryParam || "").trim();

    const [categories, t] = await Promise.all([
        getAllCategories(locale),
        getTranslations({ locale, namespace: "faqPage" }),
    ]);

    const isSearchMode = searchQuery.length > 0;
    const searchResults = isSearchMode
        ? await searchFaqs(locale, searchQuery)
        : undefined;
    const paginatedFaqs = isSearchMode
        ? undefined
        : await getFaqsPaginated(locale, currentPage, pageSize);

    const displayFaqs = isSearchMode
        ? searchResults || []
        : paginatedFaqs?.docs || [];

    async function searchAction(formData: FormData) {
        "use server";
        const query = (formData.get("q") as string) || "";
        if (query.trim()) {
            redirect(`/faq?q=${encodeURIComponent(query.trim())}`);
        } else {
            redirect("/faq");
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                dividerTitle={t("dividerTitle")}
                dividerAs="h1"
                as="h2"
                title={t("title")}
                titleHighlight={t("titleHighlight")}
                description={t("description")}
            />

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Left Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-4">
                        {/* Search Input */}
                        <form className="relative" action={searchAction}>
                            <Input
                                type="text"
                                name="q"
                                defaultValue={searchQuery}
                                placeholder={t("searchPlaceholder")}
                                className="rounded-md border-white/10 bg-white/5 pr-10 text-sm text-white placeholder:text-stone-400"
                            />
                            <button
                                type="submit"
                                aria-label="Search"
                                className="-translate-y-1/2 absolute top-1/2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-300 hover:bg-white/10 hover:text-white"
                            >
                                <SearchIcon className="h-4 w-4" />
                            </button>
                        </form>

                        {/* Categories */}
                        <div>
                            <h3 className="mb-3 font-semibold text-stone-400 text-xs uppercase tracking-wider">
                                {t("categoriesHeading")}
                            </h3>
                            <div className="flex flex-col space-y-1">
                                {categories.map((category) => (
                                    <Button
                                        key={category.id}
                                        variant="ghost"
                                        asChild
                                        className="group -mx-3 h-9 justify-between rounded-md px-3 font-normal text-sm text-stone-300 hover:bg-white/5 hover:text-white"
                                    >
                                        <Link
                                            href={`/faq/category/${category.slug}`}
                                        >
                                            <span>{category.name}</span>
                                            <ChevronRightIcon className="h-3 w-3 opacity-10 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="space-y-6">
                        {/* FAQ Questions */}
                        {displayFaqs.length > 0 ? (
                            <Accordion
                                type="single"
                                collapsible
                                className="space-y-4"
                            >
                                {displayFaqs.map((faq) => (
                                    <AccordionItem
                                        key={faq.id}
                                        value={faq.id.toString()}
                                        className="rounded-lg border-stone-700 bg-stone-800/50 px-6"
                                    >
                                        <AccordionTrigger className="py-6 font-medium text-lg text-white hover:no-underline">
                                            <div className="flex items-start gap-3 text-left">
                                                <span>{faq.question}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-6">
                                            <div className="space-y-4 text-stone-100/70">
                                                {/* Render answer preview */}
                                                <div className="prose prose-invert prose-sm max-w-none prose-a:text-blue-400 prose-li:text-stone-300 prose-p:text-stone-300 prose-strong:text-white [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-stone-400 [&_td]:border [&_td]:border-stone-400 [&_td]:p-3 [&_th]:border [&_th]:border-stone-400 [&_th]:p-3">
                                                    {isStringAnswer(
                                                        faq.answer,
                                                    ) ? (
                                                        <div
                                                            // biome-ignore lint/security/noDangerouslySetInnerHtml: FAQ content is controlled by admin users
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    faq.answer
                                                                        .length >
                                                                    200
                                                                        ? faq.answer.substring(
                                                                              0,
                                                                              200,
                                                                          ) +
                                                                          "..."
                                                                        : faq.answer,
                                                            }}
                                                        />
                                                    ) : isRichTextAnswer(
                                                          faq.answer,
                                                      ) ? (
                                                        <div
                                                            // biome-ignore lint/security/noDangerouslySetInnerHtml: Payload CMS rich text conversion is safe
                                                            dangerouslySetInnerHTML={{
                                                                __html: convertLexicalToHTML(
                                                                    {
                                                                        data: faq.answer,
                                                                    },
                                                                ),
                                                            }}
                                                        />
                                                    ) : (
                                                        <p className="text-stone-400 italic">
                                                            {t(
                                                                "answerUnavailable",
                                                            )}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Link to detailed page */}
                                                <div className="pt-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/faq/${faq.slug}`}
                                                            className="text-blue-400 hover:text-blue-300"
                                                        >
                                                            {t("readMore")} →
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-lg text-stone-400">
                                    {t("emptyState")}
                                </p>
                            </div>
                        )}

                        {!isSearchMode &&
                            paginatedFaqs &&
                            paginatedFaqs.totalPages > 1 && (
                                <div className="pt-2">
                                    {(() => {
                                        const {
                                            pages,
                                            showLeftEllipsis,
                                            showRightEllipsis,
                                        } = getPaginationModel(
                                            currentPage,
                                            paginatedFaqs.totalPages,
                                            5,
                                        );
                                        return (
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                                                            href={
                                                                currentPage ===
                                                                1
                                                                    ? undefined
                                                                    : `/faq?page=${currentPage - 1}`
                                                            }
                                                            aria-disabled={
                                                                currentPage ===
                                                                1
                                                                    ? true
                                                                    : undefined
                                                            }
                                                            role={
                                                                currentPage ===
                                                                1
                                                                    ? "link"
                                                                    : undefined
                                                            }
                                                        />
                                                    </PaginationItem>

                                                    {showLeftEllipsis && (
                                                        <PaginationItem>
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    )}

                                                    {pages.map((page) => (
                                                        <PaginationItem
                                                            key={page}
                                                        >
                                                            <PaginationLink
                                                                href={`/faq?page=${page}`}
                                                                isActive={
                                                                    page ===
                                                                    currentPage
                                                                }
                                                            >
                                                                {page}
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    ))}

                                                    {showRightEllipsis && (
                                                        <PaginationItem>
                                                            <PaginationEllipsis />
                                                        </PaginationItem>
                                                    )}

                                                    <PaginationItem>
                                                        <PaginationNext
                                                            className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                                                            href={
                                                                currentPage ===
                                                                paginatedFaqs.totalPages
                                                                    ? undefined
                                                                    : `/faq?page=${currentPage + 1}`
                                                            }
                                                            aria-disabled={
                                                                currentPage ===
                                                                paginatedFaqs.totalPages
                                                                    ? true
                                                                    : undefined
                                                            }
                                                            role={
                                                                currentPage ===
                                                                paginatedFaqs.totalPages
                                                                    ? "link"
                                                                    : undefined
                                                            }
                                                        />
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        );
                                    })()}
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
