import Link from "next/link";
import { InstrumentsTable } from "@/components/instruments-table";
import { Button } from "@/components/ui/button";
import { getPayloadClient } from "@/lib/payload";
import type { TradingInstrument } from "@/payload-types";

export const dynamic = "force-dynamic";

export default async function InstrumentsSpecificationPage() {
    const payload = await getPayloadClient();
    const result = await payload.find({
        collection: "trading-instruments",
        where: { isActive: { equals: true } },
        limit: 500,
        sort: "displayOrder",
        select: {
            id: true,
            symbol: true,
            description: true,
            market: true,
            digits: true,
            contractSize: true,
            swap: true,
            commission: true,
        },
    });

    const instruments = (result?.docs || []) as TradingInstrument[];

    return (
        <>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <Button variant="tertiary" size="tertiary" asChild>
                    <Link href="/instruments-specification">
                        Trading Instruments & Specs
                    </Link>
                </Button>
                <Button variant="ghost" size="tertiary" asChild>
                    <Link href="/instruments-specification/trading-update">
                        Trading Update
                    </Link>
                </Button>
            </div>
            <div className="mt-12">
                <InstrumentsTable instruments={instruments} />
            </div>
        </>
    );
}
