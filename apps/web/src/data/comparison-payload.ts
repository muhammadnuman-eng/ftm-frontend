import type { ComparisonProgram } from "./comparison";
import type { ProgramWithDiscounts } from "./programs";
import { getPrograms } from "./programs";

// Transform Payload programs to comparison format
export const transformProgramsToComparison = (
    programs: ProgramWithDiscounts[],
): ComparisonProgram[] => {
    return programs.map((program) => {
        // Build fees object from pricing tiers with required keys present
        const fees: ComparisonProgram["fees"] = {
            "5K": 0,
            "10K": 0,
            "25K": 0,
            "50K": 0,
            "100K": 0,
        };
        if (program.pricingTiers) {
            program.pricingTiers.forEach((tier) => {
                const size = tier.accountSize
                    .replace("$", "")
                    .replace("K", "K");
                switch (size) {
                    case "5K":
                        fees["5K"] = tier.price;
                        break;
                    case "10K":
                        fees["10K"] = tier.price;
                        break;
                    case "25K":
                        fees["25K"] = tier.price;
                        break;
                    case "50K":
                        fees["50K"] = tier.price;
                        break;
                    case "100K":
                        fees["100K"] = tier.price;
                        break;
                    case "150K":
                        fees["150K"] = tier.price as number;
                        break;
                    case "200K":
                        fees["200K"] = tier.price as number;
                        break;
                    case "300K":
                        fees["300K"] = tier.price as number;
                        break;
                    default:
                        break;
                }
            });
        }

        // Build discounts object from program discounts
        const discounts: ComparisonProgram["discounts"] = {};
        if (program.discounts) {
            Object.entries(program.discounts).forEach(([key, value]) => {
                // Convert account size format from "$100K" to "100K" for comparison table
                const size = key.replace("$", "");
                discounts[size] = value;
            });
        }

        // Determine category display name
        const categoryMap: Record<string, "1-Step" | "2-Step" | "Instant"> = {
            "1-step": "1-Step",
            "2-step": "2-Step",
            instant: "Instant",
        };

        // Check if it's an instant program
        const isInstant = program.category === "instant";

        return {
            id: program.slug,
            name: program.name,
            displayName: program.name,
            category: categoryMap[program.category] || "1-Step",
            step: program.slug,
            dailyDrawdown: {
                percent: program.dailyDrawdown?.percent || 0,
                type: program.dailyDrawdown?.type || "Balance Based",
                usdAmount: 0, // Calculated dynamically in the component based on selected account size
            },
            overallDrawdown: {
                percent: program.overallDrawdown?.percent || 0,
                type: program.overallDrawdown?.type || "Balance Based",
                usdAmount: 0, // Calculated dynamically in the component based on selected account size
            },
            profitTarget: isInstant
                ? null
                : program.profitTarget?.percent
                  ? {
                        percent: program.profitTarget.percent,
                        usdAmount: 0, // Calculated dynamically in the component based on selected account size
                    }
                  : null,
            secondProfitTarget: program.secondProfitTarget?.percent
                ? {
                      percent: program.secondProfitTarget.percent,
                      usdAmount: 0, // Calculated dynamically in the component based on selected account size
                  }
                : null,
            minTradingDays: {
                eval: program.minTradingDays?.evaluation || undefined,
                simFunded: program.minTradingDays?.simFunded || "5",
            },
            consistency: {
                eval: program.consistencyScore?.evaluation || undefined,
                simFunded: program.consistencyScore?.simFunded || "45%",
            },
            profitSplit: program.profitSplit || null,
            fees,
            discounts:
                Object.keys(discounts).length > 0 ? discounts : undefined,
            activationFee: program.activationFee || undefined,
        };
    });
};

// Main function to get comparison data from Payload
export const getComparisonPrograms = async (): Promise<ComparisonProgram[]> => {
    const programs = await getPrograms();
    return transformProgramsToComparison(programs);
};
