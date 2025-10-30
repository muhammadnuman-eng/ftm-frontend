import { Gift, Tag, X } from "lucide-react";
import {
    formatDiscountAmount,
    formatPrice,
} from "../../lib/coupons/calculation";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export interface AppliedCoupon {
    code: string;
    couponId: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    discountAmount: number;
    finalPrice: number;
}

interface AppliedCouponProps {
    appliedCoupon: AppliedCoupon;
    originalPrice: number;
    onRemove: () => void;
    currency?: string;
    className?: string;
    showRemoveButton?: boolean;
    compact?: boolean;
}

export function AppliedCoupon({
    appliedCoupon,
    originalPrice,
    onRemove,
    currency = "USD",
    className = "",
    showRemoveButton = true,
    compact = false,
}: AppliedCouponProps) {
    const { code, discountType, discountValue, finalPrice } = appliedCoupon;

    const discountText = formatDiscountAmount(
        discountType,
        discountValue,
        currency,
    );

    const savingsAmount = originalPrice - finalPrice;
    const savingsPercentage =
        originalPrice > 0 ? (savingsAmount / originalPrice) * 100 : 0;

    if (compact) {
        return (
            <div
                className={`flex items-center justify-between rounded-md bg-lime-500 p-2 ${className}`}
            >
                <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-lime-50" />
                    <span className="font-medium text-lime-50 text-sm">
                        {code}
                    </span>
                    <Badge
                        variant="secondary"
                        className="bg-lime-100 text-lime-800 text-xs"
                    >
                        {discountText}
                    </Badge>
                </div>
                {showRemoveButton && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRemove}
                        className="h-6 w-6 p-0 text-green-700 hover:bg-green-100"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 ${className}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <Gift className="h-5 w-5 text-green-600" />
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="mb-1 flex items-center space-x-2">
                            <h3 className="font-semibold text-green-900 text-lg">
                                Coupon Applied
                            </h3>
                            <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                            >
                                {code}
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-700">
                                    Discount:
                                </span>
                                <span className="font-medium text-green-900">
                                    {discountText}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-green-700">
                                    You save:
                                </span>
                                <span className="font-medium text-green-900">
                                    {formatPrice(savingsAmount, currency)}
                                    {savingsPercentage > 0 && (
                                        <span className="ml-1 text-green-600">
                                            ({savingsPercentage.toFixed(1)}
                                            %)
                                        </span>
                                    )}
                                </span>
                            </div>

                            <div className="mt-2 border-green-200 border-t pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-green-700 text-sm">
                                        Original Price:
                                    </span>
                                    <span className="text-green-600 text-sm line-through">
                                        {formatPrice(originalPrice, currency)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-green-900">
                                        Final Price:
                                    </span>
                                    <span className="font-bold text-green-900 text-lg">
                                        {formatPrice(finalPrice, currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showRemoveButton && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onRemove}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                        <X className="mr-1 h-4 w-4" />
                        Remove
                    </Button>
                )}
            </div>
        </div>
    );
}

/**
 * Simplified version for displaying in order summaries
 */
export function CouponSummary({
    appliedCoupon,
    originalPrice: _originalPrice,
    currency = "USD",
    className = "",
}: {
    appliedCoupon: AppliedCoupon;
    originalPrice: number;
    currency?: string;
    className?: string;
}) {
    const { code, discountType, discountValue } = appliedCoupon;
    const discountText = formatDiscountAmount(
        discountType,
        discountValue,
        currency,
    );

    return (
        <div className={`flex items-center justify-between py-2 ${className}`}>
            <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-green-600" />
                <span className="text-sm text-stone-600">Coupon ({code})</span>
            </div>
            <div className="text-right">
                <div className="font-medium text-green-600 text-sm">
                    -{formatPrice(appliedCoupon.discountAmount, currency)}
                </div>
                <div className="text-stone-500 text-xs">{discountText}</div>
            </div>
        </div>
    );
}

/**
 * Component for displaying coupon savings in a prominent way
 */
export function CouponSavingsBanner({
    appliedCoupon,
    originalPrice,
    currency = "USD",
    className = "",
}: {
    appliedCoupon: AppliedCoupon;
    originalPrice: number;
    currency?: string;
    className?: string;
}) {
    const savingsAmount = originalPrice - appliedCoupon.finalPrice;
    const savingsPercentage =
        originalPrice > 0 ? (savingsAmount / originalPrice) * 100 : 0;

    return (
        <div
            className={`rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-center text-white ${className}`}
        >
            <div className="mb-2 flex items-center justify-center space-x-2">
                <Gift className="h-5 w-5" />
                <span className="font-semibold">You're Saving!</span>
            </div>
            <p className="font-bold text-2xl">
                {formatPrice(savingsAmount, currency)}
            </p>
            <p className="text-sm opacity-90">
                {savingsPercentage.toFixed(1)}% off with coupon{" "}
                {appliedCoupon.code}
            </p>
        </div>
    );
}
