import Link from "next/link";
import { Button } from "@/components/ui/button";

const TradingUpdateLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <Button variant="ghost" size="tertiary" asChild>
                    <Link href="/instruments-specification">
                        Trading Instruments & Specs
                    </Link>
                </Button>
                <Button variant="tertiary" size="tertiary" asChild>
                    <Link href="/instruments-specification/trading-update">
                        Trading Update
                    </Link>
                </Button>
            </div>
            <div className="mt-12">{children}</div>
        </>
    );
};

export default TradingUpdateLayout;
