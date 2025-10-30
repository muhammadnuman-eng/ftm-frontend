"use client";

import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import type { ProgramWithDiscounts } from "@/data/programs";
import { cn } from "@/lib/utils";
import CircularText from "../components/CircularText";
import { DollarAnimation } from "./animations/dollar";
import { LogoIcon } from "./logo";
import { SectionHeader } from "./section-header";
import { BorderBeam } from "./ui/border-beam";

// Use the ProgramWithDiscounts type from programs.ts
type ProgramWithFeatures = ProgramWithDiscounts;

interface CategoryContent {
    id: string;
    category: "1-step" | "2-step" | "instant";
    title: string;
    description: string;
    benefits: string[];
}

interface PricingState {
    category: "1-step" | "2-step" | "instant";
    selectedPlan: ProgramWithFeatures | null;
    selectedTierIndex: number;
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
});

const formatCurrency = (amount: number) => {
    const hasCents = !Number.isInteger(amount);
    if (hasCents) {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
    // Remove the currency symbol spacing differences across locales by slicing to ensure $ prefix
    return currencyFormatter.format(amount);
};

const categoryConfigs = {
    "1-step": {
        label: "1 Step Evaluation",
        mobileLabel: "1 Step",
        defaultPlan: "nitro",
    },
    "2-step": {
        label: "2 Step Evaluation",
        mobileLabel: "2 Step",
        defaultPlan: "2-step-plus",
    },
    instant: {
        label: "Instant Funding",
        mobileLabel: "Instant",
        defaultPlan: "instant-plus",
    },
} as const;

// Compact plan card for carousel
interface CarouselPlanCardProps {
    plan: ProgramWithFeatures;
}

const CarouselPlanCard = memo(({ plan }: CarouselPlanCardProps) => {
    const [selectedTierIndex, setSelectedTierIndex] = useState(0);
    const selectedTier = plan.pricingTiers?.[selectedTierIndex];
    const selectedDiscount =
        selectedTier && plan.discounts
            ? plan.discounts[selectedTier.accountSize]
            : undefined;

    if (!selectedTier || !plan.pricingTiers) return null;

    return (
        <Card
            className="h-full border-white/20 bg-white/[0.02] p-6"
            grit={false}
            wrapperClassName="bg-card/30 h-full"
        >
            <CardHeader className="px-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-lg text-white">
                            {plan.name}
                        </CardTitle>
                        {plan.isNewProgram && (
                            <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 font-medium text-white text-xs">
                                NEW
                            </span>
                        )}
                        {plan.isPopular && plan.slug === "standard" && (
                            <span className="inline-flex items-center rounded-full bg-lime-500 px-2 py-0.5 font-medium text-black text-xs">
                                HOT
                            </span>
                        )}
                    </div>
                    <div className="rounded-lg bg-white/5 px-2 py-1 text-white/60 text-xs">
                        {plan.category === "1-step"
                            ? "1 Step"
                            : plan.category === "2-step"
                              ? "2 Step"
                              : "Instant"}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col space-y-4 p-0">
                {/* Selected Account Size & Price */}
                <div className="text-center">
                    <div className="mb-1 text-sm text-white/60">
                        Account Size
                    </div>
                    <div className="mb-1 font-bold text-2xl text-white">
                        {selectedTier.accountSize}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        {selectedDiscount ? (
                            <>
                                <span className="text-sm text-white/40 line-through">
                                    {formatCurrency(
                                        selectedDiscount.originalPrice ??
                                            selectedTier.price,
                                    )}
                                </span>
                                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-transparent text-xl">
                                    {formatCurrency(
                                        selectedDiscount.discountedPrice,
                                    )}
                                </span>
                            </>
                        ) : (
                            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-transparent text-xl">
                                {formatCurrency(selectedTier.price)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Account Size Selector */}
                <div className="flex flex-wrap justify-center gap-1">
                    {plan.pricingTiers.map((tier, index) => (
                        <button
                            key={tier.accountSize}
                            type="button"
                            onClick={() => setSelectedTierIndex(index)}
                            className={cn(
                                "rounded-md px-2 py-1 font-medium text-xs transition-all",
                                selectedTierIndex === index
                                    ? "bg-indigo-600 text-white"
                                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80",
                            )}
                        >
                            {tier.accountSize}
                        </button>
                    ))}
                </div>

                {/* Key Features */}
                <div className="space-y-2">
                    {plan.features?.slice(0, 4).map((feature) => {
                        if (feature.value === "false") return null;
                        return (
                            <div
                                key={feature.key}
                                className="flex items-center justify-between text-sm"
                            >
                                <span className="text-white/60">
                                    {feature.label}
                                </span>
                                {feature.value === "true" ? (
                                    <Check className="h-3 w-3 text-blue-400" />
                                ) : (
                                    <span
                                        className={cn(
                                            "font-medium text-xs",
                                            feature.emphasized
                                                ? "bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"
                                                : "text-white/90",
                                        )}
                                    >
                                        {feature.value}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* CTA Button */}
                <Button
                    variant="outline"
                    className="mt-auto w-full border-white/20 text-white hover:bg-white/10"
                    asChild
                >
                    <Link
                        href={`/variations?category=${plan.category}&program=${plan.slug}&accountSize=${selectedTier.accountSize}`}
                    >
                        Get Started
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
});
CarouselPlanCard.displayName = "CarouselPlanCard";

interface PricingSectionProps {
    programs: ProgramWithFeatures[];
    categoryContent: CategoryContent[];
}

export const PricingSection = ({
    programs: initialPrograms,
    categoryContent,
}: PricingSectionProps) => {
    const [state, setState] = useState<PricingState>({
        category: "1-step",
        selectedPlan: null,
        selectedTierIndex: 0,
    });

    // Use the programs with pre-calculated discounts from server-side
    const programs = initialPrograms;

    const { categoryPlans, selectedPlan } = useMemo(() => {
        const categoryPlans = programs.filter(
            (plan) => plan.category === state.category,
        );
        const selectedPlan =
            state.selectedPlan ||
            categoryPlans.find(
                (plan) =>
                    plan.slug === categoryConfigs[state.category].defaultPlan,
            ) ||
            categoryPlans[0];

        return { categoryPlans, selectedPlan };
    }, [state, programs]);

    const currentCategoryContent = useMemo(() => {
        // Use program-specific description and benefits
        const categoryContentItem = categoryContent.find(
            (content) => content.category === state.category,
        );

        if (selectedPlan && categoryContentItem) {
            return {
                ...categoryContentItem,
                title: selectedPlan.subtitle || categoryContentItem.title,
                description:
                    selectedPlan.description || categoryContentItem.description,
                benefits:
                    selectedPlan.benefits?.map((b) => b.benefit) ||
                    categoryContentItem.benefits,
            };
        }

        return categoryContentItem;
    }, [selectedPlan, categoryContent, state.category]);

    const selectedTier =
        selectedPlan?.pricingTiers?.[state.selectedTierIndex] ??
        selectedPlan?.pricingTiers?.[0];

    const selectedTierDiscount =
        selectedTier && selectedPlan?.discounts
            ? selectedPlan.discounts[selectedTier.accountSize]
            : undefined;

    const handleCategoryChange = useCallback(
        (category: PricingState["category"]) => {
            setState({
                category,
                selectedPlan: null,
                selectedTierIndex: 0,
            });
        },
        [],
    );

    const handlePlanSelect = useCallback((plan: ProgramWithFeatures) => {
        setState((prev) => ({
            ...prev,
            selectedPlan: plan,
            selectedTierIndex: 0,
        }));
    }, []);

    const handleTierSelect = useCallback((tierIndex: number) => {
        setState((prev) => ({
            ...prev,
            selectedTierIndex: tierIndex,
        }));
    }, []);

    return (
        <section className="relative mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
            <SectionHeader
                dividerTitle="Pricing"
                title="Choose Your Trading Challenge"
                titleHighlight="Trading Challenge"
                description="Transparent pricing for every trader's journey"
                videoName="dollar-motion"
                animation={<DollarAnimation />}
            />

            {/* Category Tabs */}
            <div className="mb-8">
                <div className="space-y-4 sm:space-y-6">
                    {/* Main Category Tabs */}
                    <div className="flex justify-center">
                        <div className="flex w-full rounded-md border border-white/10 bg-white/5 p-1 sm:max-w-none sm:flex-row sm:rounded-full">
                            {Object.entries(categoryConfigs).map(
                                ([category, config]) => (
                                    <button
                                        key={category}
                                        type="button"
                                        onClick={() =>
                                            handleCategoryChange(
                                                category as PricingState["category"],
                                            )
                                        }
                                        className={cn(
                                            "relative flex-1 rounded px-3 py-3 font-semibold text-sm transition-all duration-300 sm:rounded-full sm:px-9 sm:py-4 sm:text-base",
                                            "whitespace-nowrap hover:text-white focus:outline-none",
                                            state.category === category
                                                ? "bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                                                : "text-white/80 hover:bg-white/5 hover:text-white/80",
                                        )}
                                    >
                                        <span className="relative z-10 sm:hidden">
                                            {config.mobileLabel}
                                        </span>
                                        <span className="relative z-10 hidden sm:block">
                                            {config.label}
                                        </span>
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Plan Sub-tabs */}
                    <div className="overflow-x-auto">
                        <div className="flex min-w-max justify-center">
                            <div className="flex gap-2 rounded-full border border-white/10 bg-white/5 p-1">
                                {categoryPlans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => handlePlanSelect(plan)}
                                        className={cn(
                                            "relative flex items-center rounded-full px-4 py-2.5 font-semibold text-sm transition-all duration-300 sm:px-9 sm:py-3 sm:text-base",
                                            "flex-shrink-0 whitespace-nowrap hover:text-white focus:outline-none",
                                            selectedPlan?.id === plan.id
                                                ? "bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                                                : "text-white/60 hover:bg-white/5 hover:text-white/80",
                                        )}
                                    >
                                        <span className="hidden items-center gap-2 sm:flex sm:gap-4">
                                            {plan.name}
                                            {plan.isNewProgram && (
                                                <span className="-mr-1 sm:-mr-2 inline-flex items-center whitespace-nowrap rounded-full bg-red-500 px-1.5 py-0.5 font-medium text-white text-xs sm:px-2">
                                                    NEW
                                                </span>
                                            )}
                                            {plan.isPopular &&
                                                plan.slug === "standard" && (
                                                    <span className="-mr-1 sm:-mr-2 inline-flex items-center whitespace-nowrap rounded-full bg-lime-500 px-1.5 py-0.5 font-medium text-black text-xs sm:px-2">
                                                        HOT
                                                    </span>
                                                )}
                                        </span>
                                        <span className="flex items-center gap-2 sm:hidden sm:gap-4">
                                            {plan.mobileName}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Layout: Description (Left) + Plan Card (Right) */}
            {selectedPlan && (
                <div className="grid items-start gap-12 lg:grid-cols-3">
                    {/* Left Side: Title & Description */}
                    <div>
                        <h2 className="mb-4 hidden font-bold text-3xl text-white md:block">
                            {currentCategoryContent?.title}
                        </h2>
                        <div className="space-y-4 text-white/70">
                            <p className="hidden text-lg md:block">
                                {currentCategoryContent?.description}
                            </p>
                            <div className="hidden space-y-2 md:block">
                                <h3 className="font-semibold text-lg text-white/90">
                                    Key Benefits:
                                </h3>
                                <ul className="space-y-1 text-sm">
                                    {currentCategoryContent?.benefits.map(
                                        (benefit) => (
                                            <li
                                                key={benefit}
                                                className="flex items-center gap-2"
                                            >
                                                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                                {benefit}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>
                            <div className="relative flex items-center gap-6 rounded-full border border-white/20 p-2 sm:mt-8">
                                <BorderBeam
                                    size={120}
                                    duration={10}
                                    className="from-transparent via-blue-400 to-transparent"
                                />
                                <BorderBeam
                                    size={120}
                                    delay={15}
                                    duration={10}
                                    className="from-transparent via-lime-400 to-transparent"
                                />
                                <div className="relative">
                                    <CircularText
                                        text="TRADER'S*TOP*CHOICE*"
                                        onHover="slowDown"
                                        className="text-white"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <LogoIcon className="size-8" />
                                    </div>
                                </div>
                                <div className="flex flex-1 flex-col gap-1">
                                    <span className="font-bold text-[11px] text-white/70 uppercase tracking-wider">
                                        Trader's Top Choice
                                    </span>
                                    <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-2xl text-transparent sm:text-3xl">
                                        {state.category === "1-step"
                                            ? "1-Step Nitro"
                                            : state.category === "2-step"
                                              ? "2-Step Plus"
                                              : "Instant Plus"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Plan Card */}
                    <div className="lg:col-span-2">
                        <div
                            className={cn(
                                "relative overflow-hidden rounded-2xl border border-white/20 bg-white/[0.04]",
                            )}
                        >
                            {/* Split Layout: Account Sizes (Left) | Features (Right) */}
                            <div className="grid p-6 sm:gap-6 md:grid-cols-2">
                                {/* Left Side: Account Sizes */}
                                <div>
                                    <div className="hidden space-y-3 sm:block">
                                        {selectedPlan.pricingTiers?.map(
                                            (tier, index) => (
                                                <button
                                                    key={tier.accountSize}
                                                    type="button"
                                                    onClick={() =>
                                                        handleTierSelect(index)
                                                    }
                                                    className={cn(
                                                        "w-full rounded-lg border px-3 py-1 text-left transition-all duration-300 sm:py-3",
                                                        "hover:border-indigo-500/50 hover:bg-indigo-500/10",
                                                        state.selectedTierIndex ===
                                                            index
                                                            ? "border-blue-500 bg-indigo-500/10 ring-1 ring-blue-500/30"
                                                            : "border-white/20",
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Selection Circle */}
                                                        <div className="flex-shrink-0">
                                                            {state.selectedTierIndex ===
                                                            index ? (
                                                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                                                                    <Check className="h-4 w-4 font-bold text-white" />
                                                                </div>
                                                            ) : (
                                                                <div className="h-5 w-5 rounded-full border-2 border-white/50" />
                                                            )}
                                                        </div>

                                                        {/* Account Size and Price */}
                                                        <div className="flex flex-1 items-center justify-between">
                                                            <div className="font-bold text-base text-white">
                                                                {
                                                                    tier.accountSize
                                                                }
                                                            </div>
                                                            <div className="text-right">
                                                                {selectedPlan
                                                                    .discounts?.[
                                                                    tier
                                                                        .accountSize
                                                                ] ? (
                                                                    <>
                                                                        <div className="text-white/40 text-xs line-through">
                                                                            {formatCurrency(
                                                                                selectedPlan
                                                                                    .discounts[
                                                                                    tier
                                                                                        .accountSize
                                                                                ]
                                                                                    .originalPrice ??
                                                                                    tier.price,
                                                                            )}
                                                                        </div>
                                                                        <div className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-lg text-transparent">
                                                                            {formatCurrency(
                                                                                selectedPlan
                                                                                    .discounts[
                                                                                    tier
                                                                                        .accountSize
                                                                                ]
                                                                                    .discountedPrice,
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-lg text-transparent">
                                                                        {formatCurrency(
                                                                            tier.price,
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {/* Right Side: Features */}
                                <div>
                                    <div className="mb-4 font-semibold text-blue-400 text-sm uppercase tracking-wider">
                                        Plan Features
                                    </div>
                                    <div className="space-y-3">
                                        {/* Note: Fee moved below Consistency Score */}
                                        {/* Render features from Payload */}
                                        {selectedPlan.features?.map(
                                            (feature) => {
                                                if (feature.value === "false")
                                                    return null;
                                                return (
                                                    <div
                                                        key={feature.key}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-white/60">
                                                            {feature.label}
                                                        </span>
                                                        {feature.value ===
                                                        "true" ? (
                                                            <Check className="h-4 w-4 text-blue-400" />
                                                        ) : (
                                                            <span
                                                                className={cn(
                                                                    "font-medium",
                                                                    feature.emphasized
                                                                        ? "bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"
                                                                        : "text-white/90",
                                                                )}
                                                            >
                                                                {feature.value}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            },
                                        )}

                                        {/* Consistency Score Section */}
                                        {selectedPlan.consistencySection &&
                                            Array.isArray(
                                                selectedPlan.consistencySection,
                                            ) &&
                                            selectedPlan.consistencySection
                                                .length > 0 && (
                                                <>
                                                    <div className="mt-6 mb-3 font-semibold text-blue-400 text-sm uppercase tracking-wider">
                                                        CONSISTENCY SCORE
                                                    </div>
                                                    {selectedPlan.consistencySection.map(
                                                        (item, index) => (
                                                            <div
                                                                key={`${item.label}-${index}`}
                                                                className="flex items-center justify-between text-sm"
                                                            >
                                                                <span className="text-white/60">
                                                                    {item.label}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    {item.badge ? (
                                                                        <span className="rounded-full bg-rose-500 px-2 py-0.5 font-bold text-white text-xs">
                                                                            {
                                                                                item.badge
                                                                            }
                                                                        </span>
                                                                    ) : null}
                                                                    <span className="font-medium text-white/90">
                                                                        {
                                                                            item.value
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </>
                                            )}

                                        {/* New flags between Consistency Score and Fee */}
                                        {selectedPlan.hasResetFee &&
                                            selectedTier?.resetFee && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-white/60">
                                                        Reset Fee
                                                    </span>
                                                    <span className="font-medium text-white/90">
                                                        {formatCurrency(
                                                            selectedTier.resetFee,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        {selectedTier?.resetFeeFunded &&
                                            typeof selectedTier.resetFeeFunded ===
                                                "number" && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-white/60">
                                                        Funded Reset Fee
                                                    </span>
                                                    <span className="font-medium text-white/90">
                                                        {formatCurrency(
                                                            selectedTier.resetFeeFunded,
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        {selectedPlan.hasActivationFeeValue &&
                                            typeof selectedPlan.activationFeeValue ===
                                                "number" && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-white/60">
                                                        Activation Fee
                                                    </span>
                                                    <span className="font-medium text-white/90">
                                                        {formatCurrency(
                                                            selectedPlan.activationFeeValue,
                                                        )}
                                                    </span>
                                                </div>
                                            )}

                                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 border-white/20 border-t pt-4 sm:hidden">
                                            {selectedPlan.pricingTiers?.map(
                                                (tier, index) => (
                                                    <button
                                                        key={tier.accountSize}
                                                        type="button"
                                                        onClick={() =>
                                                            handleTierSelect(
                                                                index,
                                                            )
                                                        }
                                                        className={cn(
                                                            "rounded-lg border px-3 py-1 text-left transition-all duration-300 sm:py-3",
                                                            "hover:border-indigo-500/50 hover:bg-indigo-500/10",
                                                            state.selectedTierIndex ===
                                                                index
                                                                ? "border-blue-500 bg-indigo-500/10 ring-1 ring-blue-500/30"
                                                                : "border-white/20",
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {/* Account Size and Price */}
                                                            <div className="flex flex-1 items-center justify-between">
                                                                <div className="font-medium text-sm text-white">
                                                                    {
                                                                        tier.accountSize
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ),
                                            )}
                                        </div>

                                        {/* Dynamic fee display based on selected tier (moved here) */}
                                        {selectedTier && (
                                            <div className="mt-4 border-white/20 border-t pt-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-white">
                                                        Fee
                                                    </span>
                                                    {selectedTierDiscount &&
                                                    typeof selectedTierDiscount.originalPrice ===
                                                        "number" ? (
                                                        <div className="flex items-baseline gap-1 text-right">
                                                            <div className="text-base text-white/40 line-through">
                                                                {formatCurrency(
                                                                    selectedTierDiscount.originalPrice,
                                                                )}
                                                            </div>
                                                            <div className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text font-semibold text-3xl text-transparent">
                                                                {formatCurrency(
                                                                    selectedTierDiscount.discountedPrice,
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text font-medium text-3xl text-transparent">
                                                            {formatCurrency(
                                                                selectedTier.price,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <div className="p-6">
                                {selectedPlan && (
                                    <Button
                                        className={cn(
                                            "group relative w-full overflow-hidden rounded-full px-8 py-8 font-bold transition-all duration-300 lg:text-lg",
                                            "bg-gradient-to-br from-lime-500 to-emerald-500 text-white hover:from-lime-600 hover:to-emerald-600",
                                        )}
                                        asChild
                                    >
                                        <Link
                                            href={`/variations?category=${state.category}&program=${selectedPlan.slug}&accountSize=${selectedTier?.accountSize}`}
                                        >
                                            <span className="relative z-10 hidden items-center justify-center gap-3 sm:flex">
                                                <span>
                                                    Get Started with{" "}
                                                    {selectedPlan.name}
                                                </span>
                                                <ArrowUpRight className="size-5 text-white lg:size-6" />
                                            </span>
                                            <span className="relative z-10 flex w-full items-center justify-between gap-3 sm:hidden">
                                                <span className="flex flex-col gap-0.5">
                                                    <span className="font-medium text-xs uppercase leading-none">
                                                        {selectedPlan.name}
                                                    </span>
                                                    <span className="font-bold text-xl leading-none">
                                                        Get Started
                                                    </span>
                                                </span>
                                                <ArrowUpRight className="size-5 text-white lg:size-6" />
                                            </span>
                                        </Link>
                                    </Button>
                                )}
                                {selectedPlan.faqLink ? (
                                    <p className="mt-4 text-sm text-white/60">
                                        Please refer to{" "}
                                        <Link
                                            href={selectedPlan.faqLink}
                                            className="text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                            FAQs
                                        </Link>{" "}
                                        for detailed information.
                                    </p>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Plans Carousel */}
            <div className="-mx-4 hidden md:block">
                <div className="mb-8 text-center">
                    <h5 className="text-center font-bold text-white/60 text-xs uppercase tracking-widest">
                        All Available Plans
                    </h5>
                </div>
                <Carousel
                    opts={{
                        align: "start",
                        loop: false,
                    }}
                    className="w-full px-12"
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {programs.map((plan) => (
                            <CarouselItem
                                key={plan.id}
                                className="basis-full py-1 pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3"
                            >
                                <CarouselPlanCard plan={plan} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 border-stone-800 bg-stone-900 text-white hover:bg-stone-800" />
                    <CarouselNext className="right-0 border-stone-800 bg-stone-900 text-white hover:bg-stone-800" />
                </Carousel>
            </div>
        </section>
    );
};
