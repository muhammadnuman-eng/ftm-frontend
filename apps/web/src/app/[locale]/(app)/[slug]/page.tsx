import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CalendarIcon,
    ClockIcon,
    TagIcon,
    UserIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { extractVideoID } from "@/blocks/YouTube";
import TableOfContents from "@/components/table-of-contents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPostBySlug, getPosts } from "@/lib/payload";
import { constructCanonicalUrl } from "@/lib/seo/global-seo";
import type { Media, Post, Tag } from "@/payload-types";

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
        locale?: string;
    }>;
}

export async function generateMetadata({
    params,
}: BlogPostPageProps): Promise<Metadata> {
    const { slug, locale = "en" } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: "Post Not Found - Funded Trader Markets",
        };
    }

    // Get the canonical URL from post SEO if set, otherwise use self-referencing URL
    const canonicalUrl = constructCanonicalUrl(`/${slug}`, locale);

    return {
        title: `${post.title} - Funded Trader Markets`,
        description: post.excerpt,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: "article",
            url: canonicalUrl,
            publishedTime: post.publishedAt || undefined,
            authors: [
                typeof post.author === "object" && post.author?.name
                    ? post.author.name
                    : "Unknown Author",
            ],
        },
    };
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600; // 1 hour in seconds

// Helper functions for safely accessing relationship data
const getAuthorName = (author: Post["author"]): string => {
    return typeof author === "object" && author?.name
        ? author.name
        : "Unknown Author";
};

const getAuthorBio = (author: Post["author"]): string | null => {
    return typeof author === "object" ? author?.bio || null : null;
};

const getCategoryId = (category: Post["category"]): string | undefined => {
    return typeof category === "object"
        ? String(category?.id)
        : String(category);
};

const getTagId = (tag: string | number | Tag): string | undefined => {
    return typeof tag === "object" ? String(tag?.id) : String(tag);
};

const getTagName = (tag: string | number | Tag): string => {
    return typeof tag === "object" && tag?.name ? tag.name : "Untitled Tag";
};

const getCategoryName = (category: Post["category"]): string => {
    return typeof category === "object" && category?.name
        ? category.name
        : "Uncategorized";
};

const getMediaUrl = (media: string | number | Media): string | undefined => {
    return typeof media === "object" ? media?.url || undefined : undefined;
};

const BlogPostPage = async ({ params }: BlogPostPageProps) => {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    // Extract headings from content for table of contents
    const extractHeadings = (content: Post["content"]) => {
        if (!content) {
            return [];
        }

        // Handle Lexical rich text format
        if (
            typeof content === "object" &&
            content !== null &&
            "root" in content
        ) {
            try {
                // Convert Lexical to HTML first
                const html = convertLexicalToHTML({
                    data: content,
                    converters: ({ defaultConverters }) => ({
                        ...defaultConverters,
                        blocks: {
                            ...defaultConverters.blocks,
                            youtube: ({ node }: any) => {
                                const url = node.fields.url as string;
                                const videoID = extractVideoID(url);
                                if (!videoID) return "";

                                return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 0.5rem;"
    src="https://www.youtube-nocookie.com/embed/${videoID}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    title="YouTube video"
  ></iframe>
</div>`;
                            },
                        },
                    }),
                });

                // Extract headings from HTML with proper hierarchy
                const headings: Array<{
                    id: string;
                    text: string;
                    level: number;
                    parentId?: string;
                }> = [];
                let headingIndex = 0;
                const stack: Array<{ id: string; level: number }> = [];

                // Extract all heading levels (h1-h6) in order
                const allHeadingRegex = /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
                let match: RegExpExecArray | null;

                match = allHeadingRegex.exec(html);
                while (match !== null) {
                    const level = Number.parseInt(match[1].substring(1), 10);
                    const headingText = match[2]
                        .replace(/<[^>]*>/g, "")
                        .replace(/\s+/g, " ")
                        .trim();

                    if (headingText) {
                        const id = `heading-${headingIndex}`;

                        // Find the appropriate parent
                        let parentId: string | undefined;
                        while (
                            stack.length > 0 &&
                            stack[stack.length - 1].level >= level
                        ) {
                            stack.pop();
                        }

                        if (stack.length > 0) {
                            parentId = stack[stack.length - 1].id;
                        }

                        headings.push({
                            id,
                            text: headingText,
                            level,
                            parentId,
                        });

                        stack.push({ id, level });
                        headingIndex++;
                    }
                    match = allHeadingRegex.exec(html);
                }

                return headings;
            } catch (error) {
                console.error("Error converting Lexical to HTML:", error);
                return [];
            }
        }

        // Handle string content (fallback)
        if (typeof content === "string") {
            const headings: Array<{
                id: string;
                text: string;
                level: number;
                parentId?: string;
            }> = [];
            let headingIndex = 0;
            const stack: Array<{ id: string; level: number }> = [];

            // Extract all heading levels (h1-h6) in order
            const allHeadingRegex = /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
            let match: RegExpExecArray | null;

            match = allHeadingRegex.exec(content);
            while (match !== null) {
                const level = Number.parseInt(match[1].substring(1), 10);
                const headingText = match[2]
                    .replace(/<[^>]*>/g, "")
                    .replace(/\s+/g, " ")
                    .trim();

                if (headingText) {
                    const id = `heading-${headingIndex}`;

                    // Find the appropriate parent
                    let parentId: string | undefined;
                    while (
                        stack.length > 0 &&
                        stack[stack.length - 1].level >= level
                    ) {
                        stack.pop();
                    }

                    if (stack.length > 0) {
                        parentId = stack[stack.length - 1].id;
                    }

                    headings.push({
                        id,
                        text: headingText,
                        level,
                        parentId,
                    });

                    stack.push({ id, level });
                    headingIndex++;
                }
                match = allHeadingRegex.exec(content);
            }

            return headings;
        }

        return [];
    };

    const headings = extractHeadings(post.content);

    // Get all posts for navigation and related posts
    const allPosts = await getPosts();

    // Get current post index
    const currentIndex = allPosts.findIndex((p) => p.slug === slug);
    const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    const nextPost =
        currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

    // Get related posts (same category or tags )
    const relatedPosts = allPosts
        .filter(
            (p) =>
                p.id !== post.id &&
                (getCategoryId(p.category) === getCategoryId(post.category) ||
                    p.tags?.some((tag) =>
                        post.tags?.some((pt) => getTagId(pt) === getTagId(tag)),
                    )),
        )
        .slice(0, 3);

    return (
        <div className="">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Breadcrumbs */}
                <div className="mb-8 flex items-center text-slate-400 text-sm">
                    <Link
                        href="/"
                        className="transition-colors hover:text-white"
                    >
                        Home
                    </Link>
                    <span className="mx-2">/</span>
                    <Link
                        href="/blog"
                        className="transition-colors hover:text-white"
                    >
                        Blog
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-white">{post.title}</span>
                </div>

                <div className="mb-12 rounded-2xl bg-card/50 p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        {/* Left side - Meta info */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-indigo-300)_0%,var(--color-indigo-600)_100%)]">
                                        <UserIcon className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs uppercase tracking-wide">
                                        Author
                                    </div>
                                    <div className="font-semibold text-slate-200">
                                        {getAuthorName(post.author)}
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden h-8 w-px bg-slate-700/50 sm:block" />

                            {/* Date and Read Time */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                                        <CalendarIcon className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs uppercase tracking-wide">
                                            Published
                                        </div>
                                        <div className="text-slate-300 text-sm">
                                            {new Date(
                                                post.publishedAt ||
                                                    post.createdAt,
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                                        <ClockIcon className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs uppercase tracking-wide">
                                            Read Time
                                        </div>
                                        <div className="text-slate-300 text-sm">
                                            {post.readTime || "5 min read"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <div className="text-slate-500 text-xs uppercase tracking-wide lg:text-right">
                                    Topics
                                </div>
                                <div className="flex flex-wrap gap-2 lg:justify-end">
                                    {post.tags.map((tag) => (
                                        <Badge
                                            key={getTagId(tag)}
                                            variant="secondary"
                                            className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 transition-all duration-200 hover:border-indigo-500/30 hover:bg-indigo-500/20"
                                        >
                                            <TagIcon className="mr-1.5 h-3 w-3" />
                                            {getTagName(tag)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="max-w-4xl">
                    <h1 className="font-bold text-3xl leading-tight sm:text-4xl lg:text-5xl">
                        {post.title}
                    </h1>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
                {/* Article Meta */}
                <div className="mx-auto max-w-7xl">
                    {/* Article Content with Table of Contents */}
                    <div className="grid gap-12 lg:grid-cols-4">
                        {/* Table of Contents */}
                        {headings.length > 0 && (
                            <div className="lg:col-span-1">
                                <TableOfContents headings={headings} />
                            </div>
                        )}

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <article className="prose prose-invert prose-lg max-w-none prose-blockquote:border-indigo-500 prose-blockquote:bg-slate-800/50 prose-code:bg-slate-800 prose-pre:bg-slate-900 prose-blockquote:text-slate-300 prose-code:text-indigo-300 prose-em:text-slate-200 prose-headings:text-white prose-li:text-slate-300 prose-ol:text-slate-300 prose-p:text-slate-300 prose-strong:text-white prose-ul:text-slate-300">
                                {/* Rich text content from Payload CMS */}
                                {post.content ? (
                                    <div
                                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Payload CMS HTML conversion is safe
                                        dangerouslySetInnerHTML={{
                                            __html: (() => {
                                                const html =
                                                    convertLexicalToHTML({
                                                        data: post.content,
                                                        converters: ({
                                                            defaultConverters,
                                                        }) => ({
                                                            ...defaultConverters,
                                                            blocks: {
                                                                ...defaultConverters.blocks,
                                                                youtube: ({
                                                                    node,
                                                                    // biome-ignore lint/suspicious/noExplicitAny: no explicit any
                                                                }: any) => {
                                                                    const url =
                                                                        node
                                                                            .fields
                                                                            .url as string;
                                                                    const videoID =
                                                                        extractVideoID(
                                                                            url,
                                                                        );
                                                                    if (
                                                                        !videoID
                                                                    )
                                                                        return "";
                                                                    return `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 2rem 0;">
  <iframe
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 0.5rem;"
    src="https://www.youtube-nocookie.com/embed/${videoID}"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen
    title="YouTube video"
  ></iframe>
</div>`;
                                                                },
                                                            },
                                                        }),
                                                    });

                                                // Add IDs to headings for table of contents
                                                let headingIndex = 0;
                                                return html.replace(
                                                    /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi,
                                                    (_match, tag, content) => {
                                                        const id = `heading-${headingIndex}`;
                                                        headingIndex++;
                                                        return `<${tag} id="${id}">${content}</${tag}>`;
                                                    },
                                                );
                                            })(),
                                        }}
                                    />
                                ) : (
                                    <div className="text-slate-300">
                                        <p>
                                            No content available for this post.
                                        </p>
                                    </div>
                                )}
                            </article>
                            <div className="mt-8 rounded-lg bg-card/50 p-6">
                                <div className="flex items-start gap-6">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-indigo-300)_0%,var(--color-indigo-600)_100%)]">
                                        <UserIcon className="size-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="mb-3 font-semibold text-white text-xl">
                                            {getAuthorName(post.author)}
                                        </h3>
                                        <p className="text-slate-300 leading-relaxed">
                                            {getAuthorBio(post.author) ||
                                                "Trading expert with years of experience in funded trading programs. Passionate about helping traders develop consistent strategies and achieve their financial goals through disciplined risk management and psychological mastery."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pagination */}
                            <div className="mt-16 flex items-center justify-between gap-4 border-slate-700/50 border-t pt-8">
                                {prevPost ? (
                                    <Link
                                        href={`/${prevPost.slug}`}
                                        className="group flex items-center gap-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 transition-all hover:border-slate-600/50 hover:bg-slate-700/50"
                                    >
                                        <ArrowLeftIcon className="group-hover:-translate-x-1 h-5 w-5 text-slate-400 transition-transform" />
                                        <div className="text-left">
                                            <div className="text-slate-400 text-sm">
                                                Previous Post
                                            </div>
                                            <div className="font-medium text-white group-hover:text-indigo-300">
                                                {prevPost.title}
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <div />
                                )}

                                {nextPost ? (
                                    <Link
                                        href={`/${nextPost.slug}`}
                                        className="group flex items-center gap-4 rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 transition-all hover:border-slate-600/50 hover:bg-slate-700/50"
                                    >
                                        <div className="text-right">
                                            <div className="text-slate-400 text-sm">
                                                Next Post
                                            </div>
                                            <div className="font-medium text-white group-hover:text-indigo-300">
                                                {nextPost.title}
                                            </div>
                                        </div>
                                        <ArrowRightIcon className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                ) : (
                                    <div />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <div className="mt-24">
                        <div className="mb-12 text-center">
                            <h2 className="mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text font-bold text-3xl text-transparent sm:text-4xl">
                                Related Articles
                            </h2>
                            <p className="text-slate-400">
                                Continue your learning journey with these
                                related articles
                            </p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {relatedPosts.map((relatedPost) => (
                                <Card
                                    key={relatedPost.id}
                                    className="group overflow-hidden border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 transition-all duration-300 hover:border-slate-600/50 hover:shadow-xl"
                                >
                                    <div className="aspect-video overflow-hidden">
                                        <Image
                                            src={
                                                getMediaUrl(
                                                    relatedPost.featuredImage,
                                                ) || "/images/placeholder.jpg"
                                            }
                                            alt={relatedPost.title}
                                            width={400}
                                            height={225}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Badge
                                                variant="secondary"
                                                className="border-indigo-500/20 bg-indigo-500/10 text-indigo-300"
                                            >
                                                {getCategoryName(
                                                    relatedPost.category,
                                                )}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                <ClockIcon className="h-3 w-3" />
                                                {relatedPost.readTime}
                                            </div>
                                        </div>
                                        <h3 className="mb-3 font-semibold text-lg text-white transition-colors group-hover:text-indigo-300">
                                            <Link href={`/${relatedPost.slug}`}>
                                                {relatedPost.title}
                                            </Link>
                                        </h3>
                                        <p className="mb-4 line-clamp-3 text-slate-300 text-sm leading-relaxed">
                                            {relatedPost.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <UserIcon className="h-3 w-3" />
                                                {getAuthorName(
                                                    relatedPost.author,
                                                )}
                                            </div>
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                                className="border-slate-600 text-indigo-400 transition-colors hover:border-indigo-500 hover:text-indigo-300"
                                            >
                                                <Link
                                                    href={`/${relatedPost.slug}`}
                                                >
                                                    Read More
                                                    <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPostPage;
