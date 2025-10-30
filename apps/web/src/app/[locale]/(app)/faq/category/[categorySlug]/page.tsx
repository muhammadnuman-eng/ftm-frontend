import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    HomeIcon,
    SearchIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPayloadClient } from "@/lib/payload";
import { constructCanonicalUrl } from "@/lib/seo/global-seo";
import type { Faq } from "@/payload-types";

// Enable ISR with 30 minute revalidation for FAQ category pages
export const revalidate = 1800; // 30 minutes in seconds

// Types for FAQ answer structure (for plain text extraction only)
interface FaqAnswerChild {
    type: string;
    text?: string;
    children?: FaqAnswerChild[];
    [key: string]: unknown;
}

interface FaqCategoryPageProps {
    params: Promise<{
        categorySlug: string;
        locale?: string;
    }>;
    searchParams?: Promise<{
        q?: string;
    }>;
}

async function getFaqCategoryBySlug(slug: string) {
    const payload = await getPayloadClient();

    const { docs } = await payload.find({
        collection: "faq-categories",
        where: {
            and: [
                {
                    slug: {
                        equals: slug,
                    },
                },
                {
                    isActive: {
                        equals: true,
                    },
                },
            ],
        },
    });

    return docs[0] || null;
}

async function getFaqsByCategory(categoryId: string) {
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
                    isActive: {
                        equals: true,
                    },
                },
            ],
        },
        limit: 100,
        sort: ["isFeatured", "displayOrder", "question"],
        depth: 1,
    });

    return docs;
}

async function getAllCategories() {
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
    });

    return docs;
}

export async function generateMetadata({
    params,
}: FaqCategoryPageProps): Promise<Metadata> {
    const { categorySlug, locale = "en" } = await params;
    const category = await getFaqCategoryBySlug(categorySlug);

    if (!category) {
        return {
            title: "FAQ Category Not Found",
        };
    }

    const title = `${category.name} FAQ`;
    const description =
        category.description ||
        `Frequently asked questions about ${category.name.toLowerCase()}`;

    // Self-referencing canonical URL
    const canonicalUrl = constructCanonicalUrl(
        `/faq/category/${categorySlug}`,
        locale,
    );

    return {
        title: `${title} | FTM`,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            type: "website",
        },
    };
}

// Extract plain text from FAQ answer (string or Lexical JSON)
function extractPlainTextFromAnswer(answer: unknown): string {
    if (typeof answer === "string") return answer;
    if (!answer || typeof answer !== "object") return "";
    const root = (answer as { root?: unknown }).root as
        | { children?: FaqAnswerChild[] }
        | undefined;
    if (!root || !Array.isArray(root.children)) return "";
    let text = "";
    const walk = (nodes: FaqAnswerChild[]) => {
        for (const node of nodes) {
            if (typeof node.text === "string") text += node.text;
            if (Array.isArray(node.children)) walk(node.children);
        }
    };
    walk(root.children);
    return text;
}

export default async function FaqCategoryPage({
    params,
    searchParams,
}: FaqCategoryPageProps) {
    const { categorySlug } = await params;
    const sp = searchParams ? await searchParams : undefined;
    const searchQuery = (sp?.q || "").trim();
    const category = await getFaqCategoryBySlug(categorySlug);

    if (!category) {
        notFound();
    }

    const [faqs, allCategories] = await Promise.all([
        getFaqsByCategory(category.id.toString()),
        getAllCategories(),
    ]);

    const isSearchMode = searchQuery.length > 0;
    const filteredFaqs = isSearchMode
        ? (faqs as Faq[]).filter((faq) => {
              const question =
                  typeof faq.question === "string" ? faq.question : "";
              const tags = Array.isArray(faq.tags) ? faq.tags : [];
              const answerText = extractPlainTextFromAnswer(faq.answer);
              const q = searchQuery.toLowerCase();
              return (
                  question.toLowerCase().includes(q) ||
                  tags.some((t) => (t?.tag || "").toLowerCase().includes(q)) ||
                  answerText.toLowerCase().includes(q)
              );
          })
        : faqs;

    async function searchAction(formData: FormData) {
        "use server";
        const q = ((formData.get("q") as string) || "").trim();
        if (q) {
            redirect(
                `/faq/category/${category.slug}?q=${encodeURIComponent(q)}`,
            );
        } else {
            redirect(`/faq/category/${category.slug}`);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 md:px-6 lg:px-8">
            <SectionHeader
                dividerTitle="FAQ"
                dividerAs="h1"
                as="h2"
                title={category.name}
                titleHighlight={category.name}
                description={
                    category.description ||
                    `Find answers to frequently asked questions about ${category.name.toLowerCase()}.`
                }
            />

            {/* Breadcrumb */}
            <nav className="flex items-center justify-center space-x-2 text-sm text-stone-400">
                <Link href="/" className="transition-colors hover:text-white">
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
                <span className="text-white">{category.name}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Left Sidebar - Search + Categories */}
                <div className="lg:col-span-1">
                    <div className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-4">
                        {/* Search Input */}
                        <form className="relative" action={searchAction}>
                            <Input
                                type="text"
                                name="q"
                                defaultValue={searchQuery}
                                placeholder={`Search in ${category.name}`}
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
                        <div>
                            <h3 className="mb-3 font-semibold text-stone-400 text-xs uppercase tracking-wider">
                                All Categories
                            </h3>
                            <div className="flex flex-col space-y-1">
                                {allCategories.map((cat) => (
                                    <Button
                                        key={cat.id}
                                        variant="ghost"
                                        asChild
                                        className={`group -mx-3 h-9 justify-between rounded-md px-3 font-normal text-sm hover:bg-white/5 hover:text-white ${
                                            cat.id === category.id
                                                ? "bg-white/10 text-white"
                                                : "text-stone-300"
                                        }`}
                                    >
                                        <Link
                                            href={`/faq/category/${cat.slug}`}
                                        >
                                            <span>{cat.name}</span>
                                            <ChevronRightIcon className="h-3 w-3 opacity-10 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Back to All FAQs */}
                        <div className="border-white/10 border-t pt-4">
                            <Button
                                variant="ghost"
                                asChild
                                className="w-full justify-start text-stone-300 hover:text-white"
                            >
                                <Link
                                    href="/faq"
                                    className="flex items-center gap-2"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                    All FAQs
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content - FAQs */}
                <div className="lg:col-span-3">
                    {filteredFaqs.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <p className="text-stone-400">
                                    {filteredFaqs.length} question
                                    {filteredFaqs.length !== 1 ? "s" : ""} in
                                    this category
                                    {isSearchMode ? " (filtered)" : ""}
                                </p>
                            </div>

                            <Accordion
                                type="single"
                                collapsible
                                className="space-y-4"
                            >
                                {filteredFaqs.map((faq) => (
                                    <AccordionItem
                                        key={faq.id}
                                        value={faq.id.toString()}
                                        className="rounded-lg border-stone-700 bg-stone-800/50 px-6"
                                    >
                                        <AccordionTrigger className="py-6 font-medium text-lg text-white hover:no-underline">
                                            <div className="flex items-start gap-3 text-left">
                                                {faq.isFeatured && (
                                                    <span className="mt-0.5 inline-flex items-center rounded-full bg-blue-500/20 px-2 py-1 font-medium text-blue-400 text-xs">
                                                        Featured
                                                    </span>
                                                )}
                                                <span>{faq.question}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-6">
                                            <div className="space-y-4 text-stone-100/70">
                                                {/* Render answer based on type */}
                                                <div className="prose prose-invert prose-sm max-w-none prose-a:text-blue-400 prose-li:text-stone-300 prose-p:text-stone-300 prose-strong:text-white [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-stone-400 [&_td]:border [&_td]:border-stone-400 [&_td]:p-3 [&_th]:border [&_th]:border-stone-400 [&_th]:p-3">
                                                    {faq.answer &&
                                                    typeof faq.answer ===
                                                        "object" ? (
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
                                                    ) : typeof faq.answer ===
                                                      "string" ? (
                                                        <div
                                                            // biome-ignore lint/security/noDangerouslySetInnerHtml: FAQ content is controlled by admin users
                                                            dangerouslySetInnerHTML={{
                                                                __html: faq.answer,
                                                            }}
                                                        />
                                                    ) : (
                                                        <p className="text-stone-400 italic">
                                                            Content not
                                                            available
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Link to detailed page - NEW STRUCTURE */}
                                                <div className="pt-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/faq/${faq.slug}`}
                                                            className="text-blue-400 hover:text-blue-300"
                                                        >
                                                            Read full answer →
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-lg text-stone-400">
                                No FAQs available in this category yet.
                            </p>
                            <Button variant="ghost" asChild className="mt-4">
                                <Link href="/faq">Browse all FAQs</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
