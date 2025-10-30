import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Country } from "react-phone-number-input";
import { CompleteCheckout } from "@/components/checkout/complete-checkout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgramWithDiscounts } from "@/data/programs";
import { getPrograms } from "@/data/programs";
import { detectCountryCodeLower } from "@/lib/geo";
import { getCommerceConfig, getPlatforms } from "@/lib/payload";

// Enable ISR with 1 hour revalidation for checkout page
export const revalidate = 3600; // 1 hour in seconds

export const metadata: Metadata = {
    title: "Checkout",
};

type SearchParams = {
    category?: string | string[];
    planId?: string | string[];
    tier?: string | string[];
    platform?: string | string[];
    // In-app purchase params
    inapp?: string | string[];
    embed?: string | string[];
    email?: string | string[];
    firstName?: string | string[];
    lastName?: string | string[];
    client_id?: string | string[];
    country?: string | string[];
    address?: string | string[];
    city?: string | string[];
    phone?: string | string[];
    state?: string | string[];
    postalCode?: string | string[];
    ip?: string | string[];
};

function toStringParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
}

// Helpers removed: we will display human-friendly text in summary

const CheckoutPage = async ({
    searchParams,
    params,
}: {
    searchParams: Promise<SearchParams>;
    params: Promise<{ locale: string }>;
}) => {
    const sp = await searchParams;
    const { locale: localeParam } = await params;
    const t = await getTranslations({ locale: localeParam });
    const category = toStringParam(sp.category) as
        | "1-step"
        | "2-step"
        | "instant"
        | "";
    const planId = toStringParam(sp.planId);
    const tierParam = toStringParam(sp.tier);
    const platformId = toStringParam(sp.platform);

    // Extract in-app purchase params
    const inAppData = {
        isInApp: toStringParam(sp.inapp) === "1",
        email: toStringParam(sp.email),
        firstName: toStringParam(sp.firstName),
        lastName: toStringParam(sp.lastName),
        clientId: toStringParam(sp.client_id),
        country: toStringParam(sp.country),
        address: toStringParam(sp.address),
        city: toStringParam(sp.city),
        phone: toStringParam(sp.phone),
        state: toStringParam(sp.state),
        postalCode: toStringParam(sp.postalCode),
        ip: toStringParam(sp.ip),
    };

    const [programs, platforms, detectedCountryCode, commerceConfig] =
        await Promise.all([
            getPrograms(),
            getPlatforms(),
            detectCountryCodeLower(),
            getCommerceConfig(),
        ]);

    // Resolve selected program by id (string) or slug fallback
    const selectedPlan: ProgramWithDiscounts | null =
        programs.find((p) => String(p.id) === planId) ||
        programs.find((p) => p.slug === planId) ||
        null;

    const tierIndexRaw = Number.parseInt(tierParam || "0", 10);
    const tierIndex = Number.isFinite(tierIndexRaw) ? tierIndexRaw : 0;
    const resolvedTierIndex = selectedPlan?.pricingTiers?.length
        ? Math.max(0, Math.min(tierIndex, selectedPlan.pricingTiers.length - 1))
        : 0;

    const selectedPlatform = platforms.find((p) => p?.slug === platformId);

    const tier = selectedPlan?.pricingTiers?.[resolvedTierIndex];
    const tierDiscount = tier
        ? selectedPlan?.discounts?.[tier.accountSize]
        : undefined;
    const tierWithPricing = tier
        ? {
              ...tier,
              originalPrice: tierDiscount?.originalPrice ?? tier.price,
              discountedPrice: tierDiscount?.discountedPrice,
              couponCode: tierDiscount?.couponCode,
              discountType: tierDiscount?.discountType,
              discountValue: tierDiscount?.discountValue,
          }
        : undefined;
    const hasValidSelection = Boolean(
        category && selectedPlan && tierWithPricing && platformId,
    );

    const categoryLabel =
        category === "1-step"
            ? t("checkout.categories.oneStep")
            : category === "2-step"
              ? t("checkout.categories.twoStep")
              : category === "instant"
                ? t("checkout.categories.instant")
                : "";

    const summaryText = hasValidSelection
        ? [
              categoryLabel,
              selectedPlan?.name,
              tier?.accountSize,
              selectedPlatform?.name || platformId,
          ]
              .filter(Boolean)
              .join(" - ")
        : "";

    // Convert detected country code to uppercase for phone input
    const defaultCountry = detectedCountryCode?.toUpperCase() as Country;

    return (
        <div className="relative mx-auto max-w-7xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
            {!hasValidSelection ? (
                <Card wrapperClassName="bg-none" className="!bg-none py-6">
                    <CardHeader className="">
                        <CardTitle className="text-white/80 text-xs uppercase">
                            {t("checkout.orderSummary")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="text-white/70">
                                {t("checkout.selectionIncomplete")}
                            </div>
                            <Link
                                href="/variations"
                                className="text-blue-400 text-sm hover:underline hover:underline-offset-4"
                            >
                                {t("checkout.goBackToChoose")}
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                selectedPlan &&
                tierWithPricing && (
                    <CompleteCheckout
                        selectedPlan={selectedPlan}
                        tier={tierWithPricing}
                        platformId={platformId}
                        summaryText={summaryText}
                        categoryLabel={categoryLabel}
                        platformName={selectedPlatform?.name}
                        defaultCountry={defaultCountry}
                        inAppData={inAppData}
                        commerceConfig={commerceConfig}
                    />
                )
            )}
        </div>
    );
};

export default CheckoutPage;
