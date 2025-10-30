import { Decimal } from "decimal.js";
import { useEffect, useState } from "react";
import { getBestAutoApplyCouponAction } from "@/app/actions/auto-apply-coupons";
import type { ProgramWithDiscounts } from "@/data/programs";

interface UseDiscountedPricingOptions {
    program: ProgramWithDiscounts | null;
    accountSize: string | null;
    enabled?: boolean;
    forceRefresh?: boolean; // Add option to force refresh
}

interface DiscountedPricing {
    originalPrice: number;
    discountedPrice: number;
    discountAmount: number;
    discountType?: "percentage" | "fixed";
    discountValue?: number;
    isLoading: boolean;
}

export function useDiscountedPricing({
    program,
    accountSize,
    enabled = true,
    forceRefresh = false,
}: UseDiscountedPricingOptions): DiscountedPricing | null {
    const [pricing, setPricing] = useState<DiscountedPricing | null>(null);

    // Add a refresh counter to force re-fetch when needed
    const [_refreshCounter, setRefreshCounter] = useState(0);

    useEffect(() => {
        if (!enabled || !program || !accountSize) {
            setPricing(null);
            return;
        }

        const tier = program.pricingTiers?.find(
            (t) => t.accountSize === accountSize,
        );

        if (!tier) {
            setPricing(null);
            return;
        }

        let isCancelled = false;

        const fetchDiscount = async () => {
            // Set loading state immediately
            if (!isCancelled) {
                setPricing({
                    originalPrice: tier.price,
                    discountedPrice: tier.price,
                    discountAmount: 0,
                    isLoading: true,
                });
            }

            try {
                // Check if we already have cached discount for this account size
                if (program.discounts?.[accountSize]) {
                    const discount = program.discounts[accountSize];
                    if (!isCancelled) {
                        setPricing({
                            originalPrice: discount.originalPrice,
                            discountedPrice: discount.discountedPrice,
                            discountAmount: discount.discountAmount,
                            discountType: discount.discountType,
                            discountValue: discount.discountValue,
                            isLoading: false,
                        });
                    }
                    return;
                }

                // Convert URLSearchParams to plain object
                const urlParams: Record<string, string> = {};
                const searchParams = new URLSearchParams(
                    window.location.search,
                );
                searchParams.forEach((value, key) => {
                    urlParams[key] = value;
                });

                // Fetch auto-apply coupons
                const result = await getBestAutoApplyCouponAction({
                    programId: program.id.toString(),
                    accountSize: accountSize,
                    orderAmount: tier.price,
                    urlParams: urlParams || {},
                });

                // Check if this request is still valid
                if (isCancelled) return;

                if (result.success && result.coupon) {
                    const { type: discountType, value: discountValue } =
                        result.coupon.discount;

                    let discountedPriceDecimal = new Decimal(tier.price);
                    let discountAmountDecimal = new Decimal(0);

                    if (discountType === "percentage") {
                        discountAmountDecimal = new Decimal(tier.price)
                            .times(discountValue)
                            .dividedBy(100);
                        discountedPriceDecimal = new Decimal(tier.price).minus(
                            discountAmountDecimal,
                        );
                    } else {
                        discountAmountDecimal = new Decimal(discountValue);
                        discountedPriceDecimal = Decimal.max(
                            0,
                            new Decimal(tier.price).minus(discountValue),
                        );
                    }

                    setPricing({
                        originalPrice: tier.price,
                        discountedPrice: discountedPriceDecimal
                            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                            .toNumber(),
                        discountAmount: discountAmountDecimal
                            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                            .toNumber(),
                        discountType,
                        discountValue,
                        isLoading: false,
                    });
                } else {
                    // No discount available
                    setPricing({
                        originalPrice: tier.price,
                        discountedPrice: tier.price,
                        discountAmount: 0,
                        isLoading: false,
                    });
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Error fetching discount:", error);
                    // Fallback to no discount
                    setPricing({
                        originalPrice: tier.price,
                        discountedPrice: tier.price,
                        discountAmount: 0,
                        isLoading: false,
                    });
                }
            }
        };

        fetchDiscount();

        // Cleanup function to cancel stale requests
        return () => {
            isCancelled = true;
        };
    }, [program, accountSize, enabled]); // Add refreshCounter to dependencies

    // Force refresh when program/accountSize changes significantly
    useEffect(() => {
        if (forceRefresh && program && accountSize) {
            setRefreshCounter((prev) => prev + 1);
        }
    }, [program?.id, accountSize, forceRefresh, program]);

    return pricing;
}
