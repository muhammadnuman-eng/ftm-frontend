import {
    ArrowRightIcon,
    BarChart3Icon,
    ClockIcon,
    DollarSignIcon,
    GiftIcon,
    GlobeIcon,
    ShieldIcon,
    StarIcon,
    TagIcon,
    TargetIcon,
    TrendingUpIcon,
    TrophyIcon,
    UsersIcon,
    ZapIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent, type GradientPosition } from "@/components/ui/card";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import { generateGlobalMetadata, mergeMetadata } from "@/lib/seo/global-seo";
import { cn } from "@/lib/utils";
import type { Affiliate, Media } from "@/payload-types";
// Enable ISR with 2 hour revalidation for affiliates page
export const revalidate = 7200; // 2 hours in seconds

// Icon mapping for dynamic content
const iconMap = {
    "dollar-sign": DollarSignIcon,
    gift: GiftIcon,
    tag: TagIcon,
    trophy: TrophyIcon,
    target: TargetIcon,
    zap: ZapIcon,
    users: UsersIcon,
    "trending-up": TrendingUpIcon,
    shield: ShieldIcon,
    clock: ClockIcon,
    chart: BarChart3Icon,
    globe: GlobeIcon,
    star: StarIcon,
};

// Icon color mapping for dynamic content
const iconColorMap = {
    emerald:
        "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-emerald-300)_0%,var(--color-emerald-600)_100%)]",
    orange: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-orange-300)_0%,var(--color-orange-600)_100%)]",
    cyan: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-cyan-300)_0%,var(--color-cyan-600)_100%)]",
    blue: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-blue-300)_0%,var(--color-blue-600)_100%)]",
    purple: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-purple-300)_0%,var(--color-purple-600)_100%)]",
    rose: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-rose-300)_0%,var(--color-rose-600)_100%)]",
    yellow: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-yellow-200)_0%,var(--color-amber-600)_100%)]",
    green: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-green-300)_0%,var(--color-green-600)_100%)]",
    red: "bg-[radial-gradient(66.67%_103.95%_at_50%_-42.76%,var(--color-red-300)_0%,var(--color-red-600)_100%)]",
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
    const payload = await getPayloadClient();

    try {
        const affiliates = (await payload.findGlobal({
            slug: "affiliates",
            draft: isDraftMode,
            locale,
        })) as Affiliate;

        const pageTitle = affiliates.seo?.title || "Affiliates Program";
        const pageDescription =
            affiliates.seo?.description ||
            affiliates.header?.description ||
            "Join FTM's affiliate program and earn up to 22.5% commission.";
        const keywords =
            affiliates.seo?.keywords ||
            "affiliate program, trading affiliate, commission, referral program, FTM";
        const ogImage =
            typeof affiliates.seo?.ogImage === "object"
                ? (affiliates.seo.ogImage as Media)
                : null;

        // Use global SEO as base
        const globalMetadata = await generateGlobalMetadata({
            locale,
            pageType: "affiliatesPage",
            pageTitle,
            pageDescription,
            pageKeywords: keywords,
            pageImage: ogImage?.url,
            pagePath: "/affiliates",
        });

        // Merge with page-specific metadata
        return mergeMetadata(globalMetadata, {
            openGraph: {
                url: `https://fundedtradermarkets.com/${locale}/affiliates`,
            },
        });
    } catch (error) {
        console.error("Error generating metadata:", error);
        return generateGlobalMetadata({
            locale,
            pageType: "affiliatesPage",
            pageTitle: "Affiliates Program",
            pageDescription:
                "Join FTM's affiliate program and earn up to 22.5% commission.",
            pagePath: "/affiliates",
        });
    }
}

const AffiliatesPage = async ({
    params,
}: {
    params: Promise<{ locale: string }>;
}) => {
    const { isEnabled: isDraftMode } = await draftMode();
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);
    const payload = await getPayloadClient();

    // Fetch affiliates content from Payload CMS
    const affiliates = (await payload.findGlobal({
        slug: "affiliates",
        draft: isDraftMode,
        locale,
    })) as Affiliate;

    return (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                title={
                    affiliates.header?.title ||
                    "Partner with FTM.\nEarn on Every Challenge Purchased."
                }
                titleHighlight={
                    affiliates.header?.titleHighlight || "Challenge Purchased."
                }
                description={
                    affiliates.header?.description ||
                    "Join our affiliate program and receive up to 22.5% commission for each challenge account purchased through your referral. Help others start their trading journey while building a reliable income stream with FTM."
                }
                as="h1"
            />

            {/* CTA Buttons */}
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                    href={"/affiliate-area/register"}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-semibold text-lg text-white transition-all duration-200 hover:from-indigo-500 hover:to-indigo-500"
                >
                    {affiliates.ctaButtons?.primaryButton?.text ||
                        "Become an Affiliate"}
                    <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <Link
                    href={"/affiliate-area/login"}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 font-semibold text-lg text-white transition-all duration-200 hover:bg-white/10"
                >
                    {affiliates.ctaButtons?.secondaryButton?.text ||
                        "Affiliate Login"}
                </Link>
            </div>

            {/* Commission Cards */}
            <div className="grid gap-6 lg:grid-cols-3">
                {affiliates.commissionCards?.map(
                    (card: Affiliate["commissionCards"][0], index: number) => {
                        const IconComponent =
                            iconMap[card.icon as keyof typeof iconMap] ||
                            DollarSignIcon;
                        const iconColorClass =
                            iconColorMap[
                                card.iconColor as keyof typeof iconColorMap
                            ] || iconColorMap.emerald;

                        return (
                            <Card
                                key={`card-${card.title || index}`}
                                gradientPosition={
                                    card.gradientPosition as GradientPosition
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
                                        <div>
                                            <h3 className="font-bold text-2xl lg:text-3xl">
                                                {card.title}
                                            </h3>
                                            <h4 className="font-semibold text-lg text-stone-100/80">
                                                {card.subtitle}
                                            </h4>
                                        </div>
                                        <p className="text-stone-100/70">
                                            {card.description}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    },
                )}
            </div>

            {/* Bottom section */}
            <div className="space-y-6 text-center">
                <h2 className="text-center font-bold text-3xl lg:text-4xl">
                    {affiliates.bottomSection?.title ||
                        "Ready to boost your income by helping traders succeed?"}
                </h2>
                <p className="mx-auto max-w-3xl text-lg text-stone-100/80 leading-relaxed">
                    {affiliates.bottomSection?.description ||
                        "Our affiliate program is tailored for influencers, educators, and community leaders eager to share the advantages of funded trading accounts. Join us and grow your income by promoting real trading opportunities to your audience."}
                </p>
            </div>

            {/* Additional Features (if any) */}
            {affiliates.additionalFeatures &&
                affiliates.additionalFeatures.length > 0 && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {affiliates.additionalFeatures.map(
                            (
                                feature: NonNullable<
                                    Affiliate["additionalFeatures"]
                                >[0],
                                index: number,
                            ) => {
                                const IconComponent =
                                    iconMap[
                                        feature.icon as keyof typeof iconMap
                                    ] || StarIcon;
                                const iconColorClass =
                                    iconColorMap[
                                        feature.iconColor as keyof typeof iconColorMap
                                    ] || iconColorMap.blue;

                                return (
                                    <Card
                                        key={`feature-${feature.title || index}`}
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
                                                    {feature.title}
                                                </h3>
                                                <p className="text-stone-100/70">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            },
                        )}
                    </div>
                )}
        </div>
    );
};

export default AffiliatesPage;
