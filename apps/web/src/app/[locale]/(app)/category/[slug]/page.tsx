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
import { notFound, redirect } from "next/navigation";
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
import { getCategories, getPostsByCategory, searchPosts } from "@/lib/payload";
import { constructCanonicalUrl } from "@/lib/seo/global-seo";
import type { Category, Post } from "@/payload-types";

// Enable ISR with 1 hour revalidation for blog category pages
export const revalidate = 3600; // 1 hour in seconds

interface CategoryPageProps {
    params: Promise<{
        slug: string;
        locale?: string;
    }>;
    searchParams: Promise<{
        q?: string;
    }>;
}

export async function generateMetadata({
    params,
}: CategoryPageProps): Promise<Metadata> {
    const { slug, locale = "en" } = await params;
    const categories = await getCategories();
    const category = categories.find((c) => c.slug === slug);

    if (!category) {
        return {
            title: "Category Not Found - Funded Trader Markets",
            description: "The requested category could not be found.",
        };
    }

    // Self-referencing canonical URL
    const canonicalUrl = constructCanonicalUrl(`/category/${slug}`, locale);

    return {
        title: `${category.name} - Trading Tips & Market Insights - Funded Trader Markets`,
        description:
            category.description ||
            `Browse ${category.name} articles with expert tips, forex trading strategies, and prop trading news.`,
        alternates: {
            canonical: canonicalUrl,
        },
    };
}

const CategoryPage = async ({ params, searchParams }: CategoryPageProps) => {
    const { slug } = await params;
    const { q: searchQuery = "" } = await searchParams;

    // Fetch data
    let posts: Post[] = [];
    let categories: Category[] = [];
    let currentCategory: Category | undefined;

    try {
        // Always fetch categories
        categories = await getCategories();
        currentCategory = categories.find((c) => c.slug === slug);

        if (!currentCategory) {
            notFound();
        }

        if (searchQuery) {
            // Search within this category
            const allPosts = await searchPosts(searchQuery);
            posts = allPosts.filter(
                (post) =>
                    typeof post.category === "object" &&
                    post.category?.slug === slug,
            );
        } else {
            // Get all posts for this category
            posts = await getPostsByCategory(slug);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        notFound();
    }

    // Server action for search within category
    async function searchAction(formData: FormData) {
        "use server";
        const query = formData.get("q") as string;

        if (query) {
            redirect(`/category/${slug}?q=${encodeURIComponent(query)}`);
        } else {
            redirect(`/category/${slug}`);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                dividerTitle="FTM Blog"
                title={`${currentCategory?.name} Articles`}
                titleHighlight={[currentCategory?.name || ""]}
                description={
                    currentCategory?.description ||
                    `Browse our collection of ${currentCategory?.name} articles with expert insights and strategies.`
                }
            />

            {/* Breadcrumb */}
            <nav className="flex items-center justify-center space-x-2 text-sm text-stone-400">
                <Link
                    href="/blog"
                    className="transition-colors hover:text-white"
                >
                    Blog
                </Link>
                <span>/</span>
                <span className="text-white">{currentCategory?.name}</span>
            </nav>

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    <div className="space-y-6">
                        {/* Search Results Info */}
                        {searchQuery && (
                            <div className="mb-6">
                                <p className="text-stone-400">
                                    {posts.length > 0
                                        ? `Found ${posts.length} article${posts.length === 1 ? "" : "s"} for "${searchQuery}" in ${currentCategory?.name}`
                                        : `No articles found for "${searchQuery}" in ${currentCategory?.name}`}
                                </p>
                                <Link
                                    href={`/category/${slug}`}
                                    className="text-indigo-400 text-sm transition-colors hover:text-indigo-300"
                                >
                                    Clear search
                                </Link>
                            </div>
                        )}

                        {/* Blog Posts */}
                        {posts.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2">
                                {posts.map((post) => (
                                    <Card
                                        key={post.id}
                                        className="overflow-hidden rounded-lg border-stone-700 bg-stone-800/50 transition-colors hover:bg-stone-700/50"
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
                                                    {currentCategory?.name ||
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
                                        ? `No articles found for "${searchQuery}" in this category.`
                                        : "No articles found in this category yet."}
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

                        {/* Results info */}
                        {posts.length > 0 && (
                            <div className="flex justify-center pt-4">
                                <p className="text-sm text-stone-400">
                                    Showing {posts.length} article
                                    {posts.length === 1 ? "" : "s"} in{" "}
                                    {currentCategory?.name}
                                    {searchQuery && ` for "${searchQuery}"`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1">
                    <div className="space-y-6 rounded-lg border border-white/10 bg-white/5 p-4">
                        {/* Search Form - Search within this category */}
                        <form action={searchAction} className="relative">
                            <Input
                                type="text"
                                name="q"
                                placeholder={`Search in ${currentCategory?.name}...`}
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
                                    className="group -mx-3 flex h-9 items-center justify-start rounded-md border-l-2 px-3 font-normal text-sm text-stone-300 transition-colors hover:bg-white/5 hover:text-white"
                                >
                                    All Posts
                                </Link>
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/category/${category.slug}`}
                                        className={`group -mx-3 flex h-9 items-center justify-start rounded-md px-3 font-normal text-sm transition-colors ${
                                            slug === category.slug
                                                ? "bg-indigo-600/20 text-indigo-400"
                                                : "text-stone-300 hover:bg-white/5 hover:text-white"
                                        }`}
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Back to All Articles */}
                        <div className="border-white/10 border-t pt-4">
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-2 text-indigo-400 text-sm transition-colors hover:text-indigo-300"
                            >
                                ← Back to all articles
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryPage;
