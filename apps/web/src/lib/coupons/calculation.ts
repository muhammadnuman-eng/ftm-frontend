import { Decimal } from "decimal.js";

export interface DiscountCalculation {
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    discountType: "percentage" | "fixed";
    discountValue: number;
    savings: number;
}

export interface CalculationOptions {
    originalPrice: number;
    discountType: "percentage" | "fixed";
    discountValue: number;
    currency?: string;
    maxDiscountAmount?: number; // Maximum discount that can be applied
}

/**
 * Calculates the final price after applying a coupon discount
 */
export function calculateDiscount({
    originalPrice,
    discountType,
    discountValue,
    currency: _currency = "USD",
    maxDiscountAmount,
}: CalculationOptions): DiscountCalculation {
    const originalPriceDecimal = new Decimal(originalPrice);
    const discountValueDecimal = new Decimal(discountValue);
    let discountAmountDecimal = new Decimal(0);

    switch (discountType) {
        case "percentage":
            discountAmountDecimal = originalPriceDecimal
                .mul(discountValueDecimal)
                .div(100);
            break;

        case "fixed":
            discountAmountDecimal = discountValueDecimal;
            break;

        default:
            throw new Error(`Invalid discount type: ${discountType}`);
    }

    // Apply maximum discount limit if specified
    if (maxDiscountAmount) {
        const maxDiscountDecimal = new Decimal(maxDiscountAmount);
        if (discountAmountDecimal.gt(maxDiscountDecimal)) {
            discountAmountDecimal = maxDiscountDecimal;
        }
    }

    // Ensure discount doesn't exceed the original price
    if (discountAmountDecimal.gt(originalPriceDecimal)) {
        discountAmountDecimal = originalPriceDecimal;
    }

    // Ensure discount is not negative
    if (discountAmountDecimal.lt(0)) {
        discountAmountDecimal = new Decimal(0);
    }

    let finalPriceDecimal = originalPriceDecimal.sub(discountAmountDecimal);

    // Ensure final price is not negative
    if (finalPriceDecimal.lt(0)) {
        finalPriceDecimal = new Decimal(0);
    }

    // Convert back to numbers with proper precision (rounded up)
    const discountAmount = discountAmountDecimal
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();
    const finalPrice = finalPriceDecimal
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();

    return {
        originalPrice,
        discountAmount,
        finalPrice,
        discountType,
        discountValue,
        savings: discountAmount,
    };
}

/**
 * Formats a discount amount for display
 */
export function formatDiscountAmount(
    discountType: "percentage" | "fixed",
    discountValue: number,
    _currency = "USD",
): string {
    switch (discountType) {
        case "percentage":
            return `${discountValue}% OFF`;

        case "fixed":
            return `$${discountValue.toFixed(2)} OFF`;

        default:
            return "Discount Applied";
    }
}

/**
 * Formats a price with currency symbol
 */
export function formatPrice(amount: number, currency = "USD"): string {
    const currencySymbols: Record<string, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
    };

    const symbol = currencySymbols[currency] || "$";
    const amountDecimal = new Decimal(amount);
    return `${symbol}${amountDecimal.toDecimalPlaces(0, Decimal.ROUND_CEIL).toFixed(0)}`;
}

/**
 * Calculates the discount percentage actually applied
 */
export function calculateActualDiscountPercentage(
    originalPrice: number,
    finalPrice: number,
): number {
    if (originalPrice === 0) return 0;

    const originalPriceDecimal = new Decimal(originalPrice);
    const finalPriceDecimal = new Decimal(finalPrice);
    const discountAmountDecimal = originalPriceDecimal.sub(finalPriceDecimal);

    return discountAmountDecimal
        .div(originalPriceDecimal)
        .mul(100)
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();
}

/**
 * Validates if a discount calculation is reasonable
 */
export function validateDiscountCalculation(calculation: DiscountCalculation): {
    valid: boolean;
    warnings: string[];
} {
    const warnings: string[] = [];
    let valid = true;

    // Check if discount amount is reasonable
    if (calculation.discountAmount > calculation.originalPrice) {
        warnings.push("Discount amount exceeds original price");
        valid = false;
    }

    // Check if final price is negative
    if (calculation.finalPrice < 0) {
        warnings.push("Final price is negative");
        valid = false;
    }

    // Check for very high percentage discounts
    const discountPercentage = calculateActualDiscountPercentage(
        calculation.originalPrice,
        calculation.finalPrice,
    );
    if (discountPercentage > 90) {
        warnings.push("Discount percentage is unusually high (>90%)");
    }

    // Check for very small discounts
    if (calculation.discountAmount > 0 && calculation.discountAmount < 0.01) {
        warnings.push("Discount amount is very small (<$0.01)");
    }

    return { valid, warnings };
}

/**
 * Calculates bulk discount for multiple items or account sizes
 */
export function calculateBulkDiscount(
    items: Array<{
        price: number;
        accountSize: string;
        discountValue?: number;
    }>,
    baseDiscountType: "percentage" | "fixed",
    baseDiscountValue: number,
): {
    totalOriginalPrice: number;
    totalDiscountAmount: number;
    totalFinalPrice: number;
    itemCalculations: DiscountCalculation[];
} {
    const itemCalculations: DiscountCalculation[] = [];
    let totalOriginalPriceDecimal = new Decimal(0);
    let totalDiscountAmountDecimal = new Decimal(0);
    let totalFinalPriceDecimal = new Decimal(0);

    for (const item of items) {
        const discountValue = item.discountValue || baseDiscountValue;

        const calculation = calculateDiscount({
            originalPrice: item.price,
            discountType: baseDiscountType,
            discountValue,
        });

        itemCalculations.push(calculation);
        totalOriginalPriceDecimal = totalOriginalPriceDecimal.add(
            calculation.originalPrice,
        );
        totalDiscountAmountDecimal = totalDiscountAmountDecimal.add(
            calculation.discountAmount,
        );
        totalFinalPriceDecimal = totalFinalPriceDecimal.add(
            calculation.finalPrice,
        );
    }

    return {
        totalOriginalPrice: totalOriginalPriceDecimal
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber(),
        totalDiscountAmount: totalDiscountAmountDecimal
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber(),
        totalFinalPrice: totalFinalPriceDecimal
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber(),
        itemCalculations,
    };
}

/**
 * Applies progressive discount tiers based on order amount
 */
export function applyProgressiveDiscount(
    originalPrice: number,
    tiers: Array<{
        minAmount: number;
        discountType: "percentage" | "fixed";
        discountValue: number;
    }>,
): DiscountCalculation | null {
    // Find the highest tier that applies
    const applicableTier = tiers
        .filter((tier) => originalPrice >= tier.minAmount)
        .sort((a, b) => b.minAmount - a.minAmount)[0];

    if (!applicableTier) {
        return null;
    }

    return calculateDiscount({
        originalPrice,
        discountType: applicableTier.discountType,
        discountValue: applicableTier.discountValue,
    });
}

/**
 * Combines multiple discounts with proper stacking rules
 */
export function combineDiscounts(
    originalPrice: number,
    discounts: Array<{
        type: "percentage" | "fixed";
        value: number;
        stackable: boolean;
        priority: number;
    }>,
): DiscountCalculation {
    // Sort by priority (higher priority first)
    const sortedDiscounts = discounts.sort((a, b) => b.priority - a.priority);

    const originalPriceDecimal = new Decimal(originalPrice);
    let currentPriceDecimal = originalPriceDecimal;
    let totalDiscountDecimal = new Decimal(0);
    const appliedDiscounts: string[] = [];

    for (const discount of sortedDiscounts) {
        let discountAmountDecimal = new Decimal(0);

        if (discount.type === "percentage") {
            discountAmountDecimal = currentPriceDecimal
                .mul(discount.value)
                .div(100);
        } else {
            const discountValueDecimal = new Decimal(discount.value);
            discountAmountDecimal = Decimal.min(
                discountValueDecimal,
                currentPriceDecimal,
            );
        }

        if (discountAmountDecimal.gt(0)) {
            totalDiscountDecimal = totalDiscountDecimal.add(
                discountAmountDecimal,
            );
            appliedDiscounts.push(
                `${discount.value}${discount.type === "percentage" ? "%" : "$"}`,
            );

            if (discount.stackable) {
                currentPriceDecimal = currentPriceDecimal.sub(
                    discountAmountDecimal,
                );
            } else {
                // Non-stackable discount, apply to original price and stop
                totalDiscountDecimal = discountAmountDecimal;
                currentPriceDecimal = originalPriceDecimal.sub(
                    discountAmountDecimal,
                );
                break;
            }
        }
    }

    const finalPriceDecimal = Decimal.max(
        0,
        originalPriceDecimal.sub(totalDiscountDecimal),
    );
    const totalDiscount = totalDiscountDecimal
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();
    const finalPrice = finalPriceDecimal
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();

    return {
        originalPrice,
        discountAmount: totalDiscount,
        finalPrice,
        discountType: "fixed", // Combined discount is treated as fixed
        discountValue: totalDiscount,
        savings: totalDiscount,
    };
}
