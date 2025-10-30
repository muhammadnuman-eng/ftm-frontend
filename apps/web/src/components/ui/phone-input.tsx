"use client";

import { ChevronDownIcon, PhoneIcon } from "lucide-react";
import { type ComponentProps, useEffect, useId, useState } from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
    id?: string;
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (value: string | undefined) => void;
    required?: boolean;
    className?: string;
    defaultCountry?: RPNInput.Country;
    disabled?: boolean;
}

export function PhoneInput({
    id,
    label,
    placeholder = "Enter phone number",
    value,
    onChange,
    required,
    className,
    defaultCountry = "US",
    disabled = false,
}: PhoneInputProps) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [phoneValue, setPhoneValue] = useState(value || "");

    // Update local state when value prop changes
    useEffect(() => {
        setPhoneValue(value || "");
    }, [value]);

    const handleChange = (newValue: string | undefined) => {
        setPhoneValue(newValue || "");
        onChange?.(newValue);
    };

    return (
        <div className={cn("space-y-2", className)} dir="ltr">
            {label && (
                <Label htmlFor={inputId} className="text-white/80">
                    {label}
                    {required && <span className="ml-1 text-red-400">*</span>}
                </Label>
            )}
            <RPNInput.default
                className="flex h-12 rounded-md"
                international
                defaultCountry={defaultCountry}
                flagComponent={FlagComponent}
                countrySelectComponent={CountrySelect}
                inputComponent={PhoneInputField}
                id={inputId}
                placeholder={placeholder}
                value={phoneValue}
                onChange={handleChange}
                disabled={disabled}
            />
        </div>
    );
}

const PhoneInputField = ({ className, ...props }: ComponentProps<"input">) => {
    return (
        <Input
            data-slot="phone-input"
            className={cn(
                "rounded-s-none border-s-0 focus-visible:z-10",
                className,
            )}
            {...props}
        />
    );
};

PhoneInputField.displayName = "PhoneInputField";

type CountrySelectProps = {
    disabled?: boolean;
    value: RPNInput.Country;
    onChange: (value: RPNInput.Country) => void;
    options: { label: string; value: RPNInput.Country | undefined }[];
};

const CountrySelect = ({
    disabled,
    value,
    onChange,
    options,
}: CountrySelectProps) => {
    const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(event.target.value as RPNInput.Country);
    };

    return (
        <div className="relative inline-flex h-12 items-center self-stretch rounded-s-md border border-white/10 bg-white/5 py-2 ps-3 pe-2 text-white/80 outline-none transition-[color,box-shadow] focus-within:z-10 focus-within:border-white/15 focus-within:ring-[3px] focus-within:ring-blue-100/5 hover:border-white/15 has-disabled:pointer-events-none has-disabled:opacity-50">
            <div className="inline-flex items-center gap-1" aria-hidden="true">
                <FlagComponent
                    country={value}
                    countryName={value}
                    aria-hidden="true"
                />
                <span className="text-white/60">
                    <ChevronDownIcon size={16} aria-hidden="true" />
                </span>
            </div>
            <select
                disabled={disabled}
                value={value}
                onChange={handleSelect}
                className="absolute inset-0 cursor-pointer text-sm opacity-0"
                aria-label="Select country"
            >
                <option key="default" value="">
                    Select a country
                </option>
                {options
                    .filter((x) => x.value)
                    .map((option, i) => (
                        <option
                            key={option.value ?? `empty-${i}`}
                            value={option.value}
                        >
                            {option.label}{" "}
                            {option.value &&
                                `+${RPNInput.getCountryCallingCode(option.value)}`}
                        </option>
                    ))}
            </select>
        </div>
    );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
    const Flag = flags[country];

    return (
        <span className="w-5 overflow-hidden rounded-sm">
            {Flag ? (
                <Flag title={countryName} />
            ) : (
                <PhoneIcon size={16} aria-hidden="true" />
            )}
        </span>
    );
};
