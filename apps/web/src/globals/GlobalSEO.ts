import type { GlobalConfig } from "payload";

export const GlobalSEO: GlobalConfig = {
    slug: "global-seo",
    admin: {
        group: "Settings",
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "Default SEO",
                    description:
                        "Default SEO settings that apply to all pages unless overridden",
                    fields: [
                        {
                            name: "defaults",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "siteName",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Funded Trader Markets",
                                    admin: {
                                        description:
                                            "Your site name (e.g., 'Funded Trader Markets')",
                                    },
                                },
                                {
                                    name: "titleTemplate",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "%s | The Best Prop Firm For Funded Traders",
                                    admin: {
                                        description:
                                            "Template for page titles. Use %s as placeholder for page title",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Funded Trader Markets: Faster payouts, better conditions, transparent rules. Join thousands of traders getting funded.",
                                    admin: {
                                        description:
                                            "Default meta description (150-160 characters recommended)",
                                        rows: 3,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    defaultValue:
                                        "prop trading, funded trader, forex funding, trading account, prop firm",
                                    admin: {
                                        description:
                                            "Default SEO keywords (comma-separated)",
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description:
                                            "Default Open Graph image for social sharing (recommended: 1200x630px)",
                                    },
                                },
                                {
                                    name: "twitterHandle",
                                    type: "text",
                                    required: false,
                                    admin: {
                                        description:
                                            "Twitter handle (e.g., '@ftmarkets')",
                                    },
                                },
                                {
                                    name: "canonicalBaseUrl",
                                    type: "text",
                                    required: false,
                                    defaultValue:
                                        "https://fundedtradermarkets.com",
                                    admin: {
                                        description:
                                            "Base URL for canonical links (e.g., 'https://fundedtradermarkets.com')",
                                    },
                                },
                                {
                                    name: "defaultRobots",
                                    type: "group",
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow search engines to index pages",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow search engines to follow links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "organizationSchema",
                                    type: "textarea",
                                    required: false,
                                    admin: {
                                        description:
                                            "Global organization JSON-LD schema (application/ld+json). This will be included on all pages. Paste your schema.org Organization JSON here.",
                                        rows: 15,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Home Page",
                    fields: [
                        {
                            name: "homePage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for home page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Home page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Home page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Home page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description: "Home page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Programs Page",
                    fields: [
                        {
                            name: "programsPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for programs page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Programs page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Programs page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Programs page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description: "Programs page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Blog Page",
                    fields: [
                        {
                            name: "blogPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for blog page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Blog page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Blog page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Blog page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description: "Blog page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "FAQ Page",
                    fields: [
                        {
                            name: "faqPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for FAQ page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "FAQ page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "FAQ page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "FAQ page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description: "FAQ page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "1-Step Program",
                    fields: [
                        {
                            name: "oneStepPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for 1-Step program page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "1-Step page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "1-Step page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "1-Step page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description: "1-Step page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "2-Step Program",
                    fields: [
                        {
                            name: "twoStepPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for 2-Step program page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "2-Step page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "2-Step page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "2-Step page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description: "2-Step page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "How It Works Page",
                    fields: [
                        {
                            name: "howItWorksPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for How It Works page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "How It Works page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "How It Works page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "How It Works page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description:
                                            "How It Works page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Affiliates Page",
                    fields: [
                        {
                            name: "affiliatesPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for Affiliates page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Affiliates page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Affiliates page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Affiliates page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description: "Affiliates page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Instant Funding Program",
                    fields: [
                        {
                            name: "instantPage",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "enabled",
                                    type: "checkbox",
                                    defaultValue: false,
                                    admin: {
                                        description:
                                            "Enable custom SEO for Instant Funding program page",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Instant Funding page title (leave empty to use default)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Instant Funding page meta description",
                                        rows: 3,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "keywords",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Instant Funding page keywords (comma-separated)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "ogImage",
                                    type: "upload",
                                    relationTo: "media",
                                    required: false,
                                    admin: {
                                        description:
                                            "Instant Funding page OG image",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "canonicalUrl",
                                    type: "text",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Custom canonical URL (leave empty to auto-generate)",
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                },
                                {
                                    name: "robots",
                                    type: "group",
                                    admin: {
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
                                    },
                                    fields: [
                                        {
                                            name: "index",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description: "Allow indexing",
                                            },
                                        },
                                        {
                                            name: "follow",
                                            type: "checkbox",
                                            defaultValue: true,
                                            admin: {
                                                description:
                                                    "Allow following links",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "jsonLdSchema",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "JSON-LD structured data (application/ld+json). Paste your schema.org JSON here.",
                                        rows: 10,
                                        condition: (_data, siblingData) =>
                                            siblingData?.enabled,
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
