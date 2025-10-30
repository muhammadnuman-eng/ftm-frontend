import type { CollectionConfig } from "payload";
import slugify from "slugify";

export const Categories: CollectionConfig = {
    slug: "categories",
    admin: {
        useAsTitle: "name",
        group: "Blog",
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
        },
        {
            name: "description",
            type: "textarea",
            localized: true,
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
