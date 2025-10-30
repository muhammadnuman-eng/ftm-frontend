"use client";

import { GiftIcon, Loader } from "lucide-react";
import posthog from "posthog-js";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import {
    applyCouponAction,
    validateCouponAction,
} from "../../app/actions/coupons";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { AppliedCoupon } from "./applied-coupon";

interface CouponInputProps {
    programId: string;
    accountSize: string;
    originalPrice: number;
    userId?: string;
    userEmail?: string;
    onCouponApplied: (appliedCoupon: AppliedCoupon) => void;
    onCouponRemoved: () => void;
    appliedCoupon?: AppliedCoupon;
    disabled?: boolean;
    className?: string;
    initialCode?: string;
    showRemoveButton?: boolean;
}

export function CouponInput({
    programId,
    accountSize,
    originalPrice,
    userId,
    userEmail,
    onCouponApplied,
    onCouponRemoved,
    appliedCoupon,
    disabled = false,
    className = "",
    initialCode = "",
    showRemoveButton = true,
}: CouponInputProps) {
    const [couponCode, setCouponCode] = useState(initialCode);
    const [validationMessage, setValidationMessage] = useState("");
    const [isProcessing, startProcessing] = useTransition();
    const couponInputId = useId();

    const handleValidateCoupon = () => {
        if (!couponCode.trim()) {
            setValidationMessage("Please enter a coupon code");
            return;
        }

        startProcessing(async () => {
            try {
                const result = await validateCouponAction(
                    couponCode.trim(),
                    programId,
                    accountSize,
                    userId,
                    userEmail,
                    originalPrice,
                );

                if (result.valid) {
                    setValidationMessage("✓ Valid coupon code");
                } else {
                    setValidationMessage(result.error || "Invalid coupon code");
                }
            } catch (error) {
                setValidationMessage("Error validating coupon");
                console.error("Coupon validation error:", error);
            }
        });
    };

    const handleApplyCoupon = () => {
        if (!couponCode.trim()) {
            setValidationMessage("Please enter a coupon code");
            return;
        }

        startProcessing(async () => {
            try {
                const validation = await validateCouponAction(
                    couponCode.trim(),
                    programId,
                    accountSize,
                    userId,
                    userEmail,
                    originalPrice,
                );

                if (!validation.valid) {
                    setValidationMessage(
                        validation.error || "Invalid coupon code",
                    );
                    toast.error(validation.error || "Invalid coupon code");

                    // Track coupon failure
                    posthog.capture("checkout_coupon_applied_failed", {
                        couponCode: couponCode.trim(),
                        programId,
                        accountSize,
                        originalPrice,
                        error: validation.error || "Invalid coupon code",
                        validationFailed: true,
                    });

                    return;
                }

                const applyResult = await applyCouponAction(
                    couponCode.trim(),
                    programId,
                    accountSize,
                    originalPrice,
                    userId,
                    userEmail,
                );

                if (applyResult.success && applyResult.appliedCoupon) {
                    onCouponApplied(applyResult.appliedCoupon);
                    setValidationMessage("Coupon applied successfully");
                    setCouponCode(applyResult.appliedCoupon.code);
                    toast.success("Coupon applied successfully!");

                    // Track successful coupon application
                    posthog.capture("checkout_coupon_applied_success", {
                        couponCode: applyResult.appliedCoupon.code,
                        programId,
                        accountSize,
                        originalPrice,
                        finalPrice: applyResult.appliedCoupon.finalPrice,
                        discountAmount:
                            applyResult.appliedCoupon.discountAmount,
                        discountType: applyResult.appliedCoupon.discountType,
                        discountValue: applyResult.appliedCoupon.discountValue,
                    });
                } else {
                    setValidationMessage(
                        applyResult.error || "Failed to apply coupon",
                    );
                    toast.error(applyResult.error || "Failed to apply coupon");

                    // Track coupon failure
                    posthog.capture("checkout_coupon_applied_failed", {
                        couponCode: couponCode.trim(),
                        programId,
                        accountSize,
                        originalPrice,
                        error: applyResult.error || "Failed to apply coupon",
                        applyFailed: true,
                    });
                }
            } catch (error) {
                console.error("Error applying coupon:", error);
                setValidationMessage(
                    "An error occurred while applying the coupon",
                );
                toast.error("An error occurred while applying the coupon");
            }
        });
    };

    const handleRemoveCoupon = () => {
        onCouponRemoved();
        setCouponCode("");
        setValidationMessage("");
        toast.success("Coupon removed");
    };

    const handleInputChange = (value: string) => {
        setCouponCode(value);
        setValidationMessage("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (validationMessage.includes("✓")) {
                handleApplyCoupon();
            } else {
                handleValidateCoupon();
            }
        }
    };

    if (appliedCoupon) {
        return (
            <div className={`space-y-3 ${className}`}>
                <Label className="font-medium text-sm">Applied Coupon</Label>
                <div className="flex items-center justify-between rounded bg-gradient-to-t from-lime-600 to-lime-500 p-3 outline outline-black">
                    <div className="flex items-center space-x-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-lime-100">
                            <GiftIcon className="h-5 w-5 text-lime-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white">
                                {appliedCoupon.code}
                            </p>
                            <p className="font-medium text-sm text-white">
                                {appliedCoupon.discountType === "percentage"
                                    ? `${appliedCoupon.discountValue}% discount`
                                    : `$${appliedCoupon.discountValue} off`}
                            </p>
                        </div>
                    </div>
                    {showRemoveButton && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            disabled={disabled}
                            className="text-lime-950 hover:bg-lime-950"
                            data-ph-capture-attribute-button="removeCoupon"
                        >
                            Remove
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <div className="flex space-x-2">
                <div className="flex-1">
                    <Input
                        id={couponInputId}
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) =>
                            handleInputChange(e.target.value.toUpperCase())
                        }
                        onKeyPress={handleKeyPress}
                        disabled={disabled || isProcessing}
                        className="uppercase"
                        data-ph-capture-attribute-field-name="couponCode"
                    />
                </div>
                <Button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={disabled || isProcessing}
                    variant="outline"
                    className="h-12"
                    data-ph-capture-attribute-button="applyCoupon"
                >
                    {isProcessing ? (
                        <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Applying...
                        </>
                    ) : (
                        "Apply"
                    )}
                </Button>
            </div>
            {validationMessage && (
                <p
                    className={`text-sm ${
                        validationMessage.toLowerCase().includes("success")
                            ? "text-green-600"
                            : "text-red-600"
                    }`}
                >
                    {validationMessage}
                </p>
            )}
        </div>
    );
}
