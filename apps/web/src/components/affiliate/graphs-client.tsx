"use client";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/animate-ui/primitives/animate/tooltip";

interface GraphData {
    labels: string[];
    unpaid: number[];
    pending: number[];
    rejected: number[];
    paid: number[];
}

interface GraphsClientProps {
    graphData: GraphData;
}

export function GraphsClient({ graphData }: GraphsClientProps) {
    const maxValue = Math.max(
        ...graphData.unpaid,
        ...graphData.pending,
        ...graphData.rejected,
        ...graphData.paid,
    );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="mb-2 font-bold text-3xl text-white">Graphs</h1>
            </div>

            <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-6 shadow-sm">
                <h2 className="mb-6 font-semibold text-white text-xl">
                    Earnings
                </h2>

                {/* Legend */}
                <div className="mb-8 flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-amber-700" />
                        <span className="text-sm text-stone-300">
                            Unpaid Referral Earnings
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-indigo-700" />
                        <span className="text-sm text-stone-300">
                            Pending Referral Earnings
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-rose-700" />
                        <span className="text-sm text-stone-300">
                            Rejected Referral Earnings
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-sm bg-lime-700" />
                        <span className="text-sm text-stone-300">
                            Paid Referral Earnings
                        </span>
                    </div>
                </div>

                {/* Simple Bar Chart */}
                <TooltipProvider>
                    <div className="space-y-6">
                        {graphData.labels.map((label, idx) => {
                            const total =
                                graphData.unpaid[idx] +
                                graphData.pending[idx] +
                                graphData.rejected[idx] +
                                graphData.paid[idx];

                            if (total === 0) return null;

                            const unpaidPercent =
                                (graphData.unpaid[idx] / maxValue) * 100;
                            const pendingPercent =
                                (graphData.pending[idx] / maxValue) * 100;
                            const rejectedPercent =
                                (graphData.rejected[idx] / maxValue) * 100;
                            const paidPercent =
                                (graphData.paid[idx] / maxValue) * 100;

                            return (
                                <div key={label}>
                                    <div className="mb-2 flex items-center gap-4">
                                        <span className="w-32 text-sm text-stone-400">
                                            {label}
                                        </span>
                                        <div className="flex h-8 flex-1 gap-px rounded bg-stone-950/30 [&_div]:first:rounded-l [&_div]:last:rounded-r">
                                            {unpaidPercent > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className="h-full cursor-help bg-amber-700"
                                                            style={{
                                                                width: `${unpaidPercent}%`,
                                                                minWidth:
                                                                    "10px",
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="rounded-lg bg-stone-950 px-3 py-2 text-sm text-white shadow-lg">
                                                            <p className="font-medium">
                                                                Unpaid
                                                            </p>
                                                            <p className="text-amber-400">
                                                                $
                                                                {graphData.unpaid[
                                                                    idx
                                                                ].toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            {pendingPercent > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className="h-full cursor-help bg-indigo-700"
                                                            style={{
                                                                width: `${pendingPercent}%`,
                                                                minWidth:
                                                                    "10px",
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="rounded-lg bg-stone-950 px-3 py-2 text-sm text-white shadow-lg">
                                                            <p className="font-medium">
                                                                Pending
                                                            </p>
                                                            <p className="text-indigo-400">
                                                                $
                                                                {graphData.pending[
                                                                    idx
                                                                ].toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            {rejectedPercent > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className="h-full cursor-help bg-rose-700"
                                                            style={{
                                                                width: `${rejectedPercent}%`,
                                                                minWidth:
                                                                    "10px",
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="rounded-lg bg-stone-950 px-3 py-2 text-sm text-white shadow-lg">
                                                            <p className="font-medium">
                                                                Rejected
                                                            </p>
                                                            <p className="text-rose-400">
                                                                $
                                                                {graphData.rejected[
                                                                    idx
                                                                ].toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            {paidPercent > 0 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className="h-full cursor-help bg-lime-700"
                                                            style={{
                                                                width: `${paidPercent}%`,
                                                                minWidth:
                                                                    "10px",
                                                            }}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="rounded-lg bg-stone-950 px-3 py-2 text-sm text-white shadow-lg">
                                                            <p className="font-medium">
                                                                Paid
                                                            </p>
                                                            <p className="text-lime-400">
                                                                $
                                                                {graphData.paid[
                                                                    idx
                                                                ].toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <span className="w-20 text-right text-sm text-white">
                                            ${total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </TooltipProvider>

                {graphData.labels.length === 0 && (
                    <p className="py-8 text-center text-stone-400">
                        No earnings data available yet
                    </p>
                )}
            </div>
        </div>
    );
}
