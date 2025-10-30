import type { CollectionConfig } from "payload";

export const PayoutRequests: CollectionConfig = {
    slug: "payout-requests",
    admin: {
        useAsTitle: "affiliateUsername",
        defaultColumns: [
            "affiliateUsername",
            "amount",
            "paymentMethod",
            "status",
            "createdAt",
        ],
    },
    access: {
        read: () => true,
        create: () => true,
        update: ({ req: { user } }) => {
            // Only admins can update payout requests
            return !!user;
        },
        delete: ({ req: { user } }) => {
            // Only admins can delete payout requests
            return !!user;
        },
    },
    fields: [
        {
            name: "affiliateId",
            type: "number",
            required: true,
            admin: {
                readOnly: true,
            },
        },
        {
            name: "affiliateUsername",
            type: "text",
            required: true,
            admin: {
                readOnly: true,
            },
        },
        {
            name: "affiliateEmail",
            type: "email",
            required: true,
            admin: {
                readOnly: true,
            },
        },
        {
            name: "amount",
            type: "number",
            required: true,
            admin: {
                readOnly: true,
                description: "Requested payout amount",
            },
        },
        {
            name: "paymentMethod",
            type: "select",
            required: true,
            defaultValue: "crypto_usdt_trc20",
            options: [
                {
                    label: "Crypto - USDT - TRC20",
                    value: "crypto_usdt_trc20",
                },
                {
                    label: "Crypto - USDT - ERC20",
                    value: "crypto_usdt_erc20",
                },
                {
                    label: "Rise",
                    value: "rise",
                },
            ],
            admin: {
                readOnly: true,
            },
        },
        {
            name: "paymentEmail",
            type: "email",
            admin: {
                readOnly: true,
                description: "Email for Rise payments",
            },
        },
        {
            name: "walletAddress",
            type: "text",
            admin: {
                readOnly: true,
                description: "Wallet address for crypto payments",
            },
        },
        {
            name: "notes",
            type: "textarea",
            admin: {
                readOnly: true,
                description: "Additional notes from the affiliate",
            },
        },
        {
            name: "status",
            type: "select",
            required: true,
            defaultValue: "pending",
            options: [
                {
                    label: "Pending",
                    value: "pending",
                },
                {
                    label: "Approved",
                    value: "approved",
                },
                {
                    label: "Paid",
                    value: "paid",
                },
                {
                    label: "Rejected",
                    value: "rejected",
                },
            ],
        },
        {
            name: "adminNotes",
            type: "textarea",
            admin: {
                description: "Internal notes for admins",
            },
        },
        {
            name: "processedAt",
            type: "date",
            admin: {
                description: "Date when the payout was processed",
            },
        },
    ],
    timestamps: true,
};
