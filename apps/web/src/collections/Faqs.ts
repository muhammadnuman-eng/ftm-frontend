import {
    EXPERIMENTAL_TableFeature,
    lexicalEditor,
} from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import slugify from "slugify";

export const Faqs: CollectionConfig = {
    slug: "faqs",
    admin: {
        useAsTitle: "question",
        defaultColumns: ["question", "category", "isActive", "displayOrder"],
        group: "FAQ",
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
                            name: "question",
                            type: "text",
                            localized: true,
                            required: true,
                            admin: {
                                description: "The FAQ question",
                            },
                        },
                        {
                            name: "answer",
                            type: "richText",
                            localized: true,
                            required: true,
                            editor: lexicalEditor({
                                features: ({ defaultFeatures }) => [
                                    EXPERIMENTAL_TableFeature(),

                                    ...defaultFeatures,
                                ],
                            }),
                            admin: {
                                description:
                                    "The detailed answer to the question",
                            },
                        },
                        {
                            name: "slug",
                            type: "text",
                            localized: true,
                            required: true,
                            unique: true,
                            admin: {
                                description:
                                    "URL-friendly version of the question",
                            },
                        },
                        {
                            name: "category",
                            type: "relationship",
                            relationTo: "faq-categories",
                            required: true,
                            admin: {
                                description: "The category this FAQ belongs to",
                            },
                        },
                    ],
                },
                {
                    label: "Settings",
                    fields: [
                        {
                            name: "displayOrder",
                            type: "number",
                            defaultValue: 0,
                            admin: {
                                description:
                                    "Order in which this FAQ should appear within its category (lower numbers first)",
                            },
                        },
                        {
                            name: "isActive",
                            type: "checkbox",
                            defaultValue: true,
                            admin: {
                                description:
                                    "Whether this FAQ is active and visible",
                            },
                        },
                        {
                            name: "isFeatured",
                            type: "checkbox",
                            defaultValue: false,
                            admin: {
                                description:
                                    "Mark as featured FAQ (will appear at the top of listings)",
                            },
                        },
                    ],
                },
                {
                    label: "Meta",
                    fields: [
                        {
                            name: "metaTitle",
                            type: "text",
                            localized: true,
                            admin: {
                                description:
                                    "SEO meta title (will use question if empty)",
                            },
                        },
                        {
                            name: "metaDescription",
                            type: "textarea",
                            localized: true,
                            admin: {
                                description: "SEO meta description",
                            },
                        },
                        {
                            name: "tags",
                            type: "array",
                            localized: true,
                            fields: [
                                {
                                    name: "tag",
                                    type: "text",
                                    required: true,
                                },
                            ],
                            admin: {
                                description: "Tags for better searchability",
                            },
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
                if (!data.slug && data.question) {
                    data.slug = slugify(data.question, {
                        lower: true,
                        strict: true,
                        trim: true,
                        remove: /[*+~.()'"!:@?]/g, // Remove special characters
                    });
                }
                return data;
            },
        ],
    },
};
