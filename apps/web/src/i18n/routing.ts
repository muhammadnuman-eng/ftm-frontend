import { createSharedPathnamesNavigation } from "next-intl/navigation";
import { LOCALE_CODES } from "@/lib/i18n/locales";

export const localeNavigation = createSharedPathnamesNavigation({
    locales: LOCALE_CODES,
    localePrefix: "as-needed",
});

export const {
    Link: LocaleLink,
    redirect: localeRedirect,
    usePathname,
    useRouter,
} = localeNavigation;
