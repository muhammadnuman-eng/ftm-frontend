import type { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: string;
        positive: boolean;
    };
}

export function StatCard({ title, value, icon, trend }: StatCardProps) {
    return (
        <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-6 shadow-sm">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="mb-2 text-sm text-stone-400">{title}</p>
                    <p className="font-bold text-3xl text-white">{value}</p>
                    {trend && (
                        <div
                            className={`mt-2 flex items-center gap-1 text-sm ${
                                trend.positive
                                    ? "text-green-500"
                                    : "text-red-500"
                            }`}
                        >
                            <span>{trend.positive ? "↑" : "↓"}</span>
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
                {icon && <div className="text-stone-500">{icon}</div>}
            </div>
        </div>
    );
}
