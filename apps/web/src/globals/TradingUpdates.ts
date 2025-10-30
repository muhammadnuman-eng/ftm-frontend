import type { GlobalConfig } from "payload";

export const TradingUpdates: GlobalConfig = {
    slug: "trading-updates",
    dbName: "tu",
    access: {
        read: () => true,
        update: () => true,
    },
    admin: {
        group: "Trading Data",
        livePreview: {
            url: ({ locale }) => {
                const baseUrl =
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3001";
                const path = locale
                    ? `/${locale}/trading-updates`
                    : "/trading-updates";
                return `${baseUrl}${path}`;
            },
        },
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "Holidays/Market Hours",
                    fields: [
                        {
                            name: "holidayTitle",
                            type: "text",
                            localized: true,
                            required: true,
                            defaultValue: "Trading Schedule",
                            admin: {
                                description:
                                    "Main title for the holidays/market hours section",
                            },
                        },
                        {
                            name: "holidayDescription",
                            type: "textarea",
                            localized: true,
                            required: false,
                            admin: {
                                description:
                                    "Description text above the schedule table",
                                rows: 3,
                            },
                        },
                        {
                            name: "holidayFooter",
                            type: "textarea",
                            localized: true,
                            required: false,
                            admin: {
                                description:
                                    "Optional description below the table",
                                rows: 2,
                            },
                        },
                        {
                            name: "scheduleMatrix",
                            type: "json",
                            admin: {
                                description: "Schedule matrix configuration",
                                components: {
                                    Field: "/src/components/ScheduleMatrixField#default",
                                },
                            },
                        },
                    ],
                },
                {
                    label: "Platform Updates",
                    fields: [
                        {
                            name: "platformTitle",
                            type: "text",
                            localized: true,
                            required: true,
                            defaultValue: "Platform Updates",
                            admin: {
                                description:
                                    "Title for the platform updates section",
                            },
                        },
                        {
                            name: "platformContent",
                            type: "richText",
                            localized: true,
                            required: false,
                            admin: {
                                description:
                                    "Rich text content for platform updates",
                            },
                        },
                    ],
                },
                {
                    label: "Instrument Updates",
                    fields: [
                        {
                            name: "instrumentTitle",
                            type: "text",
                            localized: true,
                            required: true,
                            defaultValue: "Instrument Updates",
                            admin: {
                                description:
                                    "Title for the instrument updates section",
                            },
                        },
                        {
                            name: "instrumentDescription",
                            type: "textarea",
                            localized: true,
                            required: false,
                            admin: {
                                description:
                                    "Description text above the crypto grid",
                                rows: 3,
                            },
                        },
                        {
                            name: "instrumentFooter",
                            type: "textarea",
                            localized: true,
                            required: false,
                            admin: {
                                description:
                                    "Optional description below the crypto grid",
                                rows: 2,
                            },
                        },
                        {
                            name: "cryptoItems",
                            type: "array",
                            localized: true,
                            required: true,
                            minRows: 1,
                            dbName: "crypto",
                            admin: {
                                description:
                                    "Crypto instruments to display in the grid",
                            },
                            fields: [
                                {
                                    name: "symbol",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description:
                                            "Crypto symbol (e.g., 'AAVEUSD', 'BTCUSD')",
                                    },
                                },
                                {
                                    name: "iconText",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Optional text to display in the icon area",
                                    },
                                },
                                {
                                    name: "gradientStyle",
                                    type: "select",
                                    required: true,
                                    defaultValue: "purple-blue",
                                    dbName: "grad",
                                    admin: {
                                        description:
                                            "Gradient style for the crypto icon",
                                    },
                                    options: [
                                        {
                                            label: "Purple to Blue",
                                            value: "purple-blue",
                                        },
                                        {
                                            label: "Orange to Red",
                                            value: "orange-red",
                                        },
                                        {
                                            label: "Green to Teal",
                                            value: "green-teal",
                                        },
                                        {
                                            label: "Custom",
                                            value: "custom",
                                        },
                                    ],
                                },
                                {
                                    name: "customGradient",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom gradient CSS (e.g., 'linear-gradient(135deg, #ff6b6b, #4ecdc4)')",
                                        condition: (_data, siblingData) =>
                                            siblingData?.gradientStyle ===
                                            "custom",
                                    },
                                },
                                {
                                    name: "isNewInstrument",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description: "Mark as new instrument",
                                    },
                                },
                                {
                                    name: "isUpdated",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Mark as updated instrument",
                                    },
                                },
                                {
                                    name: "displayOrder",
                                    type: "number",
                                    required: false,
                                    admin: {
                                        description:
                                            "Display order (auto-generated if not specified)",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "SEO",
                    fields: [
                        {
                            name: "seo",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "SEO title for the trading updates page",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "SEO description for the trading updates page",
                                        rows: 3,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "SEO keywords (comma-separated)",
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description:
                                            "Open Graph image for social sharing",
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
