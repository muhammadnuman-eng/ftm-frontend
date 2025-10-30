export interface ComparisonProgram {
    id: string;
    name: string;
    displayName: string;
    category: "1-Step" | "2-Step" | "Instant";
    step: string;
    dailyDrawdown: {
        percent: number;
        type: "Balance Based" | "Trailing" | "Trailing Lock" | "None";
        usdAmount: number;
    };
    overallDrawdown: {
        percent: number;
        type: "Balance Based" | "Trailing" | "Trailing Lock" | "None";
        usdAmount: number;
    };
    profitTarget: {
        percent: number;
        usdAmount: number;
    } | null;
    secondProfitTarget?: {
        percent: number;
        usdAmount: number;
    } | null;
    minTradingDays: {
        eval?: string;
        simFunded: string;
    };
    consistency: {
        eval?: string;
        simFunded: string;
    };
    profitSplit?: string | null;
    fees: {
        "5K": number;
        "10K": number;
        "25K": number;
        "50K": number;
        "100K": number;
        "150K"?: number;
        "200K"?: number;
        "300K"?: number;
    };
    discounts?: {
        [key: string]: {
            originalPrice: number;
            discountedPrice: number;
            discountAmount: number;
            discountType?: "percentage" | "fixed";
            discountValue?: number;
        };
    };
    activationFee?: number;
}

export const comparisonPrograms: ComparisonProgram[] = [
    {
        id: "1-step-nitro",
        name: "1 Step Nitro",
        displayName: "1 Step Nitro",
        category: "1-Step",
        step: "1-step-nitro",
        dailyDrawdown: {
            percent: 4,
            type: "Balance Based",
            usdAmount: 4000,
        },
        overallDrawdown: {
            percent: 6,
            type: "Trailing Lock",
            usdAmount: 6000,
        },
        profitTarget: {
            percent: 10,
            usdAmount: 10000,
        },
        secondProfitTarget: null,
        minTradingDays: {
            eval: "None",
            simFunded: "5",
        },
        consistency: {
            eval: "50%",
            simFunded: "45%",
        },
        fees: {
            "5K": 23,
            "10K": 52,
            "25K": 89,
            "50K": 149,
            "100K": 249,
            "200K": 439,
            "300K": 649,
        },
    },
    {
        id: "1-step-pro",
        name: "1 Step Nitro Pro",
        displayName: "1 Step Nitro Pro",
        category: "1-Step",
        step: "1-step-pro",
        dailyDrawdown: {
            percent: 2,
            type: "Balance Based",
            usdAmount: 2000,
        },
        overallDrawdown: {
            percent: 3,
            type: "Trailing Lock",
            usdAmount: 3000,
        },
        profitTarget: {
            percent: 8,
            usdAmount: 8000,
        },
        secondProfitTarget: null,
        minTradingDays: {
            eval: "None",
            simFunded: "None",
        },
        consistency: {
            eval: "20%",
            simFunded: "20%",
        },
        fees: {
            "5K": 15,
            "10K": 19,
            "25K": 39,
            "50K": 79,
            "100K": 139,
            "200K": 269,
            "300K": 369,
        },
    },
    {
        id: "1-step-x",
        name: "1 Step Nitro X",
        displayName: "1 Step Nitro X",
        category: "1-Step",
        step: "1-step-x",
        dailyDrawdown: {
            percent: 3,
            type: "Balance Based",
            usdAmount: 3000,
        },
        overallDrawdown: {
            percent: 3,
            type: "Trailing Lock",
            usdAmount: 3000,
        },
        profitTarget: {
            percent: 6,
            usdAmount: 6000,
        },
        secondProfitTarget: null,
        minTradingDays: {
            eval: "None",
            simFunded: "5",
        },
        consistency: {
            eval: "None",
            simFunded: "25%",
        },
        fees: {
            "5K": 0,
            "10K": 0,
            "25K": 59,
            "50K": 89,
            "100K": 119,
            "150K": 139,
        },
        activationFee: 125,
    },
    {
        id: "2-step-speed",
        name: "2 Step Speed",
        displayName: "2 Step Speed",
        category: "2-Step",
        step: "2-step-speed",
        dailyDrawdown: {
            percent: 4,
            type: "Balance Based",
            usdAmount: 4000,
        },
        overallDrawdown: {
            percent: 8,
            type: "Balance Based",
            usdAmount: 8000,
        },
        profitTarget: {
            percent: 8,
            usdAmount: 8000,
        },
        secondProfitTarget: {
            percent: 5,
            usdAmount: 5000,
        },
        minTradingDays: {
            eval: "None",
            simFunded: "5",
        },
        consistency: {
            eval: "50%",
            simFunded: "45%",
        },
        fees: {
            "5K": 70,
            "10K": 138,
            "25K": 278,
            "50K": 418,
            "100K": 678,
            "200K": 1178,
        },
    },
    {
        id: "2-step-standard",
        name: "2 Step Standard",
        displayName: "2 Step Standard",
        category: "2-Step",
        step: "2-step-standard",
        dailyDrawdown: {
            percent: 4,
            type: "Balance Based",
            usdAmount: 4000,
        },
        overallDrawdown: {
            percent: 10,
            type: "Balance Based",
            usdAmount: 10000,
        },
        profitTarget: {
            percent: 10,
            usdAmount: 10000,
        },
        secondProfitTarget: {
            percent: 5,
            usdAmount: 5000,
        },
        minTradingDays: {
            eval: "None",
            simFunded: "5",
        },
        consistency: {
            eval: "50%",
            simFunded: "45%",
        },
        fees: {
            "5K": 78,
            "10K": 158,
            "25K": 298,
            "50K": 458,
            "100K": 718,
            "200K": 1258,
        },
    },
    {
        id: "2-step-plus",
        name: "2 Step Plus",
        displayName: "2 Step Plus",
        category: "2-Step",
        step: "2-step-plus",
        dailyDrawdown: {
            percent: 4,
            type: "Balance Based",
            usdAmount: 4000,
        },
        overallDrawdown: {
            percent: 10,
            type: "Balance Based",
            usdAmount: 10000,
        },
        profitTarget: {
            percent: 10,
            usdAmount: 10000,
        },
        secondProfitTarget: {
            percent: 5,
            usdAmount: 5000,
        },
        minTradingDays: {
            eval: "3",
            simFunded: "5",
        },
        consistency: {
            eval: "None",
            simFunded: "45%",
        },
        fees: {
            "5K": 29,
            "10K": 59,
            "25K": 119,
            "50K": 179,
            "100K": 299,
            "200K": 549,
        },
    },
    {
        id: "instant-standard",
        name: "Instant Standard",
        displayName: "Instant Standard",
        category: "Instant",
        step: "1-step-instant",
        dailyDrawdown: {
            percent: 3,
            type: "Balance Based",
            usdAmount: 3000,
        },
        overallDrawdown: {
            percent: 5,
            type: "Trailing",
            usdAmount: 5000,
        },
        profitTarget: null,
        secondProfitTarget: null,
        minTradingDays: {
            simFunded: "5",
        },
        consistency: {
            simFunded: "20%",
        },
        fees: {
            "5K": 69,
            "10K": 99,
            "25K": 179,
            "50K": 389,
            "100K": 769,
        },
    },
    {
        id: "instant-pro",
        name: "Instant Pro",
        displayName: "Instant Pro",
        category: "Instant",
        step: "instant-pro",
        dailyDrawdown: {
            percent: 0,
            type: "None",
            usdAmount: 0,
        },
        overallDrawdown: {
            percent: 3,
            type: "Trailing",
            usdAmount: 3000,
        },
        profitTarget: null,
        secondProfitTarget: null,
        minTradingDays: {
            simFunded: "5",
        },
        consistency: {
            simFunded: "20%",
        },
        fees: {
            "5K": 49,
            "10K": 79,
            "25K": 139,
            "50K": 279,
            "100K": 539,
        },
    },
    {
        id: "instant-plus",
        name: "Instant Plus",
        displayName: "Instant Plus",
        category: "Instant",
        step: "instant-plus",
        dailyDrawdown: {
            percent: 3,
            type: "Balance Based",
            usdAmount: 3000,
        },
        overallDrawdown: {
            percent: 6,
            type: "Trailing",
            usdAmount: 6000,
        },
        profitTarget: null,
        secondProfitTarget: null,
        minTradingDays: {
            simFunded: "5",
        },
        consistency: {
            simFunded: "20%",
        },
        fees: {
            "5K": 47,
            "10K": 74,
            "25K": 136,
            "50K": 273,
            "100K": 530,
        },
    },
];

export type FilterType = "All" | "1-Step" | "2-Step" | "Instant";
export type ProgramType = "All" | string;
export type SizeType =
    | "5K"
    | "10K"
    | "25K"
    | "50K"
    | "100K"
    | "150K"
    | "200K"
    | "300K";
export type DrawdownType =
    | "All"
    | "Balance Based"
    | "Trailing"
    | "Trailing Lock";
export type InfoType =
    | "All"
    | "Daily DD"
    | "Overall DD"
    | "Profit Target"
    | "2nd Profit Target"
    | "Min Trading Days"
    | "Consistency"
    | "Profit Split"
    | "Fee"
    | "Activation Fee";

export interface FilterState {
    types: FilterType;
    programs: ProgramType;
    size: SizeType;
    drawdown: DrawdownType;
    info: InfoType;
}
