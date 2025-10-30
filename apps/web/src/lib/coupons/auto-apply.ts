import { getPayloadClient } from "@/lib/payload";
import { validateCoupon } from "./validation";
export interface AutoApplyContext {
    userId?: string;
    userEmail?: string;
    programId: string;
    accountSize: string;
    orderAmount: number;
    urlParams: URLSearchParams;
}

export interface AutoApplyCoupon {
    couponId: string;
    code: string;
    message?: string;
    priority: number;
    discount: {
        type: "percentage" | "fixed";
        value: number;
    };
}

/**
 * Find and validate auto-apply coupons based on context
 */
export async function findAutoApplyCoupons(
    context: AutoApplyContext,
): Promise<{ success: boolean; coupons: AutoApplyCoupon[]; error?: string }> {
    try {
        const payload = await getPayloadClient();
        const now = new Date();

        // Find all active auto-apply coupons
        const couponsResult = await payload.find({
            collection: "coupons",
            where: {
                and: [
                    {
                        status: {
                            equals: "active",
                        },
                    },
                    {
                        autoApply: {
                            equals: true,
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
            },
            limit: 100, // Reasonable limit
            sort: "-autoApplyPriority", // Higher priority first
        });

        const matchingCoupons: AutoApplyCoupon[] = [];

        for (const coupon of couponsResult.docs) {
            // Auto-apply coupons apply automatically without trigger checks
            // Just validate the coupon for this specific context
            const validation = await validateCoupon({
                code: coupon.code,
                userId: context.userId || "",
                programId: context.programId,
                accountSize: context.accountSize,
                userEmail: context.userEmail,
                orderAmount: context.orderAmount,
            });

            if (validation.valid && validation.discount) {
                matchingCoupons.push({
                    couponId: coupon.id.toString(),
                    code: coupon.code,
                    message: coupon.autoApplyMessage || undefined,
                    priority: coupon.autoApplyPriority || 0,
                    discount: validation.discount,
                });
            }
        }

        // Sort by priority (highest first) and return
        matchingCoupons.sort((a, b) => b.priority - a.priority);

        return {
            success: true,
            coupons: matchingCoupons,
        };
    } catch (error) {
        console.error("Error finding auto-apply coupons:", error);
        return {
            success: false,
            coupons: [],
            error: "Failed to find auto-apply coupons",
        };
    }
}

/**
 * Get the best auto-apply coupon for a given context
 */
export async function getBestAutoApplyCoupon(
    context: AutoApplyContext,
): Promise<{ success: boolean; coupon?: AutoApplyCoupon; error?: string }> {
    try {
        const result = await findAutoApplyCoupons(context);

        if (!result.success) {
            return result;
        }

        // Return the highest priority coupon
        const bestCoupon = result.coupons[0];

        return {
            success: true,
            coupon: bestCoupon,
        };
    } catch (error) {
        console.error("Error getting best auto-apply coupon:", error);
        return {
            success: false,
            error: "Failed to get auto-apply coupon",
        };
    }
}

/**
 * Check if a coupon can be manually entered (not auto-apply only)
 */
export async function canManuallyEnterCoupon(code: string): Promise<boolean> {
    try {
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
            return false; // Coupon doesn't exist
        }

        const coupon = couponResult.docs[0];

        // If it's auto-apply only, prevent manual entry
        if (coupon.autoApply && coupon.preventManualEntry) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error checking manual entry permission:", error);
        return false;
    }
}

/**
 * Create context from URL and request data
 */
export function createAutoApplyContext(
    programId: string,
    accountSize: string,
    orderAmount: number,
    searchParams: URLSearchParams,
    _headers?: Headers, // Keep for backward compatibility but marked as unused
    userId?: string,
    userEmail?: string,
): AutoApplyContext {
    return {
        userId,
        userEmail,
        programId,
        accountSize,
        orderAmount,
        urlParams: searchParams,
    };
}
