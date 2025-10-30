import type { CollectionConfig } from "payload";

export const Testimonials: CollectionConfig = {
    slug: "testimonials",
    admin: {
        group: "Content",
        useAsTitle: "author",
        defaultColumns: ["author", "text", "column", "updatedAt"],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: "text",
            type: "textarea",
            localized: true,
            required: true,
            admin: {
                description: "Testimonial text content",
                rows: 4,
            },
        },
        {
            name: "author",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description: "Author's name",
            },
        },
        {
            name: "avatar",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description: "Author's initials for avatar (e.g., 'UB', 'AK')",
            },
        },
        {
            name: "column",
            type: "select",
            required: true,
            options: [
                {
                    label: "Column 1 (Moves Up)",
                    value: "column1",
                },
                {
                    label: "Column 2 (Moves Down)",
                    value: "column2",
                },
                {
                    label: "Column 3 (Moves Up)",
                    value: "column3",
                },
            ],
            admin: {
                description:
                    "Which column this testimonial should appear in for desktop layout",
            },
        },
        {
            name: "isActive",
            type: "checkbox",
            defaultValue: true,
            admin: {
                description:
                    "Whether this testimonial should be displayed on the website",
            },
        },
        {
            name: "order",
            type: "number",
            admin: {
                description:
                    "Display order within the column (lower numbers appear first)",
            },
        },
    ],
};
