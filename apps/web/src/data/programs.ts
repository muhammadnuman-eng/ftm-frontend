import { Decimal } from "decimal.js";
import type { Where } from "payload";
import { isProgramRestrictedForCountry } from "@/lib/countries";
import { getPayloadClient } from "@/lib/payload";
import type { Program } from "@/payload-types";
import { manualDiscountOverrides } from "./manual-discount-overrides";

// Feature flag to enable/disable caching
// Set DISABLE_PRICING_CACHE=true in .env to disable all caching
const CACHE_ENABLED = process.env.DISABLE_PRICING_CACHE !== "true";

// Simple in-memory cache for programs
const programCache = new Map<
    string,
    { data: ProgramWithDiscounts[]; timestamp: number }
>();
const CACHE_TTL = 1 * 60 * 1000; // 1 minute - reduced for better price freshness

// Cache for individual programs
const singleProgramCache = new Map<
    string,
    { data: ProgramWithDiscounts | null; timestamp: number }
>();

// Cache for discount calculations
const discountCache = new Map<
    string,
    { data: ProgramWithDiscounts["discounts"]; timestamp: number }
>();
const DISCOUNT_CACHE_TTL = 30 * 1000; // 30 seconds - shorter TTL for dynamic pricing

// Global coupon cache to avoid repeated database queries
const globalCouponCache = new Map<
    string,
    { data: unknown[]; timestamp: number }
>();
const COUPON_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for coupons

// Cache helper functions
function getCachedPrograms(cacheKey: string): ProgramWithDiscounts[] | null {
    if (!CACHE_ENABLED) return null;
    const cached = programCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCachedPrograms(
    cacheKey: string,
    data: ProgramWithDiscounts[],
): void {
    if (!CACHE_ENABLED) return;
    programCache.set(cacheKey, { data, timestamp: Date.now() });
}

function getCachedSingleProgram(
    cacheKey: string,
): ProgramWithDiscounts | null | undefined {
    if (!CACHE_ENABLED) return undefined;
    const cached = singleProgramCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    return undefined;
}

function setCachedSingleProgram(
    cacheKey: string,
    data: ProgramWithDiscounts | null,
): void {
    if (!CACHE_ENABLED) return;
    singleProgramCache.set(cacheKey, { data, timestamp: Date.now() });
}

function getCachedDiscounts(
    cacheKey: string,
): ProgramWithDiscounts["discounts"] | null {
    if (!CACHE_ENABLED) return null;
    const cached = discountCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DISCOUNT_CACHE_TTL) {
        return cached.data;
    }
    return null;
}

function setCachedDiscounts(
    cacheKey: string,
    data: ProgramWithDiscounts["discounts"],
): void {
    if (!CACHE_ENABLED) return;
    discountCache.set(cacheKey, { data, timestamp: Date.now() });
}

// Global coupon fetching with aggressive caching
async function getAllActiveCoupons(): Promise<unknown[]> {
    const cacheKey = "all_active_coupons";

    if (CACHE_ENABLED) {
        const cached = globalCouponCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < COUPON_CACHE_TTL) {
            return cached.data;
        }
    }

    try {
        const payload = await getPayloadClient();
        const now = new Date();

        // Fetch ALL active coupons once
        const couponsResult = await payload.find({
            collection: "coupons",
            where: {
                and: [
                    { status: { equals: "active" } },
                    { autoApply: { equals: true } },
                    { validFrom: { less_than_equal: now.toISOString() } },
                    {
                        or: [
                            { validTo: { greater_than: now.toISOString() } },
                            { validTo: { exists: false } },
                        ],
                    },
                ],
            },
            limit: 100,
            sort: "-autoApplyPriority",
            select: {
                id: true,
                code: true,
                discountType: true,
                discountValue: true,
                autoApplyPriority: true,
                autoApplyMessage: true,
                restrictionType: true,
                applicablePrograms: true,
                excludedPrograms: true,
                minimumPurchaseAmount: true,
                totalUsageLimit: true,
                usagePerUser: true,
                accountSizeDiscounts: true,
            },
        });

        if (!couponsResult?.docs) {
            console.warn(
                "Coupons query returned no docs; falling back to empty list",
            );
            if (CACHE_ENABLED) {
                globalCouponCache.set(cacheKey, {
                    data: [],
                    timestamp: Date.now(),
                });
            }
            return [];
        }

        const coupons = couponsResult.docs;
        if (CACHE_ENABLED) {
            globalCouponCache.set(cacheKey, {
                data: coupons,
                timestamp: Date.now(),
            });
        }
        return coupons;
    } catch (error) {
        console.error("Error fetching active coupons:", error);
        return [];
    }
}

// Optimized batch validation without database calls
function validateCouponBatch(
    coupon: unknown,
    programId: string,
    accountSize: string,
    orderAmount: number,
    _userId?: string,
    _userEmail?: string,
): { valid: boolean; discount?: { type: string; value: number } } {
    const couponData = coupon as Record<string, unknown>;

    // Check program restrictions
    if (couponData.restrictionType === "whitelist") {
        const applicablePrograms =
            (couponData.applicablePrograms as unknown[]) || [];
        const isApplicable = applicablePrograms.some((program: unknown) => {
            if (typeof program === "number") {
                return program.toString() === programId;
            }
            if (typeof program === "object" && program !== null) {
                return (program as { id: number }).id.toString() === programId;
            }
            return false;
        });
        if (!isApplicable) return { valid: false };
    }

    if (couponData.restrictionType === "blacklist") {
        const excludedPrograms =
            (couponData.excludedPrograms as unknown[]) || [];
        const isExcluded = excludedPrograms.some((program: unknown) => {
            if (typeof program === "number") {
                return program.toString() === programId;
            }
            if (typeof program === "object" && program !== null) {
                return (program as { id: number }).id.toString() === programId;
            }
            return false;
        });
        if (isExcluded) return { valid: false };
    }

    // Check minimum purchase amount
    if (
        couponData.minimumPurchaseAmount &&
        orderAmount < (couponData.minimumPurchaseAmount as number)
    ) {
        return { valid: false };
    }

    // Get discount value for account size
    let discountValue = (couponData.discountValue as number) || 0;
    if (
        couponData.accountSizeDiscounts &&
        Array.isArray(couponData.accountSizeDiscounts)
    ) {
        const accountSizeDiscount = (
            couponData.accountSizeDiscounts as Record<string, unknown>[]
        ).find(
            (discount: Record<string, unknown>) =>
                discount.accountSize === accountSize,
        );
        if (accountSizeDiscount) {
            discountValue = (accountSizeDiscount.discountValue as number) || 0;
        }
    }

    return {
        valid: true,
        discount: {
            type: (couponData.discountType as string) || "percentage",
            value: discountValue,
        },
    };
}

export interface CategoryContent {
    id: string;
    category: "1-step" | "2-step" | "instant";
    title: string;
    description: string;
    benefits: string[];
}

export interface ProgramWithDiscounts extends Program {
    isNewProgram?: boolean | null;
    features?: Array<{
        key: string;
        label: string;
        value: string;
        badge?: string;
        emphasized?: boolean;
    }>;
    consistencySection?: Array<{
        label: string;
        value: string;
        badge?: string;
    }>;
    discounts?: {
        [accountSize: string]: {
            originalPrice: number;
            discountedPrice: number;
            discountAmount: number;
            discountType: "percentage" | "fixed";
            discountValue: number;
            couponCode?: string;
        };
    };
    hasResetFee?: boolean | null;
    hasActivationFeeValue?: boolean | null;
    activationFeeValue?: number | null;
}

type PricingTier = NonNullable<Program["pricingTiers"]>[number];

interface ProgramOptions {
    accountSize?: string;
    userId?: string;
    userEmail?: string;
    urlParams?: Record<string, string>;
    locale?: string;
}

// Helper function to normalize Payload features array into UI-friendly features
export const transformProgramToFeatures = (program: Program) => {
    const programWithArrays = program as unknown as {
        features?: Array<{ label?: string; value?: string }> | null;
    };
    const fromPayload = Array.isArray(programWithArrays.features)
        ? programWithArrays.features
        : ([] as Array<{ label?: string; value?: string }>);

    // Generate a stable key for each feature based on label and index
    return fromPayload.map(
        (item: { label?: string; value?: string }, index: number) => {
            const label = (item?.label as string) || "";
            const value = (item?.value as string) || "";
            const normalizedKey = label
                ? label
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)/g, "")
                : `feature-${index}`;
            return {
                key: normalizedKey,
                label,
                value,
            } as {
                key: string;
                label: string;
                value: string;
                badge?: string;
                emphasized?: boolean;
            };
        },
    );
};

// Helper function to calculate discounted price
function calculateDiscountedPrice(
    originalPrice: number,
    discountType: "percentage" | "fixed",
    discountValue: number,
): { discountedPrice: number; discountAmount: number } {
    const originalPriceDecimal = new Decimal(originalPrice);
    const discountValueDecimal = new Decimal(discountValue);

    const discountAmountDecimal =
        discountType === "percentage"
            ? originalPriceDecimal.times(discountValueDecimal).dividedBy(100)
            : discountValueDecimal;

    const discountedPriceDecimal = Decimal.max(
        0,
        originalPriceDecimal.minus(discountAmountDecimal),
    );

    return {
        discountedPrice: discountedPriceDecimal
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber(),
        discountAmount: discountAmountDecimal
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber(),
    };
}

// MASSIVELY OPTIMIZED batch discount calculation
async function calculateBatchDiscounts(
    program: Program,
    tiers: PricingTier[],
    urlSearchParams: URLSearchParams,
    options?: ProgramOptions,
): Promise<ProgramWithDiscounts["discounts"]> {
    // Create cache key for this specific discount calculation
    const discountCacheKey = `discounts_${program.id}_${JSON.stringify(options || {})}_${urlSearchParams.toString()}`;

    // Check discount cache first
    const cachedDiscounts = getCachedDiscounts(discountCacheKey);
    if (cachedDiscounts) {
        return cachedDiscounts;
    }

    const discounts: ProgramWithDiscounts["discounts"] = {};

    // Filter out tiers without prices
    const validTiers = tiers.filter((tier) => tier.price);
    if (validTiers.length === 0) return discounts;

    try {
        // Fetch ALL active coupons ONCE (cached globally)
        const allCoupons = await getAllActiveCoupons();

        // Process each tier with the pre-fetched coupons
        for (const tier of validTiers) {
            let bestCoupon: unknown = null;
            let bestDiscount: { type: string; value: number } | null = null;

            // Find the best coupon for this tier
            for (const coupon of allCoupons) {
                const validation = validateCouponBatch(
                    coupon,
                    program.id.toString(),
                    tier.accountSize,
                    tier.price as number,
                    options?.userId,
                    options?.userEmail,
                );

                if (validation.valid && validation.discount) {
                    const couponData = coupon as Record<string, unknown>;
                    const currentPriority =
                        (couponData.autoApplyPriority as number) || 0;
                    const bestPriority = bestCoupon
                        ? ((bestCoupon as Record<string, unknown>)
                              .autoApplyPriority as number) || 0
                        : -1;

                    // Check if this is a better coupon (higher priority)
                    if (!bestCoupon || currentPriority > bestPriority) {
                        bestCoupon = coupon;
                        bestDiscount = validation.discount;
                    }
                }
            }

            // Apply the best discount if found
            if (bestCoupon && bestDiscount) {
                const { discountedPrice, discountAmount } =
                    calculateDiscountedPrice(
                        tier.price as number,
                        bestDiscount.type as "percentage" | "fixed",
                        bestDiscount.value,
                    );

                (
                    discounts as Record<
                        string,
                        {
                            originalPrice: number;
                            discountedPrice: number;
                            discountAmount: number;
                            discountType: "percentage" | "fixed";
                            discountValue: number;
                            couponCode?: string;
                        }
                    >
                )[tier.accountSize] = {
                    originalPrice: tier.price as number,
                    discountedPrice,
                    discountAmount,
                    discountType: bestDiscount.type as "percentage" | "fixed",
                    discountValue: bestDiscount.value,
                    couponCode:
                        typeof (bestCoupon as Record<string, unknown>)?.code ===
                        "string"
                            ? ((bestCoupon as Record<string, unknown>)
                                  .code as string)
                            : undefined,
                };
            }
        }

        // Cache the results
        setCachedDiscounts(discountCacheKey, discounts);
        return discounts;
    } catch (error) {
        console.error(
            `Error in batch discount calculation for program ${program.id}:`,
            error,
        );
        return discounts;
    }
}

// Optimized function to calculate discounts for all tiers of a program
async function calculateProgramDiscounts(
    program: Program,
    options?: ProgramOptions,
): Promise<ProgramWithDiscounts["discounts"]> {
    if (!program.pricingTiers?.length) return {};

    const urlSearchParams = new URLSearchParams(options?.urlParams || {});
    const tiersToProcess = options?.accountSize
        ? program.pricingTiers.filter(
              (tier) => tier.accountSize === options.accountSize,
          )
        : program.pricingTiers;

    // Use batch processing for better performance
    return calculateBatchDiscounts(
        program,
        tiersToProcess,
        urlSearchParams,
        options,
    );
}

// Optimized function to process a single program with features and discounts
async function processProgram(
    program: Program,
    options?: ProgramOptions,
): Promise<ProgramWithDiscounts> {
    const programWithFeatures = {
        ...program,
        features: transformProgramToFeatures(program),
    } as ProgramWithDiscounts;

    const discounts = await calculateProgramDiscounts(program, options);

    if (discounts && Object.keys(discounts).length > 0) {
        programWithFeatures.discounts = discounts;
    }

    return applyManualDiscountOverrides(programWithFeatures);
}

const applyManualDiscountOverrides = (
    program: ProgramWithDiscounts,
): ProgramWithDiscounts => {
    const overrides = manualDiscountOverrides[program.slug];

    if (!overrides) {
        return program;
    }

    const updatedPricingTiers = program.pricingTiers?.map((tier) => {
        const override = overrides[tier.accountSize];

        if (!override) {
            return tier;
        }

        return {
            ...tier,
            price: override.originalPrice,
        } as PricingTier;
    }) as ProgramWithDiscounts["pricingTiers"];

    const discountEntries = Object.entries(overrides);
    const discounts = { ...(program.discounts ?? {}) } as NonNullable<
        ProgramWithDiscounts["discounts"]
    >;

    for (const [accountSize, override] of discountEntries) {
        const originalPrice = override.originalPrice;
        const discountedPrice = override.discountedPrice;
        const discountAmount = originalPrice - discountedPrice;

        discounts[accountSize] = {
            originalPrice,
            discountedPrice,
            discountAmount,
            discountType: "fixed",
            discountValue: discountAmount,
        };
    }

    return {
        ...program,
        pricingTiers: updatedPricingTiers ?? program.pricingTiers,
        discounts,
    };
};

// Optimized base function to fetch programs with minimal fields and caching
async function fetchPrograms(
    whereClause: Where,
    options: { userCountryCode?: string; locale?: string } = {},
): Promise<Program[]> {
    const { userCountryCode, locale } = options;
    const payload = await getPayloadClient();

    // Only fetch essential fields to reduce payload size
    const programs = await payload.find({
        collection: "programs",
        where: whereClause,
        sort: "order",
        limit: 50, // Limit results to prevent large payloads
        locale: locale as "all" | "en" | "tr" | "de" | "ar" | "ms" | undefined,
        select: {
            id: true,
            slug: true,
            name: true,
            mobileName: true,
            category: true,
            description: true,
            subtitle: true,
            isActive: true,
            isPopular: true,
            isNewProgram: true,
            order: true,
            pricingTiers: {
                accountSize: true,
                price: true,
                isPopular: true,
                resetFee: true,
                resetFeeFunded: true,
            },
            faqLink: true,
            benefits: {
                benefit: true,
            },
            features: true,
            consistencySection: true,
            hasResetFee: true,
            hasActivationFeeValue: true,
            activationFeeValue: true,
            // Comparison table fields
            dailyDrawdown: {
                percent: true,
                type: true,
                label: true,
            },
            overallDrawdown: {
                percent: true,
                type: true,
                label: true,
            },
            profitTarget: {
                percent: true,
                label: true,
            },
            secondProfitTarget: {
                percent: true,
                label: true,
            },
            minTradingDays: {
                evaluation: true,
                simFunded: true,
            },
            consistencyScore: {
                evaluation: true,
                simFunded: true,
            },
            profitSplit: true,
            activationFee: true,
        },
    });

    let filteredPrograms = programs.docs;

    // Filter out restricted programs if country code is provided
    if (userCountryCode) {
        filteredPrograms = programs.docs.filter(
            (program) =>
                !isProgramRestrictedForCountry(program, userCountryCode),
        );
    }

    return filteredPrograms;
}

/**
 * Example usage of getPrograms with discount calculation:
 *
 * const programs = await getPrograms(undefined, {
 *   accountSize: "$10,000",
 *   userId: "user123",
 *   userEmail: "user@example.com",
 *   urlParams: { coupon: "SEP60" }
 * });
 *
 * // Access discounted prices
 * programs.forEach(program => {
 *   if (program.discounts?.["$10,000"]) {
 *     const discount = program.discounts["$10,000"];
 *     console.log(`Original: $${discount.originalPrice}`);
 *     console.log(`Discounted: $${discount.discountedPrice}`);
 *     console.log(`Saved: $${discount.discountAmount}`);
 *   }
 * });
 */

export async function getPrograms(
    userCountryCode?: string,
    options?: ProgramOptions,
): Promise<ProgramWithDiscounts[]> {
    // Create cache key
    const cacheKey = `programs_${userCountryCode || "all"}_${JSON.stringify(options || {})}`;

    // Check cache first
    const cached = getCachedPrograms(cacheKey);
    if (cached) {
        return cached;
    }

    const localeOption = options?.locale;
    const programs = await fetchPrograms(
        { isActive: { equals: true } },
        { userCountryCode, locale: localeOption },
    );

    // Always calculate discounts for all programs
    const programPromises = programs.map((program) =>
        processProgram(program, options),
    );

    const result = await Promise.all(programPromises);
    setCachedPrograms(cacheKey, result);
    return result;
}

export async function getProgramBySlug(
    slug: string,
    options?: ProgramOptions,
): Promise<ProgramWithDiscounts | null> {
    const cacheKey = `program_${slug}_${JSON.stringify(options || {})}`;

    // Check cache first
    const cached = getCachedSingleProgram(cacheKey);
    if (cached !== undefined) {
        return cached;
    }

    const programs = await fetchPrograms(
        {
            and: [{ slug: { equals: slug } }, { isActive: { equals: true } }],
        },
        { locale: options?.locale },
    );

    if (programs.length === 0) {
        setCachedSingleProgram(cacheKey, null);
        return null;
    }

    const result = await processProgram(programs[0], options);
    setCachedSingleProgram(cacheKey, result);
    return result;
}

export async function getProgramsByCategory(
    category: "1-step" | "2-step" | "instant",
    userCountryCode?: string,
    options?: ProgramOptions,
): Promise<ProgramWithDiscounts[]> {
    const cacheKey = `programs_category_${category}_${userCountryCode || "all"}_${JSON.stringify(options || {})}`;

    // Check cache first
    const cached = getCachedPrograms(cacheKey);
    if (cached) {
        return cached;
    }

    const programs = await fetchPrograms(
        {
            and: [
                { category: { equals: category } },
                { isActive: { equals: true } },
            ],
        },
        { userCountryCode, locale: options?.locale },
    );

    // Always calculate discounts for all programs
    const programPromises = programs.map((program) =>
        processProgram(program, options),
    );

    const result = await Promise.all(programPromises);
    setCachedPrograms(cacheKey, result);
    return result;
}

// Super-fast function for basic program fetching without discount calculations
export async function getProgramsFast(
    userCountryCode?: string,
    locale?: string,
): Promise<ProgramWithDiscounts[]> {
    const cacheKey = `programs_fast_${userCountryCode || "all"}_${locale || "default"}`;

    // Check cache first
    const cached = getCachedPrograms(cacheKey);
    if (cached) {
        return cached;
    }

    const localeOption = locale;
    const programs = await fetchPrograms(
        { isActive: { equals: true } },
        { userCountryCode, locale: localeOption },
    );

    // Return programs with features but no discount calculations
    const programsWithFeatures = programs.map(
        (program) =>
            ({
                ...program,
                features: transformProgramToFeatures(program),
            }) as ProgramWithDiscounts,
    );

    setCachedPrograms(cacheKey, programsWithFeatures);
    return programsWithFeatures;
}
