import {
    ArrowRightIcon,
    CheckCircleIcon,
    ClockIcon,
    CrownIcon,
    DollarSignIcon,
    GiftIcon,
    RefreshCwIcon,
    ShieldIcon,
    StarIcon,
    TargetIcon,
    TrophyIcon,
    ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, type GradientPosition } from "@/components/ui/card";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import { generateGlobalMetadata, mergeMetadata } from "@/lib/seo/global-seo";
import { cn } from "@/lib/utils";
import type { HowItWork, Media } from "@/payload-types";
// Enable ISR with 2 hour revalidation for how-it-works page
export const revalidate = 7200; // 2 hours in seconds

// Icon mapping for dynamic content
const iconMap = {
    zap: ZapIcon,
    crown: CrownIcon,
    clock: ClockIcon,
    star: StarIcon,
    trophy: TrophyIcon,
    "check-circle": CheckCircleIcon,
    shield: ShieldIcon,
    target: TargetIcon,
    "dollar-sign": DollarSignIcon,
    gift: GiftIcon,
    refresh: RefreshCwIcon,
};

// Icon color mapping for dynamic content
const iconColorMap = {
    rose: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-rose-300)_0%,var(--color-rose-600)_100%)]",
    yellow: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-yellow-200)_0%,var(--color-amber-600)_100%)]",
    lime: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-lime-300)_0%,var(--color-lime-600)_100%)]",
    blue: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-blue-300)_0%,var(--color-blue-600)_100%)]",
    emerald:
        "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-emerald-300)_0%,var(--color-emerald-600)_100%)]",
    orange: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-orange-300)_0%,var(--color-orange-600)_100%)]",
    purple: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-purple-300)_0%,var(--color-purple-600)_100%)]",
    green: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-green-300)_0%,var(--color-green-600)_100%)]",
};

// Generate metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { isEnabled: isDraftMode } = await draftMode();
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);
    const [payload, t] = await Promise.all([
        getPayloadClient(),
        getTranslations({ locale, namespace: "howItWorksPage.meta" }),
    ]);

    try {
        const howItWork = (await payload.findGlobal({
            slug: "how-it-works",
            draft: isDraftMode,
            locale,
        })) as HowItWork;

        const pageTitle =
            howItWork.seo?.title || howItWork.header?.title || t("title");
        const pageDescription =
            howItWork.seo?.description ||
            howItWork.header?.description ||
            t("description");
        const keywords = howItWork.seo?.keywords || t("keywords");
        const ogImage =
            typeof howItWork.seo?.ogImage === "object"
                ? (howItWork.seo.ogImage as Media)
                : null;

        // Use global SEO as base
        const globalMetadata = await generateGlobalMetadata({
            locale,
            pageType: "howItWorksPage",
            pageTitle,
            pageDescription,
            pageKeywords: keywords,
            pageImage: ogImage?.url,
            pagePath: "/how-it-works",
        });

        // Merge with page-specific metadata
        return mergeMetadata(globalMetadata, {
            openGraph: {
                url: `https://fundedtradermarkets.com/${locale}/how-it-works`,
            },
        });
    } catch (error) {
        console.error("Error generating metadata:", error);
        return generateGlobalMetadata({
            locale,
            pageType: "howItWorksPage",
            pageTitle: t("title"),
            pageDescription: t("description"),
            pagePath: "/how-it-works",
        });
    }
}

const HowItWorksPage = async ({
    params,
}: {
    params: Promise<{ locale: string }>;
}) => {
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);
    const { isEnabled: isDraftMode } = await draftMode();
    const payload = await getPayloadClient();
    const t = await getTranslations({ locale, namespace: "howItWorksPage" });

    const howItWork = (await payload.findGlobal({
        slug: "how-it-works",
        draft: isDraftMode,
        locale,
    })) as HowItWork;

    return (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                title={howItWork.header?.title || t("header.title")}
                titleHighlight={
                    howItWork.header?.titleHighlight || t("header.highlight")
                }
                description={
                    howItWork.header?.description || t("header.description")
                }
            />

            {/* What is Prop Trading Section */}
            <div className="space-y-6">
                <h2 className="text-center font-bold text-5xl">
                    {howItWork.propTradingSection?.title ||
                        t("propTrading.title")}
                </h2>
                <div className="text-center">
                    <p className="mx-auto max-w-4xl text-lg text-stone-100/80 leading-relaxed">
                        {howItWork.propTradingSection?.description ||
                            t("propTrading.description")}
                    </p>
                </div>
            </div>

            {/* Key Concepts Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {howItWork.keyConcepts?.map(
                    (concept: HowItWork["keyConcepts"][0], index: number) => {
                        const IconComponent =
                            iconMap[concept.icon as keyof typeof iconMap] ||
                            TrophyIcon;
                        const iconColorClass =
                            iconColorMap[
                                concept.iconColor as keyof typeof iconColorMap
                            ] || iconColorMap.emerald;

                        return (
                            <Card
                                key={`concept-${concept.title || index}`}
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
                                                iconColorClass,
                                            )}
                                        >
                                            <IconComponent
                                                className="size-6 drop-shadow-black/50 drop-shadow-sm"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-4">
                                        <h3 className="font-bold text-xl">
                                            {concept.title}
                                        </h3>
                                        <p className="text-stone-100/70">
                                            {concept.description}
                                        </p>
                                        {concept.details &&
                                            concept.details.length > 0 && (
                                                <div className="space-y-2">
                                                    {concept.details.map(
                                                        (
                                                            detail: NonNullable<
                                                                HowItWork["keyConcepts"][0]["details"]
                                                            >[0],
                                                            detailIndex: number,
                                                        ) => (
                                                            <p
                                                                key={`detail-${detail.label || detailIndex}`}
                                                                className="text-sm text-stone-100/60"
                                                            >
                                                                <strong>
                                                                    {
                                                                        detail.label
                                                                    }
                                                                </strong>{" "}
                                                                {
                                                                    detail.description
                                                                }
                                                            </p>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    },
                )}
            </div>

            {/* Evaluation Types Section */}
            <div className="space-y-6">
                <h2 className="text-center font-bold text-3xl">
                    {howItWork.evaluationTypes?.title || t("evaluation.title")}
                </h2>
                <p className="text-center text-lg text-stone-100/70">
                    {howItWork.evaluationTypes?.description ||
                        t("evaluation.description")}
                </p>
                <div className="grid gap-4 lg:grid-cols-3">
                    {howItWork.evaluationTypes?.types?.map(
                        (type: HowItWork["evaluationTypes"]["types"][0]) => {
                            const IconComponent =
                                iconMap[type.icon as keyof typeof iconMap] ||
                                ZapIcon;
                            const iconColorClass =
                                iconColorMap[
                                    type.iconColor as keyof typeof iconColorMap
                                ] || iconColorMap.rose;

                            return (
                                <Card
                                    key={`evaluation-${type.title}`}
                                    gradientPosition={
                                        type.gradientPosition as GradientPosition
                                    }
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
                                                    iconColorClass,
                                                )}
                                            >
                                                <IconComponent
                                                    className="size-6 drop-shadow-black/50 drop-shadow-sm"
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-4">
                                            <h3 className="text-pretty font-bold text-lg lg:text-xl">
                                                {type.title}
                                            </h3>
                                            <p className="text-pretty text-stone-100/70">
                                                {type.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        },
                    )}
                </div>
            </div>

            {/* Step By Step Roadmap */}
            <div className="space-y-8">
                <SectionHeader
                    title={howItWork.roadmap?.title || t("roadmap.title")}
                    titleHighlight={
                        howItWork.roadmap?.titleHighlight ||
                        t("roadmap.highlight")
                    }
                    showVideo={false}
                />

                <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                    {howItWork.roadmap?.steps?.map(
                        (step: HowItWork["roadmap"]["steps"][0]) => (
                            <Card
                                key={`step-${step.number}`}
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
                                        <div className="absolute top-2 right-2 flex size-12 items-center justify-center rounded-full bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-zinc-400)_0%,var(--color-zinc-700)_100%)]">
                                            <span className="font-bold text-lg text-white drop-shadow-black/50 drop-shadow-sm">
                                                {step.number}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-4">
                                        <h3 className="font-bold text-lg">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-stone-100/70">
                                            {step.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ),
                    ) || []}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {howItWork.additionalInfo?.map(
                    (info: HowItWork["additionalInfo"][0], index: number) => {
                        const IconComponent =
                            iconMap[info.icon as keyof typeof iconMap] ||
                            ClockIcon;
                        const iconColorClass =
                            iconColorMap[
                                info.iconColor as keyof typeof iconColorMap
                            ] || iconColorMap.blue;

                        return (
                            <Card
                                key={`info-${info.title || index}`}
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
                                                iconColorClass,
                                            )}
                                        >
                                            <IconComponent
                                                className="size-6 drop-shadow-black/50 drop-shadow-sm"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-4">
                                        <h2 className="font-bold text-2xl">
                                            {info.title}
                                        </h2>
                                        <p className="text-lg text-stone-100/80">
                                            {info.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    },
                )}
            </div>

            {/* Ready to Start CTA */}
            <SectionHeader
                showVideo={false}
                title={howItWork.cta?.title || t("cta.title")}
                titleHighlight={
                    howItWork.cta?.titleHighlight || t("cta.highlight")
                }
                description={howItWork.cta?.description || t("cta.description")}
            />
            <div className="text-center">
                <Link
                    href={howItWork.cta?.buttonUrl || "/programs"}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-lg text-white transition-all duration-200 hover:from-indigo-500 hover:to-indigo-500"
                >
                    {howItWork.cta?.buttonText || t("cta.button")}
                    <ArrowRightIcon className="h-5 w-5" />
                </Link>
            </div>
        </div>
    );
};

export default HowItWorksPage;
