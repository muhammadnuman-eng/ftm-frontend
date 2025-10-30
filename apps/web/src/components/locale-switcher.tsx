"use client";

import { CheckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import ReactCountryFlag from "react-country-flag";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/routing";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

export const LocaleSwitcher = () => {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations("languageSwitcher");
    const [isPending, startTransition] = useTransition();

    const handleLocaleChange = (nextLocale: string) => {
        if (nextLocale === locale) {
            return;
        }

        startTransition(() => {
            router.push(pathname, {
                locale: nextLocale as never,
            });
        });
    };

    const activeLocale = SUPPORTED_LOCALES.find((item) => item.code === locale);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                disabled={isPending}
                aria-label={t("label")}
                className="flex h-10 items-center gap-2 rounded-md bg-transparent px-3 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <span className="sr-only">{t("label")}</span>
                {activeLocale ? (
                    <>
                        <ReactCountryFlag
                            svg
                            aria-hidden
                            countryCode={activeLocale.flagCode}
                            style={{ width: "1.3em", height: "1.3em" }}
                        />
                        <span className="font-semibold text-white/80 text-xs uppercase">
                            {activeLocale.code}
                        </span>
                    </>
                ) : (
                    <span className="text-white/70 text-xs uppercase">
                        {locale}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="min-w-48 border-white/15 bg-stone-900/95 text-white backdrop-blur-md"
            >
                {SUPPORTED_LOCALES.map(
                    ({ code, label, nativeLabel, flagCode }) => {
                        const isActive = code === locale;
                        return (
                            <DropdownMenuItem
                                key={code}
                                onSelect={() => {
                                    handleLocaleChange(code);
                                }}
                                disabled={isPending}
                                className="flex items-center gap-3 px-3 py-2 text-sm focus:bg-white/10"
                            >
                                <span className="flex items-center">
                                    <ReactCountryFlag
                                        svg
                                        aria-hidden
                                        countryCode={flagCode}
                                        style={{
                                            width: "1.25em",
                                            height: "1.25em",
                                        }}
                                    />
                                </span>
                                <span className="flex flex-col text-left">
                                    <span className="font-medium leading-tight">
                                        {label}
                                    </span>
                                    <span className="text-white/60 text-xs">
                                        {nativeLabel}
                                    </span>
                                </span>
                                {isActive ? (
                                    <CheckIcon
                                        className="ml-auto size-4 text-white/70"
                                        aria-hidden
                                    />
                                ) : null}
                            </DropdownMenuItem>
                        );
                    },
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
