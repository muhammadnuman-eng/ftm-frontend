import type { CollectionConfig } from "payload";

export const NewsletterSubscriptions: CollectionConfig = {
    slug: "newsletter-subscriptions",
    admin: {
        useAsTitle: "email",
        defaultColumns: ["email", "status", "createdAt"],
    },
    access: {
        create: () => true, // Allow public subscription
        read: ({ req: { user } }: { req: { user?: unknown } }) => {
            // Only authenticated users can read
            return Boolean(user);
        },
        update: ({ req: { user } }: { req: { user?: unknown } }) => {
            // Only authenticated users can update
            return Boolean(user);
        },
        delete: ({ req: { user } }: { req: { user?: unknown } }) => {
            // Only authenticated users can delete
            return Boolean(user);
        },
    },
    fields: [
        {
            name: "email",
            type: "email",
            required: true,
            unique: true,
            validate: (val: string | null | undefined) => {
                if (!val) {
                    return "Email is required";
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(val)) {
                    return "Please enter a valid email address";
                }
                return true;
            },
        },
        {
            name: "status",
            type: "select",
            required: true,
            defaultValue: "subscribed",
            options: [
                {
                    label: "Subscribed",
                    value: "subscribed",
                },
                {
                    label: "Unsubscribed",
                    value: "unsubscribed",
                },
            ],
        },
        {
            name: "source",
            type: "text",
            defaultValue: "footer",
            admin: {
                description: "Where the subscription originated from",
            },
        },
        {
            name: "ipAddress",
            type: "text",
            admin: {
                description: "IP address of the subscriber",
            },
        },
        {
            name: "userAgent",
            type: "text",
            admin: {
                description: "User agent of the subscriber",
            },
        },
    ],
    timestamps: true,
};
