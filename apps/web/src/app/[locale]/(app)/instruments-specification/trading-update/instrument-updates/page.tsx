import { draftMode } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import type { TradingUpdate } from "@/payload-types";

export const revalidate = 3600;

function badgeClass(isNew?: boolean | null, isUpdated?: boolean | null) {
    if (isNew)
        return "ml-2 rounded bg-green-600/20 px-2 py-0.5 text-xs text-green-400";
    if (isUpdated)
        return "ml-2 rounded bg-amber-600/20 px-2 py-0.5 text-xs text-amber-400";
    return "";
}

export default async function InstrumentUpdatesPage({
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

    const items = Array.isArray(tradingUpdates?.cryptoItems)
        ? [...tradingUpdates.cryptoItems].sort((a, b) => {
              const ao = a.displayOrder ?? 0;
              const bo = b.displayOrder ?? 0;
              return ao - bo;
          })
        : [];

    return (
        <div>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <Button className="rounded-full px-6" variant="ghost" asChild>
                    <Link href="/instruments-specification/trading-update/holidays-market-hours">
                        Holidays/Market Hours
                    </Link>
                </Button>
                <Button className="rounded-full px-6" variant="ghost" asChild>
                    <Link href="/instruments-specification/trading-update/platform-updates">
                        Platform Updates
                    </Link>
                </Button>
                <Button
                    className="rounded-full px-6"
                    variant="tertiary"
                    asChild
                >
                    <Link href="/instruments-specification/trading-update/instrument-updates">
                        Instrument Updates
                    </Link>
                </Button>
            </div>

            <div className="mx-auto mt-12 max-w-6xl px-4">
                {tradingUpdates?.instrumentDescription ? (
                    <p className="mt-4 text-center text-stone-300">
                        {tradingUpdates.instrumentDescription}
                    </p>
                ) : null}

                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {items.map((item) => {
                        const gradient =
                            item.gradientStyle === "custom" &&
                            item.customGradient
                                ? item.customGradient
                                : item.gradientStyle === "orange-red"
                                  ? "linear-gradient(135deg,#f59e0b,#ef4444)"
                                  : item.gradientStyle === "green-teal"
                                    ? "linear-gradient(135deg,#10b981,#14b8a6)"
                                    : "linear-gradient(135deg,#8b5cf6,#3b82f6)";
                        return (
                            <div
                                key={`${item.symbol}-${item.id}`}
                                className="rounded-lg border border-white/10 bg-white/5 p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex size-10 items-center justify-center rounded-md font-semibold text-sm text-white"
                                        style={{ background: gradient }}
                                    >
                                        {item.iconText ||
                                            item.symbol?.slice(0, 3)}
                                    </div>
                                    <div className="font-medium text-sm">
                                        {item.symbol}
                                        {item.isNewInstrument ? (
                                            <span
                                                className={badgeClass(
                                                    true,
                                                    false,
                                                )}
                                            >
                                                NEW
                                            </span>
                                        ) : null}
                                        {!item.isNewInstrument &&
                                        item.isUpdated ? (
                                            <span
                                                className={badgeClass(
                                                    false,
                                                    true,
                                                )}
                                            >
                                                UPDATED
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {tradingUpdates?.instrumentFooter ? (
                    <p className="mt-6 text-center text-stone-400">
                        {tradingUpdates.instrumentFooter}
                    </p>
                ) : null}
            </div>
        </div>
    );
}
