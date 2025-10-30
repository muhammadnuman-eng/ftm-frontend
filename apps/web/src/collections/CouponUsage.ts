import type { CollectionConfig } from "payload";

export const CouponUsage: CollectionConfig = {
    slug: "coupon-usage",
    admin: {
        useAsTitle: "id",
        defaultColumns: [
            "coupon",
            "user",
            "program",
            "accountSize",
            "discountAmount",
            "usedAt",
        ],
        group: "Commerce",
        description: "Track all coupon redemptions and usage analytics",
    },
    access: {
        read: ({ req: { user } }) => {
            if (user?.role && ["admin", "editor"].includes(user.role)) {
                return true;
            }
            return false;
        },
        // Allow programmatic creation (webhooks/server actions)
        create: () => true,
        update: () => false,
        delete: ({ req: { user } }) => {
            return Boolean(user?.role === "admin");
        },
    },
    fields: [
        {
            name: "coupon",
            type: "relationship",
            relationTo: "coupons",
            required: true,
            label: "Coupon",
            admin: {
                description: "The coupon that was used",
            },
        },
        // Removed user relationship; tracking via customerEmail instead
        {
            name: "customerEmail",
            type: "email",
            label: "Customer Email",
            admin: {
                description: "Email of the customer if no user record exists",
            },
        },
        {
            name: "program",
            type: "relationship",
            relationTo: "programs",
            required: true,
            label: "Program",
            admin: {
                description: "The program the coupon was applied to",
            },
        },
        {
            name: "accountSize",
            type: "text",
            required: true,
            label: "Account Size",
            admin: {
                description: "The account size tier (e.g., '$10K', '$25K')",
            },
        },
        {
            name: "originalPrice",
            type: "number",
            required: true,
            label: "Original Price",
            admin: {
                description: "The original price before discount",
            },
        },
        {
            name: "discountAmount",
            type: "number",
            required: true,
            label: "Discount Amount",
            admin: {
                description: "The amount of discount applied",
            },
        },
        {
            name: "finalPrice",
            type: "number",
            required: true,
            label: "Final Price",
            admin: {
                description: "The final price after discount",
            },
        },
        {
            name: "discountType",
            type: "select",
            required: true,
            options: [
                { label: "Percentage", value: "percentage" },
                { label: "Fixed Amount", value: "fixed" },
            ],
            label: "Discount Type",
            admin: {
                description: "Type of discount that was applied",
            },
        },
        {
            name: "discountValue",
            type: "number",
            required: true,
            label: "Discount Value",
            admin: {
                description:
                    "The discount value that was used (percentage or fixed amount)",
            },
        },
        {
            name: "usedAt",
            type: "date",
            required: true,
            label: "Used At",
            admin: {
                description: "When the coupon was used",
                date: {
                    pickerAppearance: "dayAndTime",
                },
            },
        },
        {
            name: "orderReference",
            type: "text",
            label: "Order Reference",
            admin: {
                description: "Reference to the order/payment ID",
            },
        },
        {
            name: "paymentMethod",
            type: "select",
            options: [
                { label: "Credit Card", value: "credit_card" },
                { label: "PayPal", value: "paypal" },
                { label: "Bank Transfer", value: "bank_transfer" },
                { label: "Cryptocurrency", value: "crypto" },
            ],
            label: "Payment Method",
            admin: {
                description: "Payment method used for this purchase",
            },
        },
        {
            name: "currency",
            type: "select",
            options: [
                { label: "USD", value: "USD" },
                { label: "EUR", value: "EUR" },
                { label: "GBP", value: "GBP" },
            ],
            defaultValue: "USD",
            required: true,
            label: "Currency",
            admin: {
                description: "Currency used for the transaction",
            },
        },
        {
            name: "userAgent",
            type: "text",
            label: "User Agent",
            admin: {
                description: "Browser/device information",
                readOnly: true,
            },
        },
        {
            name: "ipAddress",
            type: "text",
            label: "IP Address",
            admin: {
                description: "User's IP address when coupon was used",
                readOnly: true,
            },
        },
        {
            name: "metadata",
            type: "json",
            label: "Additional Metadata",
            admin: {
                description: "Additional data related to the coupon usage",
            },
        },
    ],
    hooks: {
        beforeChange: [
            ({ data, operation }) => {
                // Set usedAt timestamp for new records
                if (operation === "create" && !data.usedAt) {
                    data.usedAt = new Date().toISOString();
                }
                return data;
            },
        ],
    },
    timestamps: true,
};
