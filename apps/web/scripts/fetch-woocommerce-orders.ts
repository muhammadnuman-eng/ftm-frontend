// @ts-nocheck
/* eslint-disable no-console */

import { setTimeout as delay } from "node:timers/promises";
import { getPayloadClient } from "../src/lib/payload";

const WOO_BASE_URL = "https://fundedtradermarkets.com";
const WOO_CONSUMER_KEY = "ck_1a5c1f552e594c2ecb3ca103dc4b83d90e2f4e33";
const WOO_CONSUMER_SECRET = "cs_f70ae7886fea10e1f68e804da1350fce138ee9d6";

type WooOrder = {
    id: number;
    status?: string;
    currency?: string;
    total?: string;
    number?: string;
    payment_method?: string;
    payment_method_title?: string;
    transaction_id?: string;
    customer_note?: string;
    date_created?: string;
    affiliate?: {
        affiliate_id?: number | string;
        referral_id?: number | string;
        email?: string;
    };
    billing?: {
        first_name?: string;
        last_name?: string;
        address_1?: string;
        address_2?: string;
        city?: string;
        state?: string;
        postcode?: string;
        country?: string;
        email?: string;
        phone?: string;
    };
    coupon_lines?: Array<{
        code?: string;
        discount?: string;
        discount_type?: string;
        nominal_amount?: number;
        meta_data?: unknown[];
    }>;
    line_items?: Array<{
        id?: number;
        name?: string;
        product_id?: number;
        variation_id?: number;
        quantity?: number;
        subtotal?: string;
        total?: string;
        price?: number;
        meta_data?: Array<{
            id?: number;
            key?: string;
            value?: string;
            display_key?: string;
            display_value?: string;
        }>;
    }>;
} & Record<string, unknown>;

type MappedPurchase = {
    purchaseType: "original-order" | "reset-order" | "activation-order";
    orderNumber: string;
    hasAddOn: boolean;
    addOn?: number | string | null;
    addOnValue?: number;
    purchasePrice?: number;
    totalPrice?: number;
    discountCode?: string;
    billingAddress?: {
        address?: string;
        postalCode?: string;
        city?: string;
        state?: string;
        country?: string;
    };
    programDetails?: string;
    platformName?: string;
    platformSlug?: string;
    programName?: string;
    programType?: "1-step" | "2-step" | "instant" | "reset" | undefined;
    customerName: string;
    customerEmail: string;
    isInAppPurchase: boolean;
    accountSize?: string;
    currency?: string;
    status?: string;
    paymentMethod?: string;
    transactionId?: string;
    notes?: string;
    affiliateEmail?: string;
    metadata?: unknown;
};

function getMetaValue(
    meta:
        | Array<{ key?: string; value?: string; display_value?: string }>
        | undefined,
    key: string,
) {
    if (!meta) return undefined;
    const found = meta.find(
        (m) => (m.key ?? "").toLowerCase() === key.toLowerCase(),
    );
    return found;
}

function getRootMetaValue(order: WooOrder, key: string): string | undefined {
    const meta = Array.isArray(
        (order as unknown as { meta_data?: unknown[] })?.meta_data,
    )
        ? (
              order as unknown as {
                  meta_data: Array<{ key?: string; value?: unknown }>;
              }
          ).meta_data
        : [];
    const found = meta.find(
        (m) => (m.key ?? "").toLowerCase() === key.toLowerCase(),
    );
    if (!found) return undefined;
    const val = found.value;
    return typeof val === "string"
        ? val
        : val !== undefined
          ? String(val)
          : undefined;
}

function normalizeProgramType(stepValue: string | undefined) {
    if (!stepValue) return undefined as MappedPurchase["programType"];
    const v = stepValue.toLowerCase();
    if (v.startsWith("1-step")) return "1-step";
    if (v.startsWith("2-step")) return "2-step";
    if (v.includes("instant")) return "instant";
    if (v.includes("reset")) return "reset";
    return undefined;
}

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

function detectPurchaseTypeFromLineItems(
    items:
        | Array<{
              name?: string;
              meta_data?: Array<{
                  key?: string;
                  value?: string;
                  display_value?: string;
              }>;
          }>
        | undefined,
): "activation-order" | "reset-order" | undefined {
    if (!Array.isArray(items) || items.length === 0) return undefined;
    const hasActivation = items.some((it) => {
        const name = (it.name || "").toLowerCase();
        if (name.includes("activation fee")) return true;
        const meta = Array.isArray(it.meta_data) ? it.meta_data : [];
        return meta.some((m) =>
            ((m.display_value || m.value || "") as string)
                .toString()
                .toLowerCase()
                .includes("activation fee"),
        );
    });
    if (hasActivation) return "activation-order";

    const hasReset = items.some((it) => {
        const name = (it.name || "").toLowerCase();
        if (name.includes("reset fee")) return true;
        const meta = Array.isArray(it.meta_data) ? it.meta_data : [];
        return meta.some((m) =>
            ((m.display_value || m.value || "") as string)
                .toString()
                .toLowerCase()
                .includes("reset fee"),
        );
    });
    if (hasReset) return "reset-order";

    return undefined;
}

function chunkArray<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
}

async function fetchWooOrdersByIds({
    baseUrl,
    consumerKey,
    consumerSecret,
    ids,
    chunkSize = 100,
}: FetchOrdersOptions & { ids: number[]; chunkSize?: number }): Promise<
    WooOrder[]
> {
    if (!ids.length) return [];

    const uniqueIds = Array.from(new Set(ids));
    const chunks = chunkArray(uniqueIds, chunkSize);
    const all: WooOrder[] = [];
    const key = consumerKey ?? WOO_CONSUMER_KEY;
    const secret = consumerSecret ?? WOO_CONSUMER_SECRET;
    const base = ensureTrailingSlash(baseUrl ?? WOO_BASE_URL);

    for (const chunk of chunks) {
        const url = new URL("/wp-json/wc/v3/orders", base);
        url.searchParams.set("include", chunk.join(","));
        url.searchParams.set("per_page", String(chunk.length));

        const response = await fetch(url, {
            headers: {
                Authorization: buildBasicAuthHeader(key, secret),
                "Content-Type": "application/json",
                Accept: "application/json",
                "User-Agent": "ftm-woo-orders-script/1.0",
            },
        });

        if (!response.ok) {
            const text = await safeText(response);
            throw new Error(
                `WooCommerce orders request failed (include=${chunk.join(",")}): ${response.status} ${response.statusText} - ${text}`,
            );
        }

        const orders = (await response.json()) as WooOrder[];
        all.push(...orders);
    }

    return all;
}

function deriveAccountSize({
    order,
    lineItem,
    initialAccountSize,
    purchaseType,
    programName,
}: {
    order: WooOrder;
    lineItem?: WooOrder["line_items"] extends Array<infer T> ? T : undefined;
    initialAccountSize?: string;
    purchaseType?: "activation-order" | "reset-order";
    programName?: string;
}): string | undefined {
    const trimmedInitial = initialAccountSize?.trim();
    if (trimmedInitial) return trimmedInitial;

    const metaEntries = lineItem?.meta_data ?? [];
    const candidateKeys = [
        "pa_account-size",
        "account_size",
        "account-size",
        "activation_account_size",
        "activation-account-size",
        "accountSize",
    ];

    for (const key of candidateKeys) {
        const item = getMetaValue(metaEntries, key);
        const display = item?.display_value?.toString().trim();
        if (display) return display;
        const raw = item?.value?.toString().trim();
        if (raw) return raw;
    }

    for (const key of candidateKeys) {
        const value = getRootMetaValue(order, key)?.trim();
        if (value) return value;
    }

    const lineName = lineItem?.name ?? "";
    const sizeFromName = lineName.match(/\$?\d+(?:,\d{3})*(?:k|K|m|M)?/);
    if (sizeFromName?.[0]) {
        return sizeFromName[0].replace(/\s+/g, "");
    }

    if (purchaseType === "activation-order" && programName?.trim()) {
        return `${programName.trim()} Activation`;
    }

    if (purchaseType === "activation-order") {
        return "Activation";
    }

    if (purchaseType === "reset-order") {
        return "Reset";
    }

    return undefined;
}

function mapWooOrderToPurchase(order: WooOrder): MappedPurchase {
    const lineItem = Array.isArray(order.line_items)
        ? order.line_items[0]
        : undefined;
    const meta = lineItem?.meta_data;

    const metaAccountStep = getMetaValue(meta, "pa_account-step");
    const metaAccountSize = getMetaValue(meta, "pa_account-size");
    const metaPlatform = getMetaValue(meta, "pa_platform");

    const platformName = metaPlatform?.display_value || undefined;
    const platformSlug = metaPlatform?.value || undefined;

    const programType = normalizeProgramType(metaAccountStep?.value);
    let programName =
        metaAccountStep?.display_value || lineItem?.name || undefined;

    const detectedPurchaseType = detectPurchaseTypeFromLineItems(
        order.line_items,
    );

    const accountSize = deriveAccountSize({
        order,
        lineItem,
        initialAccountSize:
            metaAccountSize?.display_value || metaAccountSize?.value,
        purchaseType: detectedPurchaseType,
        programName,
    });

    if (detectedPurchaseType === "activation-order") {
        programName = "Activation Fee";
    }

    const discountCode =
        Array.isArray(order.coupon_lines) && order.coupon_lines[0]?.code
            ? String(order.coupon_lines[0]?.code)
            : undefined;

    const subtotal = toNumber(lineItem?.subtotal);
    const lineTotal = toNumber(lineItem?.total);
    const orderTotal = toNumber(order.total);

    const totalPrice = orderTotal ?? lineTotal ?? subtotal;
    const purchasePrice = subtotal ?? lineTotal ?? orderTotal;

    const customerName = [order.billing?.first_name, order.billing?.last_name]
        .filter(Boolean)
        .join(" ");

    const metaDataArray = Array.isArray(
        (order as unknown as { meta_data?: unknown[] })?.meta_data,
    )
        ? (order as unknown as { meta_data: Array<Record<string, unknown>> })
              .meta_data
        : [];
    const isInAppPurchase = metaDataArray.some((m) => {
        const key = typeof m.key === "string" ? m.key.toLowerCase() : "";
        const value =
            typeof m.value === "string" ? m.value : String(m.value ?? "");
        return key === "in_app_purchase" && value.startsWith("true");
    });

    // Extract AffiliateWP details from REST 'affiliate' field (Option A),
    // with fallbacks to known meta keys if needed
    const affiliateObj = order.affiliate;
    const affiliateIdFromApi =
        affiliateObj?.affiliate_id !== undefined
            ? String(affiliateObj.affiliate_id)
            : undefined;
    const referralIdFromApi =
        affiliateObj?.referral_id !== undefined
            ? String(affiliateObj.referral_id)
            : undefined;
    const affiliateEmailFromApi =
        typeof affiliateObj?.email === "string"
            ? affiliateObj.email
            : undefined;

    const affiliateEmail =
        affiliateEmailFromApi ||
        getRootMetaValue(order, "affiliate_email") ||
        getRootMetaValue(order, "affwp_affiliate_email") ||
        getRootMetaValue(order, "affwp_payment_email") ||
        getRootMetaValue(order, "payment_email") ||
        undefined;
    const affiliateId =
        affiliateIdFromApi ||
        getRootMetaValue(order, "_affiliate_id") ||
        getRootMetaValue(order, "affiliate_id") ||
        undefined;
    const referralId =
        referralIdFromApi ||
        getRootMetaValue(order, "_affwp_referral_id") ||
        getRootMetaValue(order, "affwp_referral_id") ||
        getRootMetaValue(order, "referral_id") ||
        undefined;

    let trimmedAccountSize = accountSize ? accountSize.trim() : undefined;
    if (detectedPurchaseType === "activation-order") {
        trimmedAccountSize = "0";
    }
    const programDetails = [trimmedAccountSize, programName, platformName]
        .filter(Boolean)
        .join(" - ");

    const mapped: MappedPurchase = {
        purchaseType: detectedPurchaseType ?? "original-order",
        orderNumber: String(order.number ?? order.id),
        hasAddOn: false,
        addOn: null,
        addOnValue: 0,
        purchasePrice: purchasePrice,
        totalPrice: totalPrice,
        discountCode,
        billingAddress: {
            address: order.billing?.address_1,
            postalCode: order.billing?.postcode,
            city: order.billing?.city,
            state: order.billing?.state,
            country: order.billing?.country,
        },
        programDetails,
        platformName,
        platformSlug,
        programName,
        programType,
        customerName,
        customerEmail: order.billing?.email || "",
        isInAppPurchase,
        affiliateEmail,
        accountSize: trimmedAccountSize,
        currency: order.currency,
        status: order.status,
        paymentMethod: order.payment_method_title || order.payment_method,
        transactionId: order.transaction_id,
        notes: order.customer_note,
        metadata: {
            wooOrderId: order.id,
            woo: {
                line_items: order.line_items,
                coupon_lines: order.coupon_lines,
                date_created: order.date_created,
            },
            affiliate: {
                affiliateId,
                referralId,
                email: affiliateEmail,
            },
        },
    };

    return mapped;
}

function normalizeMetadata(
    value: unknown,
):
    | { [k: string]: unknown }
    | unknown[]
    | string
    | number
    | boolean
    | null
    | undefined {
    if (value === null || value === undefined) return value as null | undefined;
    if (Array.isArray(value)) return value as unknown[];
    const t = typeof value;
    if (t === "string" || t === "number" || t === "boolean")
        return value as string | number | boolean;
    if (t === "object") return value as { [k: string]: unknown };
    return String(value);
}

type FetchOrdersOptions = {
    baseUrl?: string;
    consumerKey?: string;
    consumerSecret?: string;
    perPage?: number;
    page?: number;
    status?: string | string[];
    after?: string; // ISO8601
    before?: string; // ISO8601
    search?: string;
};

async function fetchWooOrdersPage({
    baseUrl,
    consumerKey,
    consumerSecret,
    perPage = 100,
    page = 1,
    status,
    after,
    before,
    search,
}: FetchOrdersOptions): Promise<{ orders: WooOrder[]; totalPages?: number }> {
    const url = new URL(
        "/wp-json/wc/v3/orders",
        ensureTrailingSlash(baseUrl ?? WOO_BASE_URL),
    );

    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    if (status) {
        const value = Array.isArray(status) ? status.join(",") : status;
        url.searchParams.set("status", value);
    }
    if (after) url.searchParams.set("after", after);
    if (before) url.searchParams.set("before", before);
    if (search) url.searchParams.set("search", search);

    const key = consumerKey ?? WOO_CONSUMER_KEY;
    const secret = consumerSecret ?? WOO_CONSUMER_SECRET;

    const response = await fetch(url, {
        headers: {
            Authorization: buildBasicAuthHeader(key, secret),
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "ftm-woo-orders-script/1.0",
        },
    });

    if (!response.ok) {
        const text = await safeText(response);
        throw new Error(
            `WooCommerce orders request failed: ${response.status} ${response.statusText} - ${text}`,
        );
    }

    const totalPagesHeader = response.headers.get("x-wp-totalpages");
    const totalPages = totalPagesHeader ? Number(totalPagesHeader) : undefined;
    const orders = (await response.json()) as WooOrder[];
    return { orders, totalPages };
}

async function fetchWooOrdersAll(
    options: FetchOrdersOptions & { maxPages?: number; pageDelayMs?: number },
) {
    const perPage = options.perPage ?? 1;
    const pageDelayMs = options.pageDelayMs ?? 150;
    const maxPages = options.maxPages ?? 1;

    const all: WooOrder[] = [];
    let page = options.page ?? 1;
    let totalPages: number | undefined;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { orders, totalPages: tp } = await fetchWooOrdersPage({
            ...options,
            perPage,
            page,
        });
        if (totalPages === undefined && tp !== undefined) totalPages = tp;

        if (!orders.length) break;
        all.push(...orders);

        const reachedMax = page >= maxPages;
        const reachedLast =
            totalPages !== undefined
                ? page >= totalPages
                : orders.length < perPage;
        if (reachedMax || reachedLast) break;

        page += 1;
        if (pageDelayMs > 0) await delay(pageDelayMs);
    }

    return all;
}

function buildBasicAuthHeader(user: string, pass: string) {
    const token = Buffer.from(`${user}:${pass}`).toString("base64");
    return `Basic ${token}`;
}

function ensureTrailingSlash(input: string) {
    return input.endsWith("/") ? input : `${input}/`;
}

function hasFlag(flag: string) {
    const argv = process.argv.slice(2);
    return argv.includes(flag) || argv.some((a) => a === `${flag}=true`);
}

function isValidEmail(email: string | undefined): boolean {
    if (!email) return false;
    const trimmed = email.trim();
    if (!trimmed) return false;
    // Simple pragmatic validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

async function resolveProgramId(
    payload: Awaited<ReturnType<typeof getPayloadClient>>,
    order: WooOrder,
    mapped: MappedPurchase,
): Promise<number | undefined> {
    // Try global program-product-mappings first
    try {
        const ppm = (await payload.findGlobal({
            slug: "program-product-mappings",
        })) as unknown as {
            mappings?: Array<{
                program?: number | { id?: number };
                productId?: string;
                variationId?: string;
            }>;
        };

        const items = Array.isArray(order.line_items) ? order.line_items : [];
        for (const it of items) {
            const pid =
                it?.product_id !== undefined
                    ? String(it.product_id)
                    : undefined;
            const vid =
                it?.variation_id !== undefined
                    ? String(it.variation_id)
                    : undefined;
            if (!pid || !vid) continue;

            const match = ppm?.mappings?.find(
                (m) => m.productId === pid && m.variationId === vid,
            );
            if (match?.program !== undefined && match.program !== null) {
                if (
                    typeof match.program === "object" &&
                    typeof match.program?.id === "number"
                ) {
                    return match.program.id;
                }
                if (typeof match.program === "number") return match.program;
            }
        }
    } catch {
        // ignore and fallback
    }

    // Fallback: try to match by exact program name if available
    if (mapped.programName) {
        try {
            const res = await payload.find({
                collection: "programs",
                where: {
                    name: { equals: mapped.programName },
                },
                limit: 1,
            });
            const doc = res?.docs?.[0] as { id?: number } | undefined;
            if (typeof doc?.id === "number") return doc.id;
        } catch {
            // ignore
        }
    }

    // Fallback: try to match by category (programType) and accountSize in tiers
    try {
        const res = await payload.find({
            collection: "programs",
            where: { isActive: { equals: true } },
            limit: 100,
        });
        type SimpleProgram = {
            id?: number;
            category?: "1-step" | "2-step" | "instant";
            pricingTiers?: Array<{ accountSize?: string }>;
        };
        const programs = (
            Array.isArray(res?.docs) ? res.docs : []
        ) as SimpleProgram[];

        const targetCategory = mapped.programType; // '1-step' | '2-step' | 'instant' | 'reset' | undefined
        const targetSize = mapped.accountSize?.trim();

        // Prefer same category with matching tier accountSize
        const byCategoryThenSize = programs.find((p) => {
            const sameCategory = targetCategory
                ? p?.category === targetCategory
                : true;
            if (!sameCategory) return false;
            const tiers: Array<{ accountSize?: string }> = Array.isArray(
                p?.pricingTiers,
            )
                ? p.pricingTiers
                : [];
            return targetSize
                ? tiers.some(
                      (t) => String(t.accountSize || "").trim() === targetSize,
                  )
                : tiers.length > 0;
        });
        if (typeof byCategoryThenSize?.id === "number")
            return byCategoryThenSize.id;

        // Next: any active program with a tier
        const anyActive =
            programs.find(
                (p) =>
                    Array.isArray(p?.pricingTiers) && p.pricingTiers.length > 0,
            ) || programs[0];
        if (typeof anyActive?.id === "number") return anyActive.id;
    } catch {
        // ignore
    }

    return undefined;
}

function mapWooToPayloadStatus(
    wooStatus?: string,
): "pending" | "completed" | "failed" | "refunded" | undefined {
    const s = (wooStatus || "").toLowerCase();
    if (s === "completed") return "completed";
    if (s === "refunded") return "refunded";
    if (s === "failed" || s === "cancelled" || s === "canceled")
        return "failed";
    if (s === "pending" || s === "processing" || s === "on-hold")
        return "pending";
    return undefined;
}

async function importPurchases(orders: WooOrder[], mapped: MappedPurchase[]) {
    const payload = await getPayloadClient();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < mapped.length; i++) {
        const m = mapped[i];
        const order = orders[i];
        if (!m.orderNumber?.trim()) {
            console.warn(
                `Skip: missing orderNumber for Woo order id=${order?.id}`,
            );
            skipped++;
            continue;
        }
        if (!m.customerName?.trim() || !isValidEmail(m.customerEmail)) {
            console.warn(
                `Skip ${m.orderNumber}: invalid or missing customer name/email`,
            );
            skipped++;
            continue;
        }
        if (!m.accountSize?.trim()) {
            console.warn(`Skip ${m.orderNumber}: missing accountSize`);
            skipped++;
            continue;
        }

        let programId = await resolveProgramId(payload, order, m);
        if (!programId) {
            // Fallback to the first active program available.
            try {
                const res = await payload.find({
                    collection: "programs",
                    where: { isActive: { equals: true } },
                    limit: 1,
                });
                const doc = res?.docs?.[0] as { id?: number } | undefined;
                if (typeof doc?.id === "number") {
                    programId = doc.id;
                }
            } catch {
                // continue
            }
        }
        if (!programId) {
            // Final fallback: any program
            try {
                const res = await payload.find({
                    collection: "programs",
                    limit: 1,
                });
                const doc = res?.docs?.[0] as { id?: number } | undefined;
                if (typeof doc?.id === "number") {
                    programId = doc.id;
                }
            } catch {
                // continue
            }
        }

        const status =
            (mapWooToPayloadStatus(order.status) as
                | "pending"
                | "completed"
                | "failed"
                | "refunded"
                | undefined) ?? "pending";

        const currency = ((): "USD" | "EUR" | "GBP" => {
            const c = String(
                m.currency || order.currency || "USD",
            ).toUpperCase();
            return c === "EUR" || c === "GBP" ? (c as "EUR" | "GBP") : "USD";
        })();

        const data: {
            purchaseType: "original-order" | "reset-order" | "activation-order";
            orderNumber: string;
            hasAddOn?: boolean;
            addOn?: number | null;
            addOnValue?: number;
            purchasePrice?: number;
            totalPrice?: number;
            discountCode?: string;
            billingAddress?: {
                address?: string;
                postalCode?: string;
                city?: string;
                state?: string;
                country?: string;
            };
            programDetails?: string;
            platformName?: string;
            platformSlug?: string;
            programName?: string;
            programType?: "1-step" | "2-step" | "instant" | "reset";
            customerName: string;
            customerEmail: string;
            isInAppPurchase?: boolean;
            program: number;
            accountSize: string;
            currency: "USD" | "EUR" | "GBP";
            status: "pending" | "completed" | "failed" | "refunded";
            paymentMethod?: string;
            transactionId?: string;
            notes?: string;
            metadata?:
                | { [k: string]: unknown }
                | unknown[]
                | string
                | number
                | boolean
                | null;
        } = {
            purchaseType: m.purchaseType,
            orderNumber: m.orderNumber, // preserve as-is; beforeValidate won't overwrite
            hasAddOn: m.hasAddOn,
            addOn:
                typeof m.addOn === "number" || m.addOn === null
                    ? m.addOn
                    : undefined,
            addOnValue: m.addOnValue ?? undefined,
            purchasePrice: m.purchasePrice ?? undefined,
            totalPrice: m.totalPrice ?? undefined,
            discountCode: m.discountCode ?? undefined,
            billingAddress: m.billingAddress ?? undefined,
            programDetails: m.programDetails ?? undefined,
            platformName: m.platformName ?? undefined,
            platformSlug: m.platformSlug ?? undefined,
            programName: m.programName ?? undefined,
            programType: m.programType ?? undefined,
            customerName: m.customerName,
            customerEmail: m.customerEmail,
            isInAppPurchase: m.isInAppPurchase,
            program: typeof programId === "number" ? programId : 0,
            accountSize: m.accountSize?.trim() || "",
            currency,
            status,
            paymentMethod: m.paymentMethod ?? undefined,
            transactionId: m.transactionId ?? undefined,
            notes: m.notes ?? undefined,
            metadata: normalizeMetadata(m.metadata),
        };

        // Upsert by orderNumber
        const existing = await payload.find({
            collection: "purchases",
            where: { orderNumber: { equals: m.orderNumber } },
            limit: 1,
        });

        try {
            if (existing?.docs?.[0]) {
                const id = existing.docs[0].id as number;
                await payload.update({ collection: "purchases", id, data });
                updated++;
            } else {
                await payload.create({ collection: "purchases", data });
                created++;
            }
        } catch (err) {
            console.warn(`Skip ${m.orderNumber}: create/update failed:`, err);
            skipped++;
        }
    }

    console.log(
        `Imported purchases: created=${created}, updated=${updated}, skipped=${skipped}`,
    );
}

async function main() {
    const baseUrl = WOO_BASE_URL;
    const statusArg = getArgValue("--status");
    const afterArg = getArgValue("--after");
    const beforeArg = getArgValue("--before");
    const searchArg = getArgValue("--search");
    const perPage = getNumArg("--per-page", 1);
    const maxPages = getNumArg("--max-pages", 1);
    const pageDelayMs = getNumArg("--page-delay-ms", 150);
    const startPage = getNumArg("--page", 1);
    const shouldImport = hasFlag("--import");
    const minOrderId = getNumArg("--min-order-id", 0);
    const orderIdsArg = getArgValue("--order-ids");
    const orderIds = orderIdsArg
        ?.split(/[\s,]+/)
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0) as
        | number[]
        | undefined;
    const effectiveOrderIds = orderIds?.length ? orderIds : [];

    const status = statusArg
        ? statusArg
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
        : undefined;

    console.log("Fetching orders...");
    let orders = effectiveOrderIds.length
        ? await fetchWooOrdersByIds({
              baseUrl,
              consumerKey: WOO_CONSUMER_KEY,
              consumerSecret: WOO_CONSUMER_SECRET,
              ids: effectiveOrderIds,
          })
        : await fetchWooOrdersAll({
              baseUrl,
              perPage,
              page: startPage,
              status,
              after: afterArg,
              before: beforeArg,
              search: searchArg,
              maxPages,
              pageDelayMs,
          });

    // Filter by minimum order ID if specified
    if (minOrderId > 0) {
        const beforeFilter = orders.length;
        orders = orders.filter((o) => o.id > minOrderId);
        console.log(
            `Filtered by min-order-id=${minOrderId}: ${beforeFilter} -> ${orders.length} orders`,
        );
    }

    const format = (getArgValue("--format") ?? "summary").toLowerCase();
    if (format === "json") {
        console.log(JSON.stringify(orders, null, 2));
    } else if (format === "purchases") {
        const mapped = orders.map(mapWooOrderToPurchase);
        console.log(JSON.stringify(mapped, null, 2));
        if (shouldImport) {
            await importPurchases(orders, mapped);
        }
    } else {
        console.error(`Fetched ${orders.length} orders`);
        for (const o of orders) {
            const id = o.id;
            const status = o.status ?? "";
            const total = o.total ?? "";
            const dateCreated =
                (o as { date_created?: string }).date_created ?? "";
            console.log(`${id}\t${status}\t${total}\t${dateCreated}`);
        }
        if (shouldImport) {
            const mapped = orders.map(mapWooOrderToPurchase);
            await importPurchases(orders, mapped);
        }
    }
}

function getArgValue(flag: string) {
    const argv = process.argv.slice(2);
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === flag && argv[i + 1] && !argv[i + 1].startsWith("--")) {
            return argv[i + 1];
        }
        if (arg.startsWith(`${flag}=`)) {
            return arg.slice(flag.length + 1);
        }
    }
    return undefined;
}

function getNumArg(flag: string, fallback: number) {
    const raw = getArgValue(flag);
    if (raw === undefined) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
}

async function safeText(response: Response) {
    try {
        return await response.text();
    } catch {
        return "<no body>";
    }
}

void main().catch((err) => {
    console.error(err);
    process.exit(1);
});
