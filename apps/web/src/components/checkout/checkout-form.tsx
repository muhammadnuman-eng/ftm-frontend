"use client";

import Decimal from "decimal.js";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import posthog from "posthog-js";
import {
    Fragment,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import type { Country } from "react-phone-number-input";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import type { ProgramWithDiscounts } from "@/data/programs";
import { COUNTRIES, groupCountriesByContinent } from "@/lib/utils";
import type { CommerceConfig } from "@/payload-types";
import type { AppliedCoupon } from "./applied-coupon";
import { PaymentMethods } from "./payment-methods";

interface InAppData {
    isInApp: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    clientId?: string;
    country?: string;
    address?: string;
    city?: string;
    phone?: string;
    state?: string;
    postalCode?: string;
    ip?: string;
}

interface CheckoutFormProps {
    selectedPlan: ProgramWithDiscounts;
    tier: {
        id?: string | null;
        accountSize: string;
        price: number;
        discountedPrice?: number;
        originalPrice?: number;
        isPopular?: boolean | null;
        activeCoupon?: AppliedCoupon | null;
        addOnDetails?: { key: string; label: string; value: string }[];
    };
    defaultCountry: Country;
    finalPrice: number; // This will come from the coupon system
    selectedAddOns?: SelectedAddOn[];
    activeCoupon?: AppliedCoupon | null;
    platformId?: string;
    platformName?: string;
    categoryLabel?: string;
    inAppData?: InAppData;
    commerceConfig: CommerceConfig | null;
    onCouponRemoved?: () => void;
}

interface SelectedAddOn {
    addOnId: string;
    priceIncreasePercentage?: number;
    metadata?: Record<string, unknown>;
}

export function CheckoutForm({
    selectedPlan,
    tier,
    defaultCountry,
    finalPrice,
    selectedAddOns = [],
    activeCoupon = null,
    platformId,
    platformName,
    categoryLabel,
    inAppData,
    commerceConfig,
    onCouponRemoved,
}: CheckoutFormProps) {
    const [customerData, setCustomerData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        // Billing Address - required for business
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: defaultCountry?.toLowerCase() || "",
    });
    const [countryOpen, setCountryOpen] = useState(false);
    const countryId = useId();

    // localStorage key for form data
    const FORM_STORAGE_KEY = "ftm-checkout-form-data";

    // Load saved form data on component mount
    useEffect(() => {
        // If in-app purchase, prioritize in-app data over localStorage
        if (inAppData?.isInApp) {
            setCustomerData({
                firstName: inAppData.firstName || "",
                lastName: inAppData.lastName || "",
                email: inAppData.email || "",
                phone: inAppData.phone || "",
                address: inAppData.address || "",
                city: inAppData.city || "",
                state: inAppData.state || "",
                postalCode: inAppData.postalCode || "",
                country:
                    inAppData.country?.toLowerCase() ||
                    defaultCountry?.toLowerCase() ||
                    "",
            });
            return;
        }

        try {
            const savedData = localStorage.getItem(FORM_STORAGE_KEY);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // Set customer data with all saved fields
                setCustomerData({
                    firstName: parsedData.firstName || "",
                    lastName: parsedData.lastName || "",
                    email: parsedData.email || "",
                    phone: parsedData.phone || "",
                    address: parsedData.address || "",
                    city: parsedData.city || "",
                    state: parsedData.state || "",
                    postalCode: parsedData.postalCode || "",
                    country:
                        parsedData.country ||
                        defaultCountry?.toLowerCase() ||
                        "",
                });
            }
        } catch (error) {
            console.warn("Failed to load saved form data:", error);
            // Clear corrupted data
            localStorage.removeItem(FORM_STORAGE_KEY);
        }
    }, [defaultCountry, inAppData]);

    // Debounce localStorage saves
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Save form data to localStorage whenever it changes (debounced)
    useEffect(() => {
        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout
        saveTimeoutRef.current = setTimeout(() => {
            try {
                localStorage.setItem(
                    FORM_STORAGE_KEY,
                    JSON.stringify(customerData),
                );
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event("ftm-checkout-updated"));
            } catch (error) {
                console.warn("Failed to save form data:", error);
            }
        }, 500); // Save after 500ms of inactivity

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [customerData]);

    // Group countries by continent for the selector
    const countriesByContinent = groupCountriesByContinent(COUNTRIES);

    const handleInputChange = useCallback((field: string, value: string) => {
        setCustomerData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Track field completion when value is filled
        if (value && value.trim().length > 0) {
            posthog.capture("checkout_field_completed", {
                fieldName: field,
                hasValue: true,
            });
        }
    }, []);

    const handleFieldFocus = useCallback((fieldName: string) => {
        posthog.capture("checkout_field_focused", {
            fieldName,
        });
    }, []);

    // Function to clear saved form data
    const clearSavedData = useCallback(() => {
        try {
            localStorage.removeItem(FORM_STORAGE_KEY);
            setCustomerData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                city: "",
                state: "",
                postalCode: "",
                country: defaultCountry?.toLowerCase() || "",
            });
        } catch (error) {
            console.warn("Failed to clear form data:", error);
        }
    }, [defaultCountry]);

    // Export clearSavedData for use in payment success
    // We'll attach it to the component for external access
    useEffect(() => {
        (
            window as unknown as { clearCheckoutFormData?: () => void }
        ).clearCheckoutFormData = clearSavedData;
        return () => {
            delete (window as unknown as { clearCheckoutFormData?: () => void })
                .clearCheckoutFormData;
        };
    }, [clearSavedData]);

    // Validation helpers
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const validationErrors = useMemo(() => {
        const errors: Record<string, string> = {};

        if (customerData.email && !emailRegex.test(customerData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (customerData.phone && customerData.phone.length < 6) {
            errors.phone = "Phone number is too short";
        }

        if (customerData.postalCode && customerData.postalCode.length < 3) {
            errors.postalCode = "Postal code is too short";
        }

        return errors;
    }, [customerData.email, customerData.phone, customerData.postalCode]);

    // Track validation errors
    useEffect(() => {
        if (Object.keys(validationErrors).length > 0) {
            posthog.capture("checkout_validation_error", {
                errors: validationErrors,
                errorFields: Object.keys(validationErrors),
                errorCount: Object.keys(validationErrors).length,
            });
        }
    }, [validationErrors]);

    const resolvedProgramType = (() => {
        const category = selectedPlan.category;
        switch (category) {
            case "1-step":
                return "1-step" as const;
            case "2-step":
                return "2-step" as const;
            case "instant":
                return "instant" as const;
            default:
                return undefined;
        }
    })();

    const purchasePrice = activeCoupon
        ? (tier.discountedPrice ?? tier.price)
        : tier.price;
    const addOnValue = new Decimal(finalPrice)
        .minus(purchasePrice)
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();
    const programDetails =
        `${tier.accountSize} - ${selectedPlan.name} - ${categoryLabel || ""} - ${platformName || platformId || ""}`
            .split(" - ")
            .filter((part) => part && part !== "undefined" && part !== "null")
            .join(" - ");

    // Determine if fields should be disabled (in-app purchase mode)
    const isInAppPurchase = inAppData?.isInApp ?? false;

    return (
        <div className="space-y-8">
            {/* Customer Information */}
            <div className="space-y-4">
                <div className="font-bold text-white/80 text-xs uppercase">
                    Customer Information
                    {isInAppPurchase && (
                        <span className="ml-2 font-normal text-white/40 text-xs">
                            (Pre-filled from in-app purchase)
                        </span>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label className="text-white/80">
                            First name
                            <span className="ml-1 text-red-400">*</span>
                        </Label>
                        <Input
                            name="firstName"
                            placeholder="John"
                            value={customerData.firstName}
                            onChange={(e) =>
                                handleInputChange("firstName", e.target.value)
                            }
                            onFocus={() => handleFieldFocus("firstName")}
                            required
                            disabled={isInAppPurchase}
                            data-ph-capture-attribute-field-name="firstName"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white/80">
                            Last name
                            <span className="ml-1 text-red-400">*</span>
                        </Label>
                        <Input
                            name="lastName"
                            placeholder="Doe"
                            value={customerData.lastName}
                            onChange={(e) =>
                                handleInputChange("lastName", e.target.value)
                            }
                            onFocus={() => handleFieldFocus("lastName")}
                            required
                            disabled={isInAppPurchase}
                            data-ph-capture-attribute-field-name="lastName"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-white/80">
                            Email
                            <span className="ml-1 text-red-400">*</span>
                        </Label>
                        <Input
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={customerData.email}
                            onChange={(e) =>
                                handleInputChange("email", e.target.value)
                            }
                            onFocus={() => handleFieldFocus("email")}
                            required
                            disabled={isInAppPurchase}
                            className={
                                validationErrors.email && customerData.email
                                    ? "border-red-500 focus:border-red-500"
                                    : ""
                            }
                            data-ph-capture-attribute-field-name="email"
                        />
                        {validationErrors.email && customerData.email && (
                            <p className="mt-1 text-red-400 text-xs">
                                {validationErrors.email}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <PhoneInput
                            label="Phone"
                            placeholder="Enter phone number"
                            defaultCountry={defaultCountry}
                            value={customerData.phone}
                            onChange={(value) =>
                                handleInputChange("phone", value || "")
                            }
                            required
                            disabled={isInAppPurchase}
                        />
                    </div>
                </div>

                {/* Billing Address */}
                <div className="space-y-4 border-white/10 border-t pt-6">
                    <div className="font-bold text-white/80 text-xs uppercase">
                        Billing Address
                    </div>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">
                                Street Address
                                <span className="ml-1 text-red-400">*</span>
                            </Label>
                            <Input
                                name="address"
                                placeholder="123 Main Street"
                                value={customerData.address}
                                onChange={(e) =>
                                    handleInputChange("address", e.target.value)
                                }
                                onFocus={() => handleFieldFocus("address")}
                                required
                                disabled={isInAppPurchase}
                                data-ph-capture-attribute-field-name="address"
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-white/80">
                                    City
                                    <span className="ml-1 text-red-400">*</span>
                                </Label>
                                <Input
                                    name="city"
                                    placeholder="New York"
                                    value={customerData.city}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "city",
                                            e.target.value,
                                        )
                                    }
                                    onFocus={() => handleFieldFocus("city")}
                                    required
                                    disabled={isInAppPurchase}
                                    data-ph-capture-attribute-field-name="city"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-white/80">
                                    State/Province
                                    <span className="ml-1 text-red-400">*</span>
                                </Label>
                                <Input
                                    name="state"
                                    placeholder="NY"
                                    value={customerData.state}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "state",
                                            e.target.value,
                                        )
                                    }
                                    onFocus={() => handleFieldFocus("state")}
                                    required
                                    disabled={isInAppPurchase}
                                    data-ph-capture-attribute-field-name="state"
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-white/80">
                                    Postal/Zip Code
                                    <span className="ml-1 text-red-400">*</span>
                                </Label>
                                <Input
                                    name="postalCode"
                                    placeholder="10001"
                                    value={customerData.postalCode}
                                    onChange={(e) =>
                                        handleInputChange(
                                            "postalCode",
                                            e.target.value,
                                        )
                                    }
                                    onFocus={() =>
                                        handleFieldFocus("postalCode")
                                    }
                                    required
                                    disabled={isInAppPurchase}
                                    data-ph-capture-attribute-field-name="postalCode"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor={countryId}
                                    className="text-white/80"
                                >
                                    Country
                                    <span className="ml-1 text-red-400">*</span>
                                </Label>
                                <Popover
                                    open={countryOpen}
                                    onOpenChange={setCountryOpen}
                                >
                                    <PopoverTrigger asChild>
                                        {/* biome-ignore lint/a11y/useSemanticElements: Button is used as combobox trigger per Radix UI pattern */}
                                        <Button
                                            id={countryId}
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={countryOpen}
                                            disabled={isInAppPurchase}
                                            className="h-12 w-full justify-between border-white/10 bg-white/5 px-3 font-normal hover:bg-white/5 focus-visible:border-white/15"
                                        >
                                            {customerData.country ? (
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span className="text-lg leading-none">
                                                        {
                                                            COUNTRIES.find(
                                                                (c) =>
                                                                    c.code ===
                                                                    customerData.country,
                                                            )?.flagEmoji
                                                        }
                                                    </span>
                                                    <span className="truncate">
                                                        {
                                                            COUNTRIES.find(
                                                                (c) =>
                                                                    c.code ===
                                                                    customerData.country,
                                                            )?.name
                                                        }
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Select country
                                                </span>
                                            )}
                                            <ChevronDownIcon
                                                size={16}
                                                className="shrink-0 text-muted-foreground/80"
                                                aria-hidden="true"
                                            />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-full min-w-[var(--radix-popper-anchor-width)] p-0"
                                        align="start"
                                    >
                                        <Command>
                                            <CommandInput placeholder="Search country..." />
                                            <CommandList>
                                                <CommandEmpty>
                                                    No country found.
                                                </CommandEmpty>
                                                {countriesByContinent.map(
                                                    (group) => (
                                                        <Fragment
                                                            key={
                                                                group.continent
                                                            }
                                                        >
                                                            <CommandGroup
                                                                heading={
                                                                    group.continent
                                                                }
                                                            >
                                                                {group.items.map(
                                                                    (
                                                                        country,
                                                                    ) => (
                                                                        <CommandItem
                                                                            key={
                                                                                country.code
                                                                            }
                                                                            value={
                                                                                country.name
                                                                            }
                                                                            onSelect={() => {
                                                                                handleInputChange(
                                                                                    "country",
                                                                                    country.code,
                                                                                );
                                                                                setCountryOpen(
                                                                                    false,
                                                                                );
                                                                            }}
                                                                        >
                                                                            <span className="text-lg leading-none">
                                                                                {
                                                                                    country.flagEmoji
                                                                                }
                                                                            </span>{" "}
                                                                            {
                                                                                country.name
                                                                            }
                                                                            {customerData.country ===
                                                                                country.code && (
                                                                                <CheckIcon
                                                                                    size={
                                                                                        16
                                                                                    }
                                                                                    className="ml-auto"
                                                                                />
                                                                            )}
                                                                        </CommandItem>
                                                                    ),
                                                                )}
                                                            </CommandGroup>
                                                        </Fragment>
                                                    ),
                                                )}
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4 border-white/10 border-t pt-6">
                <div className="font-bold text-white/80 text-xs uppercase">
                    Payment Method
                </div>

                <PaymentMethods
                    amount={finalPrice}
                    purchasePrice={purchasePrice}
                    totalPrice={finalPrice}
                    programId={selectedPlan.id.toString()}
                    accountSize={tier.accountSize}
                    tierId={tier.id || undefined}
                    programName={selectedPlan.name}
                    programType={resolvedProgramType}
                    programDetails={programDetails}
                    platformId={platformId}
                    platformName={platformName}
                    region={undefined} // Let the API determine region from country
                    addOnValue={addOnValue}
                    purchaseType={
                        tier.activeCoupon ? "original-order" : undefined
                    }
                    customerData={customerData}
                    selectedAddOns={selectedAddOns}
                    activeCoupon={activeCoupon}
                    commerceConfig={commerceConfig}
                    onCouponRemoved={onCouponRemoved}
                />
            </div>
        </div>
    );
}
