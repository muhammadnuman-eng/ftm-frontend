"use client";

import { useState } from "react";
import {
    Stepper,
    StepperContent,
    StepperIndicator,
    StepperItem,
    StepperNav,
    StepperPanel,
    StepperTitle,
    StepperTrigger,
} from "@/components/ui/stepper";
import type { ProgramWithDiscounts } from "@/data/programs";
import type { Platform } from "@/payload-types";
import { StepBillingDetails } from "./step-billing-details";
import { StepOrderReview } from "./step-order-review";
import { StepSelectAccount } from "./step-select-account";

interface PrefilledData {
    email: string;
    firstName: string;
    lastName: string;
    clientId: string;
    country: string;
    address: string;
    city: string;
    phone: string;
    state: string;
    postalCode: string;
    ip: string;
}

interface InAppPurchaseFlowProps {
    programs: ProgramWithDiscounts[];
    platforms: (Platform & { isRestricted?: boolean })[];
    prefilledData: PrefilledData;
    userCountryCode?: string;
    userCountryName?: string;
}

export interface SelectedPlanData {
    category: "1-step" | "2-step" | "instant";
    plan: ProgramWithDiscounts;
    tierIndex: number;
    platform: string;
}

export interface BillingData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

const steps = [
    { title: "Select Account" },
    { title: "Billing Details" },
    { title: "Order Review" },
];

export function InAppPurchaseFlow({
    programs,
    platforms,
    prefilledData,
    userCountryCode,
    userCountryName,
}: InAppPurchaseFlowProps) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState<SelectedPlanData | null>(
        null,
    );
    const [billingData, setBillingData] = useState<BillingData>({
        firstName: prefilledData.firstName,
        lastName: prefilledData.lastName,
        email: prefilledData.email,
        phone: prefilledData.phone,
        address: prefilledData.address,
        city: prefilledData.city,
        state: prefilledData.state,
        postalCode: prefilledData.postalCode,
        country: prefilledData.country,
    });

    const handleSelectAccount = (data: SelectedPlanData) => {
        setSelectedPlan(data);
        setCurrentStep(2);
    };

    const handleBillingSubmit = (data: BillingData) => {
        setBillingData(data);
        setCurrentStep(3);
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <Stepper
            value={currentStep}
            onValueChange={setCurrentStep}
            className="space-y-8"
        >
            <StepperNav className="mb-15 gap-3.5">
                {steps.map((step, index) => {
                    return (
                        <StepperItem
                            key={step.title}
                            step={index + 1}
                            className="relative flex-1 items-start"
                        >
                            <StepperTrigger className="flex grow flex-col items-start justify-center gap-3.5">
                                <StepperIndicator className="h-1 w-full rounded-full bg-border data-[state=active]:bg-primary data-[state=completed]:bg-green-500" />
                                <div className="flex flex-col items-start gap-1">
                                    <StepperTitle className="text-start font-semibold group-data-[state=inactive]/step:text-muted-foreground">
                                        {step.title}
                                    </StepperTitle>
                                </div>
                            </StepperTrigger>
                        </StepperItem>
                    );
                })}
            </StepperNav>

            <StepperPanel>
                <StepperContent value={1}>
                    <StepSelectAccount
                        programs={programs}
                        platforms={platforms}
                        onNext={handleSelectAccount}
                        userCountryCode={userCountryCode}
                        userCountryName={userCountryName}
                    />
                </StepperContent>

                <StepperContent value={2}>
                    {selectedPlan && (
                        <StepBillingDetails
                            selectedPlan={selectedPlan}
                            initialData={billingData}
                            onNext={handleBillingSubmit}
                            onBack={handleBack}
                        />
                    )}
                </StepperContent>

                <StepperContent value={3}>
                    {selectedPlan && (
                        <StepOrderReview
                            selectedPlan={selectedPlan}
                            billingData={billingData}
                            platforms={platforms}
                            clientId={prefilledData.clientId}
                        />
                    )}
                </StepperContent>
            </StepperPanel>
        </Stepper>
    );
}
