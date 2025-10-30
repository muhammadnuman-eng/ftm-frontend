/** biome-ignore-all lint/performance/noImgElement: dont use nextimage */

import { ArrowUpRightIcon } from "lucide-react";
import { draftMode } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import { BannerDisplay } from "./banner-display";
import { LocaleSwitcher } from "./locale-switcher";
import { LogoIcon, LogoWithType } from "./logo";
import { MainNavigation } from "./main-navigation";
import { MobileMenu } from "./mobile-menu";
import { Button } from "./ui/button";

// Helper function to get background gradient classes
const getBackgroundClasses = (color: string) => {
    switch (color) {
        case "blue":
            return "bg-gradient-to-br from-25% from-blue-500 to-blue-700";
        case "purple":
            return "bg-gradient-to-br from-25% from-purple-500 to-purple-700";
        case "green":
            return "bg-gradient-to-br from-25% from-green-500 to-green-700";
        case "red":
            return "bg-gradient-to-br from-25% from-red-500 to-red-700";
        case "black":
            return "bg-black";
        default:
            return "bg-gradient-to-br from-25% from-indigo-500 to-indigo-700";
    }
};

export const Header = async ({ locale }: { locale: string }) => {
    // Use connection() to ensure dynamic rendering for banner date-based visibility
    await connection();

    const { isEnabled: isDraftMode } = await draftMode();
    const payload = await getPayloadClient();

    const normalizedLocale = normalizeLocale(locale);

    const banners = await payload.findGlobal({
        slug: "banners",
        draft: isDraftMode,
        locale: normalizedLocale,
    });

    const marqueeConfig = banners.headerMarquee;

    const t = await getTranslations({
        locale: normalizedLocale,
        namespace: "header",
    });

    // If marquee is disabled, don't render it
    if (!marqueeConfig?.enabled) {
        return (
            <div className="sticky top-0 z-50 border-b border-b-white/10 bg-stone-950/20 backdrop-blur-2xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20">
                    <Link href="/">
                        <LogoWithType className="hidden h-12 md:block" />
                        <LogoIcon className="h-8 md:hidden" />
                    </Link>

                    <MainNavigation locale={normalizedLocale} />

                    <div className="flex items-center gap-2">
                        <div className="hidden items-center gap-2 md:flex">
                            <Button variant="ghost" size="lg" asChild>
                                <Link
                                    href="https://dash.fundedtradermarkets.com/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t("register")}
                                </Link>
                            </Button>
                            <Button variant="default" size="lg" asChild>
                                <Link
                                    href="https://dash.fundedtradermarkets.com/sign-in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t("login")}
                                </Link>
                            </Button>
                            <LocaleSwitcher />
                        </div>
                        <MobileMenu />
                    </div>
                </div>
            </div>
        );
    }

    const backgroundClass = getBackgroundClasses(
        marqueeConfig.backgroundColor || "indigo",
    );
    return (
        <>
            <BannerDisplay
                viewType={marqueeConfig.viewType || "marquee"}
                images={marqueeConfig.images || []}
                speed={marqueeConfig.speed || "normal"}
                backgroundClass={backgroundClass}
            />
            <div className="sticky top-0 z-50 border-b border-b-white/10 bg-stone-950/20 backdrop-blur-2xl">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-20">
                    <Link href="/">
                        <LogoWithType className="hidden h-12 md:block" />
                        <LogoIcon className="h-8 md:hidden" />
                    </Link>

                    <MainNavigation locale={normalizedLocale} />

                    <div className="flex items-center gap-2">
                        <div className="hidden items-center gap-2 md:flex">
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href="https://dash.fundedtradermarkets.com/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t("register")}
                                </Link>
                            </Button>
                            <Button variant="secondary" size="sm" asChild>
                                <Link
                                    href="https://dash.fundedtradermarkets.com/sign-in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {t("login")}
                                </Link>
                            </Button>
                            <LocaleSwitcher />
                        </div>

                        <Button
                            variant="default"
                            size="sm"
                            asChild
                            className="rounded-sm sm:hidden"
                        >
                            <Link href="/variations">
                                Get Started
                                <ArrowUpRightIcon className="size-4" />
                            </Link>
                        </Button>

                        <MobileMenu />
                    </div>
                </div>
            </div>
        </>
    );
};
