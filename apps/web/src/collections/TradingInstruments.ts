import type { CollectionConfig } from "payload";

export const TradingInstruments: CollectionConfig = {
    slug: "trading-instruments",
    admin: {
        useAsTitle: "symbol",
        defaultColumns: [
            "symbol",
            "description",
            "market",
            "contractSize",
            "commission",
            "isActive",
        ],
        group: "Trading Data",
        listSearchableFields: ["symbol", "description", "market"],
    },
    access: {
        read: () => true,
        create: ({ req: { user } }) => Boolean(user),
        update: ({ req: { user } }) => Boolean(user),
        delete: ({ req: { user } }) => Boolean(user),
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "Basic Information",
                    fields: [
                        {
                            name: "symbol",
                            type: "text",
                            localized: true,
                            required: true,
                            unique: true,
                            admin: {
                                description:
                                    "Trading symbol (e.g., EURUSD, BTCUSD)",
                            },
                        },
                        {
                            name: "description",
                            type: "text",
                            localized: true,
                            required: true,
                            admin: {
                                description:
                                    "Full description of the instrument",
                            },
                        },
                        {
                            name: "market",
                            type: "select",
                            required: true,
                            options: [
                                {
                                    label: "Forex",
                                    value: "forex",
                                },
                                {
                                    label: "Metals",
                                    value: "metals",
                                },
                                {
                                    label: "Indices",
                                    value: "indices",
                                },
                                {
                                    label: "Crypto",
                                    value: "crypto",
                                },
                                {
                                    label: "Commodities",
                                    value: "commodities",
                                },
                            ],
                            admin: {
                                description:
                                    "Market category for the instrument",
                            },
                        },
                        {
                            name: "isActive",
                            type: "checkbox",
                            defaultValue: true,
                            admin: {
                                description:
                                    "Whether this instrument is currently available for trading",
                            },
                        },
                    ],
                },
                {
                    label: "Trading Specifications",
                    fields: [
                        {
                            name: "digits",
                            type: "number",
                            required: true,
                            min: 0,
                            max: 10,
                            admin: {
                                description:
                                    "Number of decimal places for price quotes",
                            },
                        },
                        {
                            name: "contractSize",
                            type: "text",
                            localized: true,
                            required: true,
                            admin: {
                                description:
                                    "Contract size (e.g., 100,000, 1, 5,000)",
                            },
                        },
                        {
                            name: "contractSizeNumeric",
                            type: "number",
                            required: true,
                            admin: {
                                description:
                                    "Contract size as numeric value for calculations",
                            },
                        },
                        {
                            name: "swap",
                            type: "text",
                            localized: true,
                            required: true,
                            defaultValue: "0%",
                            admin: {
                                description: "Swap rate (e.g., 0%, -2.5%)",
                            },
                        },
                        {
                            name: "commission",
                            type: "text",
                            localized: true,
                            required: true,
                            admin: {
                                description: "Commission fee (e.g., $7, $0)",
                            },
                        },
                        {
                            name: "commissionNumeric",
                            type: "number",
                            required: true,
                            admin: {
                                description:
                                    "Commission as numeric value for calculations",
                            },
                        },
                    ],
                },
                {
                    label: "Additional Information",
                    fields: [
                        {
                            name: "minTradeSize",
                            type: "number",
                            required: false,
                            admin: {
                                description: "Minimum trade size (lots)",
                            },
                        },
                        {
                            name: "maxTradeSize",
                            type: "number",
                            required: false,
                            admin: {
                                description: "Maximum trade size (lots)",
                            },
                        },
                        {
                            name: "tradingHours",
                            type: "textarea",
                            localized: true,
                            required: false,
                            admin: {
                                description: "Trading hours information",
                                rows: 2,
                            },
                        },
                        {
                            name: "notes",
                            type: "textarea",
                            localized: true,
                            required: false,
                            admin: {
                                description:
                                    "Additional notes or special conditions",
                                rows: 3,
                            },
                        },
                    ],
                },
                {
                    label: "Display Settings",
                    fields: [
                        {
                            name: "displayOrder",
                            type: "number",
                            required: false,
                            admin: {
                                description:
                                    "Order for displaying instruments (lower numbers appear first)",
                            },
                        },
                        {
                            name: "isFeatured",
                            type: "checkbox",
                            defaultValue: false,
                            admin: {
                                description: "Mark as featured instrument",
                            },
                        },
                        {
                            name: "isPopular",
                            type: "checkbox",
                            defaultValue: false,
                            admin: {
                                description: "Mark as popular instrument",
                            },
                        },
                        {
                            name: "customCssClass",
                            type: "text",
                            localized: true,
                            required: false,
                            admin: {
                                description: "Custom CSS class for styling",
                            },
                        },
                    ],
                },
            ],
        },
    ],
    hooks: {
        beforeValidate: [
            ({ data }) => {
                if (!data) return data;

                // Auto-generate display order based on market and symbol
                if (!data.displayOrder) {
                    const marketOrder = {
                        forex: 1000,
                        metals: 2000,
                        indices: 3000,
                        crypto: 4000,
                        commodities: 5000,
                    };
                    const baseOrder =
                        marketOrder[data.market as keyof typeof marketOrder] ||
                        9000;
                    // Use symbol as secondary sort (first few characters converted to number)
                    const symbolOrder = data.symbol
                        ? data.symbol.charCodeAt(0)
                        : 0;
                    data.displayOrder = baseOrder + symbolOrder;
                }

                // Extract numeric values from text fields
                if (data.contractSize && !data.contractSizeNumeric) {
                    const numericValue = Number.parseFloat(
                        data.contractSize.replace(/[,$]/g, ""),
                    );
                    if (!Number.isNaN(numericValue)) {
                        data.contractSizeNumeric = numericValue;
                    }
                }

                if (data.commission && !data.commissionNumeric) {
                    const numericValue = Number.parseFloat(
                        data.commission.replace(/[$]/g, ""),
                    );
                    if (!Number.isNaN(numericValue)) {
                        data.commissionNumeric = numericValue;
                    }
                }

                return data;
            },
        ],
    },
};
