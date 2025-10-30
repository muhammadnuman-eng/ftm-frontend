import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./src/lib/i18n/locales";

export const i18nConfig = {
    defaultLocale: DEFAULT_LOCALE,
    locales: SUPPORTED_LOCALES.map((locale) => locale.code),
};

export type AppLocale = (typeof i18nConfig.locales)[number];

export const localeMetadata = SUPPORTED_LOCALES.reduce(
    (acc, locale) => {
        acc[locale.code] = locale;
        return acc;
    },
    {} as Record<AppLocale, (typeof SUPPORTED_LOCALES)[number]>,
);

export default i18nConfig;
