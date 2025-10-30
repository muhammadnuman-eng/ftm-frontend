"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { TradingInstrument } from "@/payload-types";

type Market = TradingInstrument["market"];

const MARKET_ORDER: Array<Market> = [
    "forex",
    "metals",
    "commodities",
    "indices",
    "crypto",
];

const MARKET_LABEL: Record<Market, string> = {
    forex: "Forex",
    metals: "Metals",
    indices: "Indices",
    crypto: "Crypto",
    commodities: "Commodities",
};

const MARKET_BADGE_STYLES: Record<Market, string> = {
    forex: "bg-emerald-500/10 text-emerald-300 ring-1 ring-inset ring-emerald-500/20",
    metals: "bg-amber-500/10 text-amber-300 ring-1 ring-inset ring-amber-500/20",
    indices: "bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-500/20",
    crypto: "bg-violet-500/10 text-violet-300 ring-1 ring-inset ring-violet-500/20",
    commodities:
        "bg-rose-500/10 text-rose-300 ring-1 ring-inset ring-rose-500/20",
};

export function InstrumentsTable({
    instruments,
}: {
    instruments: TradingInstrument[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedMarket, setSelectedMarket] = useState<"all" | Market>("all");

    const markets = MARKET_ORDER;

    const filtered = useMemo(() => {
        const list =
            selectedMarket === "all"
                ? instruments
                : instruments.filter((i) => i.market === selectedMarket);
        const getMarketRank = (market: Market) => {
            const idx = MARKET_ORDER.indexOf(market);
            return idx === -1 ? Number.POSITIVE_INFINITY : idx;
        };
        return [...list].sort((a, b) => {
            const rankA = getMarketRank(a.market);
            const rankB = getMarketRank(b.market);
            if (rankA !== rankB) return rankA - rankB;
            return a.symbol.localeCompare(b.symbol);
        });
    }, [instruments, selectedMarket]);

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl bg-black outline outline-white/10 md:overflow-visible">
                {/* Mobile market filter toolbar */}
                <div className="border-white/10 border-b px-3 py-2 md:hidden">
                    <div className="relative inline-block">
                        <button
                            type="button"
                            onClick={() => setIsOpen((v) => !v)}
                            className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-white text-xs hover:bg-white/10"
                        >
                            <span className="mr-2">
                                {selectedMarket === "all"
                                    ? "Markets"
                                    : MARKET_LABEL[selectedMarket]}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                        {isOpen ? (
                            <div className="absolute left-0 z-[20] mt-2 w-44 overflow-hidden rounded-md border border-white/10 bg-black py-1 shadow-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMarket("all");
                                        setIsOpen(false);
                                    }}
                                    className={`block w-full px-3 py-2 text-left text-sm ${selectedMarket === "all" ? "bg-white/10 text-white" : "text-stone-200 hover:bg-white/5"}`}
                                >
                                    All Markets
                                </button>
                                {markets.map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => {
                                            setSelectedMarket(m);
                                            setIsOpen(false);
                                        }}
                                        className={`block w-full px-3 py-2 text-left text-sm ${selectedMarket === m ? "bg-white/10 text-white" : "text-stone-200 hover:bg-white/5"}`}
                                    >
                                        {MARKET_LABEL[m]}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
                <table className="table-fixed md:min-w-full">
                    <thead className="">
                        <tr className="border-white/10 border-b bg-gradient-to-br from-blue-500/5 to-indigo-500/10 text-left text-white text-xs md:text-sm">
                            <th className="w-0 whitespace-nowrap px-4 py-3 font-medium">
                                Symbol
                            </th>
                            <th className="px-4 py-3 font-medium">
                                Description
                            </th>
                            <th className="hidden w-20 px-4 py-3 font-medium md:table-cell">
                                Digits
                            </th>
                            <th className="hidden w-32 px-4 py-3 font-medium md:table-cell">
                                Contract Size
                            </th>
                            <th className="hidden w-24 px-4 py-3 font-medium md:table-cell">
                                Swap
                            </th>
                            <th className="hidden w-28 px-4 py-3 font-medium md:table-cell">
                                Commission
                            </th>
                            <th className="hidden w-0 whitespace-nowrap px-4 py-3 font-medium md:table-cell">
                                <div className="relative inline-block">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen((v) => !v)}
                                        className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-white text-xs hover:bg-white/10"
                                    >
                                        <span className="mr-2">
                                            {selectedMarket === "all"
                                                ? "Markets"
                                                : MARKET_LABEL[selectedMarket]}
                                        </span>
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    {isOpen ? (
                                        <div className="absolute right-0 z-[20] mt-2 w-44 overflow-hidden rounded-md border border-white/10 bg-black py-1 shadow-xl">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMarket("all");
                                                    setIsOpen(false);
                                                }}
                                                className={`block w-full px-3 py-2 text-left text-sm ${selectedMarket === "all" ? "bg-white/10 text-white" : "text-stone-200 hover:bg-white/5"}`}
                                            >
                                                All Markets
                                            </button>
                                            {markets.map((m) => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMarket(m);
                                                        setIsOpen(false);
                                                    }}
                                                    className={`block w-full px-3 py-2 text-left text-sm ${selectedMarket === m ? "bg-white/10 text-white" : "text-stone-200 hover:bg-white/5"}`}
                                                >
                                                    {MARKET_LABEL[m]}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.length === 0 ? (
                            <tr>
                                <td
                                    className="px-4 py-6 text-stone-400"
                                    colSpan={7}
                                >
                                    No instruments found for the selected
                                    market.
                                </td>
                            </tr>
                        ) : (
                            filtered.map((ins, idx) => (
                                <tr
                                    key={ins.id}
                                    className={cn(
                                        "text-sm text-stone-200 hover:bg-yellow-500/5",
                                        idx % 2 === 0 && "bg-white/2",
                                    )}
                                >
                                    <td className="px-4 py-3 font-semibold text-white">
                                        {ins.symbol}
                                    </td>
                                    <td className="px-4 py-3 text-stone-300">
                                        <span className="line-clamp-2">
                                            {ins.description}
                                        </span>
                                        {/* Mobile market badge */}
                                        <div className="mt-1 md:hidden">
                                            <span
                                                className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-center font-medium text-[10px] ${MARKET_BADGE_STYLES[ins.market]}`}
                                            >
                                                {MARKET_LABEL[ins.market]}
                                            </span>
                                        </div>
                                        {/* Mobile-only details for hidden columns */}
                                        <div className="mt-2 space-y-[5px] md:hidden">
                                            <div className="flex items-center justify-between text-[12px]">
                                                <span className="text-stone-400">
                                                    Digits
                                                </span>
                                                <span className="text-stone-200">
                                                    {ins.digits}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[12px]">
                                                <span className="text-stone-400">
                                                    Contract Size
                                                </span>
                                                <span className="text-stone-200">
                                                    {ins.contractSize}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-[12px]">
                                                <span className="text-stone-400">
                                                    Swap
                                                </span>
                                                <span className="text-stone-200">
                                                    {ins.swap}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-[12px]">
                                                <span className="text-stone-400">
                                                    Commission
                                                </span>
                                                <span className="text-stone-200">
                                                    {ins.commission}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        {ins.digits}
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        {ins.contractSize}
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        {ins.swap}
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        {ins.commission}
                                    </td>
                                    <td className="hidden px-4 py-3 md:table-cell">
                                        <span
                                            className={`flex w-full items-center justify-center rounded px-2 py-1 text-center font-medium text-xs ${MARKET_BADGE_STYLES[ins.market]}`}
                                        >
                                            {MARKET_LABEL[ins.market]}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InstrumentsTable;
