"use client";

import { Decimal } from "decimal.js";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProgramWithDiscounts } from "@/data/programs";
import { useDiscountedPricing } from "@/hooks/useDiscountedPricing";
import type { Platform } from "@/payload-types";
import { CategoryTabs } from "../variations/category-tabs";
import { VariationsSelector } from "../variations/variations-selector";
import type { SelectedPlanData } from "./inapp-purchase-flow";

interface StepSelectAccountProps {
    programs: ProgramWithDiscounts[];
    platforms: (Platform & { isRestricted?: boolean })[];
    onNext: (data: SelectedPlanData) => void;
    userCountryCode?: string;
    userCountryName?: string;
}

export function StepSelectAccount({
    programs,
    platforms,
    onNext,
    userCountryCode,
    userCountryName,
}: StepSelectAccountProps) {
    const [selectedCategory, setSelectedCategory] = useState<
        "1-step" | "2-step" | "instant"
    >("1-step");

    // Auto-select first program in the category
    const [selectedPlan, setSelectedPlan] =
        useState<ProgramWithDiscounts | null>(() => {
            const firstPlan = programs.find((p) => p.category === "1-step");
            return firstPlan || null;
        });

    const [selectedTierIndex, setSelectedTierIndex] = useState(0);

    // Auto-select first available platform
    const [selectedPlatform, setSelectedPlatform] = useState<string>(() => {
        const firstAvailable = platforms.find(
            (platform) => !platform.isRestricted,
        );
        return firstAvailable?.slug || "";
    });

    // Handle category change
    const handleCategoryChange = (
        newCategory: "1-step" | "2-step" | "instant",
    ) => {
        setSelectedCategory(newCategory);

        // Find the first plan in the new category
        const categoryPlans = programs.filter(
            (p) => p.category === newCategory,
        );
        if (categoryPlans.length > 0) {
            // Try to find the "hot" plan for the category, otherwise use the first one
            let defaultPlan = categoryPlans[0];

            if (newCategory === "1-step") {
                const nitroPlan = categoryPlans.find((p) => p.slug === "nitro");
                if (nitroPlan) defaultPlan = nitroPlan;
            } else if (newCategory === "2-step") {
                const twoStepPlus = categoryPlans.find(
                    (p) => p.slug === "2-step-plus",
                );
                if (twoStepPlus) defaultPlan = twoStepPlus;
            } else if (newCategory === "instant") {
                const instantPlus = categoryPlans.find(
                    (p) => p.slug === "instant-plus",
                );
                if (instantPlus) defaultPlan = instantPlus;
            }

            setSelectedPlan(defaultPlan);
            // Reset tier index when changing plans
            setSelectedTierIndex(0);
        }
    };

    const tier = selectedPlan?.pricingTiers?.[selectedTierIndex];

    const discountedPricing = useDiscountedPricing({
        program: selectedPlan,
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
        if (discountedPricing?.discountedPrice) {
            return new Decimal(discountedPricing.discountedPrice)
                .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                .toNumber();
        }
        return originalPrice;
    }, [discountedPricing?.discountedPrice, originalPrice]);

    const isValid =
        selectedPlan?.pricingTiers?.[selectedTierIndex] && selectedPlatform;

    const handleContinue = () => {
        if (isValid && selectedPlan) {
            onNext({
                category: selectedCategory,
                plan: selectedPlan,
                tierIndex: selectedTierIndex,
                platform: selectedPlatform,
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Category Tabs */}
            <CategoryTabs
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: Variations Selector */}
                <div className="lg:col-span-2">
                    <VariationsSelector
                        programs={programs}
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                        selectedPlan={selectedPlan}
                        onPlanChange={setSelectedPlan}
                        showFeaturesOnly={false}
                        selectedTierIndex={selectedTierIndex}
                        onTierChange={setSelectedTierIndex}
                        selectedPlatform={selectedPlatform}
                        onPlatformChange={setSelectedPlatform}
                        platforms={platforms}
                        userCountryCode={userCountryCode}
                        userCountryName={userCountryName}
                    />
                </div>

                {/* Right: Selected Configuration */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-6 rounded-xl bg-card p-6">
                        {isValid && selectedPlan ? (
                            <div className="space-y-6">
                                {/* Summary Line */}
                                <div className="text-center font-semibold text-sm text-white leading-relaxed">
                                    {selectedCategory === "1-step"
                                        ? "1-Step"
                                        : selectedCategory === "2-step"
                                          ? "2-Step"
                                          : "Instant"}{" "}
                                    - {selectedPlan.name} - {tier?.accountSize}{" "}
                                    -{" "}
                                    {platforms.find(
                                        (p) => p.slug === selectedPlatform,
                                    )?.name || selectedPlatform}
                                </div>

                                {/* Pricing */}
                                <div className="space-y-2 text-center">
                                    {originalPrice !== finalPrice && (
                                        <div className="text-lg text-white/40 line-through">
                                            ${originalPrice.toFixed(2)}
                                        </div>
                                    )}
                                    <div className="font-bold text-4xl text-green-400">
                                        ${finalPrice.toFixed(2)}
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="space-y-3 border-white/10 border-t pt-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-white/80">
                                            Challenge
                                        </span>
                                        <span className="font-medium text-white">
                                            ${finalPrice.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-white/10 border-t pt-3 font-semibold">
                                        <span className="text-white">
                                            Total
                                        </span>
                                        <span className="text-white">
                                            ${finalPrice.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-8 text-center">
                                <div className="text-6xl">🎯</div>
                                <div className="text-sm text-white/40">
                                    Select your account configuration to
                                    continue
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleContinue}
                            disabled={!isValid}
                            size="lg"
                            className="w-full bg-white text-black text-lg hover:bg-white/90 disabled:opacity-50"
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
