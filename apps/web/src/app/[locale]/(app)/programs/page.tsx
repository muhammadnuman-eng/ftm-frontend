import { ArrowRightIcon, RocketIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ComparisonTableWrapper } from "@/components/comparison-table-wrapper";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, type GradientPosition } from "@/components/ui/card";
import { getPrograms } from "@/data/programs";
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
    // The translations will be used as fallbacks via the default siteName/description
    return generateGlobalMetadata({
        locale,
        pageType: "programsPage",
        pagePath: "/programs",
    });
}

const CATEGORY_CONFIG = [
    {
        category: "1-step" as const,
        translationKey: "oneStep",
        gradientPosition: "top-right" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-rose-300)_0%,var(--color-rose-600)_100%)]",
        link: "/1-step",
    },
    {
        category: "2-step" as const,
        translationKey: "twoStep",
        gradientPosition: "top-center" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-yellow-200)_0%,var(--color-amber-600)_100%)]",
        link: "/2-step",
    },
    {
        category: "instant" as const,
        translationKey: "instant",
        gradientPosition: "top-left" as GradientPosition,
        iconClassname:
            "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-lime-300)_0%,var(--color-lime-600)_100%)]",
        link: "/ftm-instant-funding",
    },
] as const;

const ProgramsPage = async ({
    params,
}: {
    params: Promise<{ locale: string }>;
}) => {
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);
    const t = await getTranslations({ locale, namespace: "programsPage" });

    const programs = await getPrograms(undefined, { locale });

    if (!programs || programs.length === 0) {
        notFound();
    }

    const programsByCategory = programs.reduce(
        (acc, program) => {
            if (!acc[program.category]) {
                acc[program.category] = [];
            }
            if (acc[program.category]) {
                acc[program.category].push(program);
            }
            return acc;
        },
        {} as Record<string, typeof programs>,
    );

    const categoryCards = CATEGORY_CONFIG.map((config) => {
        const categoryPrograms = programsByCategory[config.category] || [];
        return {
            ...config,
            title: t(`categories.${config.translationKey}.title`),
            description: t(`categories.${config.translationKey}.description`),
            badge: t(`categories.${config.translationKey}.badge`),
            programs: categoryPrograms,
        };
    });

    return (
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                title={t("header.title")}
                titleHighlight={t("header.highlight")}
                description={t("header.description")}
            />

            <div className="grid gap-4 text-left lg:grid-cols-3">
                {categoryCards.map((card) => (
                    <Card
                        key={card.category}
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
                                    <RocketIcon
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
                                <p className="text-sm text-stone-100/50">
                                    {t("categories.count", {
                                        count: card.programs.length,
                                    })}
                                </p>
                            </div>

                            <div className="mt-6 flex w-full items-center justify-between">
                                <Link
                                    href={card.link}
                                    className={cn(
                                        "rounded px-8 py-3 font-semibold text-sm",
                                        card.iconClassname,
                                    )}
                                >
                                    {card.badge}
                                </Link>
                                <Link
                                    href={card.link}
                                    className="flex items-center gap-2 text-xs [&:hover_svg]:translate-x-1 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:opacity-60 [&_svg]:transition-transform"
                                >
                                    {t("learnMore")} <ArrowRightIcon />
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <SectionHeader
                showVideo={false}
                title={t("comparison.title")}
                titleHighlight={t("comparison.highlight")}
                description={t("comparison.description")}
            />

            <ComparisonTableWrapper locale={locale} type="All" />
        </div>
    );
};

export default ProgramsPage;
