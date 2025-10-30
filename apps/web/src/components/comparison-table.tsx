"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type {
    ComparisonProgram,
    DrawdownType,
    FilterState,
    FilterType,
    InfoType,
    ProgramType,
    SizeType,
} from "@/data/comparison";
import { cn } from "@/lib/utils";

interface DropdownProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

const Dropdown = ({ label, value, options, onChange }: DropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find((option) => option.value === value);

    return (
        <div className="filter-group">
            <div className="mb-2 font-medium text-sm text-white/60">
                {label}
            </div>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full min-w-32 items-center justify-between rounded-md border border-white/20 bg-white/5 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10"
                >
                    <span>{selectedOption?.label ?? value}</span>
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 text-white/60 transition-transform",
                            isOpen && "rotate-180",
                        )}
                    />
                </button>
                {isOpen && (
                    <>
                        <button
                            type="button"
                            className="fixed inset-0 z-10 cursor-default"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute top-full z-20 mt-1 w-full min-w-48 rounded-md border border-white/20 bg-stone-800 p-1 shadow-lg">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "block w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-white/10",
                                        value === option.value
                                            ? "bg-blue-600 text-white"
                                            : "text-white/80",
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

interface ComparisonTableProps {
    type?: FilterType;
    programs: ComparisonProgram[];
}

export const ComparisonTable = ({
    type = "All",
    programs,
}: ComparisonTableProps) => {
    const t = useTranslations("comparisonTable");
    const locale = useLocale();
    const currencyFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }),
        [locale],
    );

    const [filters, setFilters] = useState<FilterState>({
        types: type,
        programs: "All",
        size: "100K",
        drawdown: "All",
        info: "All",
    });
    const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);

    const typeOptions = useMemo(
        () => [
            { value: "All", label: t("filters.type.options.all") },
            { value: "1-Step", label: t("filters.type.options.oneStep") },
            { value: "2-Step", label: t("filters.type.options.twoStep") },
            { value: "Instant", label: t("filters.type.options.instant") },
        ],
        [t],
    );

    const drawdownOptions = useMemo(
        () => [
            { value: "All", label: t("filters.drawdown.options.all") },
            {
                value: "Balance Based",
                label: t("filters.drawdown.options.balanceBased"),
            },
            {
                value: "Trailing",
                label: t("filters.drawdown.options.trailing"),
            },
            {
                value: "Trailing Lock",
                label: t("filters.drawdown.options.trailingLock"),
            },
        ],
        [t],
    );

    const rowKeys = [
        "Daily DD",
        "Overall DD",
        "Profit Target",
        "2nd Profit Target",
        "Min Trading Days",
        "Consistency",
        "Profit Split",
        "Fee",
        "Activation Fee",
    ] as const;

    const rowLabels = useMemo(
        () => ({
            "Daily DD": t("rows.dailyDd.label"),
            "Overall DD": t("rows.overallDd.label"),
            "Profit Target": t("rows.profitTarget.label"),
            "2nd Profit Target": t("rows.secondProfitTarget.label"),
            "Min Trading Days": t("rows.minTradingDays.label"),
            Consistency: t("rows.consistency.label"),
            "Profit Split": t("rows.profitSplit.label"),
            Fee: t("rows.fee.label"),
            "Activation Fee": t("rows.activationFee.label"),
        }),
        [t],
    );

    const noneLabel = (
        <span className="italic opacity-50">{t("rows.shared.none")}</span>
    );
    const evalLabel = t("rows.shared.eval");
    const simLabel = t("rows.shared.sim");
    const activationSuffix = t("table.activationSuffix");
    const ctaLabel = t("table.cta");
    const infoProgramHeading = t("table.infoProgram");
    const emptyMessage = t("table.empty");

    const updateFilter = <K extends keyof FilterState>(
        key: K,
        value: FilterState[K],
    ) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const formatCurrency = (amount: number): string =>
        currencyFormatter.format(amount);

    const getAccountSizeValue = (
        program: ComparisonProgram,
        size: SizeType,
    ): number => {
        const fee = program.fees[size];
        return fee !== undefined ? fee : 0;
    };

    const getCtaUrl = (program: ComparisonProgram): string => {
        const params = new URLSearchParams();
        // Convert display category (e.g., "2-Step") to slug expected by variations page (e.g., "2-step")
        const categorySlug = program.category
            .toLowerCase()
            .replace(/\s+/g, "-");
        params.set("category", categorySlug);
        // Deep-link to this specific program
        params.set("program", String(program.id));
        if (adjustedSize) {
            params.set("accountSize", `$${adjustedSize}`);
        }
        return `/variations?${params.toString()}`;
    };

    // First, filter programs by type, program selection, and drawdown (without size filter)
    const baseFilteredPrograms = useMemo(() => {
        let filtered = programs;

        if (filters.types !== "All") {
            filtered = filtered.filter(
                (program) => program.category === filters.types,
            );
        }

        if (filters.programs !== "All") {
            filtered = filtered.filter(
                (program) => program.id === filters.programs,
            );
        }

        if (filters.drawdown !== "All") {
            filtered = filtered.filter(
                (program) =>
                    program.dailyDrawdown.type === filters.drawdown ||
                    program.overallDrawdown.type === filters.drawdown,
            );
        }

        return filtered;
    }, [filters, programs]);

    const programOptions = useMemo(
        () => [
            { value: "All", label: t("filters.program.options.all") },
            ...baseFilteredPrograms.map((program) => ({
                value: program.id,
                label: program.name,
            })),
        ],
        [baseFilteredPrograms, t],
    );

    const availableSizes = useMemo(() => {
        const allSizes = new Set<string>();
        baseFilteredPrograms.forEach((program) => {
            Object.keys(program.fees).forEach((size) => {
                allSizes.add(size);
            });
        });

        return Array.from(allSizes).sort((a, b) => {
            const aValue = Number.parseInt(a.replace("K", ""), 10);
            const bValue = Number.parseInt(b.replace("K", ""), 10);
            return aValue - bValue;
        });
    }, [baseFilteredPrograms]);

    const sizeOptions = useMemo(
        () =>
            availableSizes.map((size) => ({
                value: size,
                label: t("filters.size.option", { size }),
            })),
        [availableSizes, t],
    );

    const adjustedSize = useMemo(() => {
        if (availableSizes.includes(filters.size)) {
            return filters.size;
        }
        return availableSizes[availableSizes.length - 1] || "100K";
    }, [filters.size, availableSizes]);

    // Finally, filter by account size availability
    const filteredPrograms = useMemo(() => {
        return baseFilteredPrograms.filter((program) => {
            const fee = program.fees[adjustedSize as SizeType];
            return fee !== undefined && fee > 0;
        });
    }, [baseFilteredPrograms, adjustedSize]);

    const infoOptions = useMemo(
        () => [
            { value: "All", label: t("filters.info.options.all") },
            ...rowKeys.map((row) => ({ value: row, label: rowLabels[row] })),
        ],
        [rowKeys, rowLabels, t],
    );

    const visibleRows = useMemo(() => {
        if (filters.info === "All") {
            return rowKeys;
        }
        return rowKeys.filter((row) => row === filters.info);
    }, [filters.info, rowKeys]);

    // Get account size value in dollars
    const getAccountSizeInDollars = (size: SizeType): number => {
        const sizeMap: Record<SizeType, number> = {
            "5K": 5000,
            "10K": 10000,
            "25K": 25000,
            "50K": 50000,
            "100K": 100000,
            "150K": 150000,
            "200K": 200000,
            "300K": 300000,
        };
        return sizeMap[size] || 100000;
    };

    const renderDrawdown = (
        percent: number,
        type?: string,
    ): React.ReactNode => {
        // Check if type is "None" or if percent is 0
        if (type === "None" || percent === 0) {
            return noneLabel;
        }
        const accountValue = getAccountSizeInDollars(adjustedSize as SizeType);
        const usdAmount = (percent / 100) * accountValue;
        return (
            <>
                {percent}%<br />
                {formatCurrency(usdAmount)}
                {type && (
                    <>
                        <br />
                        {type}
                    </>
                )}
            </>
        );
    };

    const renderProfitTarget = (
        target: ComparisonProgram["profitTarget"],
    ): React.ReactNode => {
        if (!target) return noneLabel;
        const accountValue = getAccountSizeInDollars(adjustedSize as SizeType);
        const usdAmount = (target.percent / 100) * accountValue;
        return (
            <>
                {target.percent}%<br />
                {formatCurrency(usdAmount)}
            </>
        );
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex flex-wrap gap-4">
                <Dropdown
                    label={t("filters.type.label")}
                    value={filters.types}
                    options={typeOptions}
                    onChange={(value) =>
                        updateFilter("types", value as FilterType)
                    }
                />

                <Dropdown
                    label={t("filters.program.label")}
                    value={filters.programs}
                    options={programOptions}
                    onChange={(value) =>
                        updateFilter("programs", value as ProgramType)
                    }
                />

                <Dropdown
                    label={t("filters.size.label")}
                    value={adjustedSize}
                    options={sizeOptions}
                    onChange={(value) =>
                        updateFilter("size", value as SizeType)
                    }
                />

                <Dropdown
                    label={t("filters.drawdown.label")}
                    value={filters.drawdown}
                    options={drawdownOptions}
                    onChange={(value) =>
                        updateFilter("drawdown", value as DrawdownType)
                    }
                />

                <Dropdown
                    label={t("filters.info.label")}
                    value={filters.info}
                    options={infoOptions}
                    onChange={(value) =>
                        updateFilter("info", value as InfoType)
                    }
                />
            </div>

            <div className="block space-y-6 lg:hidden">
                {filteredPrograms.map((program) => {
                    const fee = getAccountSizeValue(
                        program,
                        adjustedSize as SizeType,
                    );
                    const discount = program.discounts?.[adjustedSize];

                    return (
                        <Card
                            key={program.id}
                            className="!bg-none relative"
                            wrapperClassName="ring-1 ring-white/10"
                        >
                            <CardHeader className="pt-6">
                                <CardTitle className="text-xl">
                                    {program.displayName}
                                </CardTitle>
                                <CardDescription className="font-bold text-2xl text-blue-400">
                                    {discount ? (
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-white/40 line-through">
                                                {formatCurrency(
                                                    discount.originalPrice,
                                                )}
                                            </span>
                                            <span className="text-2xl">
                                                {formatCurrency(
                                                    discount.discountedPrice,
                                                )}
                                            </span>
                                        </div>
                                    ) : (
                                        formatCurrency(fee)
                                    )}
                                    {program.activationFee && (
                                        <span className="ml-2 text-sm text-white/60">
                                            +{" "}
                                            {formatCurrency(
                                                program.activationFee,
                                            )}{" "}
                                            {activationSuffix}
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pb-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    {visibleRows.includes("Daily DD") && (
                                        <div>
                                            <p className="font-medium text-white">
                                                {rowLabels["Daily DD"]}
                                            </p>
                                            <p className="text-white">
                                                {renderDrawdown(
                                                    program.dailyDrawdown
                                                        .percent,
                                                    program.dailyDrawdown.type,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {visibleRows.includes("Overall DD") && (
                                        <div>
                                            <p className="font-medium text-white">
                                                {rowLabels["Overall DD"]}
                                            </p>
                                            <p className="text-white">
                                                {renderDrawdown(
                                                    program.overallDrawdown
                                                        .percent,
                                                    program.overallDrawdown
                                                        .type,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {visibleRows.includes("Profit Target") && (
                                        <div>
                                            <p className="font-medium text-white">
                                                {rowLabels["Profit Target"]}
                                            </p>
                                            <p className="text-white">
                                                {renderProfitTarget(
                                                    program.profitTarget,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {visibleRows.includes(
                                        "2nd Profit Target",
                                    ) && (
                                        <div>
                                            <p className="font-medium text-white">
                                                {rowLabels["2nd Profit Target"]}
                                            </p>
                                            <p className="text-white">
                                                {renderProfitTarget(
                                                    program.secondProfitTarget ??
                                                        null,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {visibleRows.includes(
                                        "Min Trading Days",
                                    ) && (
                                        <div>
                                            <p className="font-medium text-white">
                                                {rowLabels["Min Trading Days"]}
                                            </p>
                                            <p className="text-white">
                                                {program.minTradingDays.eval &&
                                                program.minTradingDays.eval !==
                                                    "None"
                                                    ? `${evalLabel}: ${program.minTradingDays.eval}`
                                                    : ""}
                                                {program.minTradingDays.eval &&
                                                    program.minTradingDays
                                                        .eval !== "None" &&
                                                    " "}
                                                {`${simLabel}: ${program.minTradingDays.simFunded}`}
                                            </p>
                                        </div>
                                    )}
                                    {visibleRows.includes("Consistency") && (
                                        <div>
                                            <p className="font-medium text-white">
                                                {rowLabels.Consistency}
                                            </p>
                                            <p className="text-white">
                                                {program.consistency.eval &&
                                                program.consistency.eval !==
                                                    "None"
                                                    ? `${evalLabel}: ${program.consistency.eval}`
                                                    : ""}
                                                {program.consistency.eval &&
                                                    program.consistency.eval !==
                                                        "None" &&
                                                    " "}
                                                {`${simLabel}: ${program.consistency.simFunded}`}
                                            </p>
                                        </div>
                                    )}
                                    {visibleRows.includes("Profit Split") && (
                                        <div>
                                            <p className="font-medium text-white">
                                                {rowLabels["Profit Split"]}
                                            </p>
                                            <p className="text-white">
                                                {program.profitSplit ??
                                                    noneLabel}
                                            </p>
                                        </div>
                                    )}
                                    {visibleRows.includes("Activation Fee") &&
                                        program.activationFee && (
                                            <div>
                                                <p className="font-medium text-white">
                                                    {
                                                        rowLabels[
                                                            "Activation Fee"
                                                        ]
                                                    }
                                                </p>
                                                <p className="text-white">
                                                    {formatCurrency(
                                                        program.activationFee,
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                </div>
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    asChild
                                >
                                    <Link href={getCtaUrl(program)}>
                                        {ctaLabel}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="hidden lg:block">
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-white/10 border-b">
                                <th className="w-40 bg-white/10 p-3 text-left font-bold text-sm text-white">
                                    {infoProgramHeading}
                                </th>
                                {filteredPrograms.map((program, index) => {
                                    // Split program name to ensure consistent 2-line display
                                    const nameParts =
                                        program.displayName.split(" ");
                                    let formattedName: React.ReactNode;

                                    if (nameParts.length === 4) {
                                        // Split 4-word names evenly: 2 words / 2 words
                                        formattedName = (
                                            <>
                                                {nameParts
                                                    .slice(0, 2)
                                                    .join(" ")}
                                                <br />
                                                {nameParts.slice(2).join(" ")}
                                            </>
                                        );
                                    } else if (nameParts.length > 1) {
                                        // For other multi-word names: all but last / last word
                                        formattedName = (
                                            <>
                                                {nameParts
                                                    .slice(0, -1)
                                                    .join(" ")}
                                                <br />
                                                {
                                                    nameParts[
                                                        nameParts.length - 1
                                                    ]
                                                }
                                            </>
                                        );
                                    } else {
                                        formattedName = program.displayName;
                                    }

                                    return (
                                        <th
                                            key={program.id}
                                            className="h-16 border-white/10 border-l p-3 text-center font-bold text-sm text-white"
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            <div className="flex h-full items-center justify-center">
                                                {formattedName}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleRows.includes("Daily DD") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels["Daily DD"]}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {renderDrawdown(
                                                program.dailyDrawdown.percent,
                                                program.dailyDrawdown.type,
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("Overall DD") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels["Overall DD"]}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {renderDrawdown(
                                                program.overallDrawdown.percent,
                                                program.overallDrawdown.type,
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("Profit Target") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels["Profit Target"]}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {renderProfitTarget(
                                                program.profitTarget,
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("2nd Profit Target") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels["2nd Profit Target"]}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {renderProfitTarget(
                                                program.secondProfitTarget ??
                                                    null,
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("Min Trading Days") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels["Min Trading Days"]}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {program.minTradingDays.eval &&
                                                program.minTradingDays.eval !==
                                                    "None" && (
                                                    <div>
                                                        {evalLabel}:{" "}
                                                        {
                                                            program
                                                                .minTradingDays
                                                                .eval
                                                        }
                                                    </div>
                                                )}
                                            <div>
                                                {simLabel}:{" "}
                                                {
                                                    program.minTradingDays
                                                        .simFunded
                                                }
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("Consistency") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels.Consistency}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {program.consistency.eval &&
                                                program.consistency.eval !==
                                                    "None" && (
                                                    <div>
                                                        {evalLabel}:{" "}
                                                        {
                                                            program.consistency
                                                                .eval
                                                        }
                                                    </div>
                                                )}
                                            <div>
                                                {simLabel}:{" "}
                                                {program.consistency.simFunded}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("Profit Split") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels["Profit Split"]}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {program.profitSplit ?? noneLabel}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("Fee") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels.Fee}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            <div className="font-bold text-blue-400 text-sm">
                                                {(() => {
                                                    const fee =
                                                        getAccountSizeValue(
                                                            program,
                                                            adjustedSize as SizeType,
                                                        );
                                                    const discount =
                                                        program.discounts?.[
                                                            adjustedSize
                                                        ];

                                                    if (discount) {
                                                        return (
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-white/40 line-through">
                                                                    {formatCurrency(
                                                                        discount.originalPrice,
                                                                    )}
                                                                </span>
                                                                <span>
                                                                    {formatCurrency(
                                                                        discount.discountedPrice,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    return formatCurrency(fee);
                                                })()}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            )}

                            {visibleRows.includes("Activation Fee") && (
                                <tr className="border-white/10 border-b hover:bg-white/5">
                                    <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                        {rowLabels["Activation Fee"]}
                                    </td>
                                    {filteredPrograms.map((program, index) => (
                                        <td
                                            key={program.id}
                                            className={cn(
                                                "border-white/10 border-l p-3 text-center text-white text-xs transition-colors",
                                                hoveredColumn === index &&
                                                    "bg-white/5",
                                            )}
                                            onMouseEnter={() =>
                                                setHoveredColumn(index)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredColumn(null)
                                            }
                                        >
                                            {program.activationFee
                                                ? formatCurrency(
                                                      program.activationFee,
                                                  )
                                                : noneLabel}
                                        </td>
                                    ))}
                                </tr>
                            )}

                            <tr className="border-white/10 border-b">
                                <td className="bg-white/10 p-3 font-bold text-sm text-white">
                                    Action
                                </td>
                                {filteredPrograms.map((program, index) => (
                                    <td
                                        key={program.id}
                                        className={cn(
                                            "border-white/10 border-l p-3 text-center transition-colors",
                                            hoveredColumn === index &&
                                                "bg-white/5",
                                        )}
                                        onMouseEnter={() =>
                                            setHoveredColumn(index)
                                        }
                                        onMouseLeave={() =>
                                            setHoveredColumn(null)
                                        }
                                    >
                                        <Button
                                            variant="secondary"
                                            className="w-full"
                                            asChild
                                            size="sm"
                                        >
                                            <Link href={getCtaUrl(program)}>
                                                {ctaLabel}
                                            </Link>
                                        </Button>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {filteredPrograms.length === 0 && (
                <div className="rounded-lg border border-white/20 border-dashed bg-white/5 p-8 text-center text-white/60">
                    <p>{emptyMessage}</p>
                </div>
            )}
        </div>
    );
};
