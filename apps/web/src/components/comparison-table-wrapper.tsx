import type { FilterType } from "@/data/comparison";
import { transformProgramsToComparison } from "@/data/comparison-payload";
import { getPrograms } from "@/data/programs";
import { ComparisonTable } from "./comparison-table";

interface ComparisonTableWrapperProps {
    type?: FilterType;
    locale: string;
}

export const ComparisonTableWrapper = async ({
    type = "All",
    locale,
}: ComparisonTableWrapperProps) => {
    const programs = await getPrograms(undefined, { locale });
    const comparisonPrograms = transformProgramsToComparison(programs);

    return <ComparisonTable type={type} programs={comparisonPrograms} />;
};
