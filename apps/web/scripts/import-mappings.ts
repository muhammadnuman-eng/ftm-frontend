import { config } from "dotenv";
config();

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import csv from "csv-parser";
import { getPayloadClient } from "../src/lib/payload";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const platformIds = {
    "MetaTrader5": 1,
    "CTrader": 2,
    "MatchTrader": 3,
    "TradeLocker": 4,
}

const programIds = {
    'Nitro': 19,
    'OneStep Nitro Pro': 20,
    'OneStep Nitro X': 21,
    'Speed': 22,
    'Standard': 23,
    'TwoStep Plus': 24,
    'Instant Funded': 25,
    'Instant Funded Pro': 26,
    'Instant Funding Plus': 27,
  }

function parseCSV(filePath: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
        const records: Record<string, any>[] = [];
        
        fs.createReadStream(filePath)
            .pipe(csv({ 
                skipLines: 0,
                mapHeaders: ({ header }) => header.trim().replace(/^[\uFEFF\ufeff]/, '').replace(/^["']|["']$/g, '')
            }))
            .on("data", (row) => {
                const accountSize = row['Description']?.split(" - ")[0]?.trim().toUpperCase();
                const variationId = Number(row['PlanID'])
                const productId = Number(row['ProductID'])
                const platform = row['Platform']
                const programName = row['Description']
                    .replace('1-Step', 'OneStep')
                    .replace('1- Step', 'OneStep')
                    .replace('1 Step', 'OneStep')
                    .replace('2-Step', 'TwoStep')
                    .replace('2- Step', 'TwoStep')
                    .replace('2 Step', 'TwoStep')
                    .replace('2 - Step', 'TwoStep')
                .split("-")[1]?.trim()
                const programId = programIds[programName as keyof typeof programIds]
                const platformId = platformIds[platform as keyof typeof platformIds]

                records.push({
                    accountSize,
                    variationId,
                    productId,
                    platform,
                    programName,
                    programId,
                    platformId,
                });
            })
            .on("end", () => {
                resolve(records);
            })
            .on("error", (error) => {
                console.error("Error processing CSV:", error);
                reject(error);
            });
    });
}

// Normalizers
function normalizeAccountSize(size: string): string {
    const raw = (size || "").toString().trim().toUpperCase();
    if (!raw) return raw;
    const withDollar = raw.startsWith("$") ? raw : `$${raw}`;
    // Convert 10,000 -> 10K, 100,000 -> 100K, 1,000,000 -> 1M
    const numeric = Number(withDollar.replace(/[^0-9]/g, ""));
    if (Number.isFinite(numeric)) {
        if (numeric % 1_000_000 === 0) return `$${numeric / 1_000_000}M`;
        if (numeric % 1_000 === 0) return `$${numeric / 1_000}K`;
    }
    return withDollar.replace(/\s+/g, "");
}

function normalizePlatform(value: string): string {
    return (value || "").toString().replace(/[^a-z0-9]/gi, "").toUpperCase();
}

type FilteredRecord = {
    accountSize: string;
    variationId: number;
    productId: number;
    platform: string;
    programName: string;
    programId: number;
    platformId: number;
};

// Use the function
const records = await parseCSV(path.join(__dirname, "plan.csv"));
const filteredRecords = (records.filter(
    (record) => record.accountSize && record.variationId && record.productId,
) as unknown as FilteredRecord[]).map((r) => ({
    ...r,
    accountSize: normalizeAccountSize(r.accountSize),
}));

const payload = await getPayloadClient();

// Fetch active programs with tiers
const programsRes = await payload.find({
    collection: "programs",
    where: { isActive: { equals: true } },
    limit: 100,
});
const programs = programsRes.docs || [];
const programIdToProgram = new Map<number, any>();
for (const p of programs) programIdToProgram.set(Number(p.id), p);

// Fetch platforms (use provided platformIds mapping to resolve by id, no fuzzy match)
const platformsRes = await payload.find({ collection: "platforms", limit: 100 });
const platforms = platformsRes.docs || [];

// Load Program Product Mappings global (afterRead will auto-generate structure)
const ppmDoc = (await payload.findGlobal({
    slug: "program-product-mappings",
})) as unknown as { mappings?: any[] };

const mappings: any[] = Array.isArray(ppmDoc.mappings) ? [...ppmDoc.mappings] : [];
// Build index for quick updates
const toKey = (programId: number | string, tierId: string, platformId: string) =>
    `${programId}|${tierId}|${platformId}`;
const mappingIndex = new Map<string, number>();
for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    const progId = typeof m.program === "number" ? m.program : (m.program?.id ?? 0);
    const key = toKey(Number(progId), String(m.tierId), String(m.platformId));
    if (!mappingIndex.has(key)) mappingIndex.set(key, i);
}

let updated = 0;
let created = 0;
let skipped = 0;
let skippedNoProgram = 0;
let skippedNoTier = 0;
let skippedNoPlatform = 0;

for (const rec of filteredRecords) {
    const programId = Number(
        rec.programId || programIds[rec.programName as keyof typeof programIds],
    );
    const program = programIdToProgram.get(programId);
    if (!program) {
        skipped++;
        skippedNoProgram++;
        if (process.env.DEBUG) {
            console.warn(
                `Skip: no program found for programId=${programId} (name=${rec.programName})`,
            );
        }
        continue;
    }

    // Find tier by normalized account size
    const tiers: Array<{ id?: string; accountSize?: string }> = program.pricingTiers || [];
    const tier = tiers.find((t) => normalizeAccountSize(String(t.accountSize || "")) === rec.accountSize);
    if (!tier || !tier.id) {
        skipped++;
        skippedNoTier++;
        if (process.env.DEBUG) {
            console.warn(
                `Skip: no tier match for programId=${programId}, accountSize=${rec.accountSize}`,
            );
        }
        continue;
    }

    // Resolve platform slug
    const platformNumericId = platformIds[rec.platform as keyof typeof platformIds];
    const platformDoc = platforms.find((pl) => Number(pl.id) === Number(platformNumericId));
    const platformSlug = platformDoc?.slug as string | undefined;
    if (!platformSlug) {
        skipped++;
        skippedNoPlatform++;
        if (process.env.DEBUG) {
            console.warn(
                `Skip: no platform found for platform='${rec.platform}' (id=${platformNumericId})`,
            );
        }
        continue;
    }

    const key = toKey(programId, tier.id, platformSlug);
    const idx = mappingIndex.get(key);
    if (idx !== undefined) {
        const m = mappings[idx];
        const newProductId = String(rec.productId);
        const newVariationId = String(rec.variationId);
        if (m.productId !== newProductId || m.variationId !== newVariationId) {
            m.productId = newProductId;
            m.variationId = newVariationId;
            mappings[idx] = m;
            updated++;
        }
        continue;
    }

    // Create mapping if it does not exist
    const displayName = `${program.name} - ${rec.accountSize} - ${platformSlug}`;
    mappings.push({
        id: `${program.slug}-${tier.id}-${platformSlug}`,
        displayName,
        program: programId,
        tierId: tier.id,
        platformId: platformSlug,
        productId: String(rec.productId),
        variationId: String(rec.variationId),
        reset_fee_product_id: "",
        activation_product_id: "",
    });
    mappingIndex.set(key, mappings.length - 1);
    created++;
}

// Save updates back to global
await payload.updateGlobal({
    slug: "program-product-mappings",
    data: { mappings },
});


console.log(
    `Updated mappings: ${updated}, created: ${created}, skipped: ${skipped} (noProgram=${skippedNoProgram}, noTier=${skippedNoTier}, noPlatform=${skippedNoPlatform})`,
);