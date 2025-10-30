export interface PricingTier {
    accountSize: string;
    price: number;
}

export interface Feature {
    key: string;
    label: string;
    value: string | boolean;
    meta?: {
        badge?: "new" | "popular" | "recommended";
        emphasized?: boolean;
        tooltip?: string;
    };
}

export interface PricingPlan {
    id: string;
    category: "1-step" | "2-step" | "instant";
    name: string;
    isNewPlan?: boolean;
    isPopular?: boolean;
    tiers: PricingTier[];
    features: Feature[];
}

export interface CategoryContent {
    category: "1-step" | "2-step" | "instant";
    title: string;
    description: string;
    benefits: string[];
}

export const categoryContent: CategoryContent[] = [
    {
        category: "instant",
        title: "Instant Funding Account",
        description:
            "Get funded instantly and start trading real money immediately. Perfect for experienced traders who want to skip the evaluation process.",
        benefits: [
            "No waiting period - trade immediately",
            "Lower drawdown limits for safer trading",
            "Competitive profit splits up to 80%",
        ],
    },
    {
        category: "1-step",
        title: "1-Step Evaluation Program",
        description:
            "Complete just one evaluation phase to prove your trading skills. A streamlined path to funded trading with competitive profit targets.",
        benefits: [
            "Single evaluation phase",
            "Higher profit targets and splits up to 100%",
            "Consistency score tracking",
        ],
    },
    {
        category: "2-step",
        title: "2-Step Trading Challenge",
        description:
            "Traditional two-phase evaluation process that thoroughly tests your consistency and risk management before funding.",
        benefits: [
            "Comprehensive evaluation process",
            "Higher drawdown limits for flexibility",
            "Profit splits up to 100%",
        ],
    },
];

export const pricingPlans: PricingPlan[] = [
    {
        id: "nitro",
        category: "1-step",
        name: "1 Step Nitro",
        isPopular: true,
        tiers: [
            { accountSize: "$5K", price: 23 },
            { accountSize: "$10K", price: 52 },
            { accountSize: "$25K", price: 89 },
            { accountSize: "$50K", price: 149 },
            { accountSize: "$100K", price: 249 },
            { accountSize: "$200K", price: 439 },
            { accountSize: "$300K", price: 649 },
        ],
        features: [
            { key: "profitTarget", label: "Profit Target", value: "10%" },
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "6%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "4%",
            },
            { key: "profitSplit", label: "Profit Split", value: "Up to 100%" },
            { key: "evaluationPhase", label: "Evaluation Phase", value: "Yes" },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$23.00",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "nitro-pro",
        category: "1-step",
        name: "1 Step Nitro Pro",
        tiers: [
            { accountSize: "$5K", price: 15 },
            { accountSize: "$10K", price: 19 },
            { accountSize: "$25K", price: 39 },
            { accountSize: "$50K", price: 79 },
            { accountSize: "$100K", price: 139 },
            { accountSize: "$200K", price: 269 },
            { accountSize: "$300K", price: 369 },
        ],
        features: [
            { key: "profitTarget", label: "Profit Target", value: "8%" },
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "3%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "2%",
            },
            { key: "profitSplit", label: "Profit Split", value: "Up to 100%" },
            { key: "evaluationPhase", label: "Evaluation Phase", value: "Yes" },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$15.00",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "nitrox",
        category: "1-step",
        name: "1 Step Nitro X",
        isNewPlan: true,
        tiers: [
            { accountSize: "$25K", price: 59 },
            { accountSize: "$50K", price: 89 },
            { accountSize: "$100K", price: 119 },
            { accountSize: "$150K", price: 139 },
        ],
        features: [
            { key: "profitTarget", label: "Profit Target", value: "6%" },
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "3%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "3%",
            },
            { key: "profitSplit", label: "Profit Split", value: "Up to 100%" },
            {
                key: "evaluationPhase",
                label: "Evaluation Phase",
                value: "NO",
                meta: { badge: "new" },
            },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            { key: "activationFee", label: "Activation Fee", value: "$125" },
            { key: "resetFee", label: "Reset Fee", value: "$59" },
            {
                key: "fee",
                label: "Fee",
                value: "$59.00",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "2-step-speed",
        category: "2-step",
        name: "2 Step Speed",
        tiers: [
            { accountSize: "$5K", price: 70 },
            { accountSize: "$10K", price: 138 },
            { accountSize: "$25K", price: 278 },
            { accountSize: "$50K", price: 418 },
            { accountSize: "$100K", price: 678 },
            { accountSize: "$200K", price: 1178 },
        ],
        features: [
            {
                key: "targetPhase1",
                label: "Target Phase #1",
                value: "8%",
            },
            {
                key: "targetPhase2",
                label: "Target Phase #2",
                value: "5%",
            },
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "8%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "4%",
            },
            { key: "profitSplit", label: "Profit Split", value: "Up to 100%" },
            {
                key: "evaluationPhases",
                label: "Evaluation Phases",
                value: "Yes",
            },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$35.00",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "2-step-standard",
        category: "2-step",
        name: "2 Step Standard",
        isPopular: true,
        tiers: [
            { accountSize: "$5K", price: 78 },
            { accountSize: "$10K", price: 158 },
            { accountSize: "$25K", price: 298 },
            { accountSize: "$50K", price: 458 },
            { accountSize: "$100K", price: 718 },
            { accountSize: "$200K", price: 1258 },
        ],
        features: [
            {
                key: "targetPhase1",
                label: "Target Phase #1",
                value: "10%",
            },
            {
                key: "targetPhase2",
                label: "Target Phase #2",
                value: "5%",
            },
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "10%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "4%",
            },
            { key: "profitSplit", label: "Profit Split", value: "Up to 100%" },
            {
                key: "evaluationPhases",
                label: "Evaluation Phases",
                value: "Yes",
            },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$39.00",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "2-step-plus",
        category: "2-step",
        name: "2 Step Plus",
        isNewPlan: true,
        tiers: [
            { accountSize: "$5K", price: 29 },
            { accountSize: "$10K", price: 59 },
            { accountSize: "$25K", price: 119 },
            { accountSize: "$50K", price: 179 },
            { accountSize: "$100K", price: 299 },
            { accountSize: "$200K", price: 549 },
        ],
        features: [
            {
                key: "targetPhase1",
                label: "Target Phase #1",
                value: "10%",
            },
            {
                key: "targetPhase2",
                label: "Target Phase #2",
                value: "5%",
            },
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "10%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "4%",
            },
            { key: "profitSplit", label: "Profit Split", value: "80%" },
            {
                key: "evaluationPhases",
                label: "Evaluation Phases",
                value: "Yes",
            },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$29.00",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "instant-standard",
        category: "instant",
        name: "Instant Standard",
        tiers: [
            { accountSize: "$5K", price: 69 },
            { accountSize: "$10K", price: 99 },
            { accountSize: "$25K", price: 179 },
            { accountSize: "$50K", price: 389 },
            { accountSize: "$100K", price: 769 },
        ],
        features: [
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "5%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "3%",
            },
            { key: "profitSplit", label: "Profit Split", value: "Up to 80%" },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$69",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "instant-pro",
        category: "instant",
        name: "Instant Pro",
        tiers: [
            { accountSize: "$5K", price: 49 },
            { accountSize: "$10K", price: 79 },
            { accountSize: "$25K", price: 139 },
            { accountSize: "$50K", price: 279 },
            { accountSize: "$100K", price: 539 },
        ],
        features: [
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "3%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "none",
            },
            { key: "profitSplit", label: "Profit Split", value: "Up to 80%" },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$49",
                meta: { emphasized: true },
            },
        ],
    },
    {
        id: "instant-plus",
        category: "instant",
        name: "Instant Plus",
        isNewPlan: true,
        tiers: [
            { accountSize: "$5K", price: 47 },
            { accountSize: "$10K", price: 74 },
            { accountSize: "$25K", price: 136 },
            { accountSize: "$50K", price: 273 },
            { accountSize: "$100K", price: 530 },
        ],
        features: [
            {
                key: "maxOverallDrawdown",
                label: "Max Overall Drawdown %",
                value: "6%",
            },
            {
                key: "maxDailyDrawdown",
                label: "Max Daily Drawdown %",
                value: "3%",
            },
            { key: "profitSplit", label: "Profit Split", value: "80%" },
            { key: "simulatedFunded", label: "Simulated Funded", value: true },
            {
                key: "fee",
                label: "Fee",
                value: "$47",
                meta: { emphasized: true },
            },
        ],
    },
];
