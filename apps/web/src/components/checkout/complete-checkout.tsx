"use client";

import { Decimal } from "decimal.js";
import posthog from "posthog-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Country } from "react-phone-number-input";
import { Card, CardContent } from "@/components/ui/card";
import type { ProgramWithDiscounts } from "@/data/programs";
import type { CommerceConfig } from "@/payload-types";
import type { AppliedCoupon } from "./applied-coupon";
import { CheckoutForm } from "./checkout-form";
import { CheckoutWrapper } from "./checkout-wrapper";
import { CouponSection } from "./coupon-section";
import { type CheckoutSelectedAddOn, SelectAddOns } from "./select-add-ons";

interface InAppData {
    isInApp: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    clientId?: string;
    country?: string;
    address?: string;
    city?: string;
    phone?: string;
    state?: string;
    postalCode?: string;
    ip?: string;
}

interface CompleteCheckoutProps {
    selectedPlan: ProgramWithDiscounts;
    tier: {
        accountSize: string;
        price: number;
        discountedPrice?: number;
        originalPrice?: number;
        isPopular?: boolean | null;
        couponCode?: string | null;
        discountType?: "percentage" | "fixed";
        discountValue?: number;
    };
    platformId: string;
    summaryText: string;
    categoryLabel: string;
    platformName?: string;
    defaultCountry: Country;
    inAppData?: InAppData;
    commerceConfig: CommerceConfig | null;
}

export function CompleteCheckout({
    selectedPlan,
    tier,
    platformId,
    summaryText,
    categoryLabel,
    platformName,
    defaultCountry,
    inAppData,
    commerceConfig,
}: CompleteCheckoutProps) {
    const originalTierPrice = useMemo(
        () =>
            new Decimal(tier.originalPrice ?? tier.price)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber(),
        [tier.originalPrice, tier.price],
    );
    const initialCouponPrice = useMemo(
        () =>
            new Decimal(tier.discountedPrice ?? originalTierPrice)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber(),
        [tier.discountedPrice, originalTierPrice],
    );

    const initialCoupon: AppliedCoupon | null = useMemo(() => {
        // Create initial coupon if there's a couponCode OR if there's a discounted price (manual discount)
        const hasDiscount =
            tier.couponCode ||
            (typeof tier.discountedPrice === "number" &&
                tier.discountedPrice < originalTierPrice);

        if (!hasDiscount) {
            return null;
        }

        const originalDecimal = new Decimal(originalTierPrice);

        // Use actual discount type and value from coupon if available
        const discountType = tier.discountType ?? "percentage";
        const discountValue = tier.discountValue ?? 0;

        const discount =
            typeof tier.discountedPrice === "number"
                ? (() => {
                      const discountedDecimal = new Decimal(
                          tier.discountedPrice,
                      ).toDecimalPlaces(0, Decimal.ROUND_CEIL);
                      const discountAmountDecimal = originalDecimal
                          .minus(discountedDecimal)
                          .toDecimalPlaces(0, Decimal.ROUND_CEIL);

                      return {
                          discountType,
                          discountValue,
                          discountAmount: discountAmountDecimal.toNumber(),
                          finalPrice: discountedDecimal.toNumber(),
                      } as const;
                  })()
                : null;

        return {
            code: tier.couponCode || "MANUAL_DISCOUNT",
            couponId: tier.couponCode || "MANUAL_DISCOUNT",
            discountType: discount?.discountType ?? discountType,
            discountValue: discount?.discountValue ?? discountValue,
            discountAmount: discount?.discountAmount || 0,
            finalPrice: discount?.finalPrice ?? originalDecimal.toNumber(),
        };
    }, [
        tier.couponCode,
        tier.discountedPrice,
        tier.discountType,
        tier.discountValue,
        originalTierPrice,
    ]);

    const [couponAdjustedPrice, setCouponAdjustedPrice] = useState(() =>
        new Decimal(initialCoupon?.finalPrice ?? initialCouponPrice)
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber(),
    );
    const [selectedAddOns, setSelectedAddOns] = useState<
        CheckoutSelectedAddOn[]
    >([]);
    const [activeCoupon, setActiveCoupon] = useState<AppliedCoupon | null>(
        initialCoupon,
    );

    // Get email from localStorage for coupon validation
    const [savedEmail, setSavedEmail] = useState<string | undefined>();

    useEffect(() => {
        // Function to load email from localStorage
        const loadEmail = () => {
            try {
                const savedData = localStorage.getItem(
                    "ftm-checkout-form-data",
                );
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData.email) {
                        setSavedEmail(parsedData.email);
                        console.log(
                            "[CompleteCheckout] Email loaded from localStorage for coupon validation:",
                            parsedData.email,
                        );
                    }
                }
            } catch (error) {
                console.warn(
                    "Failed to load saved email for coupon validation:",
                    error,
                );
            }
        };

        // Load initial email
        loadEmail();

        // Listen for localStorage changes (when user types email in the form)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "ftm-checkout-form-data") {
                loadEmail();
            }
        };

        // Also listen for custom event when same tab updates localStorage
        const handleCustomStorageChange = () => {
            loadEmail();
        };

        window.addEventListener("storage", handleStorageChange);
        window.addEventListener(
            "ftm-checkout-updated",
            handleCustomStorageChange,
        );

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener(
                "ftm-checkout-updated",
                handleCustomStorageChange,
            );
        };
    }, []);

    useEffect(() => {
        setCouponAdjustedPrice(
            new Decimal(initialCoupon?.finalPrice ?? initialCouponPrice)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber(),
        );
        // Don't reset selectedAddOns when coupon changes
        // setSelectedAddOns([]);
        setActiveCoupon(initialCoupon);
    }, [initialCouponPrice, initialCoupon]);

    const handlePriceChange = useCallback(
        (newPrice: number, coupon: AppliedCoupon | null) => {
            setCouponAdjustedPrice(
                new Decimal(newPrice)
                    .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                    .toNumber(),
            );
            setActiveCoupon(coupon);

            // Track coupon changes
            posthog.capture("checkout_coupon_changed", {
                programId: selectedPlan.id,
                programName: selectedPlan.name,
                accountSize: tier.accountSize,
                originalPrice: originalTierPrice,
                newPrice,
                couponCode: coupon?.code || null,
                discountAmount: coupon?.discountAmount || 0,
                discountType: coupon?.discountType || null,
                hasCoupon: !!coupon,
            });
        },
        [
            selectedPlan.id,
            selectedPlan.name,
            tier.accountSize,
            originalTierPrice,
        ],
    );

    const handleCouponRemoved = useCallback(() => {
        // Reset to original price when coupon is removed
        setCouponAdjustedPrice(originalTierPrice);
        setActiveCoupon(null);
        // The CouponSection component will handle clearing its internal state
    }, [originalTierPrice]);

    const handleAddOnsChange = useCallback(
        (addOns: CheckoutSelectedAddOn[]) => {
            setSelectedAddOns(addOns);

            // Track add-on changes
            posthog.capture("checkout_addon_changed", {
                programId: selectedPlan.id,
                programName: selectedPlan.name,
                accountSize: tier.accountSize,
                addOnsCount: addOns.length,
                addOns: addOns.map((a) => ({
                    id: a.addOnId,
                    percentage: a.priceIncreasePercentage,
                })),
                totalAddOnPercentage: addOns.reduce(
                    (sum, a) => sum + (a.priceIncreasePercentage ?? 0),
                    0,
                ),
            });
        },
        [selectedPlan.id, selectedPlan.name, tier.accountSize],
    );

    const addOnPercentage = useMemo(() => {
        return selectedAddOns
            .reduce((total, addOn) => {
                return total.plus(addOn.priceIncreasePercentage ?? 0);
            }, new Decimal(0))
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber();
    }, [selectedAddOns]);

    const finalPrice = useMemo(() => {
        if (!Number.isFinite(couponAdjustedPrice)) {
            return 0;
        }

        if (!selectedAddOns.length) {
            return new Decimal(couponAdjustedPrice)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber();
        }

        const base = new Decimal(couponAdjustedPrice);
        const total = base.plus(base.mul(addOnPercentage).dividedBy(100));

        return total.toDecimalPlaces(0, Decimal.ROUND_CEIL).toNumber();
    }, [couponAdjustedPrice, addOnPercentage, selectedAddOns.length]);

    // Track checkout page view
    useEffect(() => {
        posthog.capture("checkout_page_viewed", {
            programId: selectedPlan.id,
            programName: selectedPlan.name,
            programCategory: selectedPlan.category,
            accountSize: tier.accountSize,
            originalPrice: originalTierPrice,
            discountedPrice: couponAdjustedPrice,
            finalPrice,
            platformId,
            platformName,
            categoryLabel,
            hasInitialCoupon: !!initialCoupon,
            initialCouponCode: initialCoupon?.code,
            isInApp: !!inAppData?.isInApp,
        });

        // Track checkout abandonment on page unload
        const handleBeforeUnload = () => {
            posthog.capture("checkout_abandoned", {
                programId: selectedPlan.id,
                programName: selectedPlan.name,
                accountSize: tier.accountSize,
                finalPrice,
                hadCoupon: !!activeCoupon,
                hadAddOns: selectedAddOns.length > 0,
                timeOnPage: performance.now(),
            });
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [
        selectedPlan.id,
        selectedPlan.name,
        selectedPlan.category,
        tier.accountSize,
        originalTierPrice,
        couponAdjustedPrice,
        finalPrice,
        platformId,
        platformName,
        categoryLabel,
        initialCoupon,
        inAppData?.isInApp,
        activeCoupon,
        selectedAddOns.length,
    ]);

    return (
        <div className="grid items-start gap-8 lg:grid-cols-12">
            {/* Left: Summary */}
            <div className="lg:col-span-5">
                <Card wrapperClassName="bg-none" className="!bg-none py-6">
                    <CardContent className="space-y-4">
                        {/* Coupon Code Section - now at top of order summary */}
                        <div className="space-y-4 border-white/10 border-b pb-6">
                            <div className="font-bold text-white/80 text-xs uppercase">
                                Coupon Code
                            </div>
                            <CouponSection
                                programId={selectedPlan.id.toString()}
                                accountSize={tier.accountSize}
                                originalPrice={originalTierPrice}
                                onPriceChange={handlePriceChange}
                                autoApplyEnabled={!initialCoupon}
                                initialCoupon={initialCoupon}
                                userEmail={savedEmail}
                            />
                        </div>

                        <CheckoutWrapper
                            selectedPlan={selectedPlan}
                            tier={{
                                ...tier,
                                price: finalPrice,
                                originalPrice: originalTierPrice,
                                discountedPrice: couponAdjustedPrice,
                                activeCoupon,
                                addOnDetails: selectedAddOns
                                    .filter((addOn) => addOn.addOnId)
                                    .map((addOn) => ({
                                        key: addOn.addOnId,
                                        label:
                                            typeof addOn.metadata?.label ===
                                            "string"
                                                ? addOn.metadata.label
                                                : typeof addOn.metadata
                                                        ?.name === "string"
                                                  ? addOn.metadata.name
                                                  : addOn.addOnId,
                                        value: `${addOn.priceIncreasePercentage ?? 0}%`,
                                    })),
                            }}
                            platformId={platformId}
                            summaryText={summaryText}
                            categoryLabel={categoryLabel}
                            platformName={platformName}
                        />

                        <SelectAddOns
                            programId={selectedPlan.id.toString()}
                            basePrice={couponAdjustedPrice}
                            onChange={handleAddOnsChange}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Right: Billing + Payment */}
            <div className="lg:col-span-7">
                <Card wrapperClassName="bg-none" className="!bg-none">
                    <CardContent className="space-y-8 p-6">
                        <CheckoutForm
                            selectedPlan={selectedPlan}
                            tier={{
                                ...tier,
                                price: originalTierPrice,
                                discountedPrice: couponAdjustedPrice,
                            }}
                            defaultCountry={defaultCountry}
                            finalPrice={finalPrice}
                            selectedAddOns={selectedAddOns}
                            activeCoupon={activeCoupon}
                            platformId={platformId}
                            platformName={platformName}
                            categoryLabel={categoryLabel}
                            inAppData={inAppData}
                            commerceConfig={commerceConfig}
                            onCouponRemoved={handleCouponRemoved}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
