import type { CollectionConfig } from "payload";

export const Tags: CollectionConfig = {
    slug: "tags",
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
            name: "slug",
            type: "text",
            localized: true,
            required: true,
            unique: true,
            admin: {
                description: "URL-friendly version of the tag name",
            },
        },
    ],
};
