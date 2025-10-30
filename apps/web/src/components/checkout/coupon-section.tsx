"use client";

import { useState } from "react";
import { useAutoApplyCoupons } from "@/hooks/useAutoApplyCoupons";
import type { AppliedCoupon } from "./applied-coupon";
import { CouponInput } from "./coupon-input";

interface CouponSectionProps {
    programId: string;
    accountSize: string;
    originalPrice: number;
    userId?: string;
    userEmail?: string;
    onPriceChange?: (finalPrice: number, coupon: AppliedCoupon | null) => void;
    autoApplyEnabled?: boolean;
    initialCoupon?: AppliedCoupon | null;
}

export function CouponSection({
    programId,
    accountSize,
    originalPrice,
    userId,
    userEmail,
    onPriceChange,
    autoApplyEnabled = true,
    initialCoupon = null,
}: CouponSectionProps) {
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
        initialCoupon,
    );

    const handleCouponApplied = (coupon: AppliedCoupon) => {
        setAppliedCoupon(coupon);
        onPriceChange?.(coupon.finalPrice, coupon);
    };

    const handleCouponRemoved = () => {
        // Check if user is removing a manually-entered coupon (different from initial)
        const isRemovingManualCoupon =
            appliedCoupon &&
            initialCoupon &&
            appliedCoupon.code !== initialCoupon.code;

        if (isRemovingManualCoupon) {
            // Reset to initial coupon
            setAppliedCoupon(initialCoupon);
            onPriceChange?.(initialCoupon.finalPrice, initialCoupon);
        } else {
            // Remove coupon completely and reset to original price
            setAppliedCoupon(null);
            onPriceChange?.(originalPrice, null);
        }
    };

    // Auto-apply coupons on component mount when enabled
    const { isLoading: isAutoApplying } = useAutoApplyCoupons({
        programId,
        accountSize,
        originalPrice,
        userId,
        userEmail,
        onCouponApplied: handleCouponApplied,
        enabled: autoApplyEnabled && !appliedCoupon,
    });

    return (
        <div className="space-y-4">
            {isAutoApplying && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Checking for automatic discounts...
                </div>
            )}

            <CouponInput
                programId={programId}
                accountSize={accountSize}
                originalPrice={originalPrice}
                userId={userId}
                userEmail={userEmail}
                onCouponApplied={handleCouponApplied}
                onCouponRemoved={handleCouponRemoved}
                appliedCoupon={appliedCoupon || undefined}
                disabled={isAutoApplying}
                initialCode={appliedCoupon?.code}
            />

            {/* {appliedCoupon && (
                <AppliedCoupon
                    appliedCoupon={appliedCoupon}
                    originalPrice={originalPrice}
                    onRemove={handleCouponRemoved}
                    currency="USD"
                    compact={true}
                    showRemoveButton={true}
                />
            )} */}
        </div>
    );
}
