import { BlocksFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import slugify from "slugify";
import { YouTube } from "../blocks/YouTube";

export const Courses: CollectionConfig = {
    slug: "courses",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "level", "isFeatured", "order", "status"],
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
                            name: "shortDescription",
                            type: "textarea",
                            localized: true,
                            required: true,
                            label: "Short Description",
                            admin: {
                                description:
                                    "Brief summary of the course (used in previews)",
                            },
                        },
                        {
                            name: "level",
                            type: "select",
                            required: true,
                            options: [
                                {
                                    label: "Beginner",
                                    value: "beginner",
                                },
                                {
                                    label: "Intermediate",
                                    value: "intermediate",
                                },
                                {
                                    label: "Advanced",
                                    value: "advanced",
                                },
                            ],
                            label: "Course Level",
                        },
                        {
                            name: "isFeatured",
                            type: "checkbox",
                            defaultValue: false,
                            label: "Featured Course",
                            admin: {
                                description: "Mark this course as featured",
                            },
                        },
                        {
                            name: "order",
                            type: "number",
                            defaultValue: 0,
                            label: "Sort Order",
                            admin: {
                                description:
                                    "Order in which this course appears in listings",
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
                            name: "description",
                            type: "richText",
                            localized: true,
                            required: true,
                            label: "Full Description",
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
                            name: "features",
                            type: "array",
                            localized: true,
                            label: "Course Features",
                            admin: {
                                description:
                                    "Key features or highlights of this course",
                            },
                            fields: [
                                {
                                    name: "feature",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Feature",
                                },
                            ],
                        },
                        {
                            name: "coverImage",
                            type: "upload",
                            relationTo: "media",
                            required: true,
                            label: "Cover Image",
                            admin: {
                                description: "Main cover image for the course",
                            },
                        },
                        {
                            name: "featuredImage",
                            type: "upload",
                            relationTo: "media",
                            required: true,
                            label: "Featured Image",
                            admin: {
                                description:
                                    "Featured image used in course listings",
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
                                            "SEO title (leave empty to use course title)",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    label: "Meta Description",
                                    admin: {
                                        description:
                                            "SEO meta description (leave empty to use short description)",
                                    },
                                },
                                {
                                    name: "image",
                                    type: "upload",
                                    relationTo: "media",
                                    label: "Meta Image",
                                    admin: {
                                        description:
                                            "SEO meta image (leave empty to use featured image)",
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
