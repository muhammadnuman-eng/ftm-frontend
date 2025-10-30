import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import type { ProgramProductMapping } from "@/payload-types";

type MappingItem = NonNullable<ProgramProductMapping["mappings"]>[0];

/**
 * Debug endpoint to check program-product-mappings configuration
 * GET /api/debug/check-mappings
 */
export async function GET() {
    try {
        const payload = await getPayload({ config });

        const mappingsGlobal = await payload.findGlobal({
            slug: "program-product-mappings",
        });

        const mappings = mappingsGlobal?.mappings || [];

        // Filter to only show mappings that have product/variation IDs set
        const configuredMappings = mappings
            .filter((m: MappingItem) => m.productId && m.variationId)
            .map((m: MappingItem) => ({
                displayName: m.displayName,
                tierId: m.tierId,
                platformId: m.platformId,
                productId: m.productId,
                variationId: m.variationId,
            }));

        const unconfiguredMappings = mappings
            .filter((m: MappingItem) => !m.productId || !m.variationId)
            .map((m: MappingItem) => ({
                displayName: m.displayName,
                tierId: m.tierId,
                platformId: m.platformId,
            }));

        return NextResponse.json(
            {
                total: mappings.length,
                configured: configuredMappings.length,
                unconfigured: unconfiguredMappings.length,
                configuredMappings,
                unconfiguredMappings,
            },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
