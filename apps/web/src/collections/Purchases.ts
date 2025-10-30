import { Decimal } from "decimal.js";
import type { CollectionConfig } from "payload";
import { generateIncrementalOrderNumber } from "../utils/orderNumber";

const PURCHASE_TYPE_OPTIONS = [
    { label: "Original Order", value: "original-order" },
    { label: "Reset Order", value: "reset-order" },
    { label: "Activation Order", value: "activation-order" },
];

const REGION_OPTIONS = [
    { label: "Africa", value: "africa" },
    { label: "Asia", value: "asia" },
    { label: "Europe", value: "europe" },
    { label: "Latin America", value: "latin-america" },
    { label: "Middle East", value: "middle-east" },
    { label: "North America", value: "north-america" },
    { label: "Oceania", value: "oceania" },
    { label: "South Asia", value: "south-asia" },
    { label: "Other", value: "other" },
];

const PROGRAM_TYPE_OPTIONS = [
    { label: "1 Step Evaluation", value: "1-step" },
    { label: "2 Step Evaluation", value: "2-step" },
    { label: "Instant", value: "instant" },
];

// Order number generation moved to utils/orderNumber.ts

export const Purchases: CollectionConfig = {
    slug: "purchases",
    admin: {
        useAsTitle: "id",
        group: "Orders",
        defaultColumns: [
            "orderNumber",
            "customerName",
            "programName",
            "purchaseType",
            "totalPrice",
            "status",
            "createdAt",
        ],
        description:
            "Purchases are created automatically through the application. Manual creation is disabled.",
        components: {
            views: {
                edit: {
                    default: {
                        Component:
                            "/src/admin/components/PurchaseDetailView#default",
                    },
                },
            },
        },
    },
    access: {
        read: ({ req: { user } }) => {
            if (
                user?.role &&
                ["admin", "editor", "author"].includes(user.role)
            ) {
                return true;
            }
            return false;
        },
        create: ({ req }) => {
            if (!req.user) {
                return true;
            }
            return ["admin", "editor"].includes(req.user.role);
        },
        update: ({ req }) => {
            if (!req.user) {
                return true;
            }
            return ["admin", "editor"].includes(req.user.role);
        },
        delete: () => false,
    },
    hooks: {
        beforeValidate: [
            async ({ data }) => {
                if (!data) {
                    return data;
                }

                // Auto-generate order number if not provided
                if (!data.orderNumber) {
                    data.orderNumber = await generateIncrementalOrderNumber();
                }

                // Ensure orderNumber is a valid number
                if (data.orderNumber && typeof data.orderNumber !== "number") {
                    data.orderNumber = Number(data.orderNumber);
                }

                // Set hasAddOn based on selectedAddOns
                if (typeof data.hasAddOn !== "boolean") {
                    data.hasAddOn =
                        Array.isArray(data.selectedAddOns) &&
                        data.selectedAddOns.length > 0;
                }

                // Set the first add-on as the main addOn relationship
                if (
                    data.hasAddOn &&
                    Array.isArray(data.selectedAddOns) &&
                    data.selectedAddOns.length > 0
                ) {
                    const firstAddOn = data.selectedAddOns[0];
                    if (firstAddOn?.addOn && !data.addOn) {
                        data.addOn = firstAddOn.addOn;
                    }
                }

                // Calculate totalPrice if not provided
                if (
                    typeof data.totalPrice !== "number" &&
                    typeof data.price === "number"
                ) {
                    data.totalPrice = data.price;
                }

                // Calculate purchasePrice if not provided
                if (
                    typeof data.purchasePrice !== "number" &&
                    typeof data.totalPrice === "number"
                ) {
                    const addOnContribution =
                        typeof data.addOnValue === "number"
                            ? data.addOnValue
                            : 0;
                    data.purchasePrice = new Decimal(data.totalPrice)
                        .minus(addOnContribution)
                        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                        .toNumber();
                }

                return data;
            },
        ],
    },
    fields: [
        {
            name: "purchaseType",
            type: "select",
            label: "Purchase Type",
            options: PURCHASE_TYPE_OPTIONS,
            defaultValue: "original-order",
        },
        {
            name: "orderNumber",
            type: "number",
            label: "Order Number",
            required: true,
            unique: true,
            admin: {
                readOnly: true,
                description:
                    "Auto-generated incremental order number starting from 100000",
            },
        },
        {
            name: "hasAddOn",
            type: "checkbox",
            label: "Add-On Included",
            defaultValue: false,
        },
        {
            name: "addOn",
            type: "relationship",
            relationTo: "add-ons",
            label: "Add-On Type",
            admin: {
                condition: (data) => Boolean(data?.hasAddOn),
            },
        },
        {
            name: "addOnValue",
            type: "number",
            label: "Add-On Value",
            admin: {
                description: "Calculated add-on price at checkout",
            },
        },
        {
            name: "purchasePrice",
            type: "number",
            label: "Purchase Price",
            admin: {
                description: "Price excluding add-ons",
                readOnly: true,
            },
        },
        {
            name: "totalPrice",
            type: "number",
            label: "Total Price",
            admin: {
                description: "Final price including add-ons",
                readOnly: true,
            },
        },
        {
            name: "discountCode",
            type: "text",
            label: "Discount Code",
            admin: {
                description: "Coupon or discount code applied at checkout",
            },
        },
        {
            name: "billingAddress",
            type: "group",
            label: "Billing Address",
            fields: [
                {
                    name: "address",
                    type: "text",
                    label: "Address",
                },
                {
                    name: "postalCode",
                    type: "text",
                    label: "Zip / Postal Code",
                },
                {
                    name: "city",
                    type: "text",
                    label: "City",
                },
                {
                    name: "state",
                    type: "text",
                    label: "State / Province",
                },
                {
                    name: "country",
                    type: "text",
                    label: "Country",
                },
            ],
        },
        {
            name: "programDetails",
            type: "text",
            label: "Program Details",
            admin: {
                description:
                    "Snapshot of the selection (e.g. $5K - Nitro - P1 - MetaTrader 5)",
            },
        },
        {
            name: "platform",
            type: "relationship",
            relationTo: "platforms",
            label: "Platform",
        },
        {
            name: "platformName",
            type: "text",
            label: "Platform Name",
            admin: {
                description:
                    "Human-readable platform name captured during checkout",
            },
        },
        {
            name: "platformSlug",
            type: "text",
            label: "Platform Identifier",
            admin: {
                description: "Internal platform identifier / slug",
            },
        },
        {
            name: "programName",
            type: "text",
            label: "Program Name",
        },
        {
            name: "programType",
            type: "select",
            options: PROGRAM_TYPE_OPTIONS,
            label: "Program Type",
        },
        {
            name: "region",
            type: "select",
            options: REGION_OPTIONS,
            label: "Region",
        },
        {
            name: "customerName",
            type: "text",
            label: "Customer Name",
            required: true,
            admin: {
                description: "Full name of the customer",
            },
        },
        {
            name: "customerEmail",
            type: "email",
            label: "Customer Email",
            required: true,
            admin: {
                description: "Email address of the customer",
            },
        },
        {
            name: "isInAppPurchase",
            type: "checkbox",
            label: "Is In-App Purchase",
            defaultValue: false,
        },
        {
            name: "program",
            type: "relationship",
            relationTo: "programs",
            required: true,
            label: "Program",
            admin: {
                description: "The program that was purchased",
            },
        },
        {
            name: "accountSize",
            type: "text",
            required: true,
            label: "Account Size",
            admin: {
                description:
                    "The account size tier purchased (e.g., '$10K', '$25K')",
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
        },
        {
            name: "status",
            type: "select",
            options: [
                { label: "Pending", value: "pending" },
                { label: "Completed", value: "completed" },
                { label: "Failed", value: "failed" },
                { label: "Refunded", value: "refunded" },
            ],
            defaultValue: "pending",
            required: true,
            label: "Payment Status",
        },
        {
            name: "paymentMethod",
            type: "text",
            label: "Payment Method",
        },
        {
            name: "transactionId",
            type: "text",
            label: "Transaction ID",
            admin: {
                description: "External payment processor transaction ID",
            },
        },
        {
            name: "notes",
            type: "textarea",
            label: "Notes",
            admin: {
                description: "Internal notes about this purchase",
            },
        },
        {
            name: "metadata",
            type: "json",
            label: "Metadata",
            admin: {
                description:
                    "Additional data from payment processor, AffiliateWP tracking",
            },
        },
        {
            name: "selectedAddOns",
            type: "array",
            label: "Selected Add-ons",
            admin: {
                description: "Add-ons chosen during checkout",
            },
            fields: [
                {
                    name: "addOn",
                    type: "relationship",
                    relationTo: "add-ons",
                    required: true,
                    label: "Add-on",
                },
                {
                    name: "priceIncreasePercentage",
                    type: "number",
                    label: "Price Increase (%)",
                },
                {
                    name: "metadata",
                    type: "json",
                    label: "Metadata",
                },
            ],
        },
        {
            name: "affiliateEmail",
            type: "email",
            label: "Affiliate Email",
            admin: {
                description: "Affiliate email",
            },
        },
        {
            name: "affiliateId",
            type: "text",
            label: "Affiliate ID",
            admin: {
                description: "Affiliate ID",
            },
        },
        {
            name: "affiliateUsername",
            type: "text",
            label: "Affiliate Username",
            admin: {
                description: "AffiliateWP username for affiliate tracking",
            },
        },
    ],
    timestamps: true,
};
