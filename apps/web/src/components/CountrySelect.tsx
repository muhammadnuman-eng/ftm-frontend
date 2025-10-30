"use client";

import React from "react";
import ReactCountryFlag from "react-country-flag";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import COUNTRY_CODES from "@/data/country-codes";

type CountrySelectProps = {
    id?: string;
    label?: string;
    value?: string; // ISO alpha-2 lower-case
    defaultValue?: string; // ISO alpha-2 lower-case
    onValueChange?: (value: string) => void;
    excluded?: string[]; // ISO alpha-2 lower-case
    placeholder?: string;
    className?: string;
    searchable?: boolean;
};

export const CountrySelect: React.FC<CountrySelectProps> = ({
    id,
    label = "Country",
    value,
    defaultValue,
    onValueChange,
    excluded = [],
    placeholder = "Select country",
    className,
    searchable = true,
}) => {
    const excludedSet = new Set((excluded || []).map((c) => c.toLowerCase()));
    const displayNames = React.useMemo(
        () => new Intl.DisplayNames(["en"], { type: "region" }),
        [],
    );
    const [query, setQuery] = React.useState("");
    const grouped = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        const items = COUNTRY_CODES.map((code) => {
            const name =
                displayNames.of(code.toUpperCase()) || code.toUpperCase();
            return { code, name };
        })
            .filter(
                (it) =>
                    !q ||
                    it.name.toLowerCase().includes(q) ||
                    it.code.includes(q),
            )
            .sort((a, b) => a.name.localeCompare(b.name));

        const map = new Map<
            string,
            { continent: string; items: { code: string; name: string }[] }
        >();
        for (const item of items) {
            const key = (item.name[0] || "#").toUpperCase();
            const group = map.get(key);
            if (group) {
                group.items.push(item);
            } else {
                map.set(key, { continent: key, items: [item] });
            }
        }
        return Array.from(map.values());
    }, [displayNames, query]);

    return (
        <div className={className}>
            {label && (
                <Label htmlFor={id} className="text-white/80">
                    {label}
                </Label>
            )}
            <Select
                value={value}
                defaultValue={defaultValue}
                onValueChange={onValueChange}
            >
                <SelectTrigger
                    id={id}
                    className="mt-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80"
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
                    {searchable && (
                        <div className="sticky top-0 z-10 bg-popover p-1">
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search countries..."
                                className="h-9"
                            />
                        </div>
                    )}
                    {grouped.map((continent) => (
                        <SelectGroup key={continent.continent}>
                            <SelectLabel className="ps-2">
                                {continent.continent}
                            </SelectLabel>
                            {continent.items.map((item) => {
                                const disabled = excludedSet.has(item.code);
                                return (
                                    <SelectItem
                                        key={item.code}
                                        value={item.code}
                                        disabled={disabled}
                                    >
                                        <span className="text-lg leading-none">
                                            <ReactCountryFlag
                                                countryCode={item.code.toUpperCase()}
                                                svg
                                                title={item.code.toUpperCase()}
                                                style={{
                                                    width: "1.2em",
                                                    height: "1.2em",
                                                }}
                                            />
                                        </span>{" "}
                                        <span className="truncate">
                                            {item.name}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default CountrySelect;
