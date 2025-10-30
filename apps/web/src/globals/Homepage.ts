import type { GlobalConfig } from "payload";

export const Homepage: GlobalConfig = {
    slug: "homepage",
    admin: {
        group: "Site Content",
        livePreview: {
            url: ({ locale }) => {
                const baseUrl =
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3000";
                const path = locale ? `/${locale}` : "/";
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
                    label: "Hero Section",
                    fields: [
                        {
                            name: "hero",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "tagline",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Get Your Funded Trading Account. Trade Without Limits.",
                                    admin: {
                                        description:
                                            "Small text above the main headline (e.g., 'Get Your Funded Trading Account')",
                                    },
                                },
                                {
                                    name: "headline",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue: "No Excuses. No Delays.",
                                    admin: {
                                        description:
                                            "Main hero headline (supports line breaks)",
                                        rows: 3,
                                    },
                                },
                                {
                                    name: "highlightedText",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "24 Hours",
                                    admin: {
                                        description:
                                            "Text that appears with gradient styling (e.g., '24 Hours')",
                                    },
                                },
                                {
                                    name: "secondaryHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "We Pay Double",
                                    admin: {
                                        description:
                                            "Second highlighted text (e.g., 'We Pay Double')",
                                    },
                                },
                                {
                                    name: "primaryButtonText",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Get Funded",
                                    admin: {
                                        description: "Primary CTA button text",
                                    },
                                },
                                {
                                    name: "primaryButtonUrl",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "/variations",
                                    admin: {
                                        description: "Primary CTA button URL",
                                    },
                                },
                                {
                                    name: "secondaryButtonText",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Join Discord",
                                    admin: {
                                        description:
                                            "Secondary CTA button text",
                                    },
                                },
                                {
                                    name: "secondaryButtonUrl",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "https://discord.com/invite/ftmarkets",
                                    admin: {
                                        description: "Secondary CTA button URL",
                                    },
                                },
                            ],
                        },
                        {
                            name: "features",
                            type: "array",
                            localized: true,
                            required: true,
                            minRows: 4,
                            maxRows: 4,
                            defaultValue: [
                                {
                                    text: "150+ Countries Covered",
                                    icon: "globe",
                                    iconColor: "blue",
                                },
                                {
                                    text: "Up to $2 million Max Allocation",
                                    icon: "wallet",
                                    iconColor: "yellow",
                                },
                                {
                                    text: "24Hrs Payout Guaranteed",
                                    icon: "dollar-badge",
                                    iconColor: "green",
                                },
                                {
                                    text: "On-Demand Payout",
                                    icon: "hand-coins",
                                    iconColor: "rose",
                                },
                            ],
                            admin: {
                                description:
                                    "Four feature boxes displayed below the hero",
                            },
                            fields: [
                                {
                                    name: "text",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                },
                                {
                                    name: "icon",
                                    type: "select",
                                    required: true,
                                    options: [
                                        {
                                            label: "Globe",
                                            value: "globe",
                                        },
                                        {
                                            label: "Wallet",
                                            value: "wallet",
                                        },
                                        {
                                            label: "Dollar Badge",
                                            value: "dollar-badge",
                                        },
                                        {
                                            label: "Hand Coins",
                                            value: "hand-coins",
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
                                            label: "Rose",
                                            value: "rose",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Featured In Section",
                    fields: [
                        {
                            name: "featuredIn",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "heading",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "As Featured In",
                                    admin: {
                                        description:
                                            "Section heading (e.g., 'As Featured In')",
                                    },
                                },
                                {
                                    name: "logos",
                                    type: "array",
                                    localized: true,
                                    required: false,
                                    minRows: 0,
                                    admin: {
                                        description:
                                            "Logo images and links for the featured in section",
                                    },
                                    fields: [
                                        {
                                            name: "name",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Name/Alt text for the logo",
                                            },
                                        },
                                        {
                                            name: "logo",
                                            type: "upload",
                                            relationTo: "media",
                                            required: true,
                                            admin: {
                                                description: "Logo image",
                                            },
                                        },
                                        {
                                            name: "url",
                                            type: "text",
                                            localized: true,
                                            required: false,
                                            admin: {
                                                description:
                                                    "Optional link URL when logo is clicked",
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Advantages Section",
                    fields: [
                        {
                            name: "advantages",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "dividerTitle",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "The FTM Advantage",
                                    admin: {
                                        description:
                                            "Small text above the main title (e.g., 'The FTM Advantage')",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Why Traders Choose FTM?",
                                    admin: {
                                        description:
                                            "Main section title (e.g., 'Why Traders Choose FTM?')",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "FTM?",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient (e.g., 'FTM?')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Discover why FTM is a leading prop firm for instant funding, fast payouts, and funded trading accounts.",
                                    admin: {
                                        description: "Section description text",
                                        rows: 3,
                                    },
                                },
                                {
                                    name: "cards",
                                    type: "array",
                                    localized: true,
                                    required: true,
                                    minRows: 1,
                                    maxRows: 6,
                                    defaultValue: [
                                        {
                                            title: "24/7 Support",
                                            description:
                                                "We are here to answer to all your questions. ALL day & night",
                                            icon: "phone",
                                            iconColor: "blue",
                                            gradientPosition: "top-right",
                                        },
                                        {
                                            title: "Up to 100% Profit Split",
                                            description:
                                                "An easy method to get paid within 24 hours guaranteed",
                                            icon: "circle-dollar-sign",
                                            iconColor: "yellow",
                                            gradientPosition: "top-center",
                                        },
                                        {
                                            title: "On Demand Payouts",
                                            description:
                                                "Need to get your payout instantly? No problem! Get It when you want.",
                                            icon: "hand-coins",
                                            iconColor: "green",
                                            gradientPosition: "top-center",
                                        },
                                        {
                                            title: "Best Conditions",
                                            description:
                                                "Tight Spreads, No Swaps, and Fast Execution",
                                            icon: "ribbon",
                                            iconColor: "rose",
                                            gradientPosition: "top-left",
                                        },
                                    ],
                                    admin: {
                                        description:
                                            "Advantage cards to display in grid",
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
                                                rows: 2,
                                            },
                                        },
                                        {
                                            name: "icon",
                                            type: "select",
                                            required: true,
                                            options: [
                                                {
                                                    label: "Phone (24/7 Support)",
                                                    value: "phone",
                                                },
                                                {
                                                    label: "Circle Dollar Sign (Profit)",
                                                    value: "circle-dollar-sign",
                                                },
                                                {
                                                    label: "Hand Coins (Payouts)",
                                                    value: "hand-coins",
                                                },
                                                {
                                                    label: "Ribbon (Best Conditions)",
                                                    value: "ribbon",
                                                },
                                                {
                                                    label: "Trophy (Achievement)",
                                                    value: "trophy",
                                                },
                                                {
                                                    label: "Zap (Fast)",
                                                    value: "zap",
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
                                                    label: "Rose",
                                                    value: "rose",
                                                },
                                                {
                                                    label: "Purple",
                                                    value: "purple",
                                                },
                                                {
                                                    label: "Orange",
                                                    value: "orange",
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
                    ],
                },
                {
                    label: "Payouts Features Section",
                    fields: [
                        {
                            name: "payoutsFeatures",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "dividerTitle",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Get Paid Fast",
                                    admin: {
                                        description:
                                            "Small text above the main title (e.g., 'Get Paid Fast')",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Reliable, On-Time\nPayouts Guaranteed",
                                    admin: {
                                        description:
                                            "Main section title (supports line breaks, e.g., 'Reliable, On-Time\\n Payouts Guaranteed')",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Guaranteed",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient (e.g., 'Guaranteed')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Enjoy fast payouts with our trusted forex prop firm built for funded traders.",
                                    admin: {
                                        description: "Section description text",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "features",
                                    type: "array",
                                    localized: true,
                                    required: true,
                                    minRows: 4,
                                    maxRows: 4,
                                    defaultValue: [
                                        {
                                            title: "Generous Profit Split",
                                            description:
                                                "With us, keep up to 100% of your rewards on our evaluation programs. And up to 80% on our instant funding challenges.",
                                            position: "left-tall",
                                        },
                                        {
                                            title: "On-Demand Payout",
                                            description:
                                                "Criteria met? Withdraw instantly. No more 30-day, 14-day or 7-day cycles. Hundreds of proof reviews on discord and payout junction!",
                                            position: "top-right",
                                        },
                                        {
                                            title: "24 Hours or Double Payout",
                                            description:
                                                "We guarantee payouts in 24 hours or less. If we're late, we double your payout and give you a free account. No excuses. Full confidence.",
                                            position: "bottom-middle",
                                        },
                                        {
                                            title: "Average Processing Time",
                                            description:
                                                "Most payouts are completed in under 2 hours. We move faster than the industry standard, backed by a 24-hour guarantee.",
                                            position: "right-tall",
                                        },
                                    ],
                                    admin: {
                                        description:
                                            "Four payout feature cards displayed in grid layout",
                                    },
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Feature card title",
                                            },
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Feature card description",
                                                rows: 3,
                                            },
                                        },
                                        {
                                            name: "position",
                                            type: "select",
                                            required: true,
                                            admin: {
                                                description:
                                                    "Card position in the grid layout",
                                            },
                                            options: [
                                                {
                                                    label: "Left Tall Card",
                                                    value: "left-tall",
                                                },
                                                {
                                                    label: "Top Right Card",
                                                    value: "top-right",
                                                },
                                                {
                                                    label: "Bottom Middle Card",
                                                    value: "bottom-middle",
                                                },
                                                {
                                                    label: "Right Tall Card",
                                                    value: "right-tall",
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
                    label: "Highest Payouts Section",
                    fields: [
                        {
                            name: "highestPayouts",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Milestone Rewards for Trading Champions",
                                    admin: {
                                        description:
                                            "Main section title (e.g., 'Milestone Rewards for Trading Champions')",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Trading Champions",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient (e.g., 'Trading Champions')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Celebrating our biggest single payouts from successful traders",
                                    admin: {
                                        description: "Section description text",
                                        rows: 2,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Trading Features Section",
                    fields: [
                        {
                            name: "tradingFeatures",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "dividerTitle",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Best Prop Trading Solutions",
                                    admin: {
                                        description:
                                            "Small text above the main title (e.g., 'Best Prop Trading Solutions')",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Fast Execution on\nLeading Trading Platforms",
                                    admin: {
                                        description:
                                            "Main section title (supports line breaks, e.g., 'Fast Execution on\\nLeading Trading Platforms')",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Leading",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient (e.g., 'Leading')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Trade forex, commodities, and indices in liquid markets with advanced charts and fast execution.",
                                    admin: {
                                        description: "Section description text",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "features",
                                    type: "array",
                                    localized: true,
                                    required: true,
                                    minRows: 4,
                                    maxRows: 4,
                                    defaultValue: [
                                        {
                                            title: "Multiple Trading Platforms",
                                            description:
                                                "We equip our traders with world-class platforms that provide the best trading experience",
                                            layout: "large-left",
                                        },
                                        {
                                            title: "Swap Free",
                                            description:
                                                "Trade without overnight fees with swap-free accounts. Applicable on All accounts without additional charge.",
                                            layout: "top-right",
                                            animation: "swap-free",
                                        },
                                        {
                                            title: "Up to 1:100 Leverage",
                                            description:
                                                "We equip our traders with world-class platforms that provide the best trading experience",
                                            layout: "bottom-left",
                                            animation: "leverage",
                                        },
                                        {
                                            title: "Trade Different Markets",
                                            description:
                                                "Forex, Commodities, Indices & more, trade your favorite markets across multiple platforms, your way!",
                                            layout: "large-bottom-right",
                                            animation: "dollar-motion",
                                        },
                                    ],
                                    admin: {
                                        description:
                                            "Four trading feature cards displayed in bento grid layout",
                                    },
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Feature card title",
                                            },
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "Feature card description",
                                                rows: 3,
                                            },
                                        },
                                        {
                                            name: "layout",
                                            type: "select",
                                            required: true,
                                            admin: {
                                                description:
                                                    "Card layout position in the bento grid",
                                            },
                                            options: [
                                                {
                                                    label: "Large Left Card (4 columns)",
                                                    value: "large-left",
                                                },
                                                {
                                                    label: "Top Right Card (2 columns)",
                                                    value: "top-right",
                                                },
                                                {
                                                    label: "Bottom Left Card (2 columns)",
                                                    value: "bottom-left",
                                                },
                                                {
                                                    label: "Large Bottom Right Card (4 columns)",
                                                    value: "large-bottom-right",
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
                    label: "Video Testimonials Section",
                    fields: [
                        {
                            name: "videoTestimonials",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "dividerTitle",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Success Reviews",
                                    admin: {
                                        description:
                                            "Small text above the main title (e.g., 'Success Reviews')",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "What Our Traders Are Saying",
                                    admin: {
                                        description:
                                            "Main section title (e.g., 'What Our Traders Are Saying')",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Traders",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient (e.g., 'Traders')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Real feedback from real traders who've leveled up their game with us.",
                                    admin: {
                                        description: "Section description text",
                                        rows: 2,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Testimonials Section",
                    fields: [
                        {
                            name: "testimonials",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "100+ Satisfied Traders",
                                    admin: {
                                        description:
                                            "Main section title (e.g., '100+ Satisfied Traders')",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Satisfied",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient (e.g., 'Satisfied')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Don't take our word for it, see what our traders have to say",
                                    admin: {
                                        description: "Section description text",
                                        rows: 2,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "FAQ Section",
                    fields: [
                        {
                            name: "faq",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "dividerTitle",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Prop Trading FAQs",
                                    admin: {
                                        description:
                                            "Small text above the main title (e.g., 'Prop Trading FAQs')",
                                    },
                                },
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Your Questions, Our Answers",
                                    admin: {
                                        description:
                                            "Main section title (e.g., 'Your Questions, Our Answers')",
                                    },
                                },
                                {
                                    name: "titleHighlight",
                                    type: "text",
                                    localized: true,
                                    required: true,
                                    defaultValue: "Our Answers",
                                    admin: {
                                        description:
                                            "Part of title to highlight with gradient (e.g., 'Our Answers')",
                                    },
                                },
                                {
                                    name: "description",
                                    type: "textarea",
                                    localized: true,
                                    required: true,
                                    defaultValue:
                                        "Find answers to commonly asked questions about our prop trading programs, evaluation process, and funding requirements.",
                                    admin: {
                                        description: "Section description text",
                                        rows: 2,
                                    },
                                },
                                {
                                    name: "faqs",
                                    type: "array",
                                    localized: true,
                                    required: true,
                                    minRows: 1,
                                    defaultValue: [
                                        {
                                            question:
                                                "What is a Forex Prop Firm?",
                                            answer: "A Forex Prop Firm allows traders to trade with higher simulated capital while earning real money based on their consistently profitable trading skills. It enables traders to trade without risking their own funds. At Funded Trader Markets (FTM), traders can prove their skills through an Evaluation process or via simulated Instant Funded Accounts and keep a significant share of the profits they earn.",
                                        },
                                        {
                                            question:
                                                "What is a Forex Funded Account?",
                                            answer: "A Forex Funded Account is a trading account provided by a prop firm, allowing traders to trade with large simulated capital instead of their own money. It enables skilled traders to profit without taking on huge financial risk.",
                                        },
                                        {
                                            question:
                                                "How Do You Qualify for a Simulated Funded Account?",
                                            answer: "To qualify for a simulated funded account with FTM, you typically have two options:\nWith Evaluation – You'll need to meet profit targets, follow risk management rules, and demonstrate consistent trading.\nWithout Evaluation – You can access Instant Funded Accounts directly, subject to fees and eligibility.\nThis ensures that only responsible and consistent traders move forward.",
                                        },
                                        {
                                            question:
                                                "What Are the Risks of Trading with a Prop Firm?",
                                            answer: "While trading with a prop firm offers excellent opportunities, there are risks to consider. If you exceed drawdown limits or fail to follow risk management rules, your account may be suspended. Some firms may also restrict certain trading strategies or instruments. Understanding and managing these risks is key to long-term success.",
                                        },
                                        {
                                            question:
                                                "What Are the Benefits of Joining a Forex Prop Firm?",
                                            answer: "Joining a Forex prop trading firm like Funded Trader Markets comes with multiple benefits:\nAccess to Capital: Trade up to $600,000 in simulated capital without risking your own money (just an evaluation fee).\nRisk Management Support: Profit targets and loss limits help you stay disciplined.\nMentorship & Tools: Get access to resources that sharpen your skills and help you stay updated on market trends.\nProfit Sharing: Earn up to 100% of your profits.\nScalability: Perform well and gain access to larger accounts and higher payout potential.",
                                        },
                                        {
                                            question:
                                                "How Much Can You Earn with a Simulated Funded Account?",
                                            answer: "Earnings depend on your trading performance. At FTM, traders can earn up to 100% of the profits they generate. There is no upper limit to how much profit a trader can generate. The more consistent and profitable you are, the more you can earn.",
                                        },
                                        {
                                            question:
                                                "What Are the Evaluation Fees at Funded Trader Markets?",
                                            answer: "Evaluation fees vary by program type and account size:\n• 1-Step Evaluation: $15 (for $5k) to $439 (for $200k)\n• 2-Step Evaluation: $27 (for $5k) to $589 (for $200k)\n• Instant Programs: $49 (for $5k) to $769 (for $100k)",
                                        },
                                        {
                                            question:
                                                "What Are the Rules for Trading a Funded Forex Account?",
                                            answer: "To trade with an FTM funded account, you must:\nHit profit targets\nRespect drawdown limits\nMeet the consistency score\nFor detailed rules for each program, please refer to our General Trading Rules.",
                                        },
                                        {
                                            question:
                                                "Can You Withdraw Profits from a Simulated Funded Account?",
                                            answer: "Yes! You can withdraw profits from your FTM Simulated Funded Account once you meet the trading criteria. Submit a payout request through your Trader Dashboard, choose your preferred payment method, and specify the amount.\n• Minimum Payout: 1% of your starting balance\n• Payout Frequency: On-demand\n• Processing Time: Typically within 24 business hours\n• Payout Methods: Crypto and Rise",
                                        },
                                        {
                                            question:
                                                "What Features Does Your Platform Provide?",
                                            answer: "Funded Trader Markets provides a user-friendly platform where traders can access virtual capital and trade up to $600,000. Key features include:\n• Affordable accounts compared to other firms\n• Simple Payout System with on-demand requests\n• Multiple Withdrawal Methods, including Crypto and Rise\n• Scaling Programs for consistent traders\n• Profit Sharing Up to 100%\n• Evaluation and Instant Funding Options",
                                        },
                                    ],
                                    admin: {
                                        description:
                                            "FAQ questions and answers for the homepage",
                                    },
                                    fields: [
                                        {
                                            name: "question",
                                            type: "text",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description: "FAQ question",
                                            },
                                        },
                                        {
                                            name: "answer",
                                            type: "textarea",
                                            localized: true,
                                            required: true,
                                            admin: {
                                                description:
                                                    "FAQ answer (supports line breaks)",
                                                rows: 4,
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};
