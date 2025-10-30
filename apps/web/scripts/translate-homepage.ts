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

// Configuration
const TARGET_LOCALE = process.env.TARGET_LOCALE || "es";
const TRANSLATION_FILE = process.env.TRANSLATION_FILE || "ftm_homepage_es.json";
const DRY_RUN = process.env.DRY_RUN === "true";

interface TranslationTask {
    path: string[];
    englishText: string;
    translatedText?: string;
}

interface TranslatorConfig {
    apiKey: string;
    model: string;
    baseUrl: string;
}

class OpenAITranslator {
    private readonly config: TranslatorConfig;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "Missing OPENAI_API_KEY. Set it in your environment to enable translations.",
            );
        }

        this.config = {
            apiKey,
            model: process.env.OPENAI_TRANSLATE_MODEL || "gpt-4o-mini",
            baseUrl: (
                process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
            ).replace(/\/$/, ""),
        };
    }

    async translateBatch(
        texts: string[],
        targetLocale: string,
        contexts: string[],
    ): Promise<string[]> {
        if (!texts.length) {
            return [];
        }

        const responseSchema = {
            name: "translation_response",
            schema: {
                type: "object",
                additionalProperties: false,
                required: ["translations"],
                properties: {
                    translations: {
                        type: "array",
                        items: { type: "string" },
                        minItems: texts.length,
                        maxItems: texts.length,
                    },
                },
            },
        };

        const payload = {
            model: this.config.model,
            response_format: {
                type: "json_schema" as const,
                json_schema: responseSchema,
            },
            messages: [
                {
                    role: "system" as const,
                    content:
                        `You are a professional translator specialized in website localization for prop firms and fintech companies. Translate from English to ${targetLocale}. ` +
                        'Rules: Keep JSON structure identical (translate values only). Do not translate program, brand, or platform names (e.g., "1 Step Nitro", "FTM", "MT5"). Keep punctuation, spacing, and capitalization consistent. Avoid robotic tone; ensure natural, locally fluent results. Do not use em dashes; use commas or full stops. Adapt idioms naturally. Preserve promotional, trustworthy voice. Keep meaning and length balanced. Translate all text except currency symbols, URLs, and HTML tags. Maintain consistent terminology (e.g., "funded account", "evaluation phase", "payout", "profit split"). Address the audience formally ("Sie" in German, "usted" in Spanish, "siz" in Turkish, and polite/formal equivalents in Malay and Arabic). Focus on fluency and credibility. Always return a JSON object with a property named translations containing the translated strings in the same order. Preserve placeholders in braces, ICU syntax, markdown, HTML tags, and URLs.',
                },
                {
                    role: "user" as const,
                    content: JSON.stringify({
                        targetLocale,
                        items: texts.map((text, index) => ({
                            position: index,
                            context: contexts[index],
                            text,
                        })),
                    }),
                },
            ],
        };

        const response = await fetch(
            `${this.config.baseUrl}/chat/completions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `OpenAI translation request failed: ${response.status} ${response.statusText} - ${errorBody}`,
            );
        }

        const data = (await response.json()) as {
            choices?: Array<{
                message?: { content?: string };
            }>;
        };

        const messageContent = data.choices?.[0]?.message?.content;
        if (!messageContent) {
            throw new Error("OpenAI translation response missing content");
        }

        const parsed = JSON.parse(messageContent) as { translations: string[] };

        if (
            !parsed?.translations ||
            parsed.translations.length !== texts.length
        ) {
            throw new Error(
                `OpenAI translation response length mismatch. Expected ${texts.length} items, got ${parsed?.translations?.length || 0}.`,
            );
        }

        return parsed.translations.map((item) => item.trim());
    }
}

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

function collectTranslatableStrings(
    obj: unknown,
    currentPath: string[] = [],
): TranslationTask[] {
    const tasks: TranslationTask[] = [];

    const walk = (node: unknown, path: string[]) => {
        if (typeof node === "string") {
            const trimmed = node.trim();
            if (trimmed && shouldTranslate(trimmed, path)) {
                tasks.push({
                    path: [...path],
                    englishText: node,
                });
            }
            return;
        }

        if (Array.isArray(node)) {
            node.forEach((item, index) => walk(item, [...path, String(index)]));
            return;
        }

        if (node && typeof node === "object") {
            Object.entries(node).forEach(([key, val]) =>
                walk(val, [...path, key]),
            );
        }
    };

    walk(obj, currentPath);
    return tasks;
}

function shouldTranslate(value: string, path: string[]): boolean {
    const lastKey = path[path.length - 1]?.toLowerCase();

    const nonTranslatableKeys = new Set([
        "id",
        "slug",
        "url",
        "href",
        "link",
        "icon",
        "iconcolor",
        "gradientposition",
        "layout",
        "position",
        "status",
        "publishedat",
        "createdat",
        "updatedat",
        // Rich text technical fields
        "type",
        "mode",
        "format",
        "style",
        "direction",
        "listtype",
        "tag",
        "indent",
        "version",
        "detail",
    ]);

    if (lastKey && nonTranslatableKeys.has(lastKey)) {
        return false;
    }

    const httpRegex = /^https?:/i;
    if (httpRegex.test(value) || value.startsWith("/")) {
        return false;
    }

    const hexColorRegex = /^#[0-9a-f]{3,8}$/i;
    if (hexColorRegex.test(value)) {
        return false;
    }

    // Skip very short technical values (ltr, rtl, etc.)
    if (value.length < 4 && !/\s/.test(value)) {
        return false;
    }

    // Skip single word technical terms common in rich text
    const technicalTerms = new Set([
        "paragraph",
        "heading",
        "list",
        "listitem",
        "quote",
        "code",
        "normal",
        "start",
        "end",
        "center",
        "left",
        "right",
        "bullet",
        "number",
        "check",
    ]);

    if (technicalTerms.has(value.toLowerCase())) {
        return false;
    }

    const hasLetters = /[a-zA-Z]/.test(value);
    return hasLetters;
}

function setValueAtPath(target: unknown, path: string[], value: unknown) {
    if (!path.length) {
        throw new Error("Cannot set value for an empty path");
    }

    let current = target as Record<string | number, unknown>;

    for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        const nextSegment = path[i + 1];

        // Check if next segment is a number (array index)
        const isNextArray = /^\d+$/.test(nextSegment);

        if (!current[segment] || typeof current[segment] !== "object") {
            // Create array if next segment is numeric, otherwise create object
            current[segment] = isNextArray ? [] : {};
        }
        current = current[segment] as Record<string | number, unknown>;
    }

    current[path[path.length - 1]] = value;
}

function deepMerge(target: unknown, source: unknown): unknown {
    // If source is null/undefined, return target
    if (source === null || source === undefined) {
        return target;
    }

    // If target is null/undefined, return source
    if (target === null || target === undefined) {
        return source;
    }

    // If both are arrays, merge by index
    if (Array.isArray(target) && Array.isArray(source)) {
        const result = [...target];
        source.forEach((item, index) => {
            if (index < result.length) {
                result[index] = deepMerge(result[index], item);
            } else {
                result.push(item);
            }
        });
        return result;
    }

    // If both are objects, merge properties
    if (
        typeof target === "object" &&
        typeof source === "object" &&
        !Array.isArray(target) &&
        !Array.isArray(source)
    ) {
        const result = { ...target } as Record<string, unknown>;
        for (const key in source as Record<string, unknown>) {
            const sourceValue = (source as Record<string, unknown>)[key];
            result[key] = deepMerge(result[key], sourceValue);
        }
        return result;
    }

    // For primitives, source overwrites target
    return source;
}

function getValueAtPath(target: unknown, path: string[]): unknown {
    let current = target;

    for (const segment of path) {
        if (!current || typeof current !== "object") {
            return undefined;
        }
        current = (current as Record<string, unknown>)[segment];
    }

    return current;
}

async function translateHomepage() {
    console.log("\n🌍 Homepage Translation Script");
    console.log(`Target Locale: ${TARGET_LOCALE}`);
    console.log(`Translation File: ${TRANSLATION_FILE}`);
    console.log(`Dry Run: ${DRY_RUN ? "Yes" : "No"}\n`);

    // Step 1: Load existing translations if available
    let existingTranslations: Record<string, unknown> | undefined;
    const translationFilePath = path.join(__dirname, TRANSLATION_FILE);

    if (fs.existsSync(translationFilePath)) {
        console.log(`✓ Found translation file: ${TRANSLATION_FILE}`);
        const raw = fs.readFileSync(translationFilePath, "utf-8");
        const parsed: TranslationJson = JSON.parse(raw);
        existingTranslations = sanitize(parsed.translations) as Record<
            string,
            unknown
        >;
    } else {
        console.log(`⚠ Translation file not found: ${TRANSLATION_FILE}`);
        console.log("  Will translate all content using AI.\n");
    }

    // Step 2: Initialize Payload client
    console.log("Connecting to Payload CMS...");
    const payload = await getPayloadClient();

    // Step 3: Fetch current homepage (English) - this gets data in a flat structure
    console.log("Fetching homepage data (English)...");
    const englishHomepage = await payload.findGlobal({
        slug: "homepage",
        locale: "en",
        depth: 5,
        fallbackLocale: false,
    });

    console.log(`  Found ${Object.keys(englishHomepage).length} fields`);

    // Step 4: Collect all translatable strings from English version
    console.log("Analyzing content...");
    const tasks = collectTranslatableStrings(englishHomepage);
    console.log(`  Found ${tasks.length} translatable strings\n`);

    // Step 5: Try to match with existing translations
    let matchedCount = 0;
    const unmatchedTasks: TranslationTask[] = [];

    for (const task of tasks) {
        if (existingTranslations) {
            const translatedValue = getValueAtPath(
                existingTranslations,
                task.path,
            );
            if (typeof translatedValue === "string" && translatedValue.trim()) {
                task.translatedText = translatedValue;
                matchedCount++;
                continue;
            }
        }

        unmatchedTasks.push(task);
    }

    console.log(`✓ Matched ${matchedCount} translations from file`);
    console.log(
        `⚠ Need to translate ${unmatchedTasks.length} strings using AI\n`,
    );

    // Step 6: Translate unmatched strings using AI
    if (unmatchedTasks.length > 0) {
        console.log("Translating remaining strings...");
        const translator = new OpenAITranslator();
        const batchSize = 10;

        for (let i = 0; i < unmatchedTasks.length; i += batchSize) {
            const batch = unmatchedTasks.slice(i, i + batchSize);
            const texts = batch.map((task) => task.englishText);
            const contexts = batch.map((task) => task.path.join("."));

            console.log(
                `  Translating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(unmatchedTasks.length / batchSize)} (${batch.length} strings)...`,
            );

            try {
                const translations = await translator.translateBatch(
                    texts,
                    TARGET_LOCALE,
                    contexts,
                );

                batch.forEach((task, index) => {
                    task.translatedText = translations[index];
                });
            } catch (error) {
                console.error("  ✗ Failed to translate batch:", error);
                throw error;
            }
        }
        console.log("✓ Translation complete\n");
    }

    // Step 7: Build update payload with translations
    console.log("Building update payload...");
    const translationsPayload: Record<string, unknown> = {};

    for (const task of tasks) {
        if (task.translatedText) {
            setValueAtPath(translationsPayload, task.path, task.translatedText);
        }
    }

    // Step 7.5: Merge translations with English data as base
    console.log("Merging translations with existing data...");
    // Use English as the base structure and apply translations on top
    const updatePayload = deepMerge(
        englishHomepage,
        translationsPayload,
    ) as Record<string, unknown>;

    console.log(
        `  Built payload with ${Object.keys(updatePayload).length} top-level fields`,
    );

    // Step 8: Update homepage
    if (DRY_RUN) {
        console.log("\n🔍 DRY RUN - Would update with:");
        console.log(JSON.stringify(updatePayload, null, 2));
        console.log("\nTo apply changes, run without DRY_RUN=true");
    } else {
        console.log("Updating homepage global...");
        await payload.updateGlobal({
            slug: "homepage",
            locale: TARGET_LOCALE as "es" | "tr" | "de" | "ar" | "ms",
            data: updatePayload,
        });
        console.log(
            `✓ Homepage updated successfully for locale: ${TARGET_LOCALE}`,
        );
    }

    console.log("\n✅ Translation process completed!\n");
}

translateHomepage()
    .then(() => {
        console.log("Done.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("\n❌ Translation failed:");
        console.error(err);
        process.exit(1);
    });
