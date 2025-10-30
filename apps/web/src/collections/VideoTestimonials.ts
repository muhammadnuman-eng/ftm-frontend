import type { CollectionConfig } from "payload";

export const VideoTestimonials: CollectionConfig = {
    slug: "video-testimonials",
    admin: {
        group: "Content",
        useAsTitle: "name",
        defaultColumns: ["name", "country", "price", "updatedAt"],
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
                description: "Trader's name",
            },
        },
        {
            name: "country",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description: "Country code (e.g., 'mx', 'ca', 'in')",
            },
        },
        {
            name: "price",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description: "Payout amount (e.g., '$35,393')",
            },
        },
        {
            name: "videoUrl",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description: "YouTube video URL",
            },
        },
        {
            name: "thumbnail",
            type: "text",
            localized: true,
            required: true,
            admin: {
                description: "Custom thumbnail image URL",
            },
        },
        {
            name: "review",
            type: "textarea",
            localized: true,
            required: true,
            admin: {
                description: "Testimonial text/review",
                rows: 3,
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
                description: "Display order (lower numbers appear first)",
            },
        },
    ],
};
