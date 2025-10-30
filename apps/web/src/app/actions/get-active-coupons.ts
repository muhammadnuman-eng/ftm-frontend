"use server";

import { getPayloadClient } from "@/lib/payload";
import { logActionError } from "@/lib/posthog-error";
import { formatDiscountAmount } from "../../lib/coupons/calculation";
export interface PublicCoupon {
    code: string;
    discountText: string;
    description?: string;
    validTo?: string | null;
    isNewCoupon: boolean;
    restrictionType: string;
    newUsersOnly: boolean;
}

/**
 * Get active coupons that can be displayed publicly
 */
export async function getActiveCouponsForDisplay(
    limit = 5,
): Promise<{ success: boolean; coupons: PublicCoupon[]; error?: string }> {
    try {
        const payload = await getPayloadClient();
        const now = new Date();

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
            limit,
            sort: "-createdAt",
        });

        const publicCoupons: PublicCoupon[] = couponsResult.docs.map(
            (coupon) => {
                const discountText = formatDiscountAmount(
                    coupon.discountType,
                    coupon.discountValue,
                    "USD",
                );

                // Check if coupon is new (created within last 7 days)
                const createdAt = new Date(coupon.createdAt);
                const isNewCoupon =
                    now.getTime() - createdAt.getTime() <
                    7 * 24 * 60 * 60 * 1000;

                return {
                    code: coupon.code,
                    discountText,
                    description: coupon.description || undefined,
                    validTo: coupon.validTo,
                    isNewCoupon,
                    restrictionType: coupon.restrictionType,
                    newUsersOnly: false, // This field doesn't exist in the Coupon type
                };
            },
        );

        return {
            success: true,
            coupons: publicCoupons,
        };
    } catch (error) {
        console.error("Error fetching active coupons:", error);
        logActionError({
            actionName: "getActiveCouponsForDisplay",
            error,
            additionalContext: {
                limit,
            },
        });
        return {
            success: false,
            coupons: [],
            error: "Failed to fetch active coupons",
        };
    }
}

/**
 * Get featured coupon for homepage banner
 */
export async function getFeaturedCoupon(): Promise<{
    success: boolean;
    coupon?: PublicCoupon;
    error?: string;
}> {
    try {
        const payload = await getPayloadClient();
        const now = new Date();

        // Get the most valuable active coupon for featuring
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
                        validFrom: {
                            less_than_equal: now.toISOString(),
                        },
                    },
                    {
                        validTo: {
                            greater_than: now.toISOString(),
                        },
                    },
                    {
                        restrictionType: {
                            equals: "all", // Only feature coupons that work on all programs
                        },
                    },
                ],
            },
            limit: 1,
            sort: "-discountValue", // Get the highest value discount
        });

        if (couponsResult.docs.length === 0) {
            return { success: true }; // No featured coupon available
        }

        const coupon = couponsResult.docs[0];
        const discountText = formatDiscountAmount(
            coupon.discountType,
            coupon.discountValue,
            "USD",
        );

        const createdAt = new Date(coupon.createdAt);
        const isNewCoupon =
            now.getTime() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;

        return {
            success: true,
            coupon: {
                code: coupon.code,
                discountText,
                description: coupon.description || undefined,
                validTo: coupon.validTo,
                isNewCoupon,
                restrictionType: coupon.restrictionType,
                newUsersOnly: false, // This field doesn't exist in the Coupon type
            },
        };
    } catch (error) {
        console.error("Error fetching featured coupon:", error);
        logActionError({
            actionName: "getFeaturedCoupon",
            error,
        });
        return {
            success: false,
            error: "Failed to fetch featured coupon",
        };
    }
}
