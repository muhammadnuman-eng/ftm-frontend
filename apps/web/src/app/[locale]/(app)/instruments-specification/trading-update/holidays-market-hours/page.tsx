import { draftMode } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import { cn } from "@/lib/utils";
import type { TradingUpdate } from "@/payload-types";

export const revalidate = 3600;

function getOrdinalSuffix(day: number): string {
    const teenRange = day % 100;
    if (teenRange >= 11 && teenRange <= 13) return "th";
    switch (day % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
    }
}

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;

        const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
        const day = date.getDate();
        const month = date.toLocaleDateString("en-US", { month: "long" });
        const suffix = getOrdinalSuffix(day);

        return `${weekday} ${day}${suffix} of ${month}`;
    } catch {
        return dateString;
    }
}

export default async function HolidaysMarketHoursPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { isEnabled: isDraftMode } = await draftMode();
    const payload = await getPayloadClient();
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);

    const tradingUpdates = (await payload.findGlobal({
        slug: "trading-updates",
        draft: isDraftMode,
        locale,
        depth: 0,
    })) as TradingUpdate;

    type ScheduleMatrix = {
        dateCols?: { id: string; selectedDate: string }[];
        scheduleTable?: Record<
            string,
            { columnIndex: number; status: string }[]
        >;
    };

    function isScheduleMatrix(value: unknown): value is ScheduleMatrix {
        return typeof value === "object" && value !== null;
    }

    const matrix = tradingUpdates?.scheduleMatrix;
    const dateCols = isScheduleMatrix(matrix) ? matrix.dateCols : undefined;
    const scheduleTable = isScheduleMatrix(matrix)
        ? matrix.scheduleTable
        : undefined;

    const colIndexById = new Map(
        (Array.isArray(dateCols) ? dateCols : []).map((c, i) => [c.id, i + 1]),
    );

    const instrumentOrder = [
        "wti",
        "xauusd",
        "xagusd",
        "eurusd",
        "gbpusd",
        "usdjpy",
        "us30",
        "nas100",
        "spx500",
        "btcusd",
    ];

    const instrumentLabel: Record<string, string> = {
        wti: "WTI",
        xauusd: "XAUUSD (Gold)",
        xagusd: "XAGUSD (Silver)",
        eurusd: "EURUSD",
        gbpusd: "GBPUSD",
        usdjpy: "USDJPY",
        us30: "US30 (Dow Jones)",
        nas100: "NAS100 (Nasdaq)",
        spx500: "SPX500 (S&P 500)",
        btcusd: "BTCUSD (Bitcoin)",
    };

    return (
        <div>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <Button
                    className="rounded-full px-6"
                    variant="tertiary"
                    asChild
                >
                    <Link href="/instruments-specification/trading-update/holidays-market-hours">
                        Holidays/Market Hours
                    </Link>
                </Button>
                <Button className="rounded-full px-6" variant="ghost" asChild>
                    <Link href="/instruments-specification/trading-update/platform-updates">
                        Platform Updates
                    </Link>
                </Button>
                <Button className="rounded-full px-6" variant="ghost" asChild>
                    <Link href="/instruments-specification/trading-update/instrument-updates">
                        Instrument Updates
                    </Link>
                </Button>
            </div>

            <div className="mx-auto mt-12 max-w-5xl px-4">
                <h2 className="text-center font-semibold text-2xl">
                    {tradingUpdates?.holidayTitle || "Trading Schedule"}
                </h2>
                {tradingUpdates?.holidayDescription ? (
                    <p className="mt-4 text-center text-stone-300">
                        {tradingUpdates.holidayDescription}
                    </p>
                ) : null}

                {Array.isArray(dateCols) && dateCols.length > 0 && (
                    <div className="mx-auto mt-8 max-w-2xl overflow-hidden overflow-x-auto rounded-lg border border-white/20 bg-black">
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr>
                                    <th className="border-white/10 border-b px-4 py-3 text-left font-medium text-sm text-stone-300">
                                        Instrument
                                    </th>
                                    {dateCols.map((col) => (
                                        <th
                                            key={col.id}
                                            className="border-white/10 border-b border-l px-4 py-3 font-medium text-sm text-stone-300"
                                        >
                                            {formatDate(col.selectedDate)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {instrumentOrder.map((key, rowIdx) => (
                                    <tr
                                        key={key}
                                        className={cn(
                                            "hover:bg-yellow-500/10",
                                            rowIdx % 2 === 0
                                                ? "bg-white/5"
                                                : "",
                                        )}
                                    >
                                        <td className="px-4 py-3 font-medium text-sm">
                                            {instrumentLabel[key] || key}
                                        </td>
                                        {dateCols.map((col) => {
                                            const entries =
                                                scheduleTable?.[key] || [];
                                            const match = entries.find(
                                                (e) =>
                                                    e.columnIndex ===
                                                    (colIndexById.get(col.id) ??
                                                        -1),
                                            );
                                            return (
                                                <td
                                                    key={`${key}-${col.id}`}
                                                    className="border-white/10 border-l px-4 py-3 text-center text-sm text-stone-200"
                                                >
                                                    {match?.status || "-"}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tradingUpdates?.holidayFooter ? (
                    <p className="mt-6 text-center text-stone-400">
                        {tradingUpdates.holidayFooter}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
