import { SectionHeader } from "@/components/section-header";

const InstrumentsSpecificationLayout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <div className="mx-auto max-w-7xl gap-6 px-4 sm:px-0">
            <SectionHeader
                title={"Trading Instruments & Platform Updates"}
                titleHighlight={["Instruments", "Updates"]}
            />
            <p className="mx-auto mt-6 max-w-md text-center text-stone-100/80 sm:text-lg sm:leading-relaxed">
                One step, two steps, or instant capital. Choose your program and
                start trading with no time limits, fast payouts, and up to 100%
                profit share.
            </p>

            <main className="mt-12">{children}</main>
        </div>
    );
};

export default InstrumentsSpecificationLayout;
