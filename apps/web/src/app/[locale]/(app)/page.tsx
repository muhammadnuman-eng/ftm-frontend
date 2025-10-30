import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { AdvantagesSection } from "@/components/advantages-section";
import { FaqSection } from "@/components/faq-section";
import { FeaturedInSection } from "@/components/featured-in-section";
import { Hero } from "@/components/hero";
import { HighestPayouts } from "@/components/highest-payouts";
import { LivePreview } from "@/components/live-preview-listener";
import { PayoutsFeaturesSection } from "@/components/payouts-features-section";
import { PayoutsSection } from "@/components/payouts-section";
import { PricingSectionWrapper } from "@/components/pricing-section-wrapper";
import { TestimonialsSection } from "@/components/testimonials-section";
import { TradingFeaturesSection } from "@/components/trading-features-section";
import { VideoTestimonialsSection } from "@/components/video-testimonials-section";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { isSupportedLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import { generateGlobalMetadata } from "@/lib/seo/global-seo";
import type { Homepage } from "@/payload-types";
// Enable ISR with 1 hour revalidation for homepage
export const revalidate = 3600; // 1 hour in seconds

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale = isSupportedLocale(localeParam)
        ? localeParam
        : DEFAULT_LOCALE;

    return generateGlobalMetadata({
        locale,
        pageType: "homePage",
        pagePath: "/",
    });
}

const Home = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { isEnabled: isDraftMode } = await draftMode();
    const payload = await getPayloadClient();
    const { locale: localeParam } = await params;

    const normalizedLocale = isSupportedLocale(localeParam)
        ? localeParam
        : DEFAULT_LOCALE;

    // Fetch homepage content from Payload CMS
    const homepage = (await payload.findGlobal({
        slug: "homepage",
        draft: isDraftMode,
        locale: normalizedLocale,
    })) as Homepage;

    // Fetch testimonials data
    const [videoTestimonials, testimonials] = await Promise.all([
        payload.find({
            collection: "video-testimonials",
            where: { isActive: { equals: true } },
            sort: "order",
            draft: isDraftMode,
            locale: normalizedLocale,
        }),
        payload.find({
            collection: "testimonials",
            where: { isActive: { equals: true } },
            sort: "order",
            draft: isDraftMode,
            locale: normalizedLocale,
        }),
    ]);

    return (
        <>
            <div className="space-y-12 sm:space-y-12">
                <Hero content={homepage} />

                <PayoutsSection />

                <FeaturedInSection content={homepage.featuredIn} />

                <AdvantagesSection content={homepage.advantages} />

                <PricingSectionWrapper locale={normalizedLocale} />

                <PayoutsFeaturesSection content={homepage.payoutsFeatures} />

                <TradingFeaturesSection content={homepage.tradingFeatures} />

                <HighestPayouts content={homepage.highestPayouts} />

                <VideoTestimonialsSection
                    content={homepage.videoTestimonials}
                    testimonials={videoTestimonials.docs}
                />

                <TestimonialsSection
                    content={homepage.testimonials}
                    testimonials={testimonials.docs}
                />

                <FaqSection content={homepage.faq} />
            </div>
            <LivePreview />
        </>
    );
};

export default Home;
