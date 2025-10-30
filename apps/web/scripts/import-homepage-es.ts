import { config } from "dotenv";
config();

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayloadClient } from "../src/lib/payload";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type TranslationJson = typeof import("./ftm_homepage_es.json");

const STRIP_KEYS = new Set([
    "id",
    "createdAt",
    "updatedAt",
    "_path",
    "__v",
    "blockName",
    "blockType",
    "locale",
]);

const LOCALE = "es";

const SECTION_FIELD_MAP: Record<string, string> = {
    hero: "hero",
    features: "features",
    featuredIn: "featuredIn",
    advantages: "advantages",
    payoutsFeatures: "payoutsFeatures",
    highestPayouts: "highestPayouts",
    tradingFeatures: "tradingFeatures",
    videoTestimonials: "videoTestimonials",
    testimonials: "testimonials",
    faq: "faq",
};

function sanitize(input: unknown): unknown {
    if (Array.isArray(input)) {
        return input.map((item) => sanitize(item));
    }

    if (input && typeof input === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(input)) {
            if (STRIP_KEYS.has(key)) continue;
            result[key] = sanitize(value);
        }
        return result;
    }

    return input;
}

async function importHomepageSpanish() {
    const filePath = path.join(__dirname, "ftm_homepage_es.json");

    console.log(`Reading Spanish homepage translations: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Translation file not found at ${filePath}. Did you add it?`,
        );
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed: TranslationJson = JSON.parse(raw);

    if (!parsed?.translations) {
        throw new Error("Invalid translation file: missing `translations` key");
    }

    const sanitizedTranslations = sanitize(parsed.translations) as Record<
        string,
        unknown
    >;

    console.log("Initializing Payload client...");
    const payload = await getPayloadClient();

    console.log("Fetching current homepage global (Spanish locale)...");
    const currentHomepage = await payload.findGlobal({
        slug: "homepage",
        locale: LOCALE,
    });

    const updatePayload: Record<string, unknown> = {};

    for (const [jsonKey, value] of Object.entries(sanitizedTranslations)) {
        const targetField = SECTION_FIELD_MAP[jsonKey];
        if (!targetField) {
            console.log(`Skipping unknown section '${jsonKey}'`);
            continue;
        }

        if (jsonKey === "featuredIn") {
            updatePayload[targetField] = {
                ...(currentHomepage.featuredIn ?? {}),
                ...(value as Record<string, unknown>),
                logos: currentHomepage.featuredIn?.logos,
            };

            continue;
        }

        updatePayload[targetField] = value;
    }

    console.log("Updating homepage global (Spanish translations)...");
    await payload.updateGlobal({
        slug: "homepage",
        locale: LOCALE,
        data: updatePayload,
    });

    console.log("✓ Spanish homepage translations imported successfully.\n");
}

importHomepageSpanish()
    .then(() => {
        console.log("Done.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Import failed:");
        console.error(err);
        process.exit(1);
    });
