import type { GlobalConfig } from "payload";

export const Banners: GlobalConfig = {
    slug: "banners",
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
            name: "headerMarquee",
            type: "group",
            localized: true,
            label: "Header Banner",
            admin: {
                description:
                    "Configuration for the banner at the top of the site (marquee or fade)",
            },
            fields: [
                {
                    name: "enabled",
                    type: "checkbox",
                    defaultValue: true,
                    admin: {
                        description: "Enable or disable the header banner",
                    },
                },
                {
                    name: "viewType",
                    type: "select",
                    defaultValue: "marquee",
                    options: [
                        {
                            label: "Marquee (Scrolling)",
                            value: "marquee",
                        },
                        {
                            label: "Fade (Rotating)",
                            value: "fade",
                        },
                    ],
                    admin: {
                        description:
                            "Choose how the banner images are displayed",
                    },
                },
                {
                    name: "backgroundColor",
                    type: "select",
                    defaultValue: "indigo",
                    options: [
                        {
                            label: "Indigo Gradient",
                            value: "indigo",
                        },
                        {
                            label: "Blue Gradient",
                            value: "blue",
                        },
                        {
                            label: "Purple Gradient",
                            value: "purple",
                        },
                        {
                            label: "Green Gradient",
                            value: "green",
                        },
                        {
                            label: "Red Gradient",
                            value: "red",
                        },
                        {
                            label: "Black",
                            value: "black",
                        },
                    ],
                    admin: {
                        description: "Background color theme for the marquee",
                    },
                },
                {
                    name: "speed",
                    type: "select",
                    defaultValue: "normal",
                    options: [
                        {
                            label: "Slow (45s for marquee, 8s for fade)",
                            value: "slow",
                        },
                        {
                            label: "Normal (30s for marquee, 5s for fade)",
                            value: "normal",
                        },
                        {
                            label: "Fast (15s for marquee, 3s for fade)",
                            value: "fast",
                        },
                    ],
                    admin: {
                        description:
                            "Animation speed - applies to marquee scrolling or fade rotation",
                    },
                },
                {
                    name: "images",
                    type: "array",
                    localized: true,
                    required: true,
                    minRows: 1,
                    admin: {
                        description: "Images to display in the marquee banner",
                    },
                    fields: [
                        {
                            name: "image",
                            type: "upload",
                            relationTo: "media",
                            required: true,
                            admin: {
                                description:
                                    "Banner image (recommended height: 64px)",
                            },
                        },
                        {
                            name: "url",
                            type: "text",
                            localized: true,
                            label: "Link URL",
                            admin: {
                                description:
                                    "Optional: clicking the banner opens this URL",
                            },
                        },
                        {
                            name: "openInNewTab",
                            type: "checkbox",
                            label: "Open in new tab",
                            defaultValue: true,
                        },
                        {
                            name: "nofollow",
                            type: "checkbox",
                            label: 'Add rel="nofollow"',
                            defaultValue: false,
                        },
                        {
                            type: "row",
                            fields: [
                                {
                                    name: "status",
                                    type: "select",
                                    defaultValue: "active",
                                    options: [
                                        {
                                            label: "Active",
                                            value: "active",
                                        },
                                        {
                                            label: "Passive (Hidden)",
                                            value: "passive",
                                        },
                                    ],
                                    admin: {
                                        width: "33%",
                                    },
                                },
                                {
                                    name: "visibleFrom",
                                    type: "date",
                                    admin: {
                                        date: {
                                            pickerAppearance: "dayAndTime",
                                        },
                                        width: "33%",
                                    },
                                },
                                {
                                    name: "visibleUntil",
                                    type: "date",
                                    admin: {
                                        date: {
                                            pickerAppearance: "dayAndTime",
                                        },
                                        width: "34%",
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
