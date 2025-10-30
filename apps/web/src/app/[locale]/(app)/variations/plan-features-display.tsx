"use client";

import { Check } from "lucide-react";
import type { ProgramWithDiscounts } from "@/data/programs";
import { cn } from "@/lib/utils";

interface PlanFeaturesDisplayProps {
    selectedPlan: ProgramWithDiscounts;
    selectedTier: {
        accountSize: string;
        price: number;
        resetFeeFunded?: number | null;
    } | null;
    discountedPricing?: {
        discountAmount: number;
        originalPrice: number;
        discountedPrice: number;
    } | null;
}

const formatCurrency = (amount: number) => {
    const hasCents = !Number.isInteger(amount);
    return `$${amount.toLocaleString(undefined, {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: hasCents ? 2 : 0,
    })}`;
};

export const PlanFeaturesDisplay = ({
    selectedPlan,
    selectedTier,
    discountedPricing,
}: PlanFeaturesDisplayProps) => {
    return (
        <div>
            <div className="mb-4 font-semibold text-blue-400 text-sm uppercase tracking-wider">
                Plan Features
            </div>
            <div className="space-y-3">
                {/* Render features from Payload */}
                {selectedPlan.features?.map((feature) => (
                    <div
                        key={feature.key}
                        className="flex items-center justify-between text-sm"
                    >
                        <span className="text-white/60">{feature.label}</span>
                        {feature.value === "true" ? (
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
                ))}

                {/* Consistency Score Section */}
                {selectedPlan.consistencySection &&
                    Array.isArray(selectedPlan.consistencySection) &&
                    selectedPlan.consistencySection.length > 0 && (
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
                                        <span className="font-medium text-white/90">
                                            {item.value}
                                        </span>
                                    </div>
                                ),
                            )}

                            <div className="-mx-1 mt-6 h-px bg-white/10" />

                            {/* New flags between Consistency Score and Fee */}
                            {selectedPlan.hasResetFee && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white/60">
                                        Reset Fee
                                    </span>
                                    {discountedPricing &&
                                    discountedPricing.discountAmount > 0 ? (
                                        <span className="font-medium text-white/90">
                                            {formatCurrency(
                                                discountedPricing.discountedPrice,
                                            )}
                                        </span>
                                    ) : selectedTier &&
                                      selectedPlan.discounts?.[
                                          selectedTier.accountSize
                                      ] ? (
                                        <span className="font-medium text-white/90">
                                            {formatCurrency(
                                                selectedPlan.discounts[
                                                    selectedTier.accountSize
                                                ].discountedPrice,
                                            )}
                                        </span>
                                    ) : null}
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
                        </>
                    )}

                {/* Fee - Dynamic based on selected tier and discounts (moved below Consistency Score) */}
                {selectedTier && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">Fee</span>
                        {discountedPricing &&
                        discountedPricing.discountAmount > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/40 line-through">
                                    {formatCurrency(
                                        discountedPricing.originalPrice,
                                    )}
                                </span>
                                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-medium text-transparent">
                                    {formatCurrency(
                                        discountedPricing.discountedPrice,
                                    )}
                                </span>
                            </div>
                        ) : selectedPlan.discounts?.[
                              selectedTier.accountSize
                          ] ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/40 line-through">
                                    {formatCurrency(
                                        selectedPlan.discounts[
                                            selectedTier.accountSize
                                        ].originalPrice ?? selectedTier.price,
                                    )}
                                </span>
                                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-medium text-transparent">
                                    {formatCurrency(
                                        selectedPlan.discounts[
                                            selectedTier.accountSize
                                        ].discountedPrice,
                                    )}
                                </span>
                            </div>
                        ) : (
                            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-medium text-transparent">
                                {formatCurrency(selectedTier.price)}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
