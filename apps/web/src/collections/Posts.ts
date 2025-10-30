import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import slugify from "slugify";
import { YouTube } from "../blocks/YouTube";

export const Posts: CollectionConfig = {
    slug: "posts",
    admin: {
        useAsTitle: "title",
        defaultColumns: [
            "title",
            "author",
            "category",
            "publishedAt",
            "status",
        ],
        group: "Blog",
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "General",
                    fields: [
                        {
                            name: "title",
                            type: "text",
                            localized: true,
                            required: true,
                        },
                        {
                            name: "excerpt",
                            type: "textarea",
                            localized: true,
                            required: true,
                            admin: {
                                description:
                                    "Brief summary of the post (used in previews and meta descriptions)",
                            },
                        },
                        {
                            name: "slug",
                            type: "text",
                            required: true,
                            unique: true,
                            admin: {
                                description:
                                    "URL-friendly version of the title",
                            },
                        },
                        {
                            name: "status",
                            type: "select",
                            options: [
                                {
                                    label: "Draft",
                                    value: "draft",
                                },
                                {
                                    label: "Published",
                                    value: "published",
                                },
                                {
                                    label: "Archived",
                                    value: "archived",
                                },
                            ],
                            defaultValue: "draft",
                            required: true,
                        },
                        {
                            name: "publishedAt",
                            type: "date",
                            admin: {
                                date: {
                                    pickerAppearance: "dayAndTime",
                                },
                            },
                        },
                    ],
                },
                {
                    label: "Content",
                    fields: [
                        {
                            name: "content",
                            type: "richText",
                            localized: true,
                            required: true,
                            editor: lexicalEditor({
                                features: ({ defaultFeatures }) => [
                                    ...defaultFeatures,
                                    BlocksFeature({
                                        blocks: [YouTube],
                                    }),
                                ],
                            }),
                        },
                        {
                            name: "featuredImage",
                            type: "upload",
                            relationTo: "media",
                            required: true,
                        },
                        {
                            name: "readTime",
                            type: "text",
                            admin: {
                                description:
                                    "Estimated reading time (e.g., '5 min read')",
                            },
                        },
                    ],
                },
                {
                    label: "Relationships",
                    fields: [
                        {
                            name: "author",
                            type: "relationship",
                            relationTo: "authors",
                            required: true,
                        },
                        {
                            name: "category",
                            type: "relationship",
                            relationTo: "categories",
                            required: true,
                        },
                        {
                            name: "tags",
                            type: "relationship",
                            relationTo: "tags",
                            hasMany: true,
                        },
                    ],
                },
                {
                    label: "Meta",
                    fields: [
                        {
                            name: "postMeta",
                            type: "group",
                            label: "Post Metadata",
                            fields: [
                                {
                                    name: "featured",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description: "Mark as featured post",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    hooks: {
        beforeChange: [
            ({ data }) => {
                // Auto-generate slug if not provided
                if (!data.slug && data.title) {
                    data.slug = slugify(data.title, {
                        lower: true,
                        strict: true,
                        trim: true,
                    });
                }

                // Set publishedAt if status is published and no date is set
                if (data.status === "published" && !data.publishedAt) {
                    data.publishedAt = new Date().toISOString();
                }

                return data;
            },
        ],
    },
};
