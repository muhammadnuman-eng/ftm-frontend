"use client";

import { Decimal } from "decimal.js";
import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDiscountedPricing } from "@/hooks/useDiscountedPricing";
import type { Platform } from "@/payload-types";
import type { BillingData, SelectedPlanData } from "./inapp-purchase-flow";

interface StepOrderReviewProps {
    selectedPlan: SelectedPlanData;
    billingData: BillingData;
    platforms: (Platform & { isRestricted?: boolean })[];
    clientId: string;
}

export function StepOrderReview({
    selectedPlan,
    billingData,
    platforms,
    clientId,
}: StepOrderReviewProps) {
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [couponRemoved, setCouponRemoved] = useState(false);

    const { plan, tierIndex, platform: platformSlug } = selectedPlan;
    const tier = plan.pricingTiers?.[tierIndex];
    const selectedPlatform = platforms.find((p) => p.slug === platformSlug);

    const discountedPricing = useDiscountedPricing({
        program: plan,
        accountSize: tier?.accountSize || null,
    });

    const originalPrice = useMemo(
        () =>
            new Decimal(tier?.price || 0)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber(),
        [tier?.price],
    );

    const finalPrice = useMemo(() => {
        if (couponRemoved) {
            return originalPrice;
        }
        if (discountedPricing?.discountedPrice) {
            return new Decimal(discountedPricing.discountedPrice)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber();
        }
        return originalPrice;
    }, [discountedPricing?.discountedPrice, originalPrice, couponRemoved]);

    const hasDiscount = !couponRemoved && originalPrice !== finalPrice;
    const couponCode =
        plan.discounts?.[tier?.accountSize || ""]?.couponCode || "DISCOUNT";

    const handleCompleteOrder = async () => {
        setIsCreatingOrder(true);
        setError(null);

        try {
            // Create purchase via API
            const response = await fetch("/api/inapp-create-purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    programId: plan.id,
                    accountSize: tier?.accountSize,
                    platformId: platformSlug,
                    platformName: selectedPlatform?.name,
                    programName: plan.name,
                    programType: selectedPlan.category,
                    categoryLabel: selectedPlan.category,
                    currency: "USD",
                    customerData: {
                        firstName: billingData.firstName,
                        lastName: billingData.lastName,
                        email: billingData.email,
                        phone: billingData.phone,
                        address: billingData.address,
                        city: billingData.city,
                        state: billingData.state,
                        postalCode: billingData.postalCode,
                        country: billingData.country,
                    },
                    isInAppPurchase: true,
                    clientId,
                    tierId: tier?.id,
                    couponCode:
                        hasDiscount && !couponRemoved ? couponCode : null,
                    selectedAddOns: [],
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to create purchase");
            }

            const data = await response.json();
            const orderNumber = data.orderNumber;

            // Redirect parent window (not iframe) to payment page
            const paymentUrl = `/orders/${orderNumber}/pay`;

            // Check if we're in an iframe
            if (window.top && window.top !== window.self) {
                // Redirect parent window
                window.top.location.href = paymentUrl;
            } else {
                // Normal redirect
                window.location.href = paymentUrl;
            }
        } catch (err) {
            console.error("Error creating purchase:", err);
            setError(
                err instanceof Error ? err.message : "Failed to create order",
            );
            setIsCreatingOrder(false);
        }
    };

    return (
        <div className="mx-auto max-w-md space-y-8 text-center">
            {/* Summary Line */}
            <div className="font-semibold text-sm text-white leading-relaxed">
                {selectedPlan.category === "1-step"
                    ? "1-Step"
                    : selectedPlan.category === "2-step"
                      ? "2-Step"
                      : "Instant"}{" "}
                - {plan.name} - {tier?.accountSize} -{" "}
                {selectedPlatform?.name || platformSlug}
            </div>

            {/* Large Price */}
            <div className="space-y-2">
                {hasDiscount && (
                    <div className="text-white/40 text-xl line-through">
                        ${originalPrice.toFixed(2)}
                    </div>
                )}
                <div className="font-bold text-5xl text-white">
                    ${finalPrice.toFixed(2)}
                </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-white/80">Challenge</span>
                    <span className="font-medium text-white">
                        ${originalPrice.toFixed(2)}
                    </span>
                </div>
                {hasDiscount && (
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-white/80">
                            Coupon: {couponCode}
                            <button
                                type="button"
                                onClick={() => setCouponRemoved(true)}
                                className="rounded-full p-0.5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                aria-label="Remove coupon"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                        <span className="font-medium text-green-400">
                            - ${(originalPrice - finalPrice).toFixed(2)}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between border-white/10 border-t pt-3 font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-white">${finalPrice.toFixed(2)}</span>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-left text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center">
                <Button
                    onClick={handleCompleteOrder}
                    disabled={isCreatingOrder}
                    size="lg"
                    className="w-full bg-white text-black text-lg hover:bg-white/90 disabled:opacity-50"
                >
                    {isCreatingOrder ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        "Place Order"
                    )}
                </Button>
            </div>
        </div>
    );
}
