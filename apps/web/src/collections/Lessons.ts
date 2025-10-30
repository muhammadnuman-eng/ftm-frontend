import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import slugify from "slugify";
import { YouTube } from "../blocks/YouTube";

export const Lessons: CollectionConfig = {
    slug: "lessons",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "module", "duration", "order", "status"],
        group: "Academy",
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
                            name: "module",
                            type: "relationship",
                            relationTo: "modules",
                            required: true,
                            label: "Module",
                            admin: {
                                description:
                                    "The module this lesson belongs to",
                            },
                        },
                        {
                            name: "duration",
                            type: "number",
                            label: "Duration (minutes)",
                            admin: {
                                description: "Lesson duration in minutes",
                            },
                        },
                        {
                            name: "order",
                            type: "number",
                            defaultValue: 0,
                            label: "Sort Order",
                            admin: {
                                description:
                                    "Order in which this lesson appears within its course",
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
                            name: "coverImage",
                            type: "upload",
                            relationTo: "media",
                            required: false,
                            label: "Cover Image",
                            admin: {
                                description:
                                    "Optional cover image for this lesson",
                            },
                        },
                    ],
                },
                {
                    label: "SEO",
                    fields: [
                        {
                            name: "seo",
                            type: "group",
                            label: "SEO Settings",
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    label: "Meta Title",
                                    admin: {
                                        description:
                                            "SEO title (leave empty to use lesson title)",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    label: "Meta Description",
                                    admin: {
                                        description: "SEO meta description",
                                    },
                                },
                                {
                                    name: "image",
                                    type: "upload",
                                    relationTo: "media",
                                    label: "Meta Image",
                                    admin: {
                                        description:
                                            "SEO meta image (leave empty to use cover image)",
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

                return data;
            },
        ],
    },
};
