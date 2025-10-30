/* eslint-disable no-console */

import { setTimeout as delay } from "node:timers/promises";
import { readFileSync, writeFileSync } from "node:fs";
import type { Field } from "payload";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../src/lib/i18n/locales";
import { getPayloadClient } from "../src/lib/payload";

type PathSegment = string | number;

type LocalizedFieldInfo = {
    path: string[];
    field: Field;
};

type TranslateBatchParams = {
    texts: string[];
    sourceLocale: string;
    targetLocale: string;
    contexts: string[];
};

interface Translator {
    translateBatch(params: TranslateBatchParams): Promise<string[]>;
}

const RAW_ARGS = process.argv.slice(2);

const IS_DRY_RUN =
    RAW_ARGS.includes("--dry-run") || process.env.DRY_RUN === "true";
const SHOULD_OVERWRITE =
    RAW_ARGS.includes("--overwrite") ||
    process.env.TRANSLATIONS_OVERWRITE === "true";
const IS_VERBOSE =
    RAW_ARGS.includes("--verbose") ||
    process.env.TRANSLATION_VERBOSE === "true";

const SELECTED_COLLECTIONS = parseCsvArg("--collections=");
const SELECTED_GLOBALS = parseCsvArg("--globals=");
const SELECTED_LOCALES = parseCsvArg("--locales=");

const SOURCE_LOCALE = DEFAULT_LOCALE;

const TARGET_LOCALES = (
    SELECTED_LOCALES?.length
        ? SELECTED_LOCALES
        : SUPPORTED_LOCALES.map((locale) => locale.code)
).filter((locale) => locale !== SOURCE_LOCALE);

const TRANSLATION_BATCH_SIZE = Number(
    process.env.TRANSLATION_BATCH_SIZE ?? "8",
);
const REQUEST_DELAY_MS = Number(
    process.env.TRANSLATION_REQUEST_DELAY_MS ?? "150",
);
const MAX_TRANSLATION_RETRIES = Number(
    process.env.TRANSLATION_RETRY_LIMIT ?? "3",
);

const translationCache = new Map<string, string>();

const persistedTranslationCache: Map<string, string> | undefined = (() => {
    const cacheFile = process.env.TRANSLATION_CACHE_FILE;
    if (!cacheFile) {
        return undefined;
    }

    try {
        const raw = readFileSync(cacheFile, "utf8");
        if (!raw.trim()) {
            return undefined;
        }

        const parsed = JSON.parse(raw) as Record<string, string> | undefined;
        if (!parsed || typeof parsed !== "object") {
            console.warn(
                `Translation cache file ${cacheFile} did not contain an object.`,
            );
            return undefined;
        }

        return new Map(Object.entries(parsed));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            console.warn(
                `Failed to read translation cache at ${cacheFile}:`,
                error,
            );
        }
        return undefined;
    }
})();

if (persistedTranslationCache) {
    for (const [key, value] of persistedTranslationCache.entries()) {
        translationCache.set(key, value);
    }
}

const cloneValue = <T>(value: T): T => {
    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
};

class OpenAITranslator implements Translator {
    private readonly apiKey: string;

    private readonly model: string;

    private readonly baseUrl: string;

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error(
                "Missing OPENAI_API_KEY. Set it in your environment to enable translations.",
            );
        }

        this.apiKey = apiKey;
        this.model =
            process.env.OPENAI_TRANSLATE_MODEL ?? "gpt-5-nano-2025-08-07";
        const configuredBase =
            process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
        this.baseUrl = configuredBase.replace(/\/$/, "");
    }

    async translateBatch({
        texts,
        sourceLocale,
        targetLocale,
        contexts,
    }: TranslateBatchParams): Promise<string[]> {
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
        } as const;

        const payload = {
            model: this.model,
            response_format: {
                type: "json_schema" as const,
                json_schema: responseSchema,
            },
            messages: [
                {
                    role: "system" as const,
                    content:
                        `You are a professional translator specialized in website localization for prop firms and fintech companies. Translate from ${sourceLocale} to ${targetLocale}. ` +
                        'Rules: Keep JSON structure identical (translate values only). Do not translate program, brand, or platform names (e.g., "1 Step Nitro", "FTM", "MT5"). Keep punctuation, spacing, and capitalization consistent. Avoid robotic tone; ensure natural, locally fluent results. Do not use em dashes; use commas or full stops. Adapt idioms naturally. Preserve promotional, trustworthy voice. Keep meaning and length balanced. Translate all text except currency symbols, URLs, and HTML tags. Maintain consistent terminology (e.g., "funded account", "evaluation phase", "payout", "profit split"). Address the audience formally ("Sie" in German, "usted" in Spanish, "siz" in Turkish, and polite/formal equivalents in Malay and Arabic). Focus on fluency and credibility. Always return a JSON object with a property named translations containing the translated strings in the same order. Preserve placeholders in braces, ICU syntax, markdown, HTML tags, and URLs.',
                },
                {
                    role: "user" as const,
                    content: JSON.stringify({
                        sourceLocale,
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

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

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

        let parsed:
            | {
                  translations: string[];
              }
            | undefined;

        try {
            parsed = JSON.parse(messageContent);
        } catch (error) {
            throw new Error(
                `Failed to parse OpenAI translation response. Received: ${messageContent}. Error: ${String(
                    error,
                )}`,
            );
        }

        if (
            !parsed?.translations ||
            parsed.translations.length !== texts.length
        ) {
            const available = parsed?.translations ?? [];
            if (available.length >= texts.length) {
                console.warn(
                    `Translation response contained ${available.length} items; expected ${texts.length}. Using first ${texts.length}.`,
                );
                return available
                    .slice(0, texts.length)
                    .map((item) => item.trim());
            }

            throw new Error(
                `OpenAI translation response length mismatch. Expected ${texts.length} items, got ${available.length}.`,
            );
        }

        return parsed.translations.map((item) => item.trim());
    }
}

const translator: Translator = new OpenAITranslator();

interface TranslationTask {
    relativePath: PathSegment[];
    absolutePath: string;
    text: string;
}

async function main() {
    if (!TARGET_LOCALES.length) {
        console.log("No target locales selected. Nothing to translate.");
        return;
    }

    console.log(
        `Translating from "${SOURCE_LOCALE}" to [${TARGET_LOCALES.map(
            (locale) => `"${locale}"`,
        ).join(
            ", ",
        )}]${IS_DRY_RUN ? " (dry run)" : ""}${SHOULD_OVERWRITE ? " (overwrite enabled)" : ""}.`,
    );

    const payload = await getPayloadClient();

    await translateCollections(payload);
    await translateGlobals(payload);

    console.log("Translation script completed.");
}

async function translateCollections(
    payload: Awaited<ReturnType<typeof getPayloadClient>>,
) {
    for (const collection of payload.config.collections ?? []) {
        if (!shouldProcessCollection(collection.slug)) {
            continue;
        }

        const localizedFields = collectLocalizedFields(collection.fields);
        if (!localizedFields.length) {
            continue;
        }

        console.log(
            `\n[Collection] ${collection.slug} - ${localizedFields.length} localized field${localizedFields.length === 1 ? "" : "s"}.`,
        );

        const limit = Number(process.env.TRANSLATION_PAGE_SIZE ?? "50");
        let page = 1;
        let totalDocsProcessed = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const result = await payload.find({
                collection: collection.slug,
                page,
                limit,
                locale: "all",
                depth: 0,
                fallbackLocale: false,
            });

            if (!result.docs.length) {
                break;
            }

            for (const doc of result.docs) {
                await translateEntity({
                    entityType: "collection",
                    slug: collection.slug,
                    entityId: doc.id,
                    localizedFields,
                    document: doc,
                    translate: async (locale, data) =>
                        payload.update({
                            collection: collection.slug,
                            id: doc.id,
                            data,
                            locale: locale as unknown as
                                | "en"
                                | "tr"
                                | "de"
                                | "ar"
                                | "ms",
                        }),
                });
            }

            totalDocsProcessed += result.docs.length;

            if (result.totalPages && page >= result.totalPages) {
                break;
            }

            page += 1;
        }

        console.log(
            `[Collection] ${collection.slug} processed ${totalDocsProcessed} document${totalDocsProcessed === 1 ? "" : "s"}.`,
        );
    }
}

async function translateGlobals(
    payload: Awaited<ReturnType<typeof getPayloadClient>>,
) {
    for (const global of payload.config.globals ?? []) {
        if (!shouldProcessGlobal(global.slug)) {
            continue;
        }

        const localizedFields = collectLocalizedFields(global.fields ?? []);
        if (!localizedFields.length) {
            continue;
        }

        console.log(
            `\n[Global] ${global.slug} - ${localizedFields.length} localized field${localizedFields.length === 1 ? "" : "s"}.`,
        );

        const doc = await payload.findGlobal({
            slug: global.slug,
            locale: "all",
            depth: 0,
            fallbackLocale: false,
        });

        await translateEntity({
            entityType: "global",
            slug: global.slug,
            entityId: global.slug,
            localizedFields,
            document: doc,
            translate: async (locale, data) =>
                payload.updateGlobal({
                    slug: global.slug,
                    data,
                    locale: locale as unknown as
                        | "en"
                        | "tr"
                        | "de"
                        | "ar"
                        | "ms",
                }),
        });
    }
}

async function translateEntity({
    entityType,
    slug,
    entityId,
    localizedFields,
    document,
    translate,
}: {
    entityType: "collection" | "global";
    slug: string;
    entityId: string | number;
    localizedFields: LocalizedFieldInfo[];
    document: unknown;
    translate: (
        locale: string,
        data: Record<string, unknown>,
    ) => Promise<unknown>;
}) {
    for (const locale of TARGET_LOCALES) {
        const updatePayload: Record<string, unknown> = {};
        let updatesForLocale = 0;

        for (const localizedField of localizedFields) {
            const localizedWrapper = getValueAtPath(
                document,
                localizedField.path,
            );

            if (!localizedWrapper || typeof localizedWrapper !== "object") {
                continue;
            }

            const englishValue = (localizedWrapper as Record<string, unknown>)[
                SOURCE_LOCALE
            ];
            if (englishValue === undefined || englishValue === null) {
                continue;
            }

            if (!SHOULD_OVERWRITE) {
                const existingTargetValue = (
                    localizedWrapper as Record<string, unknown>
                )[locale];
                if (hasMeaningfulContent(existingTargetValue)) {
                    if (IS_VERBOSE) {
                        console.log(
                            `[Skip] ${entityType} ${slug} (${entityId}) locale ${locale} at ${formatPath(localizedField.path)} already has content.`,
                        );
                    }
                    continue;
                }
            }

            const translationResult = await translateValue({
                englishValue,
                fieldPath: localizedField.path,
                locale,
            });

            if (translationResult === undefined) {
                if (IS_VERBOSE) {
                    console.log(
                        `[Skip] ${entityType} ${slug} (${entityId}) locale ${locale} at ${formatPath(localizedField.path)} has no translatable content.`,
                    );
                }
                continue;
            }

            setValueAtPath(
                updatePayload,
                localizedField.path,
                translationResult,
            );
            updatesForLocale += 1;
        }

        if (!Object.keys(updatePayload).length) {
            if (IS_VERBOSE) {
                console.log(
                    `[No Changes] ${entityType} ${slug} (${entityId}) locale ${locale} — nothing to update.`,
                );
            }
            continue;
        }

        if (IS_DRY_RUN) {
            console.log(
                `[Dry Run] ${entityType} ${slug} (${entityId}) -> locale ${locale}:`,
                JSON.stringify(updatePayload, null, 2),
            );
            continue;
        }

        try {
            await translate(locale, updatePayload);
            if (REQUEST_DELAY_MS > 0) {
                await delay(REQUEST_DELAY_MS);
            }
            console.log(
                `${entityType} ${slug} (${entityId}) updated for locale ${locale} (${updatesForLocale} field${updatesForLocale === 1 ? "" : "s"}).`,
            );
        } catch (error) {
            console.error(
                `Failed to update ${entityType} ${slug} (${entityId}) for locale ${locale}:`,
                error,
            );
        }
    }
}

async function translateValue({
    englishValue,
    fieldPath,
    locale,
}: {
    englishValue: unknown;
    fieldPath: string[];
    locale: string;
}) {
    const tasks = collectTranslationTasks(englishValue, fieldPath);

    if (!tasks.length) {
        return undefined;
    }

    const chunkedTasks = chunkTasks(tasks, TRANSLATION_BATCH_SIZE);
    const resultRef = { value: cloneValue(englishValue) } as { value: unknown };

    for (const chunk of chunkedTasks) {
        const textsToTranslate = chunk.map((task) => task.text);
        const cachedResults = retrieveCachedTranslations(
            textsToTranslate,
            locale,
        );

        const missingIndexes = cachedResults
            .map((item, index) => (item === undefined ? index : undefined))
            .filter((index): index is number => index !== undefined);

        const translations: string[] = [...cachedResults] as string[];

        if (missingIndexes.length) {
            const texts = missingIndexes.map(
                (index) => textsToTranslate[index],
            );
            const contexts = missingIndexes.map(
                (index) => chunk[index].absolutePath,
            );

            const translated = await translateWithRetry({
                texts,
                contexts,
                targetLocale: locale,
            });

            missingIndexes.forEach((missingIndex, position) => {
                translations[missingIndex] = translated[position];
                const cacheKey = buildCacheKey(
                    textsToTranslate[missingIndex],
                    locale,
                );
                translationCache.set(cacheKey, translations[missingIndex]);
                persistCachedTranslation(cacheKey, translations[missingIndex]);
            });
        }

        chunk.forEach((task, index) => {
            if (!task.relativePath.length) {
                // Entire value is a primitive that should be replaced directly
                resultRef.value = translations[index];
                return;
            }

            setValueAtPath(
                resultRef.value,
                task.relativePath,
                translations[index],
            );
        });
    }

    return resultRef.value;
}

async function translateWithRetry({
    texts,
    contexts,
    targetLocale,
}: {
    texts: string[];
    contexts: string[];
    targetLocale: string;
}) {
    let attempt = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            return await translator.translateBatch({
                texts,
                contexts,
                sourceLocale: SOURCE_LOCALE,
                targetLocale,
            });
        } catch (error) {
            attempt += 1;

            if (attempt >= MAX_TRANSLATION_RETRIES) {
                console.error(
                    `Translation failed after ${MAX_TRANSLATION_RETRIES} attempts. Falling back to English. Error:`,
                    error,
                );
                return texts;
            }

            const backoffMs = 300 * 2 ** (attempt - 1);
            console.warn(
                `Translation attempt ${attempt} failed (${(error as Error)?.message ?? error}). Retrying in ${backoffMs}ms...`,
            );
            await delay(backoffMs);
        }
    }
}

function retrieveCachedTranslations(texts: string[], targetLocale: string) {
    return texts.map((text) =>
        translationCache.get(buildCacheKey(text, targetLocale)),
    );
}

function buildCacheKey(text: string, targetLocale: string) {
    return `${SOURCE_LOCALE}::${targetLocale}::${text}`;
}

function persistCachedTranslation(key: string, value: string) {
    if (!persistedTranslationCache) {
        return;
    }

    persistedTranslationCache.set(key, value);

    const cacheFile = process.env.TRANSLATION_CACHE_FILE;
    if (!cacheFile) {
        return;
    }

    try {
        const asObject = Object.fromEntries(
            persistedTranslationCache.entries(),
        );
        writeFileSync(
            cacheFile,
            `${JSON.stringify(asObject, null, 2)}\n`,
            "utf8",
        );
    } catch (error) {
        console.warn(
            `Failed to write translation cache to ${cacheFile}:`,
            error,
        );
    }
}

function collectLocalizedFields(fields: Field[] = [], basePath: string[] = []) {
    const localizedFields: LocalizedFieldInfo[] = [];

    for (const field of fields) {
        if (!field) {
            continue;
        }

        const name = ("name" in field && field.name) || undefined;
        const currentPath = name ? [...basePath, name] : basePath;
        const isLocalized = Boolean(
            // @ts-expect-error - Field type is not fully typed
            (field as Partial<Field>).localized && name,
        );

        if (isLocalized && name) {
            localizedFields.push({ path: currentPath, field });
            // Avoid descending into children to prevent duplicate entries
            continue;
        }

        switch (field.type) {
            case "tabs":
                for (const tab of field.tabs ?? []) {
                    localizedFields.push(
                        ...collectLocalizedFields(tab.fields ?? [], basePath),
                    );
                }
                break;
            case "collapsible":
                localizedFields.push(
                    ...collectLocalizedFields(field.fields ?? [], basePath),
                );
                break;
            case "row":
                localizedFields.push(
                    ...collectLocalizedFields(field.fields ?? [], basePath),
                );
                break;
            case "group":
                localizedFields.push(
                    ...collectLocalizedFields(field.fields ?? [], currentPath),
                );
                break;
            case "array":
                localizedFields.push(
                    ...collectLocalizedFields(field.fields ?? [], currentPath),
                );
                break;
            case "blocks":
                for (const block of field.blocks ?? []) {
                    localizedFields.push(
                        ...collectLocalizedFields(block.fields ?? [], [
                            ...currentPath,
                            block.slug ?? "block",
                        ]),
                    );
                }
                break;
            default:
                break;
        }
    }

    return localizedFields;
}

function collectTranslationTasks(
    value: unknown,
    parentPath: string[],
): TranslationTask[] {
    const tasks: TranslationTask[] = [];

    const walk = (
        node: unknown,
        relativePath: PathSegment[],
        absolutePath: PathSegment[],
    ) => {
        if (typeof node === "string") {
            if (shouldTranslateString(node, absolutePath)) {
                tasks.push({
                    relativePath,
                    absolutePath: formatPath([...parentPath, ...absolutePath]),
                    text: node,
                });
            }
            return;
        }

        if (Array.isArray(node)) {
            node.forEach((item, index) =>
                walk(item, [...relativePath, index], [...absolutePath, index]),
            );
            return;
        }

        if (node && typeof node === "object") {
            Object.entries(node).forEach(([key, val]) =>
                walk(val, [...relativePath, key], [...absolutePath, key]),
            );
        }
    };

    walk(value, [], []);

    return tasks;
}

function shouldTranslateString(value: string, absolutePath: PathSegment[]) {
    const trimmed = value.trim();

    if (!trimmed) {
        return false;
    }

    const lastSegment = absolutePath.at(-1);
    const lastKey =
        typeof lastSegment === "string" ? lastSegment.toLowerCase() : undefined;

    const nonTranslatableKeys = new Set([
        "id",
        "ids",
        "slug",
        "url",
        "href",
        "link",
        "links",
        "filename",
        "filepath",
        "mimetype",
        "icon",
        "iconcolor",
        "gradientstyle",
        "gradientposition",
        "image",
        "imagelabel",
        "media",
        "badge",
        "relationto",
        "layout",
        "type",
        "format",
        "style",
        "position",
    ]);

    if (lastKey && nonTranslatableKeys.has(lastKey)) {
        return false;
    }

    if (lastKey && (lastKey.endsWith("id") || lastKey.endsWith("url"))) {
        return false;
    }

    if (/^https?:/i.test(trimmed) || trimmed.startsWith("/")) {
        return false;
    }

    if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) {
        return false;
    }

    if (lastKey === "text" && absolutePath.includes("children")) {
        return /[a-zA-Z]/.test(trimmed);
    }

    const hasLetters = /[a-zA-Z]/.test(trimmed);
    return hasLetters;
}

function setValueAtPath(target: unknown, path: PathSegment[], value: unknown) {
    if (!path.length) {
        throw new Error("Cannot set value for an empty path");
    }

    let current = target as Record<string | number, unknown>;

    path.forEach((segment, index) => {
        const isLast = index === path.length - 1;

        if (isLast) {
            current[segment] = value;
            return;
        }

        if (!current[segment] || typeof current[segment] !== "object") {
            current[segment] = typeof path[index + 1] === "number" ? [] : {};
        }

        current = current[segment] as Record<string | number, unknown>;
    });
}

function ensureLocalizedWrapper(target: unknown, path: PathSegment[]) {
    if (!path.length) {
        throw new Error("Cannot ensure wrapper for empty path");
    }

    let current = target as Record<string | number, unknown>;

    path.forEach((segment, index) => {
        const isLast = index === path.length - 1;

        if (isLast) {
            current[segment] =
                current[segment] && typeof current[segment] === "object"
                    ? current[segment]
                    : {};
            return;
        }

        if (!current[segment] || typeof current[segment] !== "object") {
            current[segment] = typeof path[index + 1] === "number" ? [] : {};
        }

        current = current[segment] as Record<string | number, unknown>;
    });
}

function getValueAtPath(target: unknown, path: string[]) {
    let current = target as Record<string, unknown> | undefined;

    for (const segment of path) {
        if (!current || typeof current !== "object") {
            return undefined;
        }

        current = current[segment] as Record<string, unknown>;
    }

    return current;
}

function hasMeaningfulContent(value: unknown): boolean {
    if (typeof value === "string") {
        return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
        return value.some((item) => hasMeaningfulContent(item));
    }

    if (value && typeof value === "object") {
        return Object.values(value).some((item) => hasMeaningfulContent(item));
    }

    return false;
}

function chunkTasks(tasks: TranslationTask[], size: number) {
    const chunks: TranslationTask[][] = [];

    for (let index = 0; index < tasks.length; index += size) {
        chunks.push(tasks.slice(index, index + size));
    }

    return chunks;
}

function parseCsvArg(prefix: string) {
    const raw = RAW_ARGS.find((arg) => arg.startsWith(prefix));
    if (!raw) {
        return undefined;
    }

    const items = raw
        .slice(prefix.length)
        .split(",")
        .map((item) => item.trim());
    return items.filter(Boolean);
}

function shouldProcessCollection(slug: string) {
    return !SELECTED_COLLECTIONS?.length || SELECTED_COLLECTIONS.includes(slug);
}

function shouldProcessGlobal(slug: string) {
    return !SELECTED_GLOBALS?.length || SELECTED_GLOBALS.includes(slug);
}

function formatPath(path: PathSegment[]) {
    return path
        .map((segment) =>
            typeof segment === "number"
                ? `[${segment}]`
                : segment.replace(/\./g, "\\."),
        )
        .join(".");
}

void main().catch((error) => {
    console.error("Translation script failed", error);
    process.exit(1);
});
