import type { GlobalConfig } from "payload";

export const HowItWorks: GlobalConfig = {
    slug: "how-it-works",
    admin: {
        group: "Site Content",
        livePreview: {
            url: ({ locale }) => {
                const baseUrl =
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3000";
                const path = locale
                    ? `/${locale}/how-it-works`
                    : "/how-it-works";
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
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "How It Works",
                                    admin: {
                                        description: "Main page title",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Works",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "From Zero to Funded: The FTM Forex Prop Trading Path",
                                    admin: {
                                        description:
                                            "Subtitle/description below main title",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "What is Prop Trading",
                    fields: [
                        {
                            name: "propTradingSection",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "What is Prop Trading?",
                                    admin: {
                                        description: "Section title",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Funded Trader Markets (FTM), one of the best prop firms, provides traders with simulated funded accounts and real payouts. Traders are evaluated on performance and must follow strict risk rules. If successful, they can earn real profits while following strict risk parameters. Go beyond the limits, and the account is deactivated. Trade smart, and your capital grows.",
                                    admin: {
                                        description: "Section description",
                                        rows: 4,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Key Concepts",
                    fields: [
                        {
                            name: "keyConcepts",
                            type: "array",
                            localized: true,
                            required: true,
                            minRows: 2,
                            maxRows: 4,
                            defaultValue: [
                                {
                                    title: "Profit Target",
                                    description:
                                        "This is the required profit percentage (e.g., 8%) you must achieve to pass the evaluation phase. Reaching the target proves your strategy is profitable and moves you to the next step.",
                                    icon: "trophy",
                                    iconColor: "emerald",
                                },
                                {
                                    title: "Drawdown Limits",
                                    description:
                                        "These are balance protection rules to measure your risk management discipline. You must not exceed these limits.",
                                    details: [
                                        {
                                            label: "Daily Limit (e.g., 5%):",
                                            description:
                                                "The maximum loss allowed in a single day.",
                                        },
                                        {
                                            label: "Overall Limit (e.g., 10%):",
                                            description:
                                                "The total loss allowed throughout the evaluation.",
                                        },
                                    ],
                                    icon: "check-circle",
                                    iconColor: "orange",
                                },
                            ],
                            admin: {
                                description: "Key trading concepts cards",
                            },
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description: "Concept title",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description: "Concept description",
                                        rows: 3,
                                    },
                                },
                                {
                                    name: "details",
                                    type: "array",
                                    localized: true,
                                    required: false,
                                    admin: {
                                        description:
                                            "Optional additional details/bullet points",
                                    },
                                    fields: [
                                        {
                                            name: "label",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Detail label (e.g., 'Daily Limit (e.g., 5%):')",
                                            },
                                        },
                                        {
                                            name: "description",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Detail description",
                                            },
                                        },
                                    ],
                                },
                                {
                                    name: "icon",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Trophy (Achievement)",
                                            value: "trophy",
                                        },
                                        {
                                            label: "Check Circle (Validation)",
                                            value: "check-circle",
                                        },
                                        {
                                            label: "Shield (Protection)",
                                            value: "shield",
                                        },
                                        {
                                            label: "Target (Goals)",
                                            value: "target",
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
                                            label: "Blue",
                                            value: "blue",
                                        },
                                        {
                                            label: "Purple",
                                            value: "purple",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Evaluation Types",
                    fields: [
                        {
                            name: "evaluationTypes",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Evaluation Types",
                                    admin: {
                                        description: "Section title",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Choose the path that best suits your style on our Programs page:",
                                    admin: {
                                        description: "Section description",
                                    },
                                },
                                {
                                    name: "types",
                                    type: "array",
                                    localized: true,
                                    required: true,
                                    minRows: 3,
                                    maxRows: 4,
                                    defaultValue: [
                                        {
                                            title: "1-Step",
                                            description:
                                                "Get funded quickly by completing a single profit target.",
                                            icon: "zap",
                                            iconColor: "rose",
                                            gradientPosition: "top-right",
                                        },
                                        {
                                            title: "2-Step",
                                            description:
                                                "Advance by verifying your skills across two phases.",
                                            icon: "crown",
                                            iconColor: "yellow",
                                            gradientPosition: "top-center",
                                        },
                                        {
                                            title: "Instant Funding",
                                            description:
                                                "Skip the evaluation and start directly with a simulated funded account.",
                                            icon: "clock",
                                            iconColor: "lime",
                                            gradientPosition: "top-left",
                                        },
                                    ],
                                    admin: {
                                        description: "Evaluation type cards",
                                    },
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Evaluation type title",
                                            },
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Evaluation type description",
                                                rows: 2,
                                            },
                                        },
                                        {
                                            name: "icon",
                                            type: "select",
                                            required: true,
                                            options: [
                                                {
                                                    label: "Zap (Fast)",
                                                    value: "zap",
                                                },
                                                {
                                                    label: "Crown (Premium)",
                                                    value: "crown",
                                                },
                                                {
                                                    label: "Clock (Time)",
                                                    value: "clock",
                                                },
                                                {
                                                    label: "Star (Featured)",
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
                                                    label: "Rose",
                                                    value: "rose",
                                                },
                                                {
                                                    label: "Yellow/Amber",
                                                    value: "yellow",
                                                },
                                                {
                                                    label: "Lime/Green",
                                                    value: "lime",
                                                },
                                                {
                                                    label: "Blue",
                                                    value: "blue",
                                                },
                                            ],
                                        },
                                        {
                                            name: "gradientPosition",
                                            type: "select",
                                            required: true,
                                            options: [
                                                {
                                                    label: "Top Right",
                                                    value: "top-right",
                                                },
                                                {
                                                    label: "Top Center",
                                                    value: "top-center",
                                                },
                                                {
                                                    label: "Top Left",
                                                    value: "top-left",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Step by Step Roadmap",
                    fields: [
                        {
                            name: "roadmap",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Step By Step Roadmap",
                                    admin: {
                                        description: "Section title",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Roadmap",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient",
                                    },
                                },
                                {
                                    name: "steps",
                                    type: "array",
                                    localized: true,
                                    required: true,
                                    minRows: 4,
                                    maxRows: 8,
                                    defaultValue: [
                                        {
                                            number: "1",
                                            title: "Choose Your Account",
                                            description:
                                                "Visit our Programs page and choose the plan that fits your goals best — evaluation-based or instant funding.",
                                            icon: "star",
                                        },
                                        {
                                            number: "2",
                                            title: "Make Payment",
                                            description:
                                                "Pay securely via crypto or credit/debit card. Your account will be activated shortly after confirmation.",
                                            icon: "dollar-sign",
                                        },
                                        {
                                            number: "3",
                                            title: "Get Login Details",
                                            description:
                                                "You'll receive your trading account credentials by email along with your dashboard access and account-specific rules.",
                                            icon: "check-circle",
                                        },
                                        {
                                            number: "4",
                                            title: "Pass & Verify (KYC)",
                                            description:
                                                "Pass evaluation or start Instant Funding, then verify with KYCAid securely.",
                                            icon: "crown",
                                        },
                                        {
                                            number: "5",
                                            title: "Start Trading",
                                            description:
                                                "Trade with your strategy. Most styles are allowed, but check prohibited methods.",
                                            icon: "zap",
                                        },
                                        {
                                            number: "6",
                                            title: "Withdraw Profits",
                                            description:
                                                "Payouts are fast and flexible. Our 24h guarantee has never failed.",
                                            icon: "trophy",
                                        },
                                    ],
                                    admin: {
                                        description: "Roadmap steps",
                                    },
                                    fields: [
                                        {
                                            name: "number",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Step number (e.g., '1', '2')",
                                            },
                                        },
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description: "Step title",
                                            },
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description: "Step description",
                                                rows: 3,
                                            },
                                        },
                                        {
                                            name: "icon",
                                            type: "select",
                                            required: true,
                                            options: [
                                                {
                                                    label: "Star (Selection)",
                                                    value: "star",
                                                },
                                                {
                                                    label: "Dollar Sign (Payment)",
                                                    value: "dollar-sign",
                                                },
                                                {
                                                    label: "Check Circle (Verification)",
                                                    value: "check-circle",
                                                },
                                                {
                                                    label: "Crown (Achievement)",
                                                    value: "crown",
                                                },
                                                {
                                                    label: "Zap (Action)",
                                                    value: "zap",
                                                },
                                                {
                                                    label: "Trophy (Success)",
                                                    value: "trophy",
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Additional Information",
                    fields: [
                        {
                            name: "additionalInfo",
                            type: "array",
                            localized: true,
                            required: true,
                            minRows: 2,
                            maxRows: 4,
                            defaultValue: [
                                {
                                    title: "Try Again!",
                                    description:
                                        "Didn't complete the challenge? Analyze your mistakes, improve your strategy, and try again. Every attempt brings you one step closer to success!",
                                    icon: "clock",
                                    iconColor: "blue",
                                },
                                {
                                    title: "Free Reset Opportunity",
                                    description:
                                        "We organize free reset giveaways every month in our Discord community. Join, try your luck, and start the challenge again for free!",
                                    icon: "dollar-sign",
                                    iconColor: "yellow",
                                },
                            ],
                            admin: {
                                description:
                                    "Additional information cards (Try Again, Free Reset, etc.)",
                            },
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description: "Card title",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    admin: {
                                        description: "Card description",
                                        rows: 3,
                                    },
                                },
                                {
                                    name: "icon",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Clock (Time/Retry)",
                                            value: "clock",
                                        },
                                        {
                                            label: "Dollar Sign (Money/Free)",
                                            value: "dollar-sign",
                                        },
                                        {
                                            label: "Gift (Bonus)",
                                            value: "gift",
                                        },
                                        {
                                            label: "Refresh (Reset)",
                                            value: "refresh",
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
                                            label: "Yellow",
                                            value: "yellow",
                                        },
                                        {
                                            label: "Green",
                                            value: "green",
                                        },
                                        {
                                            label: "Orange",
                                            value: "orange",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Call to Action",
                    fields: [
                        {
                            name: "cta",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Ready to Start?",
                                    admin: {
                                        description: "CTA section title",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Start?",
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
                                        "Join thousands of successful traders at FTM. Choose your plan, make the payment, and start your journey towards financial freedom and mastery.",
                                    admin: {
                                        description: "CTA description",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "buttonText",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "View Funding Plans",
                                    admin: {
                                        description: "CTA button text",
                                    },
                                },
                                {
                                    name: "buttonUrl",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "/programs",
                                    admin: {
                                        description: "CTA button URL",
                                    },
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
