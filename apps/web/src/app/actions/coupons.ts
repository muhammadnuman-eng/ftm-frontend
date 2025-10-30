"use server";

import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload";
import { logActionError } from "@/lib/posthog-error";
import { calculateDiscount } from "../../lib/coupons/calculation";
import {
    type ValidationResult,
    validateCoupon,
} from "../../lib/coupons/validation";
import type { Coupon, CouponUsage } from "../../payload-types";

export interface AppliedCoupon {
    code: string;
    couponId: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    discountAmount: number;
    finalPrice: number;
}

export interface CouponUsageRecord {
    couponId: string;
    customerEmail?: string;
    programId: string;
    accountSize: string;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    orderReference?: string;
    paymentMethod?: string;
    currency?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Server action to validate a coupon code
 */
export async function validateCouponAction(
    code: string,
    programId: string,
    accountSize: string,
    userId?: string,
    userEmail?: string,
    orderAmount?: number,
): Promise<ValidationResult> {
    try {
        if (!code || !programId || !accountSize) {
            return {
                valid: false,
                error: "Missing required parameters",
            };
        }

        // If no user ID provided, skip user-specific checks but still validate program + usage limits
        if (!userId) {
            const payload = await getPayloadClient();
            const couponResult = await payload.find({
                collection: "coupons",
                where: {
                    code: {
                        equals: code.toUpperCase(),
                    },
                },
                limit: 1,
            });

            if (couponResult.docs.length === 0) {
                return {
                    valid: false,
                    error: "Invalid coupon code",
                };
            }

            const basicValidation = await validateCoupon({
                code,
                userId: "0",
                programId,
                accountSize,
                userEmail,
                orderAmount,
            });

            return basicValidation;
        }

        // Full validation with user context
        return await validateCoupon({
            code,
            userId,
            programId,
            accountSize,
            userEmail,
            orderAmount,
        });
    } catch (error) {
        console.error("Error in validateCouponAction:", error);
        logActionError({
            actionName: "validateCouponAction",
            error,
            userEmail: userEmail,
            additionalContext: {
                code,
                programId,
                accountSize,
                hasUserId: !!userId,
            },
        });
        return {
            valid: false,
            error: "An error occurred while validating the coupon",
        };
    }
}

/**
 * Server action to apply a coupon and calculate the discount
 */
export async function applyCouponAction(
    code: string,
    programId: string,
    accountSize: string,
    originalPrice: number,
    userId?: string,
    userEmail?: string,
): Promise<{
    success: boolean;
    appliedCoupon?: AppliedCoupon;
    error?: string;
}> {
    try {
        // Validate the coupon first
        const validation = await validateCouponAction(
            code,
            programId,
            accountSize,
            userId,
            userEmail,
            originalPrice,
        );

        if (!validation.valid || !validation.discount || !validation.coupon) {
            return {
                success: false,
                error: validation.error || "Invalid coupon data",
            };
        }

        // Calculate the discount
        const calculation = calculateDiscount({
            originalPrice,
            discountType: validation.discount.type,
            discountValue: validation.discount.value,
        });

        const appliedCoupon: AppliedCoupon = {
            code: validation.coupon.code,
            couponId: validation.coupon.id.toString(),
            discountType: validation.discount.type,
            discountValue: validation.discount.value,
            discountAmount: calculation.discountAmount,
            finalPrice: calculation.finalPrice,
        };

        return {
            success: true,
            appliedCoupon,
        };
    } catch (error) {
        console.error("Error in applyCouponAction:", error);
        logActionError({
            actionName: "applyCouponAction",
            error,
            userEmail: userEmail,
            additionalContext: {
                code,
                programId,
                accountSize,
                originalPrice,
                hasUserId: !!userId,
            },
        });
        return {
            success: false,
            error: "An error occurred while applying the coupon",
        };
    }
}

/**
 * Server action to record coupon usage after successful payment
 */
export async function recordCouponUsageAction(
    usageData: CouponUsageRecord,
    userAgent?: string,
    ipAddress?: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const payload = await getPayloadClient();

        // Verify the coupon exists
        const coupon = await payload.findByID({
            collection: "coupons",
            id: usageData.couponId,
        });

        if (!coupon) {
            return {
                success: false,
                error: "Coupon not found",
            };
        }

        // Create the usage record
        await payload.create({
            collection: "coupon-usage",
            data: {
                coupon: Number(usageData.couponId),
                ...(usageData.customerEmail
                    ? { customerEmail: usageData.customerEmail }
                    : {}),
                program: Number(usageData.programId),
                accountSize: usageData.accountSize,
                originalPrice: usageData.originalPrice,
                discountAmount: usageData.discountAmount,
                finalPrice: usageData.finalPrice,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                usedAt: new Date().toISOString(),
                orderReference: usageData.orderReference,
                paymentMethod: usageData.paymentMethod as
                    | "credit_card"
                    | "paypal"
                    | "bank_transfer"
                    | "crypto"
                    | undefined,
                currency:
                    (usageData.currency as "USD" | "EUR" | "GBP" | undefined) ||
                    "USD",
                userAgent,
                ipAddress,
                metadata: usageData.metadata,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error recording coupon usage:", error);
        logActionError({
            actionName: "recordCouponUsageAction",
            error,
            userEmail: usageData.customerEmail,
            additionalContext: {
                couponId: usageData.couponId,
                programId: usageData.programId,
                accountSize: usageData.accountSize,
                orderReference: usageData.orderReference,
                paymentMethod: usageData.paymentMethod,
            },
        });
        return {
            success: false,
            error: "Failed to record coupon usage",
        };
    }
}

/**
 * Server action to get coupon usage statistics
 */
export async function getCouponUsageStatsAction(couponId: string): Promise<{
    success: boolean;
    stats?: {
        totalUses: number;
        totalDiscountGiven: number;
        averageDiscountAmount: number;
        mostPopularProgram: string;
        mostPopularAccountSize: string;
        recentUsages: CouponUsage[];
    };
    error?: string;
}> {
    try {
        const payload = await getPayloadClient();

        // Get all usage records for this coupon
        const usageRecords = await payload.find({
            collection: "coupon-usage",
            where: {
                coupon: {
                    equals: couponId,
                },
            },
            limit: 1000, // Adjust as needed
            sort: "-usedAt",
        });

        if (usageRecords.docs.length === 0) {
            return {
                success: true,
                stats: {
                    totalUses: 0,
                    totalDiscountGiven: 0,
                    averageDiscountAmount: 0,
                    mostPopularProgram: "",
                    mostPopularAccountSize: "",
                    recentUsages: [],
                },
            };
        }

        const totalUses = usageRecords.totalDocs;
        const totalDiscountGiven = usageRecords.docs.reduce(
            (sum, record) => sum + record.discountAmount,
            0,
        );
        const averageDiscountAmount = totalDiscountGiven / totalUses;

        // Find most popular program
        const programCounts: Record<string, number> = {};
        const accountSizeCounts: Record<string, number> = {};

        for (const record of usageRecords.docs) {
            const programId =
                typeof record.program === "string"
                    ? record.program
                    : typeof record.program === "object" &&
                        record.program !== null
                      ? String((record.program as { id?: number }).id || "")
                      : null;
            if (programId) {
                programCounts[programId] = (programCounts[programId] || 0) + 1;
            }

            if (record.accountSize) {
                accountSizeCounts[record.accountSize] =
                    (accountSizeCounts[record.accountSize] || 0) + 1;
            }
        }

        const mostPopularProgram = Object.keys(programCounts).reduce(
            (a, b) => (programCounts[a] > programCounts[b] ? a : b),
            "",
        );

        const mostPopularAccountSize = Object.keys(accountSizeCounts).reduce(
            (a, b) => (accountSizeCounts[a] > accountSizeCounts[b] ? a : b),
            "",
        );

        const recentUsages = usageRecords.docs.slice(0, 10);

        return {
            success: true,
            stats: {
                totalUses,
                totalDiscountGiven,
                averageDiscountAmount,
                mostPopularProgram,
                mostPopularAccountSize,
                recentUsages,
            },
        };
    } catch (error) {
        console.error("Error getting coupon usage stats:", error);
        return {
            success: false,
            error: "Failed to get coupon usage statistics",
        };
    }
}

/**
 * Server action to check if a user has already used a coupon
 */
export async function checkCouponUsageByUserAction(
    couponId: string,
    userIdentifier: { userId?: string; email?: string },
): Promise<{ hasUsed: boolean; usageCount: number; lastUsed?: string }> {
    try {
        const payload = await getPayloadClient();

        const usageRecords = await payload.find({
            collection: "coupon-usage",
            where: {
                and: [
                    {
                        coupon: {
                            equals: couponId,
                        },
                    },
                    userIdentifier.userId
                        ? {
                              user: {
                                  equals: userIdentifier.userId,
                              },
                          }
                        : {
                              customerEmail: {
                                  equals: userIdentifier.email,
                              },
                          },
                ],
            },
            sort: "-usedAt",
        });

        return {
            hasUsed: usageRecords.totalDocs > 0,
            usageCount: usageRecords.totalDocs,
            lastUsed: usageRecords.docs[0]?.usedAt,
        };
    } catch (error) {
        console.error("Error checking coupon usage by user:", error);
        return {
            hasUsed: false,
            usageCount: 0,
        };
    }
}

/**
 * Server action to get all active coupons for a user
 */
export async function getActiveCouponsAction(userId?: string): Promise<{
    success: boolean;
    coupons?: Coupon[];
    error?: string;
}> {
    try {
        const payload = await getPayloadClient();
        const now = new Date();

        let whereClause: Where = {
            and: [
                {
                    status: {
                        equals: "active",
                    },
                },
                {
                    validFrom: {
                        less_than_equal: now.toISOString(),
                    },
                },
                {
                    or: [
                        {
                            validTo: {
                                greater_than: now.toISOString(),
                            },
                        },
                        {
                            validTo: {
                                exists: false,
                            },
                        },
                    ],
                },
            ],
        };

        // If user ID is provided, also check for user-specific coupons
        if (userId) {
            whereClause = {
                or: [
                    whereClause,
                    {
                        and: [
                            whereClause,
                            {
                                specificUsers: {
                                    contains: userId,
                                },
                            },
                        ],
                    },
                ],
            };
        }

        const coupons = await payload.find({
            collection: "coupons",
            where: whereClause,
            sort: "-createdAt",
        });

        return {
            success: true,
            coupons: coupons.docs,
        };
    } catch (error) {
        console.error("Error getting active coupons:", error);
        return {
            success: false,
            error: "Failed to get active coupons",
        };
    }
}
