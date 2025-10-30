import {
    CheckCircleIcon,
    CrownIcon,
    DollarSignIcon,
    TrendingUpIcon,
    TrophyIcon,
    ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ComparisonTableWrapper } from "@/components/comparison-table-wrapper";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, type GradientPosition } from "@/components/ui/card";
import { normalizeLocale } from "@/lib/i18n/messages";
import { generateGlobalMetadata } from "@/lib/seo/global-seo";
import { cn } from "@/lib/utils";

export const revalidate = 7200; // 2 hours in seconds

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);

    // Don't pass pageTitle/pageDescription so Global SEO config takes precedence
    return generateGlobalMetadata({
        locale,
        pageType: "oneStepPage",
        pagePath: "/1-step",
    });
}

const CARD_CONFIG = [
    {
        key: "nitro",
        icon: ZapIcon,
        gradientPosition: "top-right" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-rose-300)_0%,var(--color-rose-600)_100%)]",
        link: "/variations?category=1-step&program=nitro",
    },
    {
        key: "nitroPro",
        icon: CrownIcon,
        gradientPosition: "top-center" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-yellow-200)_0%,var(--color-amber-600)_100%)]",
        link: "/variations?category=1-step&program=nitro-pro",
    },
    {
        key: "nitroX",
        icon: TrophyIcon,
        gradientPosition: "top-left" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-lime-300)_0%,var(--color-lime-600)_100%)]",
        link: "/variations?category=1-step&program=nitrox",
    },
] as const;

const BENEFIT_CONFIG = [
    {
        key: "capital",
        icon: DollarSignIcon,
        gradientPosition: "top-right" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-emerald-300)_0%,var(--color-emerald-600)_100%)]",
    },
    {
        key: "profit",
        icon: TrendingUpIcon,
        gradientPosition: "top-center" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-orange-300)_0%,var(--color-orange-600)_100%)]",
    },
    {
        key: "oneStep",
        icon: CheckCircleIcon,
        gradientPosition: "top-left" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-cyan-300)_0%,var(--color-cyan-600)_100%)]",
    },
] as const;

const OneStepPage = async ({
    params,
}: {
    params: Promise<{ locale: string }>;
}) => {
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);
    const t = await getTranslations({ locale, namespace: "oneStepPage" });

    const cards = CARD_CONFIG.map((card) => ({
        ...card,
        title: t(`cards.${card.key}.title`),
        description: t(`cards.${card.key}.description`),
        cta: t(`cards.${card.key}.cta`),
    }));

    const benefits = BENEFIT_CONFIG.map((benefit) => ({
        ...benefit,
        title: t(`benefits.items.${benefit.key}.title`),
        description: t(`benefits.items.${benefit.key}.description`),
    }));

    return (
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                title={t("header.title")}
                titleHighlight={t("header.highlight")}
                description={t("header.description")}
            />

            <div className="grid gap-4 text-left lg:grid-cols-3">
                {cards.map((card) => {
                    const CardIcon = card.icon;
                    return (
                        <Card
                            key={card.key}
                            gradientPosition={card.gradientPosition}
                            wrapperClassName="bg-card/30 border border-white/10"
                        >
                            <CardContent className="flex h-full flex-col items-start gap-4 p-6">
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
                                            card.iconClassname,
                                        )}
                                    >
                                        <CardIcon
                                            className="size-6 drop-shadow-black/50 drop-shadow-sm"
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

                                <div className="mt-6 flex w-full items-center justify-start">
                                    <Link
                                        href={card.link}
                                        className={cn(
                                            "rounded px-8 py-3 font-semibold text-sm",
                                            card.iconClassname,
                                        )}
                                    >
                                        {card.cta}
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <SectionHeader
                showVideo={false}
                title={t("comparison.title")}
                titleHighlight={t("comparison.highlight")}
                description={t("comparison.description")}
            />

            <ComparisonTableWrapper locale={locale} type="1-Step" />

            <SectionHeader
                showVideo={false}
                title={t("benefits.title")}
                titleHighlight={t("benefits.highlight")}
                description={t("benefits.description")}
            />

            <div className="grid gap-4 text-left lg:grid-cols-3">
                {benefits.map((benefit) => {
                    const BenefitIcon = benefit.icon;
                    return (
                        <Card
                            key={benefit.key}
                            gradientPosition={benefit.gradientPosition}
                            wrapperClassName="bg-card/30 border border-white/10"
                        >
                            <CardContent className="flex h-full flex-col items-start gap-4 p-6">
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
                                            benefit.iconClassname,
                                        )}
                                    >
                                        <BenefitIcon
                                            className="size-6 drop-shadow-black/50 drop-shadow-sm"
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col gap-4">
                                    <h3 className="text-pretty font-bold text-lg lg:text-xl">
                                        {benefit.title}
                                    </h3>
                                    <p className="text-pretty text-stone-100/70">
                                        {benefit.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default OneStepPage;
