"use client";

import { CheckIcon, ShoppingCartIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramWithDiscounts } from "@/data/programs";
import { cn } from "@/lib/utils";
import type { Program } from "@/payload-types";

const formatCurrency = (amount: number) => {
    const hasCents = !Number.isInteger(amount);
    return `$${amount.toLocaleString(undefined, {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: hasCents ? 2 : 0,
    })}`;
};

// Enhanced Program type with features
interface ProgramWithFeatures extends Program {
    isNewProgram?: boolean | null;
    features?: Array<{
        key: string;
        label: string;
        value: string;
        badge?: string;
        emphasized?: boolean;
    }>;
    discounts?: ProgramWithDiscounts["discounts"];
}

interface ProgramCardProps {
    program: ProgramWithFeatures;
}

export const ProgramCard = ({ program }: ProgramCardProps) => {
    const [selectedTierIndex, setSelectedTierIndex] = useState(0);
    const selectedTier = program.pricingTiers?.[selectedTierIndex];
    if (!selectedTier || !program.pricingTiers) return null;

    return (
        <Card className="h-full border-white/20 bg-white/[0.02] transition-all duration-300 hover:border-blue-500/50 hover:bg-white/[0.04]">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-white text-xl">
                            {program.name}
                        </CardTitle>
                        {program.isNewProgram && (
                            <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 font-medium text-white text-xs">
                                NEW
                            </span>
                        )}
                        {program.isPopular && (
                            <span className="inline-flex items-center rounded-full bg-lime-500 px-2 py-0.5 font-medium text-black text-xs">
                                POPULAR
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-sm text-white/60">{program.description}</p>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Account Size Selector */}
                <div>
                    <h4 className="mb-3 font-semibold text-white">
                        Account Size
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {program.pricingTiers.map((tier, index) => (
                            <button
                                key={tier.accountSize}
                                type="button"
                                onClick={() => setSelectedTierIndex(index)}
                                className={cn(
                                    "rounded-lg border p-3 text-center transition-all duration-200",
                                    "hover:border-blue-500/50 hover:bg-blue-500/10",
                                    selectedTierIndex === index
                                        ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
                                        : "border-white/20",
                                )}
                            >
                                <div className="font-bold text-white">
                                    {tier.accountSize}
                                </div>
                                <div className="text-sm">
                                    {program.discounts?.[tier.accountSize] ? (
                                        <>
                                            <div className="text-white/40 text-xs line-through">
                                                {formatCurrency(
                                                    program.discounts[
                                                        tier.accountSize
                                                    ].originalPrice ??
                                                        tier.price,
                                                )}
                                            </div>
                                            <div className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-transparent">
                                                {formatCurrency(
                                                    program.discounts[
                                                        tier.accountSize
                                                    ].discountedPrice,
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-transparent">
                                            {formatCurrency(tier.price)}
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Key Features */}
                <div>
                    <h4 className="mb-3 font-semibold text-white">
                        Key Features
                    </h4>
                    <div className="space-y-2">
                        {program.features?.slice(0, 5).map((feature) => {
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
                                        <CheckIcon className="h-4 w-4 text-blue-400" />
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
                        })}
                    </div>
                </div>

                {/* Add to Cart Button */}
                <Button
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                    variant="outline"
                >
                    <ShoppingCartIcon className="mr-2 h-4 w-4" />
                    Add to Cart
                </Button>
            </CardContent>
        </Card>
    );
};
