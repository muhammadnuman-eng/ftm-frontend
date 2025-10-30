import type { CollectionConfig } from "payload";

export const Authors: CollectionConfig = {
    slug: "authors",
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
            name: "bio",
            type: "textarea",
            localized: true,
        },
        {
            name: "avatar",
            type: "upload",
            relationTo: "media",
        },
        {
            name: "email",
            type: "email",
        },
        {
            name: "website",
            type: "text",
            localized: true,
        },
        {
            name: "social",
            type: "group",
            localized: true,
            fields: [
                {
                    name: "twitter",
                    type: "text",
                    localized: true,
                    admin: {
                        description: "Twitter/X profile URL",
                    },
                },
                {
                    name: "linkedin",
                    type: "text",
                    localized: true,
                    admin: {
                        description: "LinkedIn profile URL",
                    },
                },
                {
                    name: "github",
                    type: "text",
                    localized: true,
                    admin: {
                        description: "GitHub profile URL",
                    },
                },
            ],
        },
    ],
};
