import type { GlobalConfig } from "payload";

export const Policies: GlobalConfig = {
    slug: "policies",
    admin: {
        group: "Site Content",
        livePreview: {
            url: ({ locale }) => {
                const baseUrl =
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3000";
                const path = locale
                    ? `/${locale}/legal/terms-of-service`
                    : "/legal/terms-of-service";
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
                    label: "Terms of Service",
                    fields: [
                        {
                            name: "termsOfService",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,

                                    defaultValue:
                                        "Funded Trader Markets Terms of Service",
                                },
                                {
                                    name: "content",
                                    type: "richText",
                                    localized: true,
                                },
                                {
                                    name: "seo",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            admin: { rows: 3 },
                                        },
                                        {
                                            name: "keywords",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "ogImage",
                                            type: "upload",
                                            relationTo: "media",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Affiliate Policy",
                    fields: [
                        {
                            name: "affiliatePolicy",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,

                                    defaultValue:
                                        "Funded Trader Markets Affiliate Policy",
                                },
                                {
                                    name: "content",
                                    type: "richText",
                                    localized: true,
                                },
                                {
                                    name: "seo",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            admin: { rows: 3 },
                                        },
                                        {
                                            name: "keywords",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "ogImage",
                                            type: "upload",
                                            relationTo: "media",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Privacy Policy",
                    fields: [
                        {
                            name: "privacyPolicy",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,

                                    defaultValue:
                                        "Funded Trader Markets Privacy Policy",
                                },
                                {
                                    name: "content",
                                    type: "richText",
                                    localized: true,
                                },
                                {
                                    name: "seo",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            admin: { rows: 3 },
                                        },
                                        {
                                            name: "keywords",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "ogImage",
                                            type: "upload",
                                            relationTo: "media",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Refund Policy",
                    fields: [
                        {
                            name: "refundPolicy",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,

                                    defaultValue:
                                        "Funded Trader Markets Refund Policy",
                                },
                                {
                                    name: "content",
                                    type: "richText",
                                    localized: true,
                                },
                                {
                                    name: "seo",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            admin: { rows: 3 },
                                        },
                                        {
                                            name: "keywords",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "ogImage",
                                            type: "upload",
                                            relationTo: "media",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Cookie Policy",
                    fields: [
                        {
                            name: "cookiePolicy",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,

                                    defaultValue:
                                        "Funded Trader Markets Cookie Policy",
                                },
                                {
                                    name: "content",
                                    type: "richText",
                                    localized: true,
                                },
                                {
                                    name: "seo",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            admin: { rows: 3 },
                                        },
                                        {
                                            name: "keywords",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "ogImage",
                                            type: "upload",
                                            relationTo: "media",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "AML Policy",
                    fields: [
                        {
                            name: "amlPolicy",
                            type: "group",
                            localized: true,
                            fields: [
                                {
                                    name: "title",
                                    type: "text",
                                    localized: true,

                                    defaultValue:
                                        "Funded Trader Markets AML Policy",
                                },
                                {
                                    name: "content",
                                    type: "richText",
                                    localized: true,
                                },
                                {
                                    name: "seo",
                                    type: "group",
                                    localized: true,
                                    fields: [
                                        {
                                            name: "title",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "description",
                                            type: "textarea",
                                            localized: true,
                                            admin: { rows: 3 },
                                        },
                                        {
                                            name: "keywords",
                                            type: "text",
                                            localized: true,
                                        },
                                        {
                                            name: "ogImage",
                                            type: "upload",
                                            relationTo: "media",
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
