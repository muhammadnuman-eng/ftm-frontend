import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { getPrograms } from "@/data/programs";
import { normalizeLocale } from "@/lib/i18n/messages";
import { PricingSection } from "./pricing-section";

// Fallback category content in case the collection is not set up yet

export const PricingSectionWrapper = async ({ locale }: { locale: string }) => {
    await connection();

    const normalizedLocale = normalizeLocale(locale);
    // Fetch programs with discounts precomputed server-side
    const programs = await getPrograms(undefined, { locale: normalizedLocale });
    const t = await getTranslations({
        locale: normalizedLocale,
        namespace: "pricingSection",
    });

    const getFallbackCategoryContent = () => {
        // Helper function to find first program in a category and extract its subtitle
        const getSubtitleForCategory = (
            category: "instant" | "1-step" | "2-step",
        ) => {
            const program = programs.find((p) => p.category === category);
            return program?.subtitle || t(`categories.${category}.title`);
        };

        return [
            {
                id: "fallback-instant",
                category: "instant" as const,
                title: getSubtitleForCategory("instant"),
                description: t("categories.instant.description"),
                benefits: [
                    t("categories.instant.benefits.0"),
                    t("categories.instant.benefits.1"),
                    t("categories.instant.benefits.2"),
                ],
            },
            {
                id: "fallback-1-step",
                category: "1-step" as const,
                title: getSubtitleForCategory("1-step"),
                description: t("categories.1-step.description"),
                benefits: [
                    t("categories.1-step.benefits.0"),
                    t("categories.1-step.benefits.1"),
                    t("categories.1-step.benefits.2"),
                ],
            },
            {
                id: "fallback-2-step",
                category: "2-step" as const,
                title: getSubtitleForCategory("2-step"),
                description: t("categories.2-step.description"),
                benefits: [
                    t("categories.2-step.benefits.0"),
                    t("categories.2-step.benefits.1"),
                    t("categories.2-step.benefits.2"),
                ],
            },
        ];
    };

    // Use category content with subtitles from programs
    const categoryContent = getFallbackCategoryContent();

    return (
        <PricingSection programs={programs} categoryContent={categoryContent} />
    );
};
