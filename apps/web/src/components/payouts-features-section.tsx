import { ClockAnimation } from "./animations/clock";
import { SectionHeader } from "./section-header";

interface PayoutsFeaturesContent {
    dividerTitle: string;
    title: string;
    titleHighlight: string;
    description: string;
    features: {
        title: string;
        description: string;
        position: "left-tall" | "top-right" | "bottom-middle" | "right-tall";
        id?: string | null;
    }[];
}

interface PayoutsFeaturesProps {
    content?: PayoutsFeaturesContent;
}

export const PayoutsFeaturesSection = ({ content }: PayoutsFeaturesProps) => {
    const leftImage = "profit-split";
    const rightImage = "avg-processing-time";

    // Default fallback content if no CMS content provided
    const defaultContent: PayoutsFeaturesContent = {
        dividerTitle: "Get Paid Fast",
        title: "Reliable, On-Time\n Payouts Guaranteed",
        titleHighlight: "Guaranteed",
        description:
            "Enjoy fast payouts with our trusted forex prop firm built for funded traders.",
        features: [
            {
                title: "Generous Profit Split",
                description:
                    "With us, keep up to 100% of your rewards on our evaluation programs. And up to 80% on our instant funding challenges.",
                position: "left-tall",
            },
            {
                title: "On-Demand Payout",
                description:
                    "Criteria met? Withdraw instantly. No more 30-day, 14-day or 7-day cycles. Hundreds of proof reviews on discord and payout junction!",
                position: "top-right",
            },
            {
                title: "24 Hours or Double Payout",
                description:
                    "We guarantee payouts in 24 hours or less. If we're late, we double your payout and give you a free account. No excuses. Full confidence.",
                position: "bottom-middle",
            },
            {
                title: "Average Processing Time",
                description:
                    "Most payouts are completed in under 2 hours. We move faster than the industry standard, backed by a 24-hour guarantee.",
                position: "right-tall",
            },
        ],
    };

    const sectionContent = content || defaultContent;

    // Helper function to render image/video content
    const renderImageContent = (imageName: string) => {
        return (
            <div className="flex items-center justify-center">
                {/* Mobile: Use original GIF for best quality */}
                {/** biome-ignore lint/performance/noImgElement: dont use next/image */}
                <img
                    className="pointer-events-none h-36 rounded-lg bg-transparent md:hidden"
                    src={`/animations/${imageName}.gif`}
                    alt=""
                    loading="lazy"
                    style={{ backgroundColor: "transparent" }}
                />

                {/* Desktop Safari: Use original GIF for transparency + quality */}
                {/** biome-ignore lint/performance/noImgElement: dont use next/image */}
                <img
                    className="pointer-events-none hidden h-52 rounded-lg bg-transparent md:safari:block"
                    src={`/animations/${imageName}.gif`}
                    alt=""
                    loading="lazy"
                    style={{ backgroundColor: "transparent" }}
                />

                {/* Desktop non-Safari: Use video for better performance */}
                <video
                    className="pointer-events-none hidden h-52 rounded-lg bg-transparent md:non-safari:block"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    style={{ backgroundColor: "transparent" }}
                >
                    <source
                        src={`/animations/${imageName}.webm`}
                        type="video/webm"
                    />
                    <source
                        src={`/animations/${imageName}_h264.mp4`}
                        type="video/mp4"
                    />
                </video>
            </div>
        );
    };

    // Helper function to get CSS classes based on position
    const getPositionClasses = (position: string) => {
        switch (position) {
            case "left-tall":
                return {
                    container: "relative lg:row-span-2",
                    gradient:
                        "absolute inset-px rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5 lg:rounded-l-4xl",
                    content:
                        "relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-l-[calc(2rem+1px)]",
                    padding: "px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0",
                };
            case "top-right":
                return {
                    container: "relative max-lg:row-start-1",
                    gradient:
                        "absolute inset-px rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5 max-lg:rounded-t-4xl",
                    content:
                        "relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]",
                    padding: "px-8 py-8 sm:px-10 sm:py-10",
                };
            case "bottom-middle":
                return {
                    container:
                        "relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2",
                    gradient:
                        "absolute inset-px rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5",
                    content:
                        "relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]",
                    padding: "px-8 py-8 sm:px-10 sm:py-10",
                };
            case "right-tall":
                return {
                    container: "relative lg:row-span-2",
                    gradient:
                        "absolute inset-px rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5 max-lg:rounded-b-4xl lg:rounded-r-4xl",
                    content:
                        "relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]",
                    padding: "px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0",
                };
            default:
                return {
                    container: "relative",
                    gradient:
                        "absolute inset-px rounded-lg bg-gradient-to-br from-blue-500/5 to-indigo-500/5",
                    content:
                        "relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]",
                    padding: "px-8 py-8 sm:px-10 sm:py-10",
                };
        }
    };

    return (
        <div className="relative mx-auto hidden max-w-7xl space-y-8 px-4 sm:block sm:px-6 lg:px-8">
            <SectionHeader
                dividerTitle={sectionContent.dividerTitle}
                title={sectionContent.title}
                titleHighlight={sectionContent.titleHighlight}
                description={sectionContent.description}
                videoName="clock-motion"
                animation={<ClockAnimation />}
            />

            <div className="mt-10 grid gap-2 sm:mt-16 lg:grid-cols-3 lg:grid-rows-2">
                {sectionContent.features.map((feature, index) => {
                    const classes = getPositionClasses(feature.position);
                    const shouldShowImage =
                        feature.position === "left-tall" ||
                        feature.position === "right-tall";
                    const imageName =
                        feature.position === "left-tall"
                            ? leftImage
                            : rightImage;

                    return (
                        <div
                            key={feature.id || index}
                            className={classes.container}
                        >
                            <div className={classes.gradient} />
                            <div className={classes.content}>
                                <div className={classes.padding}>
                                    <h3 className="font-bold text-3xl text-white max-lg:text-center">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-2 max-w-lg text-sm/6 text-stone-400 max-lg:text-center">
                                        {feature.description}
                                    </p>
                                </div>
                                {shouldShowImage && (
                                    <div className="mt-auto mb-4">
                                        {renderImageContent(imageName)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
