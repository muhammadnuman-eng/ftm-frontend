import type { GlobalConfig } from "payload";

export const Affiliates: GlobalConfig = {
    slug: "affiliates",
    admin: {
        group: "Site Content",
        livePreview: {
            url: ({ locale }) => {
                const baseUrl =
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3000";
                const path = locale ? `/${locale}/affiliates` : "/affiliates";
                return `${baseUrl}/api/draft?secret=${process.env.PAYLOAD_SECRET}&path=${encodeURIComponent(path)}`;
            },
        },
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "Header Section",
                    fields: [
                        {
                            name: "header",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Partner with FTM.\nEarn on Every Challenge Purchased.",
                                    admin: {
                                        description:
                                            "Main page title (supports line breaks)",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Challenge Purchased.",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Join our affiliate program and receive up to 22.5% commission for each challenge account purchased through your referral. Help others start their trading journey while building a reliable income stream with FTM.",
                                    admin: {
                                        description:
                                            "Subtitle/description below main title",
                                        rows: 3,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Call to Action Buttons",
                    fields: [
                        {
                            name: "ctaButtons",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "primaryButton",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "text",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            defaultValue: "Become an Affiliate",
                                            admin: {
                                                description:
                                                    "Primary button text",
                                            },
                                        },
                                        {
                                            name: "url",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            defaultValue:
                                                "/affiliates/register",
                                            admin: {
                                                description:
                                                    "Primary button URL",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "secondaryButton",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "text",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            defaultValue: "Affiliate Login",
                                            admin: {
                                                description:
                                                    "Secondary button text",
                                            },
                                        },
                                        {
                                            name: "url",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            defaultValue: "/affiliates/login",
                                            admin: {
                                                description:
                                                    "Secondary button URL",
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Commission Cards",
                    fields: [
                        {
                            name: "commissionCards",
                            type: "array",
                            localized: true,
                            required: true,
                            minRows: 3,
                            maxRows: 6,
                            defaultValue: [
                                {
                                    title: "Upto 22.5%",
                                    subtitle: "Commission",
                                    description:
                                        "Earn up to 22.5% commission on each challenge purchase through your referral link.",
                                    icon: "dollar-sign",
                                    iconColor: "emerald",
                                    gradientPosition: "top-right",
                                },
                                {
                                    title: "Free",
                                    subtitle: "Challenges",
                                    description:
                                        "Earn free challenge accounts as rewards based on your affiliate performance.",
                                    icon: "gift",
                                    iconColor: "orange",
                                    gradientPosition: "top-center",
                                },
                                {
                                    title: "Personalized",
                                    subtitle: "Discount Codes",
                                    description:
                                        "Get custom discount codes to offer your audience exclusive deals on trading challenges.",
                                    icon: "tag",
                                    iconColor: "cyan",
                                    gradientPosition: "top-left",
                                },
                            ],
                            admin: {
                                description:
                                    "Commission benefit cards displayed in grid layout",
                            },
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description:
                                            "Card main title (e.g., 'Upto 22.5%')",
                                    },
                                },
                                {
                                    name: "subtitle",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description:
                                            "Card subtitle (e.g., 'Commission')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description: "Card description text",
                                        rows: 3,
                                    },
                                },
                                {
                                    name: "icon",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Dollar Sign (Money)",
                                            value: "dollar-sign",
                                        },
                                        {
                                            label: "Gift (Rewards)",
                                            value: "gift",
                                        },
                                        {
                                            label: "Tag (Discounts)",
                                            value: "tag",
                                        },
                                        {
                                            label: "Trophy (Achievement)",
                                            value: "trophy",
                                        },
                                        {
                                            label: "Target (Goals)",
                                            value: "target",
                                        },
                                        {
                                            label: "Zap (Fast)",
                                            value: "zap",
                                        },
                                        {
                                            label: "Users (Community)",
                                            value: "users",
                                        },
                                        {
                                            label: "Trending Up (Growth)",
                                            value: "trending-up",
                                        },
                                    ],
                                },
                                {
                                    name: "iconColor",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Emerald",
                                            value: "emerald",
                                        },
                                        {
                                            label: "Orange",
                                            value: "orange",
                                        },
                                        {
                                            label: "Cyan",
                                            value: "cyan",
                                        },
                                        {
                                            label: "Blue",
                                            value: "blue",
                                        },
                                        {
                                            label: "Purple",
                                            value: "purple",
                                        },
                                        {
                                            label: "Rose",
                                            value: "rose",
                                        },
                                        {
                                            label: "Yellow",
                                            value: "yellow",
                                        },
                                        {
                                            label: "Green",
                                            value: "green",
                                        },
                                    ],
                                },
                                {
                                    name: "gradientPosition",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Top Left",
                                            value: "top-left",
                                        },
                                        {
                                            label: "Top Center",
                                            value: "top-center",
                                        },
                                        {
                                            label: "Top Right",
                                            value: "top-right",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Bottom Section",
                    fields: [
                        {
                            name: "bottomSection",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Ready to boost your income by helping traders succeed?",
                                    admin: {
                                        description: "Bottom section title",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Our affiliate program is tailored for influencers, educators, and community leaders eager to share the advantages of funded trading accounts. Join us and grow your income by promoting real trading opportunities to your audience.",
                                    admin: {
                                        description:
                                            "Bottom section description",
                                        rows: 4,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Additional Features",
                    fields: [
                        {
                            name: "additionalFeatures",
                            type: "array",
                            localized: true,
                            required: false,
                            minRows: 0,
                            maxRows: 8,
                            admin: {
                                description:
                                    "Optional additional feature cards or benefits",
                            },
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description: "Feature title",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description: "Feature description",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "icon",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Shield (Security)",
                                            value: "shield",
                                        },
                                        {
                                            label: "Clock (Speed)",
                                            value: "clock",
                                        },
                                        {
                                            label: "Users (Support)",
                                            value: "users",
                                        },
                                        {
                                            label: "Chart (Analytics)",
                                            value: "chart",
                                        },
                                        {
                                            label: "Globe (Global)",
                                            value: "globe",
                                        },
                                        {
                                            label: "Star (Quality)",
                                            value: "star",
                                        },
                                    ],
                                },
                                {
                                    name: "iconColor",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Blue",
                                            value: "blue",
                                        },
                                        {
                                            label: "Green",
                                            value: "green",
                                        },
                                        {
                                            label: "Purple",
                                            value: "purple",
                                        },
                                        {
                                            label: "Orange",
                                            value: "orange",
                                        },
                                        {
                                            label: "Red",
                                            value: "red",
                                        },
                                        {
                                            label: "Yellow",
                                            value: "yellow",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "SEO & Meta",
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
                                            "SEO title (defaults to page title if not set)",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description: "SEO meta description",
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
                                            "Open Graph image for social sharing (1200x630)",
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
