"use client";

import { AlertTriangleIcon, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ProgramWithDiscounts } from "@/data/programs";
import { useDiscountedPricing } from "@/hooks/useDiscountedPricing";
import { cn } from "@/lib/utils";
import type { Platform } from "@/payload-types";
import { PlanFeaturesDisplay } from "./plan-features-display";

interface VariationsSelectorProps {
    programs: ProgramWithDiscounts[];
    selectedCategory: "1-step" | "2-step" | "instant";
    onCategoryChange: (category: "1-step" | "2-step" | "instant") => void;
    selectedPlan?: ProgramWithDiscounts | null;
    onPlanChange?: (plan: ProgramWithDiscounts | null) => void;
    showFeaturesOnly?: boolean;
    selectedTierIndex?: number;
    onTierChange?: (tierIndex: number) => void;
    selectedPlatform?: string;
    onPlatformChange?: (platform: string) => void;
    platforms: (Platform & { isRestricted?: boolean })[];
    userCountryCode?: string;
    userCountryName?: string;
}

interface SelectorState {
    category: "1-step" | "2-step" | "instant";
    selectedPlan: ProgramWithDiscounts | null;
    selectedTierIndex: number;
    selectedPlatform: string;
}

// Feature interface no longer needed; features are provided by Payload arrays
// Platforms are provided from Payload via props

export const VariationsSelector = ({
    programs,
    selectedCategory,
    onCategoryChange: _onCategoryChange,
    selectedPlan: sharedSelectedPlan,
    onPlanChange,
    showFeaturesOnly = false,
    selectedTierIndex: sharedTierIndex = 0,
    onTierChange,
    selectedPlatform: sharedPlatform = "",
    onPlatformChange,
    platforms,
    userCountryCode,
    userCountryName,
}: VariationsSelectorProps) => {
    const [state, setState] = useState<SelectorState>({
        category: selectedCategory,
        selectedPlan: sharedSelectedPlan || null,
        selectedTierIndex: sharedTierIndex || 0,
        selectedPlatform: sharedPlatform || "",
    });

    const hasSyncedInitialState = useRef(false);
    const {
        selectedPlan: initialSelectedPlan,
        selectedTierIndex: initialSelectedTierIndex,
        selectedPlatform: initialSelectedPlatform,
    } = state;

    // Sync internal state with shared props
    useEffect(() => {
        // In features-only mode, always sync with shared props
        if (showFeaturesOnly) {
            setState((prev) => ({
                ...prev,
                selectedPlan: sharedSelectedPlan || null,
                selectedTierIndex: sharedTierIndex || 0,
                selectedPlatform: sharedPlatform || "",
            }));
            return;
        }

        // For selection mode, only sync on initial mount
        if (hasSyncedInitialState.current) {
            return;
        }

        hasSyncedInitialState.current = true;

        if (sharedSelectedPlan && !initialSelectedPlan) {
            setState((prev) => ({
                ...prev,
                selectedPlan: sharedSelectedPlan,
            }));
        }
        if (sharedTierIndex !== undefined && initialSelectedTierIndex === 0) {
            setState((prev) => ({
                ...prev,
                selectedTierIndex: sharedTierIndex,
            }));
        }
        if (sharedPlatform && !initialSelectedPlatform) {
            setState((prev) => ({
                ...prev,
                selectedPlatform: sharedPlatform,
            }));
        }
    }, [
        sharedSelectedPlan,
        sharedTierIndex,
        sharedPlatform,
        initialSelectedPlan,
        initialSelectedTierIndex,
        initialSelectedPlatform,
        showFeaturesOnly,
    ]);

    const { categoryPlans, selectedPlan } = useMemo(() => {
        const categoryPlans = programs.filter(
            (plan) => plan.category === selectedCategory,
        );

        // Helper to find the default "hot" plan for the category
        const getDefaultHotPlan = () => {
            if (selectedCategory === "1-step") {
                return categoryPlans.find((plan) => plan.slug === "nitro");
            }
            if (selectedCategory === "2-step") {
                return categoryPlans.find(
                    (plan) => plan.slug === "2-step-plus",
                );
            }
            if (selectedCategory === "instant") {
                return categoryPlans.find(
                    (plan) => plan.slug === "instant-plus",
                );
            }
            return null;
        };

        // In features-only mode, always use shared props
        if (showFeaturesOnly && sharedSelectedPlan) {
            return { categoryPlans, selectedPlan: sharedSelectedPlan };
        }

        // Prioritize user's current selection, then shared selection, then hot plan, then first available
        let selectedPlan = null;

        // First, check if user has a valid selection for this category
        if (
            state.selectedPlan &&
            categoryPlans.some((plan) => plan.id === state.selectedPlan?.id)
        ) {
            selectedPlan = state.selectedPlan;
        }
        // If no user selection, check if shared selection is valid for this category
        else if (
            sharedSelectedPlan &&
            categoryPlans.some((plan) => plan.id === sharedSelectedPlan.id)
        ) {
            selectedPlan = sharedSelectedPlan;
        }
        // Otherwise, select the hot plan if available
        else {
            selectedPlan = getDefaultHotPlan() || categoryPlans[0] || null;
        }

        return { categoryPlans, selectedPlan };
    }, [
        programs,
        selectedCategory,
        state.selectedPlan,
        sharedSelectedPlan,
        showFeaturesOnly,
    ]);

    // When category changes, update the selected plan
    useEffect(() => {
        // Skip if in features-only mode
        if (showFeaturesOnly) {
            return;
        }

        // Check if the current selected plan is valid for the new category
        const isCurrentPlanValidForCategory =
            selectedPlan && selectedPlan.category === selectedCategory;

        if (!isCurrentPlanValidForCategory && onPlanChange && selectedPlan) {
            // The selected plan from useMemo is already the correct one for the new category
            onPlanChange(selectedPlan);
            setState((prev) => ({
                ...prev,
                selectedPlan: selectedPlan,
            }));
        }
    }, [selectedCategory, selectedPlan, onPlanChange, showFeaturesOnly]);

    // Find closest available tier index when plan changes
    const validTierIndex = useMemo(() => {
        if (!selectedPlan?.pricingTiers) return 0;

        // If current tier index is valid for this plan, keep it
        if (state.selectedTierIndex < selectedPlan.pricingTiers.length) {
            return state.selectedTierIndex;
        }

        // Otherwise, try to find closest account size
        // Get the previously selected account size from any plan that has this tier index
        let currentSize: string | undefined;

        // First try to get from current plan
        if (selectedPlan.pricingTiers[state.selectedTierIndex]) {
            currentSize =
                selectedPlan.pricingTiers[state.selectedTierIndex].accountSize;
        } else {
            // If not available, find a plan that has this tier index to get the size
            for (const plan of programs) {
                if (plan.pricingTiers?.[state.selectedTierIndex]) {
                    currentSize =
                        plan.pricingTiers[state.selectedTierIndex].accountSize;
                    break;
                }
            }
        }

        if (!currentSize) {
            return selectedPlan.pricingTiers.length - 1; // Select largest available
        }

        // Convert account sizes to numbers for comparison (e.g., "$200K" -> 200000)
        const parseAccountSize = (size: string) => {
            const num = Number.parseInt(size.replace(/[$K]/g, ""), 10);
            return size.includes("K") ? num * 1000 : num;
        };

        const targetSize = parseAccountSize(currentSize);

        // Find the closest available size
        let closestIndex = 0;
        let smallestDiff = Number.POSITIVE_INFINITY;

        selectedPlan.pricingTiers.forEach((tier, index) => {
            const tierSize = parseAccountSize(tier.accountSize);
            const diff = Math.abs(tierSize - targetSize);
            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestIndex = index;
            }
        });

        return closestIndex;
    }, [selectedPlan, state.selectedTierIndex, programs]);

    // Update state when validTierIndex changes
    useEffect(() => {
        if (validTierIndex !== state.selectedTierIndex) {
            setState((prev) => ({
                ...prev,
                selectedTierIndex: validTierIndex,
            }));
        }
    }, [validTierIndex, state.selectedTierIndex]);

    const handlePlanSelect = (plan: ProgramWithDiscounts) => {
        if (onPlanChange) {
            onPlanChange(plan);
        }

        // Calculate the best tier index for the new plan
        let newTierIndex = 0;

        // Try to preserve the current account size if possible
        if (state.selectedPlan?.pricingTiers?.[state.selectedTierIndex]) {
            const currentAccountSize =
                state.selectedPlan.pricingTiers[state.selectedTierIndex]
                    .accountSize;
            const matchingTierIndex = plan.pricingTiers?.findIndex(
                (tier) => tier.accountSize === currentAccountSize,
            );

            if (matchingTierIndex !== undefined && matchingTierIndex !== -1) {
                // Found exact match
                newTierIndex = matchingTierIndex;
            } else if (plan.pricingTiers && plan.pricingTiers.length > 0) {
                // No exact match, find closest by size
                const parseAccountSize = (size: string) => {
                    const num = Number.parseInt(size.replace(/[$K,]/g, ""), 10);
                    return size.includes("K") ? num * 1000 : num;
                };

                const targetSize = parseAccountSize(currentAccountSize);
                let closestIndex = 0;
                let smallestDiff = Number.POSITIVE_INFINITY;

                plan.pricingTiers.forEach((tier, index) => {
                    const tierSize = parseAccountSize(tier.accountSize);
                    const diff = Math.abs(tierSize - targetSize);
                    if (diff < smallestDiff) {
                        smallestDiff = diff;
                        closestIndex = index;
                    }
                });

                newTierIndex = closestIndex;
            }
        }

        // Notify parent component of the new tier index
        if (onTierChange) {
            onTierChange(newTierIndex);
        }

        setState((prev) => ({
            ...prev,
            selectedPlan: plan,
            selectedTierIndex: newTierIndex,
        }));
    };

    const handleTierSelect = (tierIndex: number) => {
        if (onTierChange) {
            onTierChange(tierIndex);
        }
        setState((prev) => ({
            ...prev,
            selectedTierIndex: tierIndex,
        }));
    };

    const handlePlatformSelect = (platformId: string) => {
        if (onPlatformChange) {
            onPlatformChange(platformId);
        }
        setState((prev) => ({
            ...prev,
            selectedPlatform: platformId,
        }));
    };

    // Get the selected tier for discount calculation
    const selectedTier = useMemo(() => {
        if (!selectedPlan?.pricingTiers) return null;
        // In features-only mode, always use shared tier index
        const tierIndexToUse = showFeaturesOnly
            ? sharedTierIndex !== undefined
                ? sharedTierIndex
                : 0
            : sharedTierIndex !== undefined
              ? sharedTierIndex
              : validTierIndex;
        return selectedPlan.pricingTiers[tierIndexToUse] || null;
    }, [selectedPlan, sharedTierIndex, validTierIndex, showFeaturesOnly]);

    // Fetch discounted pricing dynamically
    const discountedPricing = useDiscountedPricing({
        program: selectedPlan,
        accountSize: selectedTier?.accountSize || null,
        enabled: showFeaturesOnly && !!selectedPlan && !!selectedTier,
    });

    // Render only features when showFeaturesOnly is true
    if (showFeaturesOnly && selectedPlan && selectedTier) {
        return (
            <div className="hidden sm:block">
                <PlanFeaturesDisplay
                    selectedPlan={selectedPlan}
                    selectedTier={selectedTier}
                    discountedPricing={discountedPricing}
                />
            </div>
        );
    }

    // Helper function to check if plan is trader's top choice
    const isTopChoice = (planSlug: string, category: string) => {
        return (
            (category === "1-step" && planSlug === "nitro") ||
            (category === "2-step" && planSlug === "2-step-plus") ||
            (category === "instant" && planSlug === "instant-plus")
        );
    };

    // Render selection interface when showFeaturesOnly is false
    return (
        <div className="space-y-8">
            {/* Plan Sub-tabs */}
            <div className="w-full">
                <div className="flex w-full rounded-md border border-white/10 bg-white/5 p-1 sm:flex-row">
                    {categoryPlans.map((plan) => (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => handlePlanSelect(plan)}
                            className={cn(
                                "relative flex flex-1 items-center justify-center rounded px-4 py-2.5 font-semibold text-sm transition-all duration-300 sm:py-3 sm:text-base",
                                "whitespace-nowrap hover:text-white focus:outline-none",
                                selectedPlan?.id === plan.id
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                                    : "text-white/60 hover:bg-white/5 hover:text-white/80",
                            )}
                        >
                            {isTopChoice(plan.slug, selectedCategory) && (
                                <span className="-top-2 -translate-x-1/2 absolute left-1/2 inline-flex items-center rounded-full bg-lime-500 px-2 py-0.5 font-medium text-[10px] text-black uppercase tracking-wide sm:text-xs">
                                    HOT
                                </span>
                            )}
                            <span className="hidden sm:block">{plan.name}</span>
                            <span className="block sm:hidden">
                                {plan.mobileName}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selection Interface */}
            {selectedPlan && (
                <div className="space-y-8">
                    {/* Account Sizes */}
                    <div>
                        <div className="mb-4 font-semibold text-blue-400 text-sm uppercase tracking-wider">
                            Account Size
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:grid lg:grid-cols-3 lg:gap-3">
                            {selectedPlan.pricingTiers?.map((tier, index) => (
                                <button
                                    key={tier.accountSize}
                                    type="button"
                                    onClick={() => handleTierSelect(index)}
                                    className={cn(
                                        "rounded-lg border px-4 py-1.5 text-center transition-all duration-300 sm:py-3",
                                        "hover:border-indigo-500/50 hover:bg-indigo-500/10",
                                        (sharedTierIndex || validTierIndex) ===
                                            index
                                            ? "border-blue-500 bg-indigo-500/10 ring-1 ring-blue-500/30"
                                            : "border-white/20",
                                    )}
                                >
                                    <div className="font-bold text-sm text-white">
                                        {tier.accountSize}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="sm:hidden">
                        <PlanFeaturesDisplay
                            selectedPlan={selectedPlan}
                            selectedTier={selectedTier}
                            discountedPricing={discountedPricing}
                        />
                    </div>

                    {/* Platform Selection */}
                    <div>
                        <div className="mb-4 font-semibold text-blue-400 text-sm uppercase tracking-wider">
                            Trading Platform
                        </div>
                        <div className="mb-4 flex items-center gap-2">
                            <AlertTriangleIcon className="h-4 w-4 text-white/60" />
                            <p className="text-sm text-white/60">
                                MetaTrader 5 and cTrader are not available for
                                USA residents.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {platforms.map((platform) => {
                                const isSelected =
                                    (sharedPlatform ||
                                        state.selectedPlatform) ===
                                    platform.slug;
                                const isRestricted = platform.isRestricted;

                                return (
                                    <button
                                        key={platform.slug}
                                        type="button"
                                        onClick={() =>
                                            !isRestricted &&
                                            handlePlatformSelect(platform.slug)
                                        }
                                        disabled={isRestricted}
                                        className={cn(
                                            "rounded-lg border p-3 text-center transition-all duration-300",
                                            "hover:border-indigo-500/50 hover:bg-indigo-500/10",
                                            isSelected
                                                ? "border-blue-500 bg-indigo-500/10 ring-1 ring-blue-500/30"
                                                : "border-white/20",
                                            isRestricted &&
                                                "pointer-events-none cursor-not-allowed border-white/10 bg-white/[0.06] opacity-60",
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-[6px]">
                                            <span className="font-medium text-sm text-white">
                                                {platform.name}
                                            </span>
                                            {isRestricted && (
                                                <span className="inline-flex items-center gap-[4px] rounded-full bg-white/10 px-2 py-[2px] text-white/70 text-xs">
                                                    <Lock className="h-3 w-3" />
                                                    <span>
                                                        {userCountryName
                                                            ? `Restricted in ${userCountryName}`
                                                            : userCountryCode
                                                              ? `Restricted in ${userCountryCode.toUpperCase()}`
                                                              : "Restricted"}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
