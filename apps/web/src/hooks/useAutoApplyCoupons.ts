"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
    type AutoApplyRequest,
    getBestAutoApplyCouponAction,
} from "@/app/actions/auto-apply-coupons";
import { applyCouponAction } from "@/app/actions/coupons";
import type { AppliedCoupon } from "@/components/checkout/applied-coupon";

interface UseAutoApplyCouponsOptions {
    programId: string;
    accountSize: string;
    originalPrice: number;
    userId?: string;
    userEmail?: string;
    onCouponApplied?: (coupon: AppliedCoupon) => void;
    enabled?: boolean;
}

interface AutoApplyState {
    isLoading: boolean;
    hasChecked: boolean;
    error: string | null;
}

export function useAutoApplyCoupons({
    programId,
    accountSize,
    originalPrice,
    userId,
    userEmail,
    onCouponApplied,
    enabled = true,
}: UseAutoApplyCouponsOptions) {
    const [state, setState] = useState<AutoApplyState>({
        isLoading: false,
        hasChecked: false,
        error: null,
    });

    // Use ref to track if auto-apply has already been attempted
    // This prevents multiple executions even if the component re-renders
    const hasAttemptedAutoApply = useRef(false);

    useEffect(() => {
        if (
            !enabled ||
            hasAttemptedAutoApply.current ||
            !programId ||
            !accountSize
        ) {
            return;
        }

        const checkAutoApplyCoupons = async () => {
            hasAttemptedAutoApply.current = true;
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            try {
                // Get URL parameters
                const urlParams: Record<string, string> = {};
                if (typeof window !== "undefined") {
                    const searchParams = new URLSearchParams(
                        window.location.search,
                    );
                    for (const [key, value] of searchParams.entries()) {
                        urlParams[key] = value;
                    }
                }

                // Check visitor status
                const isFirstVisit = !localStorage.getItem("ftm_visited");

                // Mark as visited for future checks
                if (isFirstVisit) {
                    localStorage.setItem("ftm_visited", "true");
                }

                // Prepare auto-apply request
                const autoApplyRequest: AutoApplyRequest = {
                    programId,
                    accountSize,
                    orderAmount: originalPrice,
                    urlParams,
                    userId,
                    userEmail,
                };

                // Check for auto-apply coupons
                const result =
                    await getBestAutoApplyCouponAction(autoApplyRequest);

                if (result.success && result.coupon) {
                    // Apply the auto-found coupon
                    const applyResult = await applyCouponAction(
                        result.coupon.code,
                        programId,
                        accountSize,
                        originalPrice,
                        userId || "",
                        userEmail,
                    );

                    if (applyResult.success && applyResult.appliedCoupon) {
                        // Call the callback to update the parent component
                        onCouponApplied?.(applyResult.appliedCoupon);

                        // Show success notification with custom message
                        const message =
                            result.coupon.message ||
                            `Auto-applied coupon: ${result.coupon.code}`;
                        toast.success(message, {
                            description: "Automatically applied to your order",
                            duration: 5000,
                        });
                    } else {
                        console.warn(
                            "Auto-apply coupon validation failed:",
                            applyResult.error,
                        );
                    }
                } else if (result.error) {
                    console.warn(
                        "Auto-apply coupon check failed:",
                        result.error,
                    );
                }
            } catch (error) {
                console.error("Error checking auto-apply coupons:", error);
                setState((prev) => ({
                    ...prev,
                    error: "Failed to check for automatic discounts",
                }));
            } finally {
                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    hasChecked: true,
                }));
            }
        };

        // Small delay to ensure page is fully loaded
        const timeoutId = setTimeout(() => {
            checkAutoApplyCoupons();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [
        enabled,
        programId,
        accountSize,
        originalPrice,
        userId,
        userEmail,
        onCouponApplied,
    ]);

    return {
        isLoading: state.isLoading,
        hasChecked: state.hasChecked,
        error: state.error,
    };
}
