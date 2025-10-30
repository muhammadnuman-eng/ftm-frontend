"use client";

import {
    ArrowUpRightIcon,
    BadgeDollarSign,
    GlobeIcon,
    HandCoinsIcon,
    type LucideIcon,
    WalletIcon,
} from "lucide-react";
import Script from "next/script";
import { cn } from "@/lib/utils";
import type { Homepage } from "@/payload-types";
import { GridBackground } from "./grid-background";
import { TrustBox } from "./trustbox";
import { AuroraBackground } from "./ui/aurora-background";
import { BorderBeam } from "./ui/border-beam";
import { Card, CardContent } from "./ui/card";

interface HeroProps {
    content: Homepage;
}

const getIconComponent = (iconName: string): LucideIcon => {
    const iconMap = {
        globe: GlobeIcon,
        wallet: WalletIcon,
        "dollar-badge": BadgeDollarSign,
        "hand-coins": HandCoinsIcon,
    };
    return iconMap[iconName as keyof typeof iconMap] || GlobeIcon;
};

const getIconColor = (colorName: string): string => {
    const colorMap = {
        blue: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-blue-300)_0%,var(--color-blue-600)_100%)]",
        yellow: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-yellow-200)_0%,var(--color-amber-600)_100%)]",
        green: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-lime-300)_0%,var(--color-lime-600)_100%)]",
        rose: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-rose-300)_0%,var(--color-rose-600)_100%)]",
    };
    return colorMap[colorName as keyof typeof colorMap] || colorMap.blue;
};

const getIconColorMobile = (colorName: string): string => {
    const colorMap = {
        blue: "text-blue-400",
        yellow: "text-yellow-400",
        green: "text-green-400",
        rose: "text-rose-400",
    };
    return colorMap[colorName as keyof typeof colorMap] || colorMap.blue;
};

export const Hero = ({ content }: HeroProps) => {
    const { hero, features } = content;

    return (
        <AuroraBackground>
            <Script
                src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
                async
            />
            <div className="relative isolate overflow-hidden">
                <GridBackground />
                <div className="absolute inset-x-0 bottom-0 h-42 bg-gradient-to-t from-stone-950 to-transparent sm:hidden" />
                <div className="relative mx-auto max-w-7xl px-6 pt-10 pb-6 lg:flex lg:px-8 lg:py-8">
                    <div className="mx-auto flex w-full max-w-5xl shrink-0 flex-col items-center text-center lg:pt-8">
                        <div className="-mx-6 sm:mx-0 sm:mt-32 lg:mt-12">
                            <h1 className="text-balance px-3 py-1.5 font-semibold text-white text-xs ring-white/25 ring-inset sm:rounded-full sm:bg-black/20 sm:text-sm/6 sm:ring-1 sm:backdrop-blur-sm">
                                <span className="text-white/80 sm:text-white">
                                    {hero.tagline}
                                </span>
                            </h1>
                        </div>
                        <h2 className="mt-4 text-balance font-semibold text-4xl text-white tracking-tight sm:mt-10 sm:text-6xl [&_em]:not-italic">
                            {hero.headline.split("\n").map((line, index) => (
                                <span key={`headline-${index}-${line}`}>
                                    {line}
                                    {index <
                                        hero.headline.split("\n").length -
                                            1 && <br />}
                                </span>
                            ))}
                            <br />
                            <span className="bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">
                                <em>{hero.highlightedText}</em>{" "}
                                <span className="text-white">or</span>{" "}
                                <em>{hero.secondaryHighlight}</em>
                            </span>
                        </h2>
                        <div className="mt-10 hidden w-full gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature, index) => (
                                <FeatureBox
                                    key={
                                        feature.id ||
                                        `feature-${index}-${feature.text}`
                                    }
                                    icon={getIconComponent(feature.icon)}
                                    text={feature.text}
                                    iconClassname={getIconColor(
                                        feature.iconColor,
                                    )}
                                />
                            ))}
                        </div>
                        <div className="relative mt-10 grid w-full grid-cols-2 rounded-lg bg-black/30 outline outline-white/10 sm:hidden [&>*:nth-child(1)]:border-r-1 [&>*:nth-child(3)]:border-t-1 [&>*:nth-child(3)]:border-r-1 [&>*:nth-child(4)]:border-t-1">
                            {features.map((feature, index) => (
                                <FeatureBoxMobile
                                    key={
                                        feature.id ||
                                        `feature-${index}-${feature.text}`
                                    }
                                    icon={getIconComponent(feature.icon)}
                                    text={feature.text}
                                    iconClassname={getIconColorMobile(
                                        feature.iconColor,
                                    )}
                                />
                            ))}
                            <BorderBeam
                                size={200}
                                duration={10}
                                className="from-transparent via-blue-400 to-transparent"
                            />
                            <BorderBeam
                                size={200}
                                delay={25}
                                duration={10}
                                className="from-transparent via-lime-400 to-transparent"
                            />
                        </div>
                        <div className="mt-10 flex items-center gap-x-6">
                            <a
                                href={hero.primaryButtonUrl}
                                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 py-2.5 pr-3.5 pl-5 font-semibold text-sm text-white shadow-xs outline-2 outline-transparent outline-offset-3 transition-all duration-200 hover:from-indigo-600 hover:shadow-lg hover:outline-indigo-500/50 lg:px-8 lg:py-4 lg:text-base"
                            >
                                {hero.primaryButtonText}
                                <ArrowUpRightIcon className="lg:-mr-2 size-4 lg:size-6" />
                            </a>
                            <a
                                href={hero.secondaryButtonUrl}
                                className="font-semibold text-sm/6 text-white"
                            >
                                {hero.secondaryButtonText}{" "}
                                <span aria-hidden="true">→</span>
                            </a>
                        </div>
                        <div className="mt-6">
                            <TrustBox />
                        </div>
                        <div className="mt-6 rounded-full border bg-white/1 py-2 pr-8 pl-4">
                            <div className="flex items-center gap-4">
                                {/** biome-ignore lint/performance/noImgElement: remote image */}
                                <img
                                    src="/images/metatrader-5.svg"
                                    alt="MetaTrader 5"
                                    className="h-8"
                                />
                                <span className="font-bold text-sm text-white">
                                    Available
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuroraBackground>
    );
};

const FeatureBox = ({
    icon: Icon,
    text,
    iconClassname,
}: {
    icon: LucideIcon;
    text: string;
    iconClassname: string;
}) => {
    return (
        <Card
            wrapperClassName="bg-card/20 backdrop-blur-sm ring-1 ring-white/5"
            className="!bg-none"
        >
            <CardContent className="flex items-center gap-4 p-6 text-left">
                <div
                    className={cn(
                        "flex size-12 shrink-0 items-center justify-center rounded-xl",
                        iconClassname,
                    )}
                >
                    <Icon
                        className={cn(
                            "size-6 drop-shadow-black/50 drop-shadow-sm",
                        )}
                        strokeWidth={1.5}
                    />
                </div>
                <span className="text-balance font-medium text-base">
                    {text}
                </span>
            </CardContent>
        </Card>
    );
};

const FeatureBoxMobile = ({
    text,
    icon: Icon,
    iconClassname,
}: {
    icon: LucideIcon;
    text: string;
    iconClassname: string;
}) => {
    const words = text.split(" ");
    const shouldBreak = words.length === 2;

    return (
        <div className="relative flex flex-col items-center gap-2 border-white/5 p-4">
            <Icon className={cn("size-6", iconClassname)} strokeWidth={1} />
            <div className="text-balance font-medium text-sm leading-tight">
                {shouldBreak ? (
                    <>
                        {words[0]}
                        <br />
                        {words[1]}
                    </>
                ) : (
                    text
                )}
            </div>
        </div>
    );
};
