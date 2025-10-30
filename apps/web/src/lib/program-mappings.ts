import { getPayload } from "payload";
import configPromise from "@/payload.config";
import type { ProgramProductMapping } from "@/payload-types";

export interface ProgramMapping {
    id: string;
    program: string | number;
    tierId: string;
    platformId: string;
    productId: string;
    variationId: string;
}

type MappingItem = NonNullable<ProgramProductMapping["mappings"]>[0];

export interface MappingQuery {
    programId: string | number;
    tierId: string;
    platformId: string;
}

/**
 * Find a specific mapping for program-tier-platform combination
 */
export async function findMapping(
    query: MappingQuery,
): Promise<ProgramMapping | null> {
    try {
        const payload = await getPayload({ config: configPromise });

        const mappingsGlobal = await payload.findGlobal({
            slug: "program-product-mappings",
        });

        const mappings = mappingsGlobal?.mappings || [];

        const mapping = mappings.find((mapping: MappingItem) => {
            const mappingProgramId =
                typeof mapping.program === "number"
                    ? mapping.program
                    : typeof mapping.program === "object" &&
                        mapping.program !== null
                      ? mapping.program.id
                      : null;

            const programMatch =
                String(mappingProgramId) === String(query.programId);

            const tierMatch = mapping.tierId === query.tierId;
            const platformMatch = mapping.platformId === query.platformId;

            return programMatch && tierMatch && platformMatch;
        });

        if (!mapping) {
            console.warn(
                `No mapping found for program: ${query.programId}, tier: ${query.tierId}, platform: ${query.platformId}`,
            );
            return null;
        }

        if (!mapping.productId || !mapping.variationId) {
            console.warn(
                `Mapping found but missing product/variation IDs for program: ${query.programId}, tier: ${query.tierId}, platform: ${query.platformId}`,
            );
            return null;
        }

        return {
            id: mapping.id || "",
            program:
                typeof mapping.program === "number"
                    ? mapping.program
                    : typeof mapping.program === "object" &&
                        mapping.program !== null
                      ? mapping.program.id
                      : 0,
            tierId: mapping.tierId,
            platformId: mapping.platformId,
            productId: mapping.productId,
            variationId: mapping.variationId,
        };
    } catch (error) {
        console.error("Error finding mapping:", error);
        return null;
    }
}

/**
 * Get all mappings for a specific program
 */
export async function getProgramMappings(
    programId: string | number,
): Promise<ProgramMapping[]> {
    try {
        const payload = await getPayload({ config: configPromise });

        const mappingsGlobal = await payload.findGlobal({
            slug: "program-product-mappings",
        });

        const mappings = mappingsGlobal?.mappings || [];

        return mappings
            .filter((mapping: MappingItem) => {
                const programMatch =
                    mapping.program === programId ||
                    (typeof mapping.program === "object" &&
                        mapping.program?.id === programId);

                return programMatch && mapping.productId && mapping.variationId;
            })
            .map((mapping: MappingItem) => ({
                id: mapping.id || "",
                program:
                    typeof mapping.program === "number"
                        ? mapping.program
                        : typeof mapping.program === "object" &&
                            mapping.program !== null
                          ? mapping.program.id
                          : 0,
                tierId: mapping.tierId,
                platformId: mapping.platformId,
                productId: mapping.productId || "",
                variationId: mapping.variationId || "",
            }));
    } catch (error) {
        console.error("Error getting program mappings:", error);
        return [];
    }
}

/**
 * Get all available platforms for a program
 */
export async function getAvailablePlatforms(
    programId: string | number,
): Promise<string[]> {
    try {
        const mappings = await getProgramMappings(programId);
        const platformIds = [...new Set(mappings.map((m) => m.platformId))];
        return platformIds;
    } catch (error) {
        console.error("Error getting available platforms:", error);
        return [];
    }
}

/**
 * Get all available tiers for a program on a specific platform
 */
export async function getAvailableTiers(
    programId: string | number,
    platformId: string,
): Promise<string[]> {
    try {
        const mappings = await getProgramMappings(programId);
        const tierIds = mappings
            .filter((m) => m.platformId === platformId)
            .map((m) => m.tierId);
        return [...new Set(tierIds)];
    } catch (error) {
        console.error("Error getting available tiers:", error);
        return [];
    }
}

/**
 * Validate if a program-tier-platform combination is available for purchase
 */
export async function validatePurchaseCombination(
    query: MappingQuery,
): Promise<boolean> {
    try {
        const mapping = await findMapping(query);
        return mapping !== null;
    } catch (error) {
        console.error("Error validating purchase combination:", error);
        return false;
    }
}

/**
 * Get product and variation IDs for checkout
 */
export async function getCheckoutIds(query: MappingQuery): Promise<{
    productId: string;
    variationId: string;
} | null> {
    try {
        const mapping = await findMapping(query);

        if (!mapping) {
            return null;
        }

        return {
            productId: mapping.productId,
            variationId: mapping.variationId,
        };
    } catch (error) {
        console.error("Error getting checkout IDs:", error);
        return null;
    }
}

/**
 * Debug function to list all mappings
 */
export async function getAllMappings(): Promise<ProgramMapping[]> {
    try {
        const payload = await getPayload({ config: configPromise });

        const mappingsGlobal = await payload.findGlobal({
            slug: "program-product-mappings",
        });

        const mappings = mappingsGlobal?.mappings || [];

        return mappings.map((mapping: MappingItem) => ({
            id: mapping.id || "",
            program:
                typeof mapping.program === "number"
                    ? mapping.program
                    : typeof mapping.program === "object" &&
                        mapping.program !== null
                      ? mapping.program.id
                      : 0,
            tierId: mapping.tierId,
            platformId: mapping.platformId,
            productId: mapping.productId || "",
            variationId: mapping.variationId || "",
        }));
    } catch (error) {
        console.error("Error getting all mappings:", error);
        return [];
    }
}

/**
 * Find mapping and purchase type by external product ID
 * Checks variationId, reset_fee_product_id, and activation_product_id
 */
export async function findMappingByProductId(productId: string): Promise<{
    mapping: ProgramMapping;
    purchaseType: "original-order" | "reset-order" | "activation-order";
} | null> {
    try {
        const payload = await getPayload({ config: configPromise });

        const mappingsGlobal = await payload.findGlobal({
            slug: "program-product-mappings",
        });

        const mappings = mappingsGlobal?.mappings || [];

        for (const mapping of mappings) {
            // Check if productId matches variationId
            if (mapping.variationId === productId) {
                return {
                    mapping: {
                        id: mapping.id || "",
                        program:
                            typeof mapping.program === "number"
                                ? mapping.program
                                : typeof mapping.program === "object" &&
                                    mapping.program !== null
                                  ? mapping.program.id
                                  : 0,
                        tierId: mapping.tierId,
                        platformId: mapping.platformId,
                        productId: mapping.productId || "",
                        variationId: mapping.variationId || "",
                    },
                    purchaseType: "original-order",
                };
            }

            // Check if productId matches reset_fee_product_id
            if (mapping.reset_fee_product_id === productId) {
                return {
                    mapping: {
                        id: mapping.id || "",
                        program:
                            typeof mapping.program === "number"
                                ? mapping.program
                                : typeof mapping.program === "object" &&
                                    mapping.program !== null
                                  ? mapping.program.id
                                  : 0,
                        tierId: mapping.tierId,
                        platformId: mapping.platformId,
                        productId: mapping.productId || "",
                        variationId: mapping.variationId || "",
                    },
                    purchaseType: "reset-order",
                };
            }

            // Check if productId matches reset_fee_funded_product_id
            if (mapping.reset_fee_funded_product_id === productId) {
                return {
                    mapping: {
                        id: mapping.id || "",
                        program:
                            typeof mapping.program === "number"
                                ? mapping.program
                                : typeof mapping.program === "object" &&
                                    mapping.program !== null
                                  ? mapping.program.id
                                  : 0,
                        tierId: mapping.tierId,
                        platformId: mapping.platformId,
                        productId: mapping.productId || "",
                        variationId: mapping.variationId || "",
                    },
                    purchaseType: "reset-order",
                };
            }

            // Check if productId matches activation_product_id
            if (mapping.activation_product_id === productId) {
                return {
                    mapping: {
                        id: mapping.id || "",
                        program:
                            typeof mapping.program === "number"
                                ? mapping.program
                                : typeof mapping.program === "object" &&
                                    mapping.program !== null
                                  ? mapping.program.id
                                  : 0,
                        tierId: mapping.tierId,
                        platformId: mapping.platformId,
                        productId: mapping.productId || "",
                        variationId: mapping.variationId || "",
                    },
                    purchaseType: "activation-order",
                };
            }
        }

        console.warn(`No mapping found for product ID: ${productId}`);
        return null;
    } catch (error) {
        console.error("Error finding mapping by product ID:", error);
        return null;
    }
}
