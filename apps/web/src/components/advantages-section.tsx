import {
    CircleDollarSignIcon,
    HandCoinsIcon,
    PhoneIcon,
    RibbonIcon,
    TrophyIcon,
    ZapIcon,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Homepage } from "@/payload-types";
import { SectionHeader } from "./section-header";
import { Card, CardContent, type GradientPosition } from "./ui/card";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

// Icon mapping for the CMS icon selections
const iconMap = {
    phone: PhoneIcon,
    "circle-dollar-sign": CircleDollarSignIcon,
    "hand-coins": HandCoinsIcon,
    ribbon: RibbonIcon,
    trophy: TrophyIcon,
    zap: ZapIcon,
} as const;

// Color mapping for icon backgrounds
const iconColorMap = {
    blue: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-blue-300)_0%,var(--color-blue-600)_100%)]",
    yellow: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-yellow-200)_0%,var(--color-amber-600)_100%)]",
    green: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-lime-300)_0%,var(--color-lime-600)_100%)]",
    rose: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-rose-300)_0%,var(--color-rose-600)_100%)]",
    purple: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-purple-300)_0%,var(--color-purple-600)_100%)]",
    orange: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-orange-300)_0%,var(--color-orange-600)_100%)]",
} as const;

interface AdvantagesSectionProps {
    content?: Homepage["advantages"];
}

export const AdvantagesSection = ({ content }: AdvantagesSectionProps) => {
    const data = content;

    if (!data) return null;

    return (
        <div className="relative text-center">
            <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-indigo-950/30 to-purple-950/20" />
                <div className="absolute inset-0 bg-radial from-stone-950/80 to-stone-950" />
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-t from-transparent to-stone-950" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-stone-950" />
            </div>

            <div className="relative mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    dividerTitle={data.dividerTitle}
                    title={data.title}
                    titleHighlight={data.titleHighlight}
                    description={data.description}
                    showVideo={false}
                />

                <div className="hidden gap-4 text-left sm:grid sm:grid-cols-2 lg:grid-cols-4">
                    {data.cards.map((card, index) => {
                        const IconComponent = iconMap[card.icon];
                        const iconColorClass = iconColorMap[card.iconColor];

                        return (
                            <Card
                                key={
                                    "id" in card
                                        ? card.id || index.toString()
                                        : index.toString()
                                }
                                gradientPosition={
                                    card.gradientPosition as GradientPosition
                                }
                                wrapperClassName="bg-card/30 border border-white/10"
                            >
                                <CardContent className="flex flex-col items-start gap-4 p-6">
                                    <div className="-ml-6 relative h-16 shrink-0">
                                        <Image
                                            src="/images/icon-bg.png"
                                            alt="bg"
                                            role="presentation"
                                            width={128}
                                            height={64}
                                            className="h-16 w-auto select-none"
                                        />
                                        <div
                                            className={cn(
                                                "absolute top-2 right-2 flex size-12 items-center justify-center rounded-full",
                                                iconColorClass,
                                            )}
                                        >
                                            <IconComponent
                                                className={cn(
                                                    "size-6 drop-shadow-black/50 drop-shadow-sm",
                                                )}
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-4">
                                        <h3 className="text-pretty font-bold text-lg lg:text-xl">
                                            {card.title}
                                        </h3>
                                        <p className="text-pretty text-stone-100/70">
                                            {card.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="-mx-4 text-left sm:hidden">
                    <ScrollArea className="w-full">
                        <div className="flex gap-4 px-4 pb-3">
                            {data.cards.map((card, index) => {
                                const IconComponent = iconMap[card.icon];
                                const iconColorClass =
                                    iconColorMap[card.iconColor];

                                return (
                                    <Card
                                        key={
                                            "id" in card
                                                ? card.id || index.toString()
                                                : index.toString()
                                        }
                                        gradientPosition={
                                            card.gradientPosition as GradientPosition
                                        }
                                        wrapperClassName="min-w-64 bg-card/90 border border-white/10"
                                        className="!bg-none"
                                    >
                                        <CardContent className="flex flex-col items-start p-4">
                                            <div className="-ml-4 relative h-16 shrink-0 origin-left scale-75">
                                                <Image
                                                    src="/images/icon-bg.png"
                                                    alt="bg"
                                                    role="presentation"
                                                    width={128}
                                                    height={64}
                                                    className="h-16 w-auto select-none"
                                                />
                                                <div
                                                    className={cn(
                                                        "absolute top-2 right-2 flex size-12 items-center justify-center rounded-full",
                                                        iconColorClass,
                                                    )}
                                                >
                                                    <IconComponent
                                                        className={cn(
                                                            "size-6 drop-shadow-black/50 drop-shadow-sm",
                                                        )}
                                                        strokeWidth={1.5}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-1 flex-col gap-2">
                                                <h3 className="text-pretty font-bold text-lg">
                                                    {card.title}
                                                </h3>
                                                <p className="text-pretty text-sm text-stone-100/70">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};
