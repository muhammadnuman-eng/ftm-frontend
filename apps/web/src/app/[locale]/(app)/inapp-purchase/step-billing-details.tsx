"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { COUNTRIES } from "@/lib/utils";
import type { BillingData, SelectedPlanData } from "./inapp-purchase-flow";

interface StepBillingDetailsProps {
    selectedPlan: SelectedPlanData;
    initialData: BillingData;
    onNext: (data: BillingData) => void;
    onBack: () => void;
}

export function StepBillingDetails({
    initialData,
    onNext,
    onBack,
}: StepBillingDetailsProps) {
    const [formData] = useState<BillingData>(initialData);

    const isFormValid =
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.phone &&
        formData.address &&
        formData.city &&
        formData.state &&
        formData.postalCode &&
        formData.country;

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-end">
                    <Button type="button" variant="ghost" size="sm" asChild>
                        <a
                            href="https://dash.fundedtradermarkets.com/settings"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2 text-blue-400 hover:text-blue-300"
                        >
                            Change Billing Details
                        </a>
                    </Button>
                </div>

                <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
                    {/* Name */}
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                            {formData.firstName} {formData.lastName}
                        </span>
                    </div>

                    {/* Email */}
                    <div className="text-sm text-white/70">
                        {formData.email}
                    </div>

                    {/* Phone */}
                    <div className="text-sm text-white/70">
                        {formData.phone}
                    </div>

                    {/* Address */}
                    <div className="border-white/10 border-t pt-4 text-sm text-white/70">
                        <div>{formData.address}</div>
                        <div>
                            {formData.city}, {formData.state}{" "}
                            {formData.postalCode}
                        </div>
                        <div className="mt-1">
                            {
                                COUNTRIES.find(
                                    (c) =>
                                        c.code.toLowerCase() ===
                                        formData.country.toLowerCase(),
                                )?.name
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    onClick={onBack}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                >
                    Back
                </Button>
                <Button
                    onClick={() => onNext(formData)}
                    disabled={!isFormValid}
                    className="bg-white text-black text-lg hover:bg-white/90 disabled:opacity-50"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
