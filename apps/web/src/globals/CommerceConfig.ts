import type { GlobalConfig } from "payload";

export const CommerceConfig: GlobalConfig = {
    slug: "commerce-config",
    admin: {
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
                    label: "Restrictions",
                    fields: [
                        {
                            name: "excludedCountries",
                            type: "array",
                            localized: true,
                            admin: {
                                description:
                                    "Countries excluded from purchasing (ISO 3166-1 alpha-2 codes, e.g., 'us', 'tr').",
                            },
                            labels: {
                                singular: "Country Code",
                                plural: "Excluded Countries",
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
                        {
                            name: "bannedCountries",
                            type: "array",
                            localized: true,
                            admin: {
                                description:
                                    "Countries banned from usage entirely (ISO 3166-1 alpha-2 codes, e.g., 'ir', 'kp').",
                            },
                            labels: {
                                singular: "Country Code",
                                plural: "Banned Countries",
                            },
                            fields: [
                                {
                                    name: "code",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description:
                                            "2-letter lowercase country code (e.g., 'ir', 'kp').",
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
                {
                    label: "Payment Methods",
                    fields: [
                        {
                            name: "isPaytikoEnabled",
                            type: "checkbox",
                            defaultValue: false,
                            admin: {
                                description: "Enable Paytiko payment method",
                            },
                        },
                        {
                            name: "isConfirmoEnabled",
                            type: "checkbox",
                            defaultValue: false,
                            admin: {
                                description: "Enable Confirmo payment method",
                            },
                        },
                        {
                            name: "isBridgerEnabled",
                            type: "checkbox",
                            defaultValue: false,
                            admin: {
                                description: "Enable Bridger payment method",
                            },
                        },
                        {
                            name: "defaultPaymentMethod",
                            type: "select",
                            defaultValue: "confirmo",
                            options: [
                                {
                                    label: "Confirmo",
                                    value: "confirmo",
                                },
                                {
                                    label: "Paytiko",
                                    value: "paytiko",
                                },
                                {
                                    label: "Bridger",
                                    value: "bridger",
                                },
                            ],
                            admin: {
                                description: "Default payment method",
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
