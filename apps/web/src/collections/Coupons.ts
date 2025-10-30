import type { CollectionConfig } from "payload";

export const Coupons: CollectionConfig = {
    slug: "coupons",
    admin: {
        useAsTitle: "code",
        defaultColumns: [
            "code",
            "name",
            "discountType",
            "status",
            "validFrom",
            "validTo",
        ],
        group: "Commerce",
    },
    access: {
        read: ({ req: { user } }) => {
            // Admin, editor, author can read all coupons
            if (
                user?.role &&
                ["admin", "editor", "author"].includes(user.role)
            ) {
                return true;
            }
            // Authors (customers) can only see active coupons
            if (user?.role === "author") {
                return {
                    status: {
                        equals: "active",
                    },
                };
            }
            return false;
        },
        create: ({ req: { user } }) => {
            return Boolean(
                user?.role && ["admin", "editor"].includes(user.role),
            );
        },
        update: ({ req: { user } }) => {
            return Boolean(
                user?.role && ["admin", "editor"].includes(user.role),
            );
        },
        delete: ({ req: { user } }) => {
            return Boolean(user?.role === "admin");
        },
    },
    fields: [
        {
            type: "tabs",
            tabs: [
                {
                    label: "Basic Information",
                    fields: [
                        {
                            name: "code",
                            type: "text",
                            required: true,
                            unique: true,
                            label: "Coupon Code",
                            admin: {
                                description:
                                    "Unique coupon code (e.g., SUMMER2025, WELCOME10)",
                            },
                            validate: (value: unknown) => {
                                const code = value as string;
                                if (!code) return "Coupon code is required";
                                if (code.length < 3)
                                    return "Coupon code must be at least 3 characters";
                                if (code.length > 50)
                                    return "Coupon code must be less than 50 characters";
                                if (!/^[A-Z0-9_-]+$/i.test(code)) {
                                    return "Coupon code can only contain letters, numbers, hyphens, and underscores";
                                }
                                return true;
                            },
                            hooks: {
                                beforeValidate: [
                                    ({ value }) => {
                                        return typeof value === "string"
                                            ? value.toUpperCase()
                                            : value;
                                    },
                                ],
                            },
                        },
                        {
                            name: "name",
                            type: "text",
                            required: true,
                            label: "Internal Name",
                            admin: {
                                description:
                                    "Internal name for admin reference (e.g., Summer 2025 Campaign)",
                            },
                        },
                        {
                            name: "description",
                            type: "textarea",
                            label: "Description",
                            admin: {
                                description: "Internal notes about this coupon",
                            },
                        },
                        {
                            name: "status",
                            type: "select",
                            required: true,
                            defaultValue: "active",
                            options: [
                                { label: "Active", value: "active" },
                                { label: "Inactive", value: "inactive" },
                                { label: "Scheduled", value: "scheduled" },
                                { label: "Expired", value: "expired" },
                            ],
                            label: "Status",
                            admin: {
                                description: "Current status of the coupon",
                            },
                        },
                    ],
                },
                {
                    label: "Discount Configuration",
                    fields: [
                        {
                            name: "discountType",
                            type: "select",
                            required: true,
                            options: [
                                { label: "Percentage", value: "percentage" },
                                { label: "Fixed Amount", value: "fixed" },
                            ],
                            label: "Discount Type",
                            admin: {
                                description: "Type of discount to apply",
                            },
                        },
                        {
                            name: "discountValue",
                            type: "number",
                            required: true,
                            label: "Base Discount Value",
                            admin: {
                                description:
                                    "Base discount amount (percentage or dollar amount)",
                            },
                            validate: (
                                value: unknown,
                                options: { data?: { discountType?: string } },
                            ) => {
                                const discountValue = value as number;
                                const data = options.data;
                                if (typeof discountValue !== "number")
                                    return "Discount value is required";
                                if (discountValue <= 0)
                                    return "Discount value must be greater than 0";
                                if (
                                    data?.discountType === "percentage" &&
                                    discountValue > 100
                                ) {
                                    return "Percentage discount cannot exceed 100%";
                                }
                                return true;
                            },
                        },
                        {
                            name: "accountSizeDiscounts",
                            type: "array",
                            label: "Account Size Specific Discounts",
                            admin: {
                                description:
                                    "Override discount values for specific account sizes",
                            },
                            fields: [
                                {
                                    name: "accountSize",
                                    type: "select",
                                    required: true,
                                    options: [
                                        { label: "$5K", value: "5K" },
                                        { label: "$10K", value: "10K" },
                                        { label: "$25K", value: "25K" },
                                        { label: "$50K", value: "50K" },
                                        { label: "$100K", value: "100K" },
                                        { label: "$200K", value: "200K" },
                                    ],
                                    label: "Account Size",
                                },
                                {
                                    name: "discountValue",
                                    type: "number",
                                    required: true,
                                    label: "Discount Value",
                                    admin: {
                                        description:
                                            "Override discount for this account size",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    label: "Program Restrictions",
                    fields: [
                        {
                            name: "restrictionType",
                            type: "select",
                            required: true,
                            defaultValue: "all",
                            options: [
                                { label: "All Programs", value: "all" },
                                {
                                    label: "Whitelist (Only Selected)",
                                    value: "whitelist",
                                },
                                {
                                    label: "Blacklist (Exclude Selected)",
                                    value: "blacklist",
                                },
                            ],
                            label: "Restriction Type",
                            admin: {
                                description:
                                    "How to apply program restrictions",
                            },
                        },
                        {
                            name: "applicablePrograms",
                            type: "relationship",
                            relationTo: "programs",
                            hasMany: true,
                            label: "Applicable Programs",
                            admin: {
                                description:
                                    "Programs this coupon can be used with",
                                condition: (data) =>
                                    data.restrictionType === "whitelist",
                            },
                        },
                        {
                            name: "excludedPrograms",
                            type: "relationship",
                            relationTo: "programs",
                            hasMany: true,
                            label: "Excluded Programs",
                            admin: {
                                description:
                                    "Programs this coupon cannot be used with",
                                condition: (data) =>
                                    data.restrictionType === "blacklist",
                            },
                        },
                    ],
                },
                {
                    label: "Validity Period",
                    fields: [
                        {
                            name: "validFrom",
                            type: "date",
                            required: true,
                            label: "Valid From",
                            admin: {
                                description: "When this coupon becomes active",
                                date: {
                                    pickerAppearance: "dayAndTime",
                                },
                            },
                        },
                        {
                            name: "validTo",
                            type: "date",
                            required: false,
                            label: "Valid Until",
                            admin: {
                                description:
                                    "When this coupon expires (leave empty for never-expiring coupons)",
                                date: {
                                    pickerAppearance: "dayAndTime",
                                },
                            },
                            validate: (
                                value: unknown,
                                options: {
                                    data?: {
                                        validFrom?: string | number | Date;
                                    };
                                },
                            ) => {
                                const validTo = value as Date;
                                const data = options.data;
                                if (!validTo || !data?.validFrom) return true;
                                const validFrom = new Date(data.validFrom);
                                const validToDate = new Date(validTo);
                                if (validToDate <= validFrom) {
                                    return "Valid until date must be after valid from date";
                                }
                                return true;
                            },
                        },
                    ],
                },
                {
                    label: "Usage Limits",
                    fields: [
                        {
                            name: "totalUsageLimit",
                            type: "number",
                            defaultValue: 0,
                            label: "Total Usage Limit",
                            admin: {
                                description:
                                    "Maximum number of times this coupon can be used (0 = unlimited)",
                            },
                            validate: (value: unknown) => {
                                const limit = value as number;
                                if (typeof limit !== "number")
                                    return "Usage limit must be a number";
                                if (limit < 0)
                                    return "Usage limit cannot be negative";
                                return true;
                            },
                        },
                        {
                            name: "usagePerUser",
                            type: "number",
                            defaultValue: 1,
                            label: "Usage Per User",
                            admin: {
                                description:
                                    "Maximum number of times one user can use this coupon (0 = unlimited)",
                            },
                            validate: (value: unknown) => {
                                const limit = value as number;
                                if (typeof limit !== "number")
                                    return "Usage per user must be a number";
                                if (limit < 0)
                                    return "Usage per user cannot be negative";
                                return true;
                            },
                        },
                    ],
                },
                {
                    label: "Auto-Apply Settings",
                    fields: [
                        {
                            name: "autoApply",
                            type: "checkbox",
                            defaultValue: false,
                            label: "Auto-Apply Coupon",
                            admin: {
                                description:
                                    "Automatically apply this coupon when conditions are met",
                            },
                        },
                        {
                            name: "autoApplyPriority",
                            type: "number",
                            defaultValue: 0,
                            label: "Auto-Apply Priority",
                            admin: {
                                description:
                                    "Priority when multiple auto-apply coupons match (higher = higher priority)",
                                condition: (data) => data.autoApply,
                            },
                        },
                        {
                            name: "autoApplyMessage",
                            type: "text",
                            label: "Auto-Apply Message",
                            admin: {
                                description:
                                    "Message to show when coupon is auto-applied (e.g., 'Special discount applied!')",
                                condition: (data) => data.autoApply,
                            },
                        },
                        {
                            name: "preventManualEntry",
                            type: "checkbox",
                            defaultValue: false,
                            label: "Prevent Manual Entry",
                            admin: {
                                description:
                                    "Prevent users from manually entering this coupon code (auto-apply only)",
                                condition: (data) => data.autoApply,
                            },
                        },
                    ],
                },
                {
                    label: "Affiliate Settings",
                    fields: [
                        {
                            name: "affiliateId",
                            type: "text",
                            label: "Affiliate ID",
                            admin: {
                                description: "Affiliate ID",
                            },
                        },
                        {
                            name: "affiliateEmail",
                            type: "email",
                            label: "Affiliate Email",
                            admin: {
                                description: "Affiliate email",
                            },
                        },
                        {
                            name: "affiliateUsername",
                            type: "text",
                            label: "Affiliate Username",
                            admin: {
                                description:
                                    "AffiliateWP username for coupon-based affiliate tracking",
                            },
                        },
                    ],
                },
            ],
        },
    ],
    hooks: {
        beforeChange: [
            ({ data }) => {
                // Auto-update status based on dates
                if (data.validFrom) {
                    const now = new Date();
                    const validFrom = new Date(data.validFrom);

                    if (now < validFrom) {
                        data.status = "scheduled";
                    } else if (data.validTo) {
                        // Has expiration date
                        const validTo = new Date(data.validTo);
                        if (now > validTo) {
                            data.status = "expired";
                        } else if (
                            data.status === "scheduled" ||
                            data.status === "expired"
                        ) {
                            data.status = "active";
                        }
                    } else {
                        // Never-expiring coupon
                        if (
                            data.status === "scheduled" ||
                            data.status === "expired"
                        ) {
                            data.status = "active";
                        }
                    }
                }
                return data;
            },
        ],
    },
    timestamps: true,
};
