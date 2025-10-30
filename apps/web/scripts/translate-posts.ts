/* eslint-disable no-console */

import { setTimeout as delay } from "node:timers/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../src/lib/i18n/locales";
import { getPayloadClient } from "../src/lib/payload";

const RAW_ARGS = process.argv.slice(2);

const IS_DRY_RUN =
    RAW_ARGS.includes("--dry-run") || process.env.DRY_RUN === "true";
const SHOULD_OVERWRITE =
    RAW_ARGS.includes("--overwrite") ||
    process.env.TRANSLATIONS_OVERWRITE === "true";
const IS_VERBOSE =
    RAW_ARGS.includes("--verbose") ||
    process.env.TRANSLATION_VERBOSE === "true";

const SELECTED_LOCALES = parseCsvArg("--locales=");
const SOURCE_LOCALE = DEFAULT_LOCALE;

const TARGET_LOCALES = (
    SELECTED_LOCALES?.length
        ? SELECTED_LOCALES
        : SUPPORTED_LOCALES.map((locale) => locale.code)
).filter((locale) => locale !== SOURCE_LOCALE);

// Conservative settings to avoid rate limits
const TRANSLATION_BATCH_SIZE = Number(
    process.env.TRANSLATION_BATCH_SIZE ?? "2", // Very small batches to avoid rate limits
);
const REQUEST_DELAY_MS = Number(
    process.env.TRANSLATION_REQUEST_DELAY_MS ?? "2000", // 2 second delay between requests
);
const MAX_TRANSLATION_RETRIES = Number(
    process.env.TRANSLATION_RETRY_LIMIT ?? "3",
);
const POSTS_PAGE_SIZE = Number(
    process.env.POSTS_PAGE_SIZE ?? "5", // Process fewer posts at once to avoid rate limits
);

const translationCache = new Map<string, string>();

// Load persisted cache
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

class OpenAITranslator {
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
        this.model = process.env.OPENAI_TRANSLATE_MODEL ?? "gpt-4o-mini";
        const configuredBase =
            process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
        this.baseUrl = configuredBase.replace(/\/$/, "");
    }

    async translateBatch({
        texts,
        sourceLocale,
        targetLocale,
        contexts,
    }: {
        texts: string[];
        sourceLocale: string;
        targetLocale: string;
        contexts: string[];
    }): Promise<string[]> {
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
                        'Rules: Keep JSON structure identical (translate values only). Do not translate program, brand, or platform names (e.g., "1 Step Nitro", "FTM", "MT5"). Keep punctuation, spacing, and capitalization consistent. Avoid robotic tone; ensure natural, locally fluent results. Do not use em dashes; use commas or full stops. Adapt idioms naturally. Preserve promotional, trustworthy voice. Keep meaning and length balanced. Translate all text except currency symbols, URLs, and HTML tags. Maintain consistent terminology (e.g., "funded account", "evaluation phase", "payout", "profit split"). Address the audience formally ("Sie" in German, "usted" in Spanish, "siz" in Turkish, and polite/formal equivalents in Malay and Arabic). Focus on fluency and credibility. ' +
                        `CRITICAL: You must return exactly ${texts.length} translations in the same order as the input. Do not skip any items. If a text is empty or untranslatable, return the original text. Always return a JSON object with a property named translations containing exactly ${texts.length} translated strings. Preserve placeholders in braces, ICU syntax, markdown, HTML tags, and URLs.`,
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

            // If we have more translations than expected, use the first N
            if (available.length >= texts.length) {
                console.warn(
                    `Translation response contained ${available.length} items; expected ${texts.length}. Using first ${texts.length}.`,
                );
                return available
                    .slice(0, texts.length)
                    .map((item) => item.trim());
            }

            // If we have fewer translations than expected, pad with original text
            if (available.length < texts.length) {
                console.warn(
                    `Translation response contained ${available.length} items; expected ${texts.length}. Padding with original text for missing items.`,
                );
                const padded = [...available];
                while (padded.length < texts.length) {
                    padded.push(texts[padded.length]);
                }
                return padded.map((item) => item.trim());
            }

            throw new Error(
                `OpenAI translation response length mismatch. Expected ${texts.length} items, got ${available.length}.`,
            );
        }

        return parsed.translations.map((item) => item.trim());
    }
}

const translator = new OpenAITranslator();

interface TranslationTask {
    text: string;
    context: string;
    fieldPath: string;
}

async function main() {
    if (!TARGET_LOCALES.length) {
        console.log("No target locales selected. Nothing to translate.");
        return;
    }

    console.log(
        `Translating Posts from "${SOURCE_LOCALE}" to [${TARGET_LOCALES.map(
            (locale) => `"${locale}"`,
        ).join(
            ", ",
        )}]${IS_DRY_RUN ? " (dry run)" : ""}${SHOULD_OVERWRITE ? " (overwrite enabled)" : ""}.`,
    );

    try {
        const payload = await getPayloadClient();
        await translatePosts(payload);
        console.log("Posts translation completed.");
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("Missing required environment variable")
        ) {
            console.error(
                "❌ Database connection required but not configured.",
            );
            console.error("Please set up your database environment variables:");
            console.error("  export POSTGRES_URI='your-database-url'");
            console.error("  or");
            console.error("  export DATABASE_URL='your-database-url'");
            console.error("");
            console.error(
                "Alternatively, you can run this script from your development environment",
            );
            console.error("where the database is already configured.");
            process.exit(1);
        }
        throw error;
    }
}

async function translatePosts(
    payload: Awaited<ReturnType<typeof getPayloadClient>>,
) {
    console.log("\n[Posts] Starting translation process...");

    const limit = POSTS_PAGE_SIZE;
    let page = 1;
    let totalDocsProcessed = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const result = await payload.find({
            collection: "posts",
            page,
            limit,
            locale: "all",
            depth: 0,
            fallbackLocale: false,
        });

        if (!result.docs.length) {
            break;
        }

        console.log(
            `\n[Posts] Processing page ${page} (${result.docs.length} posts)...`,
        );

        // Process posts sequentially to avoid rate limits
        for (const doc of result.docs) {
            await translatePost(
                payload,
                doc as unknown as Record<string, unknown>,
            );
            // Add delay between posts to avoid rate limits
            if (REQUEST_DELAY_MS > 0) {
                await delay(REQUEST_DELAY_MS);
            }
        }

        totalDocsProcessed += result.docs.length;

        if (result.totalPages && page >= result.totalPages) {
            break;
        }

        page += 1;
    }

    console.log(`\n[Posts] Completed processing ${totalDocsProcessed} posts.`);
}

async function translatePost(
    payload: Awaited<ReturnType<typeof getPayloadClient>>,
    doc: Record<string, unknown>,
) {
    const postId = doc.id as string | number;
    const titleField = doc.title as Record<string, unknown> | undefined;
    const postTitle = (titleField?.[SOURCE_LOCALE] as string) || "Unknown Post";

    console.log(`\n[Post] ${postTitle} (ID: ${postId})`);

    for (const locale of TARGET_LOCALES) {
        const updatePayload: Record<string, unknown> = {};
        let updatesForLocale = 0;

        // Translate title
        const titleResult = await translateField(
            (doc.title as Record<string, unknown> | undefined)?.[SOURCE_LOCALE],
            `posts.${postId}.title`,
            locale,
        );
        if (titleResult !== undefined) {
            updatePayload.title = titleResult;
            updatesForLocale += 1;
        }

        // Translate excerpt
        const excerptResult = await translateField(
            (doc.excerpt as Record<string, unknown> | undefined)?.[
                SOURCE_LOCALE
            ],
            `posts.${postId}.excerpt`,
            locale,
        );
        if (excerptResult !== undefined) {
            updatePayload.excerpt = excerptResult;
            updatesForLocale += 1;
        }

        // Translate content (rich text)
        const contentResult = await translateField(
            (doc.content as Record<string, unknown> | undefined)?.[
                SOURCE_LOCALE
            ],
            `posts.${postId}.content`,
            locale,
        );
        if (contentResult !== undefined) {
            updatePayload.content = contentResult;
            updatesForLocale += 1;
        }

        if (!Object.keys(updatePayload).length) {
            if (IS_VERBOSE) {
                console.log(
                    `[Skip] Post ${postId} locale ${locale} — nothing to update.`,
                );
            }
            continue;
        }

        if (IS_DRY_RUN) {
            console.log(
                `[Dry Run] Post ${postId} -> locale ${locale}:`,
                JSON.stringify(updatePayload, null, 2),
            );
            continue;
        }

        // When using locale parameter in payload.update, we pass the translated values directly
        // NOT wrapped in locale keys - PayloadCMS handles that internally
        const localizedPayload: Record<string, unknown> = {
            ...updatePayload, // title, excerpt, content translated values
        };

        try {
            await payload.update({
                collection: "posts",
                id: postId,
                data: localizedPayload,
                locale: locale as "tr" | "de" | "ar" | "ms",
            });

            if (REQUEST_DELAY_MS > 0) {
                await delay(REQUEST_DELAY_MS);
            }

            console.log(
                `[Success] Post ${postId} updated for locale ${locale} (${updatesForLocale} field${updatesForLocale === 1 ? "" : "s"}).`,
            );
        } catch (error) {
            console.error(
                `[Error] Failed to update post ${postId} for locale ${locale}:`,
                error,
            );

            // Show detailed validation errors
            if (error && typeof error === "object" && "data" in error) {
                const errorData = (error as any).data;
                if (errorData?.errors) {
                    console.error(
                        "[Validation Details]:",
                        JSON.stringify(errorData.errors, null, 2),
                    );
                }
            }

            // Show what we tried to update
            console.error(
                "[Attempted Update]:",
                JSON.stringify(
                    {
                        postId,
                        locale,
                        updateKeys: Object.keys(localizedPayload),
                        titleStructure: localizedPayload.title
                            ? Object.keys(localizedPayload.title as object)
                            : "none",
                        contentStructure: localizedPayload.content
                            ? Object.keys(localizedPayload.content as object)
                            : "none",
                    },
                    null,
                    2,
                ),
            );
        }
    }
}

async function translateField(
    englishValue: unknown,
    fieldPath: string,
    locale: string,
): Promise<unknown> {
    if (!englishValue) {
        return undefined;
    }

    // Check if we should overwrite existing translations
    if (!SHOULD_OVERWRITE) {
        // This is a simplified check - in a real scenario, you'd check the existing value
        // For now, we'll assume we want to translate everything
    }

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
                (index) => chunk[index].context,
            );

            try {
                const translated = await translateWithRetry({
                    texts,
                    contexts,
                    targetLocale: locale,
                });

                // Handle the case where we got fewer translations than expected
                for (let i = 0; i < missingIndexes.length; i++) {
                    const missingIndex = missingIndexes[i];
                    const position = i;
                    let translation;

                    if (position < translated.length) {
                        // We have a translation for this position
                        translation = translated[position];
                    } else {
                        // We don't have a translation, try individual translation
                        console.warn(
                            `Missing translation for item ${position + 1}/${translated.length}, trying individual translation...`,
                        );
                        try {
                            const individualResult = await translateWithRetry({
                                texts: [textsToTranslate[missingIndex]],
                                contexts: [contexts[position]],
                                targetLocale: locale,
                            });
                            translation =
                                individualResult[0] ||
                                textsToTranslate[missingIndex];
                        } catch (individualError) {
                            console.warn(
                                `Individual translation also failed, using original text: ${individualError}`,
                            );
                            translation = textsToTranslate[missingIndex];
                        }
                    }

                    translations[missingIndex] = translation;
                    const cacheKey = buildCacheKey(
                        textsToTranslate[missingIndex],
                        locale,
                    );
                    translationCache.set(cacheKey, translation);
                    persistCachedTranslation(cacheKey, translation);
                }
            } catch (error) {
                console.warn(
                    `Failed to translate batch, using original text: ${error}`,
                );
                // Fallback to original text for failed translations
                missingIndexes.forEach((missingIndex) => {
                    translations[missingIndex] = textsToTranslate[missingIndex];
                });
            }
        }

        chunk.forEach((task, index) => {
            if (!task.fieldPath) {
                // For rich text content, we need to preserve the structure
                // Only replace if it's a simple string field
                if (typeof resultRef.value === "string") {
                    resultRef.value = translations[index];
                }
                // For rich text (objects), we don't replace the entire structure
                return;
            }

            setValueAtPath(
                resultRef.value,
                task.fieldPath.split("."),
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
            const result = await translator.translateBatch({
                texts,
                contexts,
                sourceLocale: SOURCE_LOCALE,
                targetLocale,
            });

            // If we got a result, return it even if it's not perfect
            if (result && result.length > 0) {
                return result;
            }

            throw new Error("Empty translation result");
        } catch (error) {
            attempt += 1;

            if (attempt >= MAX_TRANSLATION_RETRIES) {
                console.error(
                    `Translation failed after ${MAX_TRANSLATION_RETRIES} attempts. Falling back to English. Error:`,
                    error,
                );
                return texts;
            }

            // Handle rate limits with longer backoff
            let backoffMs = 500 * attempt;
            if (error instanceof Error && error.message.includes("429")) {
                backoffMs = 10000 + attempt * 5000; // 10-20 seconds for rate limits
                console.warn(
                    `Rate limit hit. Waiting ${backoffMs}ms before retry ${attempt}/${MAX_TRANSLATION_RETRIES}...`,
                );
            } else {
                console.warn(
                    `Translation attempt ${attempt} failed (${(error as Error)?.message ?? error}). Retrying in ${backoffMs}ms...`,
                );
            }
            await delay(backoffMs);
        }
    }
}

function collectTranslationTasks(
    value: unknown,
    parentPath: string,
): TranslationTask[] {
    const tasks: TranslationTask[] = [];

    const walk = (
        node: unknown,
        fieldPath: string[],
        absolutePath: string[],
    ) => {
        if (typeof node === "string") {
            if (shouldTranslateString(node, absolutePath)) {
                tasks.push({
                    text: node,
                    context: `${parentPath}.${absolutePath.join(".")}`,
                    fieldPath: fieldPath.join("."),
                });
            }
            return;
        }

        if (Array.isArray(node)) {
            node.forEach((item, index) =>
                walk(
                    item,
                    [...fieldPath, index.toString()],
                    [...absolutePath, index.toString()],
                ),
            );
            return;
        }

        if (node && typeof node === "object") {
            Object.entries(node).forEach(([key, val]) =>
                walk(val, [...fieldPath, key], [...absolutePath, key]),
            );
        }
    };

    walk(value, [], []);

    return tasks;
}

function shouldTranslateString(value: string, absolutePath: string[]): boolean {
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
        "linktype", // Lexical editor link node type
        "mode", // Lexical editor text mode
        "detail", // Lexical editor detail flag
        "version", // Lexical editor version
        "indent", // Lexical editor indentation
        "direction", // Lexical editor text direction
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

function setValueAtPath(target: unknown, path: string[], value: unknown) {
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

function chunkTasks<T>(tasks: T[], size: number) {
    const chunks: T[][] = [];

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

void main().catch((error) => {
    console.error("Posts translation script failed", error);
    process.exit(1);
});
