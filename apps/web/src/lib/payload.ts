import { getPayload, type Payload } from "payload";
import config from "../payload.config";
import type {
    Author,
    Category,
    CommerceConfig as CommerceConfigType,
    Post,
} from "../payload-types";

let cachedPayloadClient: Payload | null = null;

// Retry helper for transient database errors
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 100,
): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            const errorMessage = error instanceof Error ? error.message : "";

            // Only retry on connection errors
            if (
                errorMessage.includes("too many clients") ||
                errorMessage.includes("Connection terminated") ||
                errorMessage.includes("ECONNREFUSED")
            ) {
                if (i < maxRetries - 1) {
                    // Exponential backoff
                    await new Promise((resolve) =>
                        setTimeout(resolve, delay * 2 ** i),
                    );
                    continue;
                }
            }
            // For non-retriable errors, throw immediately
            throw error;
        }
    }

    throw lastError;
}

// Initialize Payload client once per process to avoid repeated bootstrap cost
export const getPayloadClient = async () => {
    if (!cachedPayloadClient) {
        cachedPayloadClient = await withRetry(() => getPayload({ config }));
    }

    return cachedPayloadClient;
};

// Fetch all published posts
export const getPosts = async (): Promise<Post[]> => {
    const payload = await getPayloadClient();

    try {
        const posts = await payload.find({
            collection: "posts",
            where: {
                status: {
                    equals: "published",
                },
            },
            sort: "-publishedAt",
            depth: 2, // Include related data (author, category, tags)
        });

        return posts.docs;
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
};

// Fetch a single post by slug
export const getPostBySlug = async (slug: string): Promise<Post | null> => {
    const payload = await getPayloadClient();

    try {
        const posts = await payload.find({
            collection: "posts",
            where: {
                and: [
                    {
                        slug: {
                            equals: slug,
                        },
                    },
                    {
                        status: {
                            equals: "published",
                        },
                    },
                ],
            },
            depth: 2,
        });

        return posts.docs[0] || null;
    } catch (error) {
        console.error("Error fetching post:", error);
        return null;
    }
};

// Fetch posts by category
export const getPostsByCategory = async (
    categorySlug: string,
): Promise<Post[]> => {
    const payload = await getPayloadClient();

    try {
        const posts = await payload.find({
            collection: "posts",
            where: {
                and: [
                    {
                        "category.slug": {
                            equals: categorySlug,
                        },
                    },
                    {
                        status: {
                            equals: "published",
                        },
                    },
                ],
            },
            sort: "-publishedAt",
            depth: 2,
        });

        return posts.docs;
    } catch (error) {
        console.error("Error fetching posts by category:", error);
        return [];
    }
};

// Fetch all categories
export const getCategories = async (): Promise<Category[]> => {
    const payload = await getPayloadClient();

    try {
        const categories = await payload.find({
            collection: "categories",
            sort: "name",
        });

        return categories.docs;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
};

// Fetch all authors
export const getAuthors = async (): Promise<Author[]> => {
    const payload = await getPayloadClient();

    try {
        const authors = await payload.find({
            collection: "authors",
            sort: "name",
        });

        return authors.docs;
    } catch (error) {
        console.error("Error fetching authors:", error);
        return [];
    }
};

// Fetch platforms collection
export const getPlatforms = async () => {
    const payload = await getPayloadClient();

    try {
        const platforms = await payload.find({
            collection: "platforms",
            limit: 100,
            sort: "sortOrder",
        });
        return platforms.docs;
    } catch (error) {
        console.error("Error fetching platforms:", error);
        return [];
    }
};

// Fetch commerce config global (restrictions, etc.)
export const getCommerceConfig =
    async (): Promise<CommerceConfigType | null> => {
        const payload = await getPayloadClient();

        try {
            const commerceConfig = (await payload.findGlobal({
                slug: "commerce-config",
            })) as CommerceConfigType;
            return commerceConfig;
        } catch (error) {
            console.error("Error fetching commerce config:", error);
            return null;
        }
    };

// Search posts using the search plugin
export const searchPosts = async (query: string): Promise<Post[]> => {
    if (!query.trim()) {
        return getPosts();
    }

    const payload = await getPayloadClient();

    try {
        // Search posts by title and excerpt only (content is rich text and can't be searched with LIKE)
        const searchResults = await payload.find({
            collection: "posts",
            where: {
                and: [
                    {
                        status: {
                            equals: "published",
                        },
                    },
                    {
                        or: [
                            {
                                title: {
                                    like: query,
                                },
                            },
                            {
                                excerpt: {
                                    like: query,
                                },
                            },
                        ],
                    },
                ],
            },
            sort: "-publishedAt",
            depth: 2,
        });

        return searchResults.docs;
    } catch (error) {
        console.error("Error searching posts:", error);
        return [];
    }
};

// Get posts with pagination
export const getPostsPaginated = async (page = 1, limit = 6) => {
    const payload = await getPayloadClient();

    try {
        const posts = await payload.find({
            collection: "posts",
            where: {
                status: {
                    equals: "published",
                },
            },
            sort: "-publishedAt",
            depth: 2,
            page,
            limit,
        });

        return {
            docs: posts.docs,
            totalPages: posts.totalPages,
            totalDocs: posts.totalDocs,
        } as const;
    } catch (error) {
        console.error("Error fetching paginated posts:", error);
        return {
            docs: [],
            totalPages: 0,
            totalDocs: 0,
        } as const;
    }
};
