import { GitCompareIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export const MainNavigation = async ({ locale }: { locale: string }) => {
    const t = await getTranslations({ locale, namespace: "navigation" });
    return (
        <NavigationMenu viewport={false} className="hidden md:flex">
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>
                        {t("programs.label")}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="grid gap-4">
                            <ul className="grid w-96 gap-2">
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link href="/1-step">
                                            <div className="font-bold text-base">
                                                {t(
                                                    "programs.links.oneStep.title",
                                                )}
                                            </div>
                                            <p className="text-muted-foreground text-sm leading-snug">
                                                {t(
                                                    "programs.links.oneStep.description",
                                                )}
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link href="/2-step">
                                            <div className="font-bold text-base">
                                                {t(
                                                    "programs.links.twoStep.title",
                                                )}
                                            </div>
                                            <p className="text-muted-foreground text-sm leading-snug">
                                                {t(
                                                    "programs.links.twoStep.description",
                                                )}
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                                <li>
                                    <NavigationMenuLink asChild>
                                        <Link href="/ftm-instant-funding">
                                            <div className="font-bold text-base">
                                                {t(
                                                    "programs.links.instant.title",
                                                )}
                                            </div>
                                            <p className="text-muted-foreground text-sm leading-snug">
                                                {t(
                                                    "programs.links.instant.description",
                                                )}
                                            </p>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                            </ul>
                            <Link
                                href="/programs"
                                className="flex items-center gap-2 rounded-md bg-indigo-600 p-4"
                            >
                                <GitCompareIcon className="shrink-0" />
                                <span className="ml-2 grid gap-1">
                                    <span className="font-bold">
                                        {t("programs.cta.label")}
                                    </span>
                                    <span className="text-sm text-white/80 leading-snug">
                                        {t("programs.cta.description")}
                                    </span>
                                </span>
                            </Link>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/how-it-works">{t("howItWorks")}</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/affiliates">{t("affiliates")}</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink
                        asChild
                        className={navigationMenuTriggerStyle()}
                    >
                        <Link href="/faq">{t("faq")}</Link>
                    </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                    <NavigationMenuTrigger>
                        {t("resources")}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="right-0 left-auto">
                        <ul className="grid w-[250px] gap-2">
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/tools">
                                        <div className="font-medium">
                                            {t("tools.title")}
                                        </div>
                                        <p className="text-muted-foreground text-sm leading-snug">
                                            {t("tools.description")}
                                        </p>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/blog">
                                        <div className="font-medium">
                                            {t("blog.title")}
                                        </div>
                                        <p className="text-muted-foreground text-sm leading-snug">
                                            {t("blog.description")}
                                        </p>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                            <li>
                                <NavigationMenuLink asChild>
                                    <Link href="/instruments-specification">
                                        <div className="font-medium">
                                            {t("instrumentsSpec.title")}
                                        </div>
                                        <p className="text-muted-foreground text-sm leading-snug">
                                            {t("instrumentsSpec.description")}
                                        </p>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
};
