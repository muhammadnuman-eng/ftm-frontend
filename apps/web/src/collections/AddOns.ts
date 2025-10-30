import type { CollectionConfig } from "payload";

export const AddOns: CollectionConfig = {
    slug: "add-ons",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "key", "status"],
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
                    label: "General",
                    fields: [
                        {
                            name: "name",
                            type: "text",
                            required: true,
                            label: "Add-on Name",
                        },
                        {
                            name: "key",
                            type: "text",
                            required: true,
                            unique: true,
                            label: "Key",
                            admin: {
                                description:
                                    "Unique identifier used in API payloads (e.g., 'higher-profit-split').",
                            },
                        },
                        {
                            name: "description",
                            type: "textarea",
                            label: "Description",
                            admin: {
                                description:
                                    "Optional description shown in checkout.",
                            },
                        },
                        {
                            name: "status",
                            type: "select",
                            defaultValue: "active",
                            options: [
                                { label: "Active", value: "active" },
                                { label: "Inactive", value: "inactive" },
                            ],
                            label: "Status",
                        },
                    ],
                },
                {
                    label: "Pricing",
                    fields: [
                        {
                            name: "priceIncreasePercentage",
                            type: "number",
                            label: "Price Increase (%)",
                            required: true,
                            defaultValue: 0,
                            admin: {
                                description:
                                    "Percentage added to the program price when this add-on is selected (e.g., 15).",
                            },
                        },
                    ],
                },
                {
                    label: "Availability",
                    fields: [
                        {
                            name: "applicablePrograms",
                            type: "relationship",
                            relationTo: "programs",
                            hasMany: true,
                            label: "Applicable Programs",
                            admin: {
                                description:
                                    "Only the selected programs will be able to attach this add-on during checkout.",
                            },
                        },
                        {
                            name: "order",
                            type: "number",
                            defaultValue: 0,
                            label: "Display Order",
                            admin: {
                                description:
                                    "Lower numbers appear first when listed in checkout.",
                            },
                        },
                    ],
                },
            ],
        },
    ],
    timestamps: true,
};
