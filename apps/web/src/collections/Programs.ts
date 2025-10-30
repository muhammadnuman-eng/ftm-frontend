import type { CollectionConfig } from "payload";
import { COUNTRIES } from "@/lib/utils";

export const Programs: CollectionConfig = {
    slug: "programs",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "category", "isActive", "isPopular"],
        group: "Commerce",
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "Basic Info",
                    fields: [
                        {
                            type: "row",
                            fields: [
                                {
                                    name: "name",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Program Name",
                                },
                                {
                                    name: "mobileName",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Program Name for mobile viewports",
                                },
                            ],
                        },
                        {
                            name: "slug",
                            type: "text",
                            localized: false,
                            required: true,
                            unique: true,
                            label: "URL Slug",
                        },
                        {
                            name: "category",
                            type: "select",
                            required: true,
                            options: [
                                { label: "1-Step", value: "1-step" },
                                { label: "2-Step", value: "2-step" },
                                { label: "Instant", value: "instant" },
                            ],
                        },
                        {
                            name: "description",
                            type: "textarea",
                            localized: true,
                            required: true,
                            label: "Short Description",
                        },
                        {
                            name: "subtitle",
                            type: "text",
                            localized: true,
                            label: "Title for pricing table",
                        },
                        {
                            name: "isActive",
                            type: "checkbox",
                            defaultValue: true,
                            label: "Active",
                        },
                        {
                            name: "isPopular",
                            type: "checkbox",
                            defaultValue: false,
                            label: "Popular",
                        },
                        {
                            name: "isNewProgram",
                            type: "checkbox",
                            defaultValue: false,
                            label: "New",
                        },
                        {
                            name: "order",
                            type: "number",
                            defaultValue: 0,
                            label: "Display Order",
                        },
                    ],
                },
                {
                    label: "Pricing",
                    fields: [
                        {
                            type: "row",
                            fields: [
                                {
                                    name: "hasResetFee",
                                    type: "checkbox",
                                    defaultValue: false,
                                    label: "Has Reset Fee",
                                },
                                {
                                    name: "hasActivationFeeValue",
                                    type: "checkbox",
                                    defaultValue: false,
                                    label: "Has Activation Fee",
                                },
                                {
                                    name: "activationFeeValue",
                                    type: "number",
                                    label: "Activation Fee",
                                },
                            ],
                        },
                        {
                            name: "pricingTiers",
                            type: "array",
                            label: "Pricing Tiers",
                            fields: [
                                {
                                    name: "accountSize",
                                    type: "text",
                                    required: true,
                                    label: "Account Size",
                                },
                                {
                                    name: "price",
                                    type: "number",
                                    required: true,
                                    label: "Original Price",
                                },
                                {
                                    name: "resetFee",
                                    type: "number",
                                    required: false,
                                    label: "Reset Fee",
                                },
                                {
                                    name: "resetFeeFunded",
                                    type: "number",
                                    required: false,
                                    label: "Funded Reset Fee",
                                },
                                {
                                    name: "isPopular",
                                    type: "checkbox",
                                    defaultValue: false,
                                    label: "Popular Tier",
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Features",
                    fields: [
                        {
                            name: "benefits",
                            type: "array",
                            localized: true,
                            label: "Program Benefits",
                            fields: [
                                {
                                    name: "benefit",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Benefit",
                                },
                            ],
                        },
                        {
                            name: "features",
                            type: "array",
                            localized: true,
                            label: "Program Features Section",
                            fields: [
                                {
                                    name: "label",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Label",
                                },
                                {
                                    name: "value",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Value",
                                },
                            ],
                        },
                        {
                            name: "consistencySection",
                            type: "array",
                            localized: true,
                            label: "Consistency Score Section",
                            fields: [
                                {
                                    name: "label",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Label",
                                },
                                {
                                    name: "value",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    label: "Value",
                                },
                                {
                                    name: "badge",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    label: "Badge",
                                },
                            ],
                        },
                        {
                            name: "faqLink",
                            type: "text",
                            localized: true,
                            label: "FAQ Link",
                            admin: {
                                description: "Link to the FAQ page",
                            },
                        },
                    ],
                },
                {
                    label: "Comparison Data",
                    fields: [
                        {
                            name: "profitTarget",
                            type: "group",
                            localized: true,
                            label: "Profit Target",
                            fields: [
                                {
                                    name: "percent",
                                    type: "number",
                                    label: "Percentage",
                                    admin: {
                                        description:
                                            "Profit target percentage (e.g., 10 for 10%)",
                                    },
                                },
                                {
                                    name: "label",
                                    type: "text",
                                    localized: true,
                                    label: "Display Label",
                                    admin: {
                                        description:
                                            "How to display in comparison table (e.g., '10%')",
                                    },
                                },
                            ],
                        },
                        {
                            name: "secondProfitTarget",
                            type: "group",
                            localized: true,
                            label: "2nd Profit Target",
                            admin: {
                                description:
                                    "Second profit target (mainly for 2-Step programs)",
                            },
                            fields: [
                                {
                                    name: "percent",
                                    type: "number",
                                    label: "Percentage",
                                    admin: {
                                        description:
                                            "Second profit target percentage (e.g., 5 for 5%)",
                                    },
                                },
                                {
                                    name: "label",
                                    type: "text",
                                    localized: true,
                                    label: "Display Label",
                                    admin: {
                                        description:
                                            "How to display in comparison table (e.g., '5%')",
                                    },
                                },
                            ],
                        },
                        {
                            name: "dailyDrawdown",
                            type: "group",
                            localized: true,
                            label: "Daily Drawdown",
                            fields: [
                                {
                                    name: "percent",
                                    type: "number",
                                    label: "Percentage",
                                    admin: {
                                        description:
                                            "Daily drawdown percentage (e.g., 4 for 4%)",
                                    },
                                },
                                {
                                    name: "type",
                                    type: "select",
                                    options: [
                                        {
                                            label: "Balance Based",
                                            value: "Balance Based",
                                        },
                                        {
                                            label: "Trailing",
                                            value: "Trailing",
                                        },
                                        {
                                            label: "Trailing Lock",
                                            value: "Trailing Lock",
                                        },
                                        { label: "None", value: "None" },
                                    ],
                                    defaultValue: "Balance Based",
                                    label: "Type",
                                },
                                {
                                    name: "label",
                                    type: "text",
                                    localized: true,
                                    label: "Display Label",
                                    admin: {
                                        description:
                                            "How to display in comparison table (e.g., '4%')",
                                    },
                                },
                            ],
                        },
                        {
                            name: "overallDrawdown",
                            type: "group",
                            localized: true,
                            label: "Overall Drawdown",
                            fields: [
                                {
                                    name: "percent",
                                    type: "number",
                                    label: "Percentage",
                                    admin: {
                                        description:
                                            "Overall drawdown percentage (e.g., 6 for 6%)",
                                    },
                                },
                                {
                                    name: "type",
                                    type: "select",
                                    options: [
                                        {
                                            label: "Balance Based",
                                            value: "Balance Based",
                                        },
                                        {
                                            label: "Trailing",
                                            value: "Trailing",
                                        },
                                        {
                                            label: "Trailing Lock",
                                            value: "Trailing Lock",
                                        },
                                        { label: "None", value: "None" },
                                    ],
                                    defaultValue: "Balance Based",
                                    label: "Type",
                                },
                                {
                                    name: "label",
                                    type: "text",
                                    localized: true,
                                    label: "Display Label",
                                    admin: {
                                        description:
                                            "How to display in comparison table (e.g., '6%')",
                                    },
                                },
                            ],
                        },
                        {
                            name: "consistencyScore",
                            type: "group",
                            localized: true,
                            label: "Consistency Score",
                            fields: [
                                {
                                    name: "evaluation",
                                    type: "text",
                                    localized: true,
                                    label: "Evaluation Phase",
                                    admin: {
                                        description:
                                            "Consistency score during evaluation (e.g., '50%')",
                                    },
                                },
                                {
                                    name: "simFunded",
                                    type: "text",
                                    localized: true,
                                    label: "Simulated Funded",
                                    admin: {
                                        description:
                                            "Consistency score during simulated funded (e.g., '45%')",
                                    },
                                },
                            ],
                        },
                        {
                            name: "minTradingDays",
                            type: "group",
                            localized: true,
                            label: "Minimum Trading Days",
                            fields: [
                                {
                                    name: "evaluation",
                                    type: "text",
                                    localized: true,
                                    label: "Evaluation Phase",
                                    admin: {
                                        description:
                                            "Minimum trading days during evaluation (e.g., 'None', '5')",
                                    },
                                },
                                {
                                    name: "simFunded",
                                    type: "text",
                                    localized: true,
                                    label: "Simulated Funded",
                                    admin: {
                                        description:
                                            "Minimum trading days during simulated funded (e.g., '5')",
                                    },
                                },
                            ],
                        },
                        {
                            name: "profitSplit",
                            type: "text",
                            label: "Profit Split",
                            admin: {
                                description: "Profit split percentage",
                            },
                        },
                        {
                            name: "activationFee",
                            type: "number",
                            label: "Activation Fee",
                            admin: {
                                description:
                                    "One-time activation fee (if applicable)",
                            },
                        },
                    ],
                },
                {
                    label: "Restrictions",
                    fields: [
                        {
                            name: "countryRestrictions",
                            type: "group",
                            localized: true,
                            label: "Country Restrictions",
                            fields: [
                                {
                                    name: "hasRestrictions",
                                    type: "checkbox",
                                    defaultValue: false,
                                    label: "Has Country Restrictions",
                                    admin: {
                                        description:
                                            "Enable this to restrict this program from certain countries",
                                    },
                                },
                                {
                                    name: "restrictedCountries",
                                    type: "select",
                                    label: "Restricted Countries",
                                    hasMany: true,
                                    admin: {
                                        condition: (_, siblingData) =>
                                            siblingData?.hasRestrictions ===
                                            true,
                                        description:
                                            "Select countries where this program should NOT be available",
                                        isClearable: true,
                                    },
                                    options: COUNTRIES.map((country) => ({
                                        label: `${country.flagEmoji} ${country.name}`,
                                        value: country.code,
                                    })).sort((a, b) =>
                                        a.label.localeCompare(b.label),
                                    ),
                                },
                                {
                                    name: "restrictionType",
                                    type: "select",
                                    label: "Restriction Type",
                                    defaultValue: "blacklist",
                                    options: [
                                        {
                                            label: "Blacklist (Restrict selected countries)",
                                            value: "blacklist",
                                        },
                                        {
                                            label: "Whitelist (Allow only selected countries)",
                                            value: "whitelist",
                                        },
                                    ],
                                    admin: {
                                        condition: (_, siblingData) =>
                                            siblingData?.hasRestrictions ===
                                            true,
                                        description:
                                            "Choose whether to block selected countries or only allow selected countries",
                                    },
                                },
                                {
                                    name: "restrictionMessage",
                                    type: "textarea",
                                    localized: true,
                                    label: "Restriction Message",
                                    admin: {
                                        condition: (_, siblingData) =>
                                            siblingData?.hasRestrictions ===
                                            true,
                                        description:
                                            "Optional message to display when program is restricted (e.g., 'This program is not available in your country due to regulatory requirements')",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
