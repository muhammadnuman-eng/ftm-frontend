import {
    ArrowRightIcon,
    CalendarIcon,
    ClockIcon,
    SearchIcon,
    UserIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
import { getCategories, getPostsPaginated, searchPosts } from "@/lib/payload";
import { generateGlobalMetadata } from "@/lib/seo/global-seo";
import type { Category, Post } from "@/payload-types";

// Enable ISR with 1 hour revalidation for blog listing
export const revalidate = 3600; // 1 hour in seconds

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
        pageType: "blogPage",
        pagePath: "/blog",
    });
}

interface BlogPageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        q?: string;
        page?: string;
    }>;
}

const BlogPage = async ({ searchParams }: BlogPageProps) => {
    const searchParamsResolved = await searchParams;
    const searchQuery = searchParamsResolved.q || "";
    const currentPage = Number.parseInt(searchParamsResolved.page || "1", 10);

    // Fetch data based on search params
    let posts: Post[] = [];
    let categories: Category[] = [];
    let totalPages = 0;
    let totalDocs = 0;

    try {
        // Always fetch categories
        categories = await getCategories();

        if (searchQuery) {
            // Search mode
            posts = [...(await searchPosts(searchQuery))];
            totalPages = 1;
            totalDocs = posts.length;
        } else {
            // Default pagination mode
            const result = await getPostsPaginated(currentPage, 6);
            posts = [...result.docs];
            totalPages = result.totalPages;
            totalDocs = result.totalDocs;
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        posts = [];
        totalPages = 0;
        totalDocs = 0;
    }

    // Server actions for form submissions
    async function searchAction(formData: FormData) {
        "use server";
        const query = formData.get("q") as string;

        if (query) {
            redirect(`/blog?q=${encodeURIComponent(query)}`);
        } else {
            redirect("/blog");
        }
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

        const pages = Array.from(
            { length: end - start + 1 },
            (_, i) => start + i,
        );

        return { pages, showLeftEllipsis, showRightEllipsis } as const;
    }

    return (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                dividerTitle="FTM Blog"
                title={"Source for Trading\n Tips & Market Insights"}
                titleHighlight={["Tips", "Insights"]}
                description="Stay ahead with expert tips, forex trading strategies, and prop trading news."
                as="h1"
            />

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="space-y-6">
                        {/* Blog Posts */}
                        {posts.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {posts.map((post) => (
                                    <Card
                                        key={post.id}
                                        className="!bg-none"
                                        wrapperClassName="ring-1 ring-white/10"
                                    >
                                        <div className="aspect-video overflow-hidden">
                                            {typeof post.featuredImage ===
                                                "object" &&
                                            post.featuredImage?.url ? (
                                                <Image
                                                    src={
                                                        post.featuredImage?.url
                                                    }
                                                    alt={post.title}
                                                    width={400}
                                                    height={225}
                                                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                />
                                            ) : null}
                                        </div>
                                        <CardHeader className="pb-4">
                                            <div className="mb-3 flex items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {(typeof post.category ===
                                                        "object" &&
                                                        post.category?.name) ||
                                                        "Uncategorized"}
                                                </Badge>
                                                <span className="text-stone-400 text-xs">
                                                    •
                                                </span>
                                                <div className="flex items-center gap-1 text-stone-400 text-xs">
                                                    <ClockIcon className="h-3 w-3" />
                                                    {post.readTime ||
                                                        "5 min read"}
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg text-white transition-colors hover:text-indigo-400">
                                                <Link href={`/${post.slug}`}>
                                                    {post.title}
                                                </Link>
                                            </CardTitle>
                                            <CardDescription className="line-clamp-3 text-stone-300">
                                                {post.excerpt}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0 pb-6">
                                            <div className="mb-4 flex items-center justify-between text-sm text-stone-400">
                                                <div className="flex items-center gap-1">
                                                    <UserIcon className="h-3 w-3" />
                                                    {(typeof post.author ===
                                                        "object" &&
                                                        post.author?.name) ||
                                                        "Unknown Author"}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {new Date(
                                                        post.publishedAt ||
                                                            post.createdAt,
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        },
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-start">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    className="hover:bg-indigo-600/20 hover:text-indigo-400"
                                                >
                                                    <Link
                                                        href={`/${post.slug}`}
                                                    >
                                                        Read More
                                                        <ArrowRightIcon className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-lg text-stone-400">
                                    {searchQuery
                                        ? `No articles found for "${searchQuery}".`
                                        : "No articles found yet."}
                                </p>
                                <Link
                                    href="/blog"
                                    className="mt-4 inline-flex items-center gap-2 text-indigo-400 transition-colors hover:text-indigo-300"
                                >
                                    Browse all articles
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && !searchQuery && (
                            <div className="pt-2">
                                {(() => {
                                    const {
                                        pages,
                                        showLeftEllipsis,
                                        showRightEllipsis,
                                    } = getPaginationModel(
                                        currentPage,
                                        totalPages,
                                        5,
                                    );
                                    return (
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                                                        href={
                                                            currentPage === 1
                                                                ? undefined
                                                                : `/blog?page=${currentPage - 1}`
                                                        }
                                                        aria-disabled={
                                                            currentPage === 1
                                                                ? true
                                                                : undefined
                                                        }
                                                        role={
                                                            currentPage === 1
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
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            href={`/blog?page=${page}`}
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
                                                            totalPages
                                                                ? undefined
                                                                : `/blog?page=${currentPage + 1}`
                                                        }
                                                        aria-disabled={
                                                            currentPage ===
                                                            totalPages
                                                                ? true
                                                                : undefined
                                                        }
                                                        role={
                                                            currentPage ===
                                                            totalPages
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

                        {/* Results info */}
                        {totalDocs > 0 && (
                            <div className="flex justify-center pt-4">
                                <p className="text-sm text-stone-400">
                                    Showing {posts.length} of {totalDocs} posts
                                    {searchQuery && ` for "${searchQuery}"`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-4">
                        {/* Search Form */}
                        <form action={searchAction} className="relative">
                            <Input
                                type="text"
                                name="q"
                                placeholder="Search articles..."
                                className="rounded-md border-white/10 bg-white/5 pr-10 text-sm text-white placeholder:text-stone-400"
                                defaultValue={searchQuery}
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
                                Categories
                            </h3>
                            <div className="flex flex-col space-y-1">
                                <Link
                                    href="/blog"
                                    className="group -mx-3 flex h-9 items-center justify-start rounded-md bg-indigo-600/20 px-3 font-normal text-indigo-400 text-sm"
                                >
                                    All Posts
                                </Link>
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.slug}`}
                                        className="group -mx-3 flex h-9 items-center justify-start rounded-md border-l-2 px-3 font-normal text-sm text-stone-300 transition-colors hover:bg-white/5 hover:text-white"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPage;
