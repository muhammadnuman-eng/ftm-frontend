import type { GlobalConfig } from "payload";

export const CookieConsent: GlobalConfig = {
    slug: "cookie-consent",
    admin: {
        group: "Site Content",
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: "enabled",
            type: "checkbox",
            label: "Enable Cookie Consent",
            defaultValue: true,
            admin: {
                description: "Toggle cookie consent popup on/off",
            },
        },
        {
            name: "message",
            type: "text",
            label: "Consent Message",
            localized: true,
            required: true,
            defaultValue:
                "We use cookies and similar technologies to optimize your experience by processing data like browsing behavior, and withdrawing or withholding consent may affect site functionality.",
            admin: {
                description:
                    "Main message displayed in the cookie consent popup",
            },
        },
        {
            name: "acceptButtonText",
            type: "text",
            label: "Accept Button Text",
            localized: true,
            required: true,
            defaultValue: "Accept",
        },
        {
            name: "denyButtonText",
            type: "text",
            label: "Deny Button Text",
            localized: true,
            required: true,
            defaultValue: "Deny",
        },
        {
            name: "cookiePolicyLinkText",
            type: "text",
            label: "Cookie Policy Link Text",
            localized: true,
            required: true,
            defaultValue: "Cookie Policy",
        },
        {
            name: "privacyPolicyLinkText",
            type: "text",
            label: "Privacy Policy Link Text",
            localized: true,
            required: true,
            defaultValue: "Privacy Statement",
        },
        {
            name: "cookiePolicyUrl",
            type: "text",
            label: "Cookie Policy URL",
            required: true,
            defaultValue: "/cookie-policy",
            admin: {
                description:
                    "URL to the cookie policy page (e.g., /cookie-policy)",
            },
        },
        {
            name: "privacyPolicyUrl",
            type: "text",
            label: "Privacy Policy URL",
            required: true,
            defaultValue: "/privacy-policy",
            admin: {
                description: "URL to the privacy policy page",
            },
        },
    ],
};
