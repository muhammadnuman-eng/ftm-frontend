import {
    ChartCandlestickIcon,
    ChartNoAxesCombinedIcon,
    CircleSlash2Icon,
} from "lucide-react";
import { BarsAnimation } from "./animations/bars";
import { FlashAnimation } from "./animations/flash";
import { SectionHeader } from "./section-header";
import { Marquee } from "./ui/marquee";

interface TradingFeaturesContent {
    dividerTitle: string;
    title: string;
    titleHighlight: string;
    description: string;
    features: {
        title: string;
        description: string;
        layout:
            | "large-left"
            | "top-right"
            | "bottom-left"
            | "large-bottom-right";
        id?: string | null;
        animation?: string;
        animationComponent?: React.ReactElement;
    }[];
}

interface TradingFeaturesProps {
    content?: TradingFeaturesContent;
}

export const TradingFeaturesSection = ({ content }: TradingFeaturesProps) => {
    // Default fallback content if no CMS content provided
    const defaultContent: TradingFeaturesContent = {
        dividerTitle: "Best Prop Trading Solutions",
        title: "Fast Execution on\nLeading Trading Platforms",
        titleHighlight: "Leading",
        description:
            "Trade forex, commodities, and indices in liquid markets with advanced charts and fast execution.",
        features: [
            {
                title: "Multiple Trading Platforms",
                description:
                    "We equip our traders with world-class platforms that provide the best trading experience",
                layout: "large-left",
            },
            {
                title: "Swap Free",
                description:
                    "Trade without overnight fees with swap-free accounts. Applicable on All accounts without additional charge.",
                layout: "top-right",
                animation: "swap-free",
            },
            {
                title: "Up to 1:100 Leverage",
                description:
                    "We equip our traders with world-class platforms that provide the best trading experience",
                layout: "bottom-left",
                animation: "leverage",
            },
            {
                title: "Trade Different Markets",
                description:
                    "Forex, Commodities, Indices & more, trade your favorite markets across multiple platforms, your way!",
                layout: "large-bottom-right",
                animationComponent: <BarsAnimation />,
            },
        ],
    };

    const sectionContent = content || defaultContent;

    // Helper function to get CSS classes and content based on layout
    const getFeatureCardProps = (
        feature: TradingFeaturesContent["features"][0],
    ) => {
        switch (feature.layout) {
            case "large-left":
                return {
                    containerClass: "flex p-px lg:col-span-4",
                    cardClass:
                        "w-full overflow-hidden rounded-lg bg-gradient-to-tr from-indigo-900/20 to-blue-800/20 outline outline-white/10 max-lg:rounded-t-4xl lg:rounded-tl-4xl",
                    contentClass:
                        "flex h-full flex-col p-4 sm:p-10 lg:flex-row lg:items-center",
                    showPlatforms: true,
                };
            case "top-right":
                return {
                    containerClass: "flex p-px lg:col-span-2",
                    cardClass:
                        "w-full overflow-hidden rounded-lg bg-gradient-to-tr from-indigo-900/20 to-blue-800/20 outline outline-white/10 lg:rounded-tr-4xl",
                    contentClass: "flex h-full flex-col",
                    showPlatforms: false,
                    animation: "swap-free",
                };
            case "bottom-left":
                return {
                    containerClass: "flex p-px lg:col-span-3",
                    cardClass:
                        "w-full overflow-hidden rounded-lg bg-gradient-to-tr from-indigo-900/20 to-blue-800/20 outline outline-white/10 lg:rounded-bl-4xl",
                    contentClass: "p-4 sm:p-10",
                    showPlatforms: false,
                    animation: "leverage",
                };
            case "large-bottom-right":
                return {
                    containerClass: "flex p-px lg:col-span-3",
                    cardClass:
                        "w-full overflow-hidden rounded-lg bg-gradient-to-tr from-indigo-900/20 to-blue-800/20 outline outline-white/10 max-lg:rounded-b-4xl lg:rounded-br-4xl",
                    contentClass: "p-4 sm:p-10",
                    showPlatforms: false,
                    animationComponent: <BarsAnimation />,
                };
            default:
                return {
                    containerClass: "flex p-px lg:col-span-2",
                    cardClass:
                        "w-full overflow-hidden rounded-lg bg-gradient-to-tr from-indigo-900/20 to-blue-800/20 outline outline-white/10",
                    contentClass: "p-4 sm:p-10",
                    showPlatforms: false,
                };
        }
    };

    return (
        <div className="relative mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
            <SectionHeader
                dividerTitle={sectionContent.dividerTitle}
                title={sectionContent.title}
                titleHighlight={sectionContent.titleHighlight}
                description={sectionContent.description}
                animation={<FlashAnimation />}
            />

            <div className="relative hidden sm:block">
                <div
                    aria-hidden="true"
                    className="-top-3 absolute inset-x-0 transform-gpu overflow-hidden px-24 blur-3xl"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="mx-auto aspect-1155/678 w-288.75 bg-linear-to-tr from-blue-500 to-indigo-500 opacity-20"
                    />
                </div>

                {/* Dynamic Trading Features Bento Grid */}
                <div className="relative mt-10 grid grid-cols-1 gap-2 text-center sm:mt-16 sm:gap-4 sm:text-left lg:grid-cols-6">
                    {sectionContent.features.map((feature, index) => {
                        const cardProps = getFeatureCardProps(feature);

                        return (
                            <div
                                key={feature.id || index}
                                className={cardProps.containerClass}
                            >
                                <div className={cardProps.cardClass}>
                                    <div className={cardProps.contentClass}>
                                        {cardProps.showPlatforms ? (
                                            // Large left card with platforms
                                            <>
                                                <div className="flex h-full flex-col justify-center lg:flex-1">
                                                    <h3 className="font-bold text-lg text-white sm:text-2xl">
                                                        {feature.title}
                                                    </h3>
                                                    <p className="mt-2 max-w-lg text-sm/6 text-white/70">
                                                        {feature.description}
                                                    </p>
                                                </div>
                                                <div className="mt-4 lg:mt-6 lg:flex-1">
                                                    <div className="relative select-none space-y-8">
                                                        <Marquee
                                                            fade
                                                            fadeWidth="25%"
                                                        >
                                                            {/* biome-ignore lint/performance/noImgElement: remote image */}
                                                            <img
                                                                className="h-10"
                                                                src="https://framerusercontent.com/images/oBEHl5CNFJ2iA8Aj9GTkarFyuQ.png"
                                                                alt="MetaTrader 5"
                                                            />
                                                            {/* biome-ignore lint/performance/noImgElement: remote image */}
                                                            <img
                                                                className="h-10"
                                                                src="https://framerusercontent.com/images/mjyKCNIChnQrl17iZp2EmwvK6W4.png"
                                                                alt="Match-Trade Technologies"
                                                            />
                                                        </Marquee>
                                                        <Marquee
                                                            reverse
                                                            fade
                                                            fadeWidth="25%"
                                                        >
                                                            {/* biome-ignore lint/performance/noImgElement: remote image */}
                                                            <img
                                                                className="h-10"
                                                                src="https://framerusercontent.com/images/9IFm2Fl5ledIA1qNInynM4BqSTM.png"
                                                                alt="Trade Locker"
                                                            />
                                                            {/* biome-ignore lint/performance/noImgElement: remote image */}
                                                            <img
                                                                className="h-10"
                                                                src="https://framerusercontent.com/images/fqa1XpwDdykbE8TfZMraP3DLjk4.png"
                                                                alt="CTrader"
                                                            />
                                                        </Marquee>
                                                    </div>
                                                </div>
                                            </>
                                        ) : feature.layout === "top-right" ? (
                                            // Top right card with animation space
                                            <div className="p-4 sm:p-10">
                                                <div className="flex items-center gap-4">
                                                    <CircleSlash2Icon
                                                        className="size-8 text-white"
                                                        strokeWidth={1.5}
                                                    />
                                                    <h3 className="font-bold text-lg text-white sm:text-2xl">
                                                        {feature.title}
                                                    </h3>
                                                </div>
                                                <p className="mt-2 text-sm text-white/70 sm:text-base">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        ) : feature.layout === "bottom-left" ? (
                                            // Bottom left card with centered animation
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <ChartCandlestickIcon
                                                        className="size-8 text-white"
                                                        strokeWidth={1.5}
                                                    />
                                                    <h3 className="font-bold text-lg text-white sm:text-2xl">
                                                        {feature.title}
                                                    </h3>
                                                </div>
                                                <p className="mt-2 text-sm text-white/70 sm:text-base">
                                                    {feature.description}
                                                </p>
                                            </>
                                        ) : (
                                            // Large bottom right card
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <ChartNoAxesCombinedIcon
                                                        className="size-8 text-white"
                                                        strokeWidth={1.5}
                                                    />
                                                    <h3 className="font-bold text-lg text-white sm:text-2xl">
                                                        {feature.title}
                                                    </h3>
                                                </div>
                                                <p className="mt-2 max-w-lg text-sm text-white/70 sm:text-base">
                                                    {feature.description}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="block sm:hidden">
                <div className="relative select-none space-y-8">
                    <Marquee fade fadeWidth="25%">
                        {/* biome-ignore lint/performance/noImgElement: remote image */}
                        <img
                            className="h-10"
                            src="https://framerusercontent.com/images/oBEHl5CNFJ2iA8Aj9GTkarFyuQ.png"
                            alt="MetaTrader 5"
                        />
                        {/* biome-ignore lint/performance/noImgElement: remote image */}
                        <img
                            className="h-10"
                            src="https://framerusercontent.com/images/mjyKCNIChnQrl17iZp2EmwvK6W4.png"
                            alt="Match-Trade Technologies"
                        />
                    </Marquee>
                    <Marquee reverse fade fadeWidth="25%">
                        {/* biome-ignore lint/performance/noImgElement: remote image */}
                        <img
                            className="h-10"
                            src="https://framerusercontent.com/images/9IFm2Fl5ledIA1qNInynM4BqSTM.png"
                            alt="Trade Locker"
                        />
                        {/* biome-ignore lint/performance/noImgElement: remote image */}
                        <img
                            className="h-10"
                            src="https://framerusercontent.com/images/fqa1XpwDdykbE8TfZMraP3DLjk4.png"
                            alt="CTrader"
                        />
                    </Marquee>
                </div>
            </div>
        </div>
    );
};
