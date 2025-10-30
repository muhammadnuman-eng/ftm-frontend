import type { CollectionConfig } from "payload";

export const Payouts: CollectionConfig = {
    slug: "payouts",
    admin: {
        group: "Site Content",
        useAsTitle: "name",
        defaultColumns: [
            "id",
            "name",
            "email",
            "country",
            "amount",
            "processingTime",
            "approvedDate",
            "updatedAt",
        ],
    },
    access: {
        read: () => true,
        create: ({ req }) =>
            !!req.user && ["admin", "editor"].includes(req.user.role),
        update: ({ req }) =>
            !!req.user && ["admin", "editor"].includes(req.user.role),
        delete: ({ req }) => !!req.user && ["admin"].includes(req.user.role),
    },
    fields: [
        {
            name: "name",
            type: "text",
            required: true,
            label: "Name",
        },
        {
            name: "email",
            type: "email",
            required: false,
            label: "Email",
        },
        {
            name: "country",
            type: "text",
            required: true,
            label: "Country",
        },
        {
            name: "amount",
            type: "number",
            required: true,
            label: "Amount (USD)",
        },
        {
            name: "processingTime",
            type: "text",
            label: "Processing Time",
            admin: {
                description: "e.g., '6 hours', '24 hours'",
            },
        },
        {
            name: "approvedDate",
            type: "date",
            label: "Approved Date",
            admin: {
                date: {
                    pickerAppearance: "dayAndTime",
                },
            },
        },
        {
            name: "transactionLink",
            type: "text",
            label: "Transaction Link",
            admin: {
                description:
                    "External link to the transaction or block explorer",
            },
        },
    ],
    timestamps: true,
};
