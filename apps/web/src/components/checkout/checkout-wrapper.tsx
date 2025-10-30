import { Decimal } from "decimal.js";
import type { ProgramWithDiscounts } from "@/data/programs";
import type { AppliedCoupon } from "./applied-coupon";

interface CheckoutWrapperProps {
    selectedPlan: ProgramWithDiscounts;
    tier: {
        accountSize: string;
        price: number;
        discountedPrice?: number;
        originalPrice?: number;
        isPopular?: boolean | null;
        activeCoupon?: AppliedCoupon | null;
        addOnDetails?: { key: string; label: string; value: string }[];
    };
    platformId: string;
    summaryText: string;
    categoryLabel: string;
    platformName?: string;
}

const formatCurrency = (amount: number) => {
    const decimalAmount = new Decimal(amount).toDecimalPlaces(
        0,
        Decimal.ROUND_CEIL,
    );
    const formatted = decimalAmount.toNumber().toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return `$${formatted}`;
};

export function CheckoutWrapper({
    selectedPlan,
    tier,
    platformId,
    summaryText,
    categoryLabel,
    platformName,
}: CheckoutWrapperProps) {
    const originalPrice = new Decimal(tier.originalPrice ?? tier.price)
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();
    const couponAdjustedPrice = new Decimal(
        tier.discountedPrice ?? originalPrice,
    )
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();
    const finalPrice = new Decimal(tier.price)
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();

    const hasCouponDiscount = originalPrice !== couponAdjustedPrice;
    const _hasAddOnAdjustment = couponAdjustedPrice !== finalPrice;

    return (
        <div className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
                <div className="font-bold text-white/80 text-xs uppercase">
                    Order Summary
                </div>
                <div className="font-semibold text-white/90">{summaryText}</div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-white/60">Evaluation Type</span>
                        <span className="text-white/90">{categoryLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/60">Plan</span>
                        <span className="text-white/90">
                            {selectedPlan.name}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/60">Account Size</span>
                        <span className="text-white/90">
                            {tier.accountSize}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-white/60">Platform</span>
                        <span className="text-white/90">
                            {platformName || platformId}
                        </span>
                    </div>
                    {tier.activeCoupon?.code && (
                        <div className="flex items-center justify-between text-white/50 text-xs">
                            <span>Coupon</span>
                            <span className="text-white/70 uppercase tracking-wide">
                                {tier.activeCoupon.code}
                            </span>
                        </div>
                    )}
                </div>

                {/* Pricing Summary */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-white/10 border-t pt-2">
                        <span className="font-semibold text-white/90">
                            Total
                        </span>
                        <div className="text-right">
                            {hasCouponDiscount && (
                                <div className="text-white/40 text-xs line-through">
                                    {formatCurrency(originalPrice)}
                                </div>
                            )}
                            <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text font-bold text-transparent text-xl">
                                {formatCurrency(finalPrice)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
