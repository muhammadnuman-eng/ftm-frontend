import { Decimal } from "decimal.js";
import type { Payload } from "payload";
import { getBestAutoApplyCoupon } from "@/lib/coupons/auto-apply";
import { calculateDiscount } from "@/lib/coupons/calculation";

export interface SelectedAddOnInput {
    addOnId: string;
    priceIncreasePercentage: number;
    metadata?: Record<string, unknown>;
}

export interface CheckoutPriceCalculationInput {
    programId: string | number;
    accountSize: string;
    tierId?: string;
    selectedAddOns: SelectedAddOnInput[];
    couponCode?: string | null;
    purchaseType?: "original-order" | "reset-order" | "activation-order";
    resetProductType?: "evaluation" | "funded";
    userEmail?: string | null;
}

export interface CheckoutPriceCalculationResult {
    tierPrice: number;
    originalPrice: number;
    appliedDiscount: number;
    finalPurchasePrice: number;
    addOnValue: number;
    totalPrice: number;
    couponValid: boolean;
    couponDetails?: {
        code: string;
        discountType: string;
        discountValue: number;
    };
}

/**
 * Calculate all prices for a checkout server-side to prevent price manipulation
 * This function should be used by all checkout endpoints
 */
export async function calculateCheckoutPrices(
    payload: Payload,
    input: CheckoutPriceCalculationInput,
): Promise<CheckoutPriceCalculationResult> {
    const {
        programId,
        accountSize,
        tierId,
        selectedAddOns = [],
        couponCode,
        purchaseType = "original-order",
        resetProductType,
        userEmail,
    } = input;

    // Fetch program with pricing tiers
    const program = await payload.findByID({
        collection: "programs",
        id: Number(programId),
    });

    const pricingTiers = (
        program as {
            pricingTiers?: Array<{
                id?: string;
                accountSize?: string;
                price?: number;
                resetFee?: number | null;
                resetFeeFunded?: number | null;
            }>;
            activationFeeValue?: number | null;
        }
    )?.pricingTiers;

    // Find the matching tier
    const normalizeSize = (size: string) =>
        size.replace(/[\s$,]/g, "").toUpperCase();
    const targetSize = normalizeSize(accountSize);

    let matchingTier:
        | {
              id?: string;
              accountSize?: string;
              price?: number;
              resetFee?: number | null;
              resetFeeFunded?: number | null;
          }
        | undefined;

    if (tierId) {
        // Try to find by tierId first
        matchingTier = pricingTiers?.find((t) => t.id === tierId);
    }

    if (!matchingTier) {
        // Fallback to finding by accountSize
        matchingTier = pricingTiers?.find(
            (t) => normalizeSize(String(t.accountSize || "")) === targetSize,
        );
    }

    if (!matchingTier) {
        throw new Error(
            `Could not find pricing tier for program ${programId} and account size ${accountSize}`,
        );
    }

    // Get base tier price based on purchase type
    let tierPrice: number;

    if (purchaseType === "reset-order") {
        if (resetProductType === "funded" && matchingTier.resetFeeFunded) {
            tierPrice = matchingTier.resetFeeFunded;
        } else if (matchingTier.resetFee) {
            tierPrice = matchingTier.resetFee;
        } else {
            throw new Error(
                `No reset fee found for program ${programId} and account size ${accountSize}`,
            );
        }
    } else if (purchaseType === "activation-order") {
        const activationFee = (
            program as { activationFeeValue?: number | null }
        ).activationFeeValue;
        if (!activationFee) {
            throw new Error(`No activation fee found for program ${programId}`);
        }
        tierPrice = activationFee;
    } else {
        // original-order
        if (!matchingTier.price) {
            throw new Error(
                `No price found for program ${programId} and account size ${accountSize}`,
            );
        }
        tierPrice = matchingTier.price;
    }

    // Calculate add-on value from selected add-ons
    let addOnValue = 0;
    if (selectedAddOns && selectedAddOns.length > 0) {
        for (const addOn of selectedAddOns) {
            const addOnIncrease = new Decimal(tierPrice)
                .mul(addOn.priceIncreasePercentage || 0)
                .div(100)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber();
            addOnValue += addOnIncrease;
        }
    }

    // Calculate price with coupon discount
    let finalPurchasePrice = tierPrice;
    let appliedDiscount = 0;
    let originalPrice = tierPrice;
    let couponValid = false;
    let couponDetails:
        | {
              code: string;
              discountType: string;
              discountValue: number;
          }
        | undefined;

    // Only apply coupons for original orders (not reset/activation)
    if (purchaseType === "original-order") {
        let couponApplied = false;

        // Check for explicit coupon code first
        if (couponCode?.trim()) {
            try {
                // Fetch coupon
                const couponRes = await payload.find({
                    collection: "coupons",
                    where: { code: { equals: couponCode.toUpperCase() } },
                    limit: 1,
                });

                if (couponRes.docs.length > 0) {
                    const coupon = couponRes.docs[0];

                    // Validate coupon is active
                    if (coupon.status === "active") {
                        const now = new Date();
                        const validFrom = new Date(coupon.validFrom);
                        const validTo = coupon.validTo
                            ? new Date(coupon.validTo)
                            : null;

                        // Check validity period
                        if (now >= validFrom && (!validTo || now <= validTo)) {
                            const discountType = (
                                coupon as { discountType?: string }
                            ).discountType as "percentage" | "fixed";
                            const discountValue =
                                (coupon as { discountValue?: number })
                                    .discountValue ?? 0;

                            // Apply discount
                            const discountCalc = calculateDiscount({
                                originalPrice: tierPrice,
                                discountType,
                                discountValue,
                            });

                            finalPurchasePrice = discountCalc.finalPrice;
                            appliedDiscount = discountCalc.discountAmount;
                            originalPrice = discountCalc.originalPrice;
                            couponValid = true;
                            couponApplied = true;
                            couponDetails = {
                                code: couponCode.toUpperCase(),
                                discountType,
                                discountValue,
                            };
                        }
                    }
                }
            } catch (error) {
                console.error("[Pricing] Error applying coupon:", error);
                // Continue to check auto-apply if explicit coupon fails
            }
        }

        // If no coupon was applied (either no code provided or validation failed), check for auto-apply coupons
        if (!couponApplied) {
            try {
                const autoApplyResult = await getBestAutoApplyCoupon({
                    userId: undefined,
                    userEmail: userEmail || undefined,
                    programId: String(programId),
                    accountSize,
                    orderAmount: tierPrice,
                    urlParams: new URLSearchParams(),
                });

                if (autoApplyResult.success && autoApplyResult.coupon) {
                    const coupon = autoApplyResult.coupon;

                    // Apply discount
                    const discountCalc = calculateDiscount({
                        originalPrice: tierPrice,
                        discountType: coupon.discount.type,
                        discountValue: coupon.discount.value,
                    });

                    finalPurchasePrice = discountCalc.finalPrice;
                    appliedDiscount = discountCalc.discountAmount;
                    originalPrice = discountCalc.originalPrice;
                    couponValid = true;
                    couponDetails = {
                        code: coupon.code,
                        discountType: coupon.discount.type,
                        discountValue: coupon.discount.value,
                    };
                }
            } catch (error) {
                console.error(
                    "[Pricing] Error checking auto-apply coupons:",
                    error,
                );
                // Continue without auto-apply coupon if there's an error
            }
        }
    }

    // Calculate total price = purchase price + add-ons
    const totalPrice = new Decimal(finalPurchasePrice)
        .add(addOnValue)
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();

    return {
        tierPrice,
        originalPrice,
        appliedDiscount,
        finalPurchasePrice,
        addOnValue,
        totalPrice,
        couponValid,
        couponDetails,
    };
}
