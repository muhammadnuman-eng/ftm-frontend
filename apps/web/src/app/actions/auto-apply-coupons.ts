"use server";

import { headers } from "next/headers";
import { logActionError } from "@/lib/posthog-error";
import {
    type AutoApplyCoupon,
    createAutoApplyContext,
    findAutoApplyCoupons,
    getBestAutoApplyCoupon,
} from "../../lib/coupons/auto-apply";

export interface AutoApplyRequest {
    programId: string;
    accountSize: string;
    orderAmount: number;
    urlParams: Record<string, string>;
    userId?: string;
    userEmail?: string;
}

/**
 * Server action to find auto-apply coupons
 */
export async function findAutoApplyCouponsAction(
    request: AutoApplyRequest,
): Promise<{ success: boolean; coupons: AutoApplyCoupon[]; error?: string }> {
    try {
        const headersList = await headers();
        const searchParams = new URLSearchParams(request.urlParams);

        const context = createAutoApplyContext(
            request.programId,
            request.accountSize,
            request.orderAmount,
            searchParams,
            headersList,
            request.userId,
            request.userEmail,
        );

        return await findAutoApplyCoupons(context);
    } catch (error) {
        console.error("Error in findAutoApplyCouponsAction:", error);
        logActionError({
            actionName: "findAutoApplyCouponsAction",
            error,
            userEmail: request.userEmail,
            additionalContext: {
                programId: request.programId,
                accountSize: request.accountSize,
                orderAmount: request.orderAmount,
            },
        });
        return {
            success: false,
            coupons: [],
            error: "Failed to find auto-apply coupons",
        };
    }
}

/**
 * Server action to get the best auto-apply coupon
 */
export async function getBestAutoApplyCouponAction(
    request: AutoApplyRequest,
): Promise<{ success: boolean; coupon?: AutoApplyCoupon; error?: string }> {
    try {
        const headersList = await headers();
        const searchParams = new URLSearchParams(request.urlParams);

        const context = createAutoApplyContext(
            request.programId,
            request.accountSize,
            request.orderAmount,
            searchParams,
            headersList,
            request.userId,
            request.userEmail,
        );

        return await getBestAutoApplyCoupon(context);
    } catch (error) {
        console.error("Error in getBestAutoApplyCouponAction:", error);
        logActionError({
            actionName: "getBestAutoApplyCouponAction",
            error,
            userEmail: request.userEmail,
            additionalContext: {
                programId: request.programId,
                accountSize: request.accountSize,
                orderAmount: request.orderAmount,
            },
        });
        return {
            success: false,
            error: "Failed to get auto-apply coupon",
        };
    }
}

/**
 * Simple server action to check for URL parameter based coupons (like SEP60)
 */
export async function checkUrlCouponAction(
    urlParams: Record<string, string>,
    programId: string,
    accountSize: string,
    orderAmount: number,
    userId?: string,
    userEmail?: string,
): Promise<{ success: boolean; coupon?: AutoApplyCoupon; error?: string }> {
    try {
        // Check common URL parameters that might indicate a coupon
        const possibleCouponParams = ["coupon", "code", "discount", "promo"];
        let couponCode: string | null = null;

        for (const param of possibleCouponParams) {
            if (urlParams[param]) {
                couponCode = urlParams[param].toUpperCase();
                break;
            }
        }

        // If no explicit coupon parameter, check if any param value looks like a coupon code
        if (!couponCode) {
            for (const [_key, value] of Object.entries(urlParams)) {
                // Look for values that might be coupon codes (alphanumeric, 3-20 chars)
                if (/^[A-Z0-9]{3,20}$/i.test(value)) {
                    couponCode = value.toUpperCase();
                    break;
                }
            }
        }

        if (!couponCode) {
            return { success: true }; // No coupon found in URL
        }

        // Use the regular auto-apply logic but specifically for URL parameter triggers
        const request: AutoApplyRequest = {
            programId,
            accountSize,
            orderAmount,
            urlParams,
            userId,
            userEmail,
        };

        return await getBestAutoApplyCouponAction(request);
    } catch (error) {
        console.error("Error in checkUrlCouponAction:", error);
        logActionError({
            actionName: "checkUrlCouponAction",
            error,
            userEmail: userEmail,
            additionalContext: {
                programId,
                accountSize,
                orderAmount,
                urlParams: Object.keys(urlParams),
            },
        });
        return {
            success: false,
            error: "Failed to check URL coupon",
        };
    }
}
