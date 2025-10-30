import { getPayloadClient } from "@/lib/payload";
import type { Coupon, Program } from "../../payload-types";
import { getCustomerAffiliateInfo } from "../affiliatewp";
import { canManuallyEnterCoupon } from "./auto-apply";
export interface ValidationResult {
    valid: boolean;
    error?: string;
    discount?: {
        type: "percentage" | "fixed";
        value: number;
    };
    coupon?: Coupon;
}

export interface CouponValidationOptions {
    code: string;
    userId?: string;
    userEmail?: string;
    programId: string;
    accountSize: string;
    orderAmount?: number;
}

/**
 * Validates a coupon code for a specific user and purchase context
 */
export async function validateCoupon({
    code,
    userId: _userId, // Kept for backward compatibility but not used - tracking is done via email only
    userEmail,
    programId,
    accountSize,
}: CouponValidationOptions): Promise<ValidationResult> {
    try {
        const payload = await getPayloadClient();

        // Find the coupon by code
        const couponsResult = await payload.find({
            collection: "coupons",
            where: {
                code: {
                    equals: code.toUpperCase(),
                },
            },
            limit: 1,
        });

        if (couponsResult.docs.length === 0) {
            return {
                valid: false,
                error: "Invalid coupon code",
            };
        }

        const coupon = couponsResult.docs[0];

        // Check if coupon can be manually entered (not auto-apply only)
        const canManualEntry = await canManuallyEnterCoupon(code);
        if (!canManualEntry) {
            return {
                valid: false,
                error: "This coupon code cannot be entered manually",
            };
        }

        // Check if coupon is active
        if (coupon.status !== "active") {
            return {
                valid: false,
                error: "This coupon is not active",
            };
        }

        // Check validity period
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);

        if (now < validFrom) {
            return {
                valid: false,
                error: "This coupon is not yet valid",
            };
        }

        // Check expiration only if validTo is set (null means never expires)
        if (coupon.validTo) {
            const validTo = new Date(coupon.validTo);
            if (now > validTo) {
                return {
                    valid: false,
                    error: "This coupon has expired",
                };
            }
        }

        // Debug log to see what we're working with
        console.log("[Coupon Validation] Coupon details:", {
            code: coupon.code,
            hasAffiliateId: !!coupon.affiliateId,
            affiliateId: coupon.affiliateId,
            affiliateIdType: typeof coupon.affiliateId,
            userEmail,
        });

        // Check affiliate binding if coupon has an affiliate
        if (coupon.affiliateId) {
            // If we don't have user email (client-side validation), we can't check affiliate binding
            // The full validation will happen server-side when the purchase is created
            if (!userEmail) {
                console.log(
                    "[Coupon Validation] Skipping affiliate check - no email provided (client-side validation)",
                );
                // Still allow the coupon on client-side, server will validate properly
            } else {
                // We have email, do full affiliate validation
                const affiliateInfo = await getCustomerAffiliateInfo(
                    payload,
                    userEmail,
                );

                console.log("[Coupon Validation] Affiliate check:", {
                    couponCode: coupon.code,
                    couponAffiliateId: coupon.affiliateId,
                    userEmail,
                    hasAnyAffiliateAssociation:
                        affiliateInfo.hasAnyAffiliateAssociation,
                    existingAffiliateId: affiliateInfo.existingAffiliateId,
                });

                // If customer has any previous affiliate association
                if (affiliateInfo.hasAnyAffiliateAssociation) {
                    // Check if it's a different affiliate than the coupon's
                    // Convert both to strings for comparison to handle type mismatches
                    const existingAffiliateStr = String(
                        affiliateInfo.existingAffiliateId || "",
                    );
                    const couponAffiliateStr = String(coupon.affiliateId || "");

                    if (
                        affiliateInfo.existingAffiliateId &&
                        existingAffiliateStr !== couponAffiliateStr
                    ) {
                        console.log(
                            "[Coupon Validation] Blocking coupon - different affiliate:",
                            {
                                existingAffiliate:
                                    affiliateInfo.existingAffiliateId,
                                existingAffiliateType:
                                    typeof affiliateInfo.existingAffiliateId,
                                couponAffiliate: coupon.affiliateId,
                                couponAffiliateType: typeof coupon.affiliateId,
                                existingAffiliateStr,
                                couponAffiliateStr,
                                areEqual:
                                    existingAffiliateStr === couponAffiliateStr,
                            },
                        );
                        return {
                            valid: false,
                            error: "This coupon is not applicable as you are bound to another affiliate.",
                        };
                    }
                }

                console.log(
                    "[Coupon Validation] Affiliate check passed - same affiliate or new customer",
                );
            }
        } else {
            console.log(
                "[Coupon Validation] No affiliate ID on coupon - skipping affiliate check",
            );
        }

        // Check program restrictions
        const programValidation = await validateProgramRestrictions(
            coupon,
            programId,
        );
        if (!programValidation.valid) {
            return programValidation;
        }

        // Check usage limits
        const usageValidation = await validateUsageLimits(coupon, userEmail);
        if (!usageValidation.valid) {
            return usageValidation;
        }

        // Get the appropriate discount value for the account size
        const discountValue = getDiscountValueForAccountSize(
            coupon,
            accountSize,
        );

        return {
            valid: true,
            discount: {
                type: coupon.discountType,
                value: discountValue,
            },
            coupon,
        };
    } catch (error) {
        console.error("Error validating coupon:", error);
        return {
            valid: false,
            error: "An error occurred while validating the coupon",
        };
    }
}

/**
 * Validates program restrictions for a coupon
 */
async function validateProgramRestrictions(
    coupon: Coupon,
    programId: string,
): Promise<ValidationResult> {
    if (coupon.restrictionType === "all") {
        return { valid: true };
    }

    if (coupon.restrictionType === "whitelist") {
        // Check if program is in the applicable programs list
        const applicablePrograms = coupon.applicablePrograms || [];
        const isApplicable = applicablePrograms.some(
            (program: string | number | Program) => {
                return typeof program === "string" ||
                    typeof program === "number"
                    ? String(program) === programId
                    : typeof program === "object" && program !== null
                      ? String(program.id) === programId
                      : false;
            },
        );

        if (!isApplicable) {
            return {
                valid: false,
                error: "This coupon is not valid for the selected program",
            };
        }
    }

    if (coupon.restrictionType === "blacklist") {
        // Check if program is in the excluded programs list
        const excludedPrograms = coupon.excludedPrograms || [];
        const isExcluded = excludedPrograms.some(
            (program: string | number | Program) => {
                return typeof program === "string" ||
                    typeof program === "number"
                    ? String(program) === programId
                    : typeof program === "object" && program !== null
                      ? String(program.id) === programId
                      : false;
            },
        );

        if (isExcluded) {
            return {
                valid: false,
                error: "This coupon cannot be used with the selected program",
            };
        }
    }

    return { valid: true };
}

/**
 * Validates usage limits for a coupon
 */
async function validateUsageLimits(
    coupon: Coupon,
    userEmail?: string,
): Promise<ValidationResult> {
    const payload = await getPayloadClient();

    // Check total usage limit
    if (coupon.totalUsageLimit && coupon.totalUsageLimit > 0) {
        const totalUsageResult = await payload.find({
            collection: "coupon-usage",
            where: {
                coupon: {
                    equals: coupon.id,
                },
            },
            limit: 1,
        });

        if (totalUsageResult.totalDocs >= coupon.totalUsageLimit) {
            return {
                valid: false,
                error: "This coupon has reached its usage limit",
            };
        }
    }

    // Check per-user usage limit
    if (coupon.usagePerUser && coupon.usagePerUser > 0 && userEmail) {
        const userUsageResult = await payload.find({
            collection: "coupon-usage",
            where: {
                and: [
                    { coupon: { equals: coupon.id } },
                    { customerEmail: { equals: userEmail } },
                ],
            },
            limit: coupon.usagePerUser + 1,
        });

        if (userUsageResult.totalDocs >= coupon.usagePerUser) {
            return {
                valid: false,
                error: "You have already used this coupon the maximum number of times",
            };
        }
    }

    return { valid: true };
}

/**
 * Gets the appropriate discount value for a specific account size
 */
function getDiscountValueForAccountSize(
    coupon: Coupon,
    accountSize: string,
): number {
    // Check if there's a specific discount for this account size
    if (coupon.accountSizeDiscounts && coupon.accountSizeDiscounts.length > 0) {
        const accountSizeDiscount = coupon.accountSizeDiscounts.find(
            (discount: { accountSize: string; discountValue: number }) =>
                discount.accountSize === accountSize,
        );

        if (accountSizeDiscount) {
            return accountSizeDiscount.discountValue;
        }
    }

    // Return the base discount value
    return coupon.discountValue || 0;
}

/**
 * Quick validation to check if a coupon code exists and is active
 */
export async function quickValidateCouponCode(
    code: string,
): Promise<{ exists: boolean; active: boolean; coupon?: Coupon }> {
    try {
        const payload = await getPayloadClient();

        const couponsResult = await payload.find({
            collection: "coupons",
            where: {
                code: {
                    equals: code.toUpperCase(),
                },
            },
            limit: 1,
        });

        if (couponsResult.docs.length === 0) {
            return { exists: false, active: false };
        }

        const coupon = couponsResult.docs[0];
        const now = new Date();
        const validFrom = new Date(coupon.validFrom);
        const validTo = coupon.validTo ? new Date(coupon.validTo) : null;

        const isActive =
            coupon.status === "active" &&
            now >= validFrom &&
            (validTo ? now <= validTo : true);

        return {
            exists: true,
            active: isActive,
            coupon,
        };
    } catch (error) {
        console.error("Error in quick coupon validation:", error);
        return { exists: false, active: false };
    }
}
