"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { ProgramWithDiscounts } from "@/data/programs";
import { useDiscountedPricing } from "@/hooks/useDiscountedPricing";
import { cn } from "@/lib/utils";
import type { Platform } from "@/payload-types";
import { CategoryTabs } from "./category-tabs";
import { VariationsSelector } from "./variations-selector";

interface InAppParams {
    inapp?: string;
    embed?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    client_id?: string;
    country?: string;
    address?: string;
    city?: string;
    phone?: string;
    state?: string;
    postalCode?: string;
    ip?: string;
}

interface VariationsWrapperProps {
    programs: ProgramWithDiscounts[];
    platforms: (Platform & { isRestricted?: boolean })[];
    initialCategory?: "1-step" | "2-step" | "instant";
    initialProgram?: ProgramWithDiscounts | null;
    initialAccountSize?: string | null;
    initialPlatform?: string | null;
    userCountryCode?: string;
    userCountryName?: string;
    inAppParams?: InAppParams;
}

export const VariationsWrapper = ({
    programs,
    platforms,
    initialCategory,
    initialProgram,
    initialAccountSize,
    initialPlatform,
    userCountryCode,
    userCountryName,
    inAppParams,
}: VariationsWrapperProps) => {
    const formatCurrency = (amount: number) => {
        const hasCents = !Number.isInteger(amount);
        return `$${amount.toLocaleString(undefined, {
            minimumFractionDigits: hasCents ? 2 : 0,
            maximumFractionDigits: hasCents ? 2 : 0,
        })}`;
    };

    const [selectedCategory, setSelectedCategory] = useState<
        "1-step" | "2-step" | "instant"
    >(initialCategory || "1-step");
    const [selectedPlan, setSelectedPlan] =
        useState<ProgramWithDiscounts | null>(initialProgram || null);
    // Initialize selectedTierIndex based on initialAccountSize
    const getInitialTierIndex = () => {
        if (initialAccountSize && initialProgram?.pricingTiers) {
            const tierIndex = initialProgram.pricingTiers.findIndex(
                (tier) => tier.accountSize === initialAccountSize,
            );
            return tierIndex !== -1 ? tierIndex : 0;
        }
        return 0;
    };

    const [selectedTierIndex, setSelectedTierIndex] = useState<number>(
        getInitialTierIndex(),
    );
    const [selectedPlatform, setSelectedPlatform] = useState<string>(() => {
        if (initialPlatform) {
            return initialPlatform;
        }

        const firstAvailable = platforms.find(
            (platform) => !platform.isRestricted,
        );
        return firstAvailable?.slug || "";
    });

    // Track if we've initialized from URL params
    const hasInitializedFromUrl = useRef(false);
    const categoryRef = useRef(initialCategory);

    useEffect(() => {
        if (!initialCategory || hasInitializedFromUrl.current) {
            return;
        }

        if (categoryRef.current !== initialCategory) {
            categoryRef.current = initialCategory;
            setSelectedCategory(initialCategory);
            setSelectedPlan(null);
            setSelectedTierIndex(0);
        }
    }, [initialCategory]);

    // Handle initial account size selection (only on mount)
    useEffect(() => {
        if (
            !hasInitializedFromUrl.current &&
            initialAccountSize &&
            initialProgram &&
            initialProgram.pricingTiers
        ) {
            const tierIndex = initialProgram.pricingTiers.findIndex(
                (tier) => tier.accountSize === initialAccountSize,
            );
            if (tierIndex !== -1) {
                setSelectedTierIndex(tierIndex);
            }
        }
    }, [initialAccountSize, initialProgram]);

    // Auto-select first plan when component mounts or category changes
    useEffect(() => {
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

        if (categoryPlans.length > 0) {
            // Only use initial program on first mount, not on every render
            if (
                !hasInitializedFromUrl.current &&
                initialProgram &&
                initialProgram.category === selectedCategory &&
                categoryPlans.some((plan) => plan.id === initialProgram.id)
            ) {
                // Mark as initialized to prevent re-applying URL params
                hasInitializedFromUrl.current = true;
                if (selectedPlan?.id !== initialProgram.id) {
                    setSelectedPlan(initialProgram);
                }
            } else if (
                !selectedPlan ||
                selectedPlan.category !== selectedCategory ||
                !categoryPlans.some((plan) => plan.id === selectedPlan.id)
            ) {
                // Default to hot plan, fallback to first plan
                const defaultPlan = getDefaultHotPlan() || categoryPlans[0];

                // Try to preserve account size when switching categories/plans
                let newTierIndex = 0;
                if (selectedPlan?.pricingTiers?.[selectedTierIndex]) {
                    const currentAccountSize =
                        selectedPlan.pricingTiers[selectedTierIndex]
                            .accountSize;
                    const matchingIndex = defaultPlan.pricingTiers?.findIndex(
                        (tier) => tier.accountSize === currentAccountSize,
                    );
                    if (matchingIndex !== undefined && matchingIndex !== -1) {
                        newTierIndex = matchingIndex;
                    }
                }

                setSelectedPlan(defaultPlan);
                setSelectedTierIndex(newTierIndex);
            }
        } else if (selectedPlan) {
            setSelectedPlan(null);
        }
    }, [
        programs,
        selectedCategory,
        selectedPlan,
        initialProgram,
        selectedTierIndex,
    ]);

    // Validate and adjust tier index when plan changes
    useEffect(() => {
        if (!selectedPlan?.pricingTiers) return;

        const tiers = selectedPlan.pricingTiers;

        // If current tier index is valid for this plan, keep it
        if (selectedTierIndex < tiers.length) {
            return;
        }

        // Tier index is out of bounds, need to find the best match
        // Try to find a tier with similar or closest account size
        const parseAccountSize = (size: string) => {
            const num = Number.parseInt(size.replace(/[$K,]/g, ""), 10);
            return size.includes("K") ? num * 1000 : num;
        };

        // Get the previously selected account size from another plan if possible
        let previousAccountSize: string | undefined;
        for (const plan of programs) {
            if (plan.pricingTiers?.[selectedTierIndex]) {
                previousAccountSize =
                    plan.pricingTiers[selectedTierIndex].accountSize;
                break;
            }
        }

        if (!previousAccountSize) {
            // Default to the last (largest) tier if we can't find previous size
            setSelectedTierIndex(tiers.length - 1);
            return;
        }

        const targetSize = parseAccountSize(previousAccountSize);

        // Find the tier with the closest account size
        let closestIndex = 0;
        let smallestDiff = Number.POSITIVE_INFINITY;

        tiers.forEach((tier, index) => {
            const currentSize = parseAccountSize(tier.accountSize);
            const diff = Math.abs(currentSize - targetSize);

            if (diff < smallestDiff) {
                smallestDiff = diff;
                closestIndex = index;
            }
        });

        setSelectedTierIndex(closestIndex);
    }, [selectedPlan, programs, selectedTierIndex]);

    // Ensure selected platform stays valid when platforms change
    useEffect(() => {
        if (!platforms || platforms.length === 0) return;

        const currentPlatform = platforms.find(
            (p) => p.slug === selectedPlatform,
        );

        if (!currentPlatform || currentPlatform.isRestricted) {
            const firstAvailable = platforms.find(
                (platform) => !platform.isRestricted,
            );
            setSelectedPlatform(firstAvailable?.slug || "");
        }
    }, [platforms, selectedPlatform]);

    // Get the selected tier for discount calculation
    const selectedTier = useMemo(() => {
        if (!selectedPlan?.pricingTiers) return null;
        return selectedPlan.pricingTiers[selectedTierIndex] || null;
    }, [selectedPlan, selectedTierIndex]);

    // Track if we need to force refresh pricing
    const [forceRefreshPricing, setForceRefreshPricing] = useState(false);

    // Create a stable key that changes when plan or tier changes to force refresh
    const _pricingKey = `${selectedPlan?.id || "none"}_${selectedTier?.accountSize || "none"}`;

    // Force refresh pricing when key changes
    useEffect(() => {
        setForceRefreshPricing(true);
        const timer = setTimeout(() => setForceRefreshPricing(false), 100);
        return () => clearTimeout(timer);
    }, []);

    // Fetch discounted pricing dynamically with force refresh on key change
    const discountedPricing = useDiscountedPricing({
        program: selectedPlan,
        accountSize: selectedTier?.accountSize || null,
        enabled: !!selectedPlan && !!selectedTier,
        forceRefresh: forceRefreshPricing,
    });

    return (
        <>
            {/* Category Tabs - Above the card */}
            <CategoryTabs
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
            />

            {/* Main Layout: Plan Features (Left) + Selection Card (Right) */}
            <div className="grid items-start sm:gap-12 lg:grid-cols-3">
                {/* Left Side: Plan Features - Outside the card */}
                <div>
                    <VariationsSelector
                        programs={programs}
                        selectedCategory={selectedCategory}
                        onCategoryChange={setSelectedCategory}
                        selectedPlan={selectedPlan}
                        onPlanChange={setSelectedPlan}
                        showFeaturesOnly={true}
                        selectedTierIndex={selectedTierIndex}
                        onTierChange={setSelectedTierIndex}
                        selectedPlatform={selectedPlatform}
                        onPlatformChange={setSelectedPlatform}
                        platforms={platforms}
                        userCountryCode={userCountryCode}
                        userCountryName={userCountryName}
                    />
                </div>

                {/* Right Side: Selection Interface Card */}
                <div className="lg:col-span-2">
                    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.04]">
                        <div className="p-4 sm:p-8">
                            <VariationsSelector
                                programs={programs}
                                selectedCategory={selectedCategory}
                                onCategoryChange={setSelectedCategory}
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
                    </div>
                </div>
            </div>

            {/* Static Checkout Section */}
            {selectedPlan && (
                <Card
                    wrapperClassName="ring ring-white/10 rounded-xl"
                    className="!bg-none relative overflow-hidden bg-gradient-to-r from-white/[0.03] to-white/[0.01] backdrop-blur-sm"
                >
                    <CardContent className="relative p-6">
                        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-white/50 text-xs">
                                        Selected Configuration
                                    </span>
                                    <span className="font-medium text-sm text-white/90">
                                        {selectedCategory === "1-step"
                                            ? "1 Step Evaluation"
                                            : selectedCategory === "2-step"
                                              ? "2 Step Evaluation"
                                              : "Instant Funding"}{" "}
                                        - {selectedPlan.name}
                                        {selectedPlan.pricingTiers?.[
                                            selectedTierIndex
                                        ] &&
                                            ` - ${selectedPlan.pricingTiers[selectedTierIndex].accountSize}`}
                                        {selectedPlatform &&
                                            ` - ${platforms.find((p) => p.slug === selectedPlatform)?.name}`}
                                    </span>
                                </div>
                            </div>
                            <div className="flex w-full flex-col items-start gap-4 sm:w-auto sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex w-full flex-col items-end text-right sm:w-auto">
                                    <span className="text-white/40 text-xs uppercase tracking-wider">
                                        One-time fee
                                    </span>
                                    {(() => {
                                        if (!selectedTier) {
                                            return (
                                                <span className="text-sm text-white/60">
                                                    N/A
                                                </span>
                                            );
                                        }

                                        // Show loading state
                                        if (discountedPricing?.isLoading) {
                                            return (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="animate-pulse bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text font-bold text-2xl text-transparent">
                                                        Loading...
                                                    </span>
                                                </div>
                                            );
                                        }

                                        // Use dynamic discounted pricing if available
                                        if (
                                            discountedPricing &&
                                            discountedPricing.discountAmount > 0
                                        ) {
                                            return (
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-sm text-white/80 line-through">
                                                        {formatCurrency(
                                                            discountedPricing.originalPrice,
                                                        )}
                                                    </span>
                                                    /
                                                    <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text font-bold text-2xl text-transparent">
                                                        {formatCurrency(
                                                            discountedPricing.discountedPrice,
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        // Check for cached discount
                                        const cachedDiscount =
                                            selectedPlan.discounts?.[
                                                selectedTier.accountSize
                                            ];

                                        if (cachedDiscount) {
                                            return (
                                                <div className="flex flex-col items-end gap-0.5">
                                                    <span className="text-white/40 text-xs line-through">
                                                        {formatCurrency(
                                                            cachedDiscount.originalPrice ??
                                                                selectedTier.price,
                                                        )}
                                                    </span>
                                                    <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text font-bold text-2xl text-transparent">
                                                        {formatCurrency(
                                                            cachedDiscount.discountedPrice,
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <span className="bg-gradient-to-r from-lime-400 to-green-400 bg-clip-text font-bold text-2xl text-transparent">
                                                {formatCurrency(
                                                    selectedTier.price,
                                                )}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="hidden h-4 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent sm:block" />
                                <a
                                    href={
                                        selectedPlan?.pricingTiers?.[
                                            selectedTierIndex
                                        ] && selectedPlatform
                                            ? (() => {
                                                  const url =
                                                      new URLSearchParams();
                                                  url.set(
                                                      "category",
                                                      selectedCategory,
                                                  );
                                                  url.set(
                                                      "planId",
                                                      String(selectedPlan.id),
                                                  );
                                                  url.set(
                                                      "tier",
                                                      String(selectedTierIndex),
                                                  );
                                                  url.set(
                                                      "platform",
                                                      selectedPlatform,
                                                  );

                                                  // Preserve in-app params if they exist
                                                  if (inAppParams) {
                                                      if (inAppParams.inapp)
                                                          url.set(
                                                              "inapp",
                                                              inAppParams.inapp,
                                                          );
                                                      if (inAppParams.embed)
                                                          url.set(
                                                              "embed",
                                                              inAppParams.embed,
                                                          );
                                                      if (inAppParams.email)
                                                          url.set(
                                                              "email",
                                                              inAppParams.email,
                                                          );
                                                      if (inAppParams.firstName)
                                                          url.set(
                                                              "firstName",
                                                              inAppParams.firstName,
                                                          );
                                                      if (inAppParams.lastName)
                                                          url.set(
                                                              "lastName",
                                                              inAppParams.lastName,
                                                          );
                                                      if (inAppParams.client_id)
                                                          url.set(
                                                              "client_id",
                                                              inAppParams.client_id,
                                                          );
                                                      if (inAppParams.country)
                                                          url.set(
                                                              "country",
                                                              inAppParams.country,
                                                          );
                                                      if (inAppParams.address)
                                                          url.set(
                                                              "address",
                                                              inAppParams.address,
                                                          );
                                                      if (inAppParams.city)
                                                          url.set(
                                                              "city",
                                                              inAppParams.city,
                                                          );
                                                      if (inAppParams.phone)
                                                          url.set(
                                                              "phone",
                                                              inAppParams.phone,
                                                          );
                                                      if (inAppParams.state)
                                                          url.set(
                                                              "state",
                                                              inAppParams.state,
                                                          );
                                                      if (
                                                          inAppParams.postalCode
                                                      )
                                                          url.set(
                                                              "postalCode",
                                                              inAppParams.postalCode,
                                                          );
                                                      if (inAppParams.ip)
                                                          url.set(
                                                              "ip",
                                                              inAppParams.ip,
                                                          );
                                                  }

                                                  return `/checkout?${url.toString()}`;
                                              })()
                                            : undefined
                                    }
                                    aria-disabled={
                                        !selectedPlan.pricingTiers?.[
                                            selectedTierIndex
                                        ] || !selectedPlatform
                                    }
                                    className={cn(
                                        "rounded-full px-6 py-3 font-semibold transition-all duration-300 sm:rounded-lg",
                                        "inline-block w-full min-w-[160px] text-center sm:w-auto",
                                        !selectedPlan.pricingTiers?.[
                                            selectedTierIndex
                                        ] || !selectedPlatform
                                            ? "pointer-events-none cursor-not-allowed bg-white/10 text-white/40"
                                            : "bg-gradient-to-r from-lime-500 to-emerald-500 text-white hover:from-lime-600 hover:to-emerald-600 hover:shadow-lg",
                                    )}
                                >
                                    Proceed to Checkout
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
};
