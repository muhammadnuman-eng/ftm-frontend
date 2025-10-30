import type { CollectionConfig } from "payload";

export const Platforms: CollectionConfig = {
    slug: "platforms",
    admin: {
        group: "Commerce",
        useAsTitle: "name",
        defaultColumns: ["name", "slug", "sortOrder", "updatedAt"],
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
                            localized: true,
                            required: true,
                            admin: {
                                description:
                                    "Human-friendly platform name (e.g., 'MetaTrader 5').",
                            },
                        },
                        {
                            name: "slug",
                            type: "text",
                            localized: true,
                            required: true,
                            unique: true,
                            admin: {
                                description:
                                    "Stable platform identifier and URL slug (e.g., 'metatrader-5', 'ctrader').",
                            },
                        },
                        {
                            name: "logo",
                            type: "upload",
                            relationTo: "media",
                            required: false,
                            admin: {
                                description:
                                    "Optional platform logo (upload to Media).",
                            },
                        },
                        {
                            name: "description",
                            type: "textarea",
                            localized: true,
                            required: false,
                            admin: {
                                description:
                                    "Short description of the platform.",
                                rows: 3,
                            },
                        },
                        {
                            name: "sortOrder",
                            type: "number",
                            defaultValue: 0,
                            admin: {
                                description: "Sort order of the platform.",
                            },
                        },
                    ],
                },
                {
                    label: "Restrictions",
                    fields: [
                        {
                            name: "restrictedCountries",
                            type: "array",
                            localized: true,
                            admin: {
                                description:
                                    "Countries where this platform is restricted (ISO 3166-1 alpha-2 codes, e.g., 'us', 'tr').",
                            },
                            labels: {
                                singular: "Country Code",
                                plural: "Restricted Countries",
                            },
                            fields: [
                                {
                                    name: "code",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description:
                                            "2-letter lowercase country code (e.g., 'us', 'tr').",
                                    },
                                    validate: (value: unknown) => {
                                        if (typeof value !== "string")
                                            return "Required";
                                        const v = value.trim();
                                        if (!/^[a-z]{2}$/.test(v)) {
                                            return "Use 2-letter lowercase code (ISO alpha-2).";
                                        }
                                        return true;
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
