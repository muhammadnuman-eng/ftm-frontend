import type { CollectionConfig } from "payload";

export const ContactMessages: CollectionConfig = {
    slug: "contact-messages",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "email", "phone", "createdAt"],
    },
    access: {
        create: () => true, // Allow public submissions
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
            name: "name",
            type: "text",
            required: true,
            validate: (val: string | null | undefined) => {
                if (!val) {
                    return "Name is required";
                }
                if (val.length < 2) {
                    return "Name must be at least 2 characters long";
                }
                return true;
            },
        },
        {
            name: "phone",
            type: "text",
            required: false,
        },
        {
            name: "email",
            type: "email",
            required: true,
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
            name: "message",
            type: "textarea",
            required: true,
            validate: (val: string | null | undefined) => {
                if (!val) {
                    return "Message is required";
                }
                if (val.length < 10) {
                    return "Message must be at least 10 characters long";
                }
                return true;
            },
        },
        {
            name: "status",
            type: "select",
            required: true,
            defaultValue: "unread",
            options: [
                {
                    label: "Unread",
                    value: "unread",
                },
                {
                    label: "Read",
                    value: "read",
                },
                {
                    label: "Responded",
                    value: "responded",
                },
                {
                    label: "Archived",
                    value: "archived",
                },
            ],
            admin: {
                description: "Current status of the contact message",
            },
        },
        {
            name: "ipAddress",
            type: "text",
            admin: {
                description: "IP address of the sender",
            },
        },
        {
            name: "userAgent",
            type: "text",
            admin: {
                description: "User agent of the sender",
            },
        },
    ],
    timestamps: true,
};
