import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
    slug: "users",
    auth: true,
    admin: {
        useAsTitle: "email",
        group: "Management",
    },
    access: {
        read: () => true,
        // Admin panel'e sadece admin, editor ve author rollerinin erişmesini sağla
        admin: ({ req: { user } }) => {
            return Boolean(
                user?.role && ["admin", "editor", "author"].includes(user.role),
            );
        },
    },
    fields: [
        {
            name: "firstName",
            type: "text",
            required: true,
            label: "First Name",
        },
        {
            name: "lastName",
            type: "text",
            required: true,
            label: "Last Name",
        },
        {
            name: "name",
            type: "text",
            label: "Full Name",
            admin: {
                readOnly: true,
                description: "Auto-generated from first and last name",
            },
            hooks: {
                beforeChange: [
                    ({ data }) => {
                        return `${data?.firstName || ""} ${data?.lastName || ""}`.trim();
                    },
                ],
            },
        },
        {
            name: "role",
            type: "select",
            options: [
                { label: "Admin", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Author", value: "author" },
            ],
            defaultValue: "author",
            required: true,
        },
        {
            name: "isActive",
            type: "checkbox",
            defaultValue: true,
            label: "Active User",
        },
    ],
};
