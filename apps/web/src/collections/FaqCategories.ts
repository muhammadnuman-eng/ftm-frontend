import type { CollectionConfig } from "payload";
import slugify from "slugify";

export const FaqCategories: CollectionConfig = {
    slug: "faq-categories",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "description", "displayOrder"],
        group: "FAQ",
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: "name",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description: "Name of the FAQ category",
            },
        },
        {
            name: "description",
            type: "textarea",
            localized: true,
            admin: {
                description: "Brief description of what this category covers",
            },
        },
        {
            name: "slug",
            type: "text",
            localized: true,
            required: true,
            unique: true,
            admin: {
                description: "URL-friendly version of the category name",
            },
        },
        {
            name: "displayOrder",
            type: "number",
            defaultValue: 0,
            admin: {
                description:
                    "Order in which this category should appear (lower numbers first)",
            },
        },
        {
            name: "isActive",
            type: "checkbox",
            defaultValue: true,
            admin: {
                description: "Whether this category is active and visible",
            },
        },
    ],
    hooks: {
        beforeChange: [
            ({ data }) => {
                // Auto-generate slug if not provided
                if (!data.slug && data.name) {
                    data.slug = slugify(data.name, {
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
