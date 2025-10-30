import type { GlobalConfig } from "payload";

export const Tools: GlobalConfig = {
    slug: "tools",
    admin: {
        group: "Site Content",
        livePreview: {
            url: ({ locale }) => {
                const baseUrl =
                    process.env.NEXT_PUBLIC_SERVER_URL ||
                    "http://localhost:3000";
                const path = locale ? `/${locale}/tools` : "/tools";
                return `${baseUrl}/api/draft?secret=${process.env.PAYLOAD_SECRET}&path=${encodeURIComponent(path)}`;
            },
        },
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: "tools",
            type: "array",
            localized: true,
            labels: {
                singular: "Tool",
                plural: "Tools",
            },
            admin: {
                description:
                    "Configure the tools shown on the Tools page. Each tool renders an iframe.",
            },
            fields: [
                {
                    type: "row",
                    fields: [
                        {
                            name: "enabled",
                            type: "checkbox",
                            defaultValue: true,
                            admin: { width: "20%" },
                        },
                        {
                            name: "id",
                            type: "text",
                            required: true,
                            admin: {
                                width: "40%",
                                description:
                                    "A short machine ID used as tab key (e.g., position-size).",
                            },
                        },
                        {
                            name: "icon",
                            type: "select",
                            defaultValue: "Calculator",
                            options: [
                                { label: "Calculator", value: "Calculator" },
                                { label: "TrendingUp", value: "TrendingUp" },
                                { label: "DollarSign", value: "DollarSign" },
                                { label: "BarChart3", value: "BarChart3" },
                            ],
                            admin: { width: "40%" },
                        },
                    ],
                },
                {
                    name: "name",
                    type: "text",
                    localized: true,
                    required: true,
                    label: "Display Name",
                },
                {
                    name: "description",
                    type: "textarea",
                    localized: true,
                    label: "Description",
                },
                {
                    name: "url",
                    type: "text",
                    required: true,
                    admin: {
                        description: "The iframe URL for this tool.",
                    },
                },
            ],
        },
    ],
};
