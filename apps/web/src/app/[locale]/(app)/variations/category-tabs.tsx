"use client";

import { cn } from "@/lib/utils";

interface CategoryTabsProps {
    selectedCategory: "1-step" | "2-step" | "instant";
    onCategoryChange: (category: "1-step" | "2-step" | "instant") => void;
}

const categoryConfigs = {
    "1-step": { label: "1 Step Evaluation", mobileName: "1 Step" },
    "2-step": { label: "2 Step Evaluation", mobileName: "2 Step" },
    instant: { label: "Instant Funding", mobileName: "Instant" },
} as const;

export const CategoryTabs = ({
    selectedCategory,
    onCategoryChange,
}: CategoryTabsProps) => {
    return (
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
                                    onCategoryChange(
                                        category as
                                            | "1-step"
                                            | "2-step"
                                            | "instant",
                                    )
                                }
                                className={cn(
                                    "relative flex-1 rounded px-3 py-3 font-semibold text-sm transition-all duration-300 sm:rounded-full sm:px-9 sm:py-4 sm:text-base",
                                    "whitespace-nowrap hover:text-white focus:outline-none",
                                    selectedCategory === category
                                        ? "bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                                        : "text-white/80 hover:bg-white/5 hover:text-white/80",
                                )}
                            >
                                <span className="relative z-10 hidden sm:block">
                                    {config.label}
                                </span>
                                <span className="relative z-10 block sm:hidden">
                                    {config.mobileName}
                                </span>
                            </button>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
};
