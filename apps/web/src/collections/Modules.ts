import type { CollectionConfig } from "payload";

export const Modules: CollectionConfig = {
    slug: "modules",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "course", "order"],
        group: "Academy",
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: "title",
            type: "text",
            localized: true,
            required: true,
            label: "Module Title",
        },
        {
            name: "titlePrefix",
            type: "text",
            localized: true,
            label: "Title Prefix",
            admin: {
                description: "Optional prefix (e.g., 'Module 1:', 'Week 1:')",
            },
        },
        {
            name: "course",
            type: "relationship",
            relationTo: "courses",
            required: true,
            label: "Course",
            admin: {
                description: "The course this module belongs to",
            },
        },
        {
            name: "order",
            type: "number",
            defaultValue: 0,
            label: "Sort Order",
            admin: {
                description:
                    "Order in which this module appears within its course",
            },
        },
    ],
};

