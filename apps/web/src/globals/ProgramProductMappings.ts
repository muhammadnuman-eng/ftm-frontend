import type { GlobalConfig } from "payload";
import type { Platform, Program } from "../payload-types";

type PayloadInstance = {
    find(args: {
        collection: "programs";
        [key: string]: unknown;
    }): Promise<{ docs: Program[] }>;
    find(args: {
        collection: "platforms";
        [key: string]: unknown;
    }): Promise<{ docs: Platform[] }>;
};

interface Mapping {
    id: string;
    displayName: string;
    program: number | string;
    tierId: string;
    platformId: string;
    productId: string;
    variationId: string;
    reset_fee_product_id: string;
    reset_fee_funded_product_id: string;
    reset_fee_funded_variation_id: string;
    activation_product_id: string;
}

// Helper function to build mappings automatically
async function buildMappings(payload: PayloadInstance): Promise<Mapping[]> {
    try {
        // 1. Fetch all active programs
        const programsRes = await payload.find({
            collection: "programs",
            where: {
                isActive: {
                    equals: true,
                },
            },
            limit: 100,
        });

        // 2. Fetch all platforms
        const platformsRes = await payload.find({
            collection: "platforms",
            limit: 100,
        });

        const programs = programsRes?.docs || [];
        const platforms = platformsRes?.docs || [];

        if (programs.length === 0 || platforms.length === 0) {
            return [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappings: Mapping[] = [];

        // 3. Generate all combinations
        for (const program of programs) {
            if (!program.pricingTiers || program.pricingTiers.length === 0) {
                continue;
            }

            for (
                let tierIndex = 0;
                tierIndex < program.pricingTiers.length;
                tierIndex++
            ) {
                const tier = program.pricingTiers[tierIndex];

                // Generate a fallback ID if tier.id is null/undefined
                const tierId =
                    tier.id ||
                    `tier-${tierIndex}-${tier.accountSize?.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

                for (const platform of platforms) {
                    const mappingId = `${program.slug}-${tierId}-${platform.slug}`;

                    // Generate display name for admin UI
                    let tierDisplayName = tier.accountSize || tierId;
                    if (tierId.includes("tier-") && tier.accountSize) {
                        tierDisplayName = tier.accountSize;
                    } else if (tierId.includes("tier-")) {
                        // Parse generated ID: "tier-0-10-000" -> "$10,000"
                        const parts = tierId.split("-");
                        if (parts.length >= 3) {
                            const accountParts = parts.slice(2);
                            let accountSize = accountParts.join("");
                            if (accountSize.length >= 4) {
                                accountSize = accountSize.replace(
                                    /(\d)(\d{3})$/,
                                    "$1,$2",
                                );
                            }
                            tierDisplayName = `$${accountSize}`;
                        }
                    }

                    const platformName = platform.name || platform.slug;
                    const displayName = `${program.name} - ${tierDisplayName} - ${platformName}`;

                    mappings.push({
                        id: mappingId,
                        displayName: displayName,
                        program: program.id,
                        tierId: tierId,
                        platformId: platform.slug,
                        productId: "", // Will be filled manually by admin
                        variationId: "", // Will be filled manually by admin
                        reset_fee_product_id: "", // Will be filled manually by admin
                        reset_fee_funded_product_id: "", // Will be filled manually by admin
                        reset_fee_funded_variation_id: "", // Will be filled manually by admin
                        activation_product_id: "", // Will be filled manually by admin
                    });
                }
            }
        }

        return mappings;
    } catch (error) {
        console.error("Error building mappings:", error);
        return [];
    }
}

// Helper function to validate platform IDs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function validatePlatformIds(
    mappings: Mapping[],
    payload: PayloadInstance,
): Promise<Mapping[]> {
    try {
        const platformsRes = await payload.find({
            collection: "platforms",
            limit: 100,
        });

        const validPlatformIds = (platformsRes?.docs || []).map(
            (platform) => platform.slug,
        );

        return mappings.filter((mapping) => {
            if (!validPlatformIds.includes(mapping.platformId)) {
                return false;
            }
            return true;
        });
    } catch (error) {
        console.error("Error validating platform IDs:", error);
        return mappings;
    }
}

export const ProgramProductMappings: GlobalConfig = {
    slug: "program-product-mappings",
    admin: {
        group: "Commerce",
        description:
            "Automatically generated mappings between programs, tiers, and platforms. Fill in Product ID and Variation ID for each combination.",
    },
    access: {
        read: () => true,
        update: () => true,
    },
    hooks: {
        afterRead: [
            async ({ doc, req: { payload } }) => {
                // Auto-generate mappings if none exist or if they're incomplete
                const existingMappings = Array.isArray(doc?.mappings)
                    ? (doc.mappings as Mapping[])
                    : [];
                const autoGeneratedMappings = await buildMappings(payload);

                if (autoGeneratedMappings.length === 0) {
                    return doc;
                }

                // Create a lookup map for existing mappings by their key characteristics
                // Use program + platformId + displayName as the stable key
                const existingMap = new Map<string, Mapping>();
                for (const mapping of existingMappings) {
                    const programId =
                        typeof mapping.program === "number"
                            ? mapping.program
                            : typeof mapping.program === "object" &&
                                mapping.program !== null
                              ? (mapping.program as { id?: number }).id
                              : 0;
                    // Create lookup keys using multiple strategies
                    const keys = [
                        // Primary key: program + tierId + platform
                        `${programId}-${mapping.tierId}-${mapping.platformId}`,
                        // Fallback key: program + displayName + platform (survives tierId changes)
                        `${programId}-${mapping.displayName}-${mapping.platformId}`,
                    ];

                    for (const key of keys) {
                        if (key && !existingMap.has(key)) {
                            existingMap.set(key, mapping);
                        }
                    }
                }

                // Merge existing user data with auto-generated structure
                const mergedMappings = autoGeneratedMappings.map(
                    (autoMapping) => {
                        const programId =
                            typeof autoMapping.program === "number"
                                ? autoMapping.program
                                : 0;

                        // Try to find existing mapping using multiple keys
                        const lookupKeys = [
                            // Try exact tierId match first
                            `${programId}-${autoMapping.tierId}-${autoMapping.platformId}`,
                            // Try displayName match (more stable across tierId changes)
                            `${programId}-${autoMapping.displayName}-${autoMapping.platformId}`,
                        ];

                        let existing: Mapping | undefined;
                        for (const key of lookupKeys) {
                            existing = existingMap.get(key);
                            if (existing) break;
                        }

                        if (existing) {
                            // Preserve user-entered productId and variationId
                            return {
                                ...autoMapping,
                                productId: existing.productId || "",
                                variationId: existing.variationId || "",
                                reset_fee_product_id:
                                    existing.reset_fee_product_id || "",
                                reset_fee_funded_product_id:
                                    existing.reset_fee_funded_product_id || "",
                                reset_fee_funded_variation_id:
                                    existing.reset_fee_funded_variation_id ||
                                    "",
                                activation_product_id:
                                    existing.activation_product_id || "",
                            };
                        }

                        return autoMapping;
                    },
                );

                return {
                    ...doc,
                    mappings: mergedMappings,
                };
            },
        ],
        beforeValidate: [
            async ({ data, req: { payload } }) => {
                // Validate and clean up mappings before saving
                const mappings = Array.isArray(data?.mappings)
                    ? (data.mappings as Mapping[])
                    : [];
                const validatedMappings = await validatePlatformIds(
                    mappings,
                    payload,
                );

                return {
                    ...data,
                    mappings: validatedMappings,
                };
            },
        ],
    },
    fields: [
        {
            name: "mappings",
            type: "array",
            labels: {
                singular: "Program Product Mapping",
                plural: "Program Product Mappings",
            },
            admin: {
                description:
                    "Map program pricing tiers to e-commerce product/variation IDs for each platform.",
            },
            fields: [
                {
                    name: "program",
                    type: "relationship",
                    relationTo: "programs",
                    required: true,
                    label: "Program",
                    admin: {
                        hidden: true,
                        description: "Auto-populated from active programs",
                    },
                },
                {
                    name: "tierId",
                    type: "text",
                    required: true,
                    label: "Tier ID",
                    admin: {
                        hidden: true,
                        description:
                            "Auto-populated from program pricing tiers",
                    },
                },
                {
                    name: "platformId",
                    type: "text",
                    required: true,
                    label: "Platform",
                    admin: {
                        hidden: true,
                        description: "Auto-populated from platforms",
                    },
                },
                {
                    type: "row",
                    fields: [
                        {
                            name: "displayName",
                            type: "text",
                            required: false,
                            label: "Display Name",
                            admin: {
                                readOnly: true,
                            },
                        },
                        {
                            name: "productId",
                            type: "text",
                            required: false,
                            label: "PID",
                            admin: {
                                width: "100px",
                            },
                        },
                        {
                            name: "variationId",
                            type: "text",
                            required: false,
                            label: "VID",
                            admin: {
                                width: "80px",
                            },
                        },
                        {
                            name: "reset_fee_product_id",
                            type: "text",
                            required: false,
                            label: "Reset Fee PID",
                            admin: {
                                width: "110px",
                            },
                        },
                        {
                            name: "reset_fee_funded_product_id",
                            type: "text",
                            required: false,
                            label: "Reset Fee Funded PID",
                            admin: {
                                width: "160px",
                            },
                        },
                        {
                            name: "reset_fee_funded_variation_id",
                            type: "text",
                            required: false,
                            label: "Reset Fee Funded VID",
                            admin: {
                                width: "160px",
                            },
                        },
                        {
                            name: "activation_product_id",
                            type: "text",
                            required: false,
                            label: "Activation PID",
                            admin: {
                                width: "120px",
                            },
                        },
                    ],
                },
            ],
        },
    ],
};
