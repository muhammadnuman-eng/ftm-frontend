"use client";

import Decimal from "decimal.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

type RawDoc = Record<string, unknown>;

const formatCurrency = (amount: number | Decimal): string => {
    const decimalAmount =
        amount instanceof Decimal ? amount : new Decimal(amount);
    const roundedAmount = decimalAmount.toDecimalPlaces(0, Decimal.ROUND_CEIL);
    const numberValue = roundedAmount.toNumber();

    return `$${numberValue.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
};

interface SelectAddOnsProps {
    programId: string;
    basePrice: number;
    onChange: (addOns: SelectedAddOn[]) => void;
}

interface SelectedAddOn {
    addOnId: string;
    priceIncreasePercentage?: number;
    metadata?: Record<string, unknown>;
}

export type CheckoutSelectedAddOn = SelectedAddOn;

interface CheckoutAddOnResponse {
    id: string;
    name: string;
    description?: string | null;
    priceIncreasePercentage: number;
    applicablePrograms: (string | number)[];
    metadata?: Record<string, unknown>;
}

const normalizeDoc = (doc: RawDoc): CheckoutAddOnResponse | null => {
    const idValue = doc?.id;
    const id =
        typeof idValue === "number"
            ? idValue.toString()
            : typeof idValue === "string"
              ? idValue
              : undefined;

    if (!id) {
        return null;
    }

    const applicable = Array.isArray(doc?.applicablePrograms)
        ? (doc.applicablePrograms as unknown[])
        : [];

    return {
        id,
        name:
            typeof doc?.name === "string" && doc.name.trim().length > 0
                ? doc.name
                : "Untitled add-on",
        description:
            typeof doc?.description === "string" ? doc.description : undefined,
        priceIncreasePercentage:
            typeof doc?.priceIncreasePercentage === "number"
                ? doc.priceIncreasePercentage
                : 0,
        applicablePrograms: applicable.filter(
            (value) => typeof value === "number" || typeof value === "string",
        ) as (string | number)[],
        metadata:
            doc?.metadata && typeof doc.metadata === "object"
                ? (doc.metadata as Record<string, unknown>)
                : undefined,
    };
};

// Cache for add-ons data with 5 minute TTL
const addOnsCache = {
    data: null as CheckoutAddOnResponse[] | null,
    timestamp: 0,
    TTL: 5 * 60 * 1000, // 5 minutes
};

export function SelectAddOns({
    programId,
    basePrice,
    onChange,
}: SelectAddOnsProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [addOns, setAddOns] = useState<CheckoutAddOnResponse[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const fetchAddOns = useCallback(async (signal: AbortSignal) => {
        // Check cache first
        const now = Date.now();
        if (addOnsCache.data && now - addOnsCache.timestamp < addOnsCache.TTL) {
            setAddOns(addOnsCache.data);
            setIsLoading(false);
            return;
        }

        try {
            const params = new URLSearchParams({
                limit: "100",
                depth: "0",
                "where[status][equals]": "active",
            });

            const response = await fetch(`/api/add-ons?${params.toString()}`, {
                headers: {
                    "Cache-Control": "max-age=300", // Browser cache for 5 minutes
                },
                signal,
            });

            if (!response.ok) {
                throw new Error("Failed to load add-ons");
            }

            const rawData = await response.json();
            const docs = Array.isArray(rawData?.docs)
                ? rawData.docs
                : Array.isArray(rawData)
                  ? rawData
                  : [];

            const normalized: CheckoutAddOnResponse[] = docs
                .map((doc: unknown) => normalizeDoc(doc as RawDoc))
                .filter(
                    (
                        item: CheckoutAddOnResponse | null,
                    ): item is CheckoutAddOnResponse => Boolean(item),
                );

            // Update cache
            addOnsCache.data = normalized;
            addOnsCache.timestamp = Date.now();

            setAddOns(normalized);
            setSelectedIds(new Set());
        } catch (error) {
            if ((error as Error).name === "AbortError") {
                return;
            }

            console.error("Error fetching add-ons:", error);

            // Only show error if we don't have cached data
            if (!addOnsCache.data) {
                toast.error(
                    "Unable to load add-ons. Please refresh the page and try again.",
                );
            } else {
                // Use cached data on error
                setAddOns(addOnsCache.data);
            }

            setSelectedIds(new Set());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        if (programId) {
            setIsLoading(true);
            fetchAddOns(controller.signal);
        } else {
            setAddOns([]);
            setSelectedIds(new Set());
            setIsLoading(false);
        }

        return () => controller.abort();
    }, [programId, fetchAddOns]);

    const applicableAddOns = useMemo(() => {
        if (!programId) {
            return addOns;
        }

        return addOns.filter((addOn) => {
            const values = addOn.applicablePrograms;

            if (!values || values.length === 0) {
                return true;
            }

            return values.some((value) => {
                if (typeof value === "number") {
                    return value.toString() === programId;
                }

                if (typeof value === "string") {
                    return (
                        value === programId || value === programId.toString()
                    );
                }

                return false;
            });
        });
    }, [addOns, programId]);

    const selections = useMemo<SelectedAddOn[]>(() => {
        return applicableAddOns
            .filter((item) => selectedIds.has(item.id))
            .map((item) => ({
                addOnId: item.id,
                priceIncreasePercentage: item.priceIncreasePercentage,
                ...(item.metadata ? { metadata: item.metadata } : {}),
            }));
    }, [applicableAddOns, selectedIds]);

    useEffect(() => {
        onChange(selections);
    }, [onChange, selections]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }

    if (applicableAddOns.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 border-white/10 border-t pt-6">
            <div className="font-bold text-white/80 text-xs uppercase">
                Add-ons
            </div>

            <div className="space-y-3">
                {applicableAddOns.map((addOn) => {
                    const isSelected = selectedIds.has(addOn.id);
                    const addedCost = new Decimal(basePrice)
                        .mul(addOn.priceIncreasePercentage ?? 0)
                        .div(100)
                        .toDecimalPlaces(0, Decimal.ROUND_CEIL);

                    return (
                        <label
                            key={addOn.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 p-4 transition hover:border-white/20 ${
                                isSelected ? "bg-white/10" : "bg-white/5"
                            }`}
                            htmlFor={`add-on-${addOn.id}`}
                        >
                            <Checkbox
                                id={`add-on-${addOn.id}`}
                                checked={isSelected}
                                className="border-white/10"
                                onCheckedChange={(checked) => {
                                    const isChecked = Boolean(checked);
                                    setSelectedIds((prev) => {
                                        const next = new Set(prev);
                                        if (isChecked) {
                                            next.add(addOn.id);
                                        } else {
                                            next.delete(addOn.id);
                                        }
                                        return next;
                                    });
                                }}
                            />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-white/90">
                                        {addOn.name}
                                    </h3>
                                    <div className="text-right text-sm text-white/70">
                                        +{formatCurrency(addedCost)}
                                    </div>
                                </div>
                                {addOn.description && (
                                    <p className="text-sm text-white/60">
                                        {addOn.description}
                                    </p>
                                )}
                                {(addOn.priceIncreasePercentage ?? 0) > 0 && (
                                    <p className="text-white/50 text-xs">
                                        Adds {addOn.priceIncreasePercentage}% to
                                        program price.
                                    </p>
                                )}
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
