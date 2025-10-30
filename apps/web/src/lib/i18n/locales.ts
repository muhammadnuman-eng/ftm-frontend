export const SUPPORTED_LOCALES = [
    {
        code: "en",
        label: "English",
        nativeLabel: "English",
        flagCode: "GB",
        dir: "ltr",
    },
    {
        code: "tr",
        label: "Turkish",
        nativeLabel: "T\u00fcrk\u00e7e",
        flagCode: "TR",
        dir: "ltr",
    },
    {
        code: "de",
        label: "German",
        nativeLabel: "Deutsch",
        flagCode: "DE",
        dir: "ltr",
    },
    {
        code: "ar",
        label: "Arabic",
        nativeLabel: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
        flagCode: "SA",
        dir: "rtl",
    },
    {
        code: "ms",
        label: "Malay",
        nativeLabel: "Bahasa Melayu",
        flagCode: "MY",
        dir: "ltr",
    },
    {
        code: "es",
        label: "Spanish",
        nativeLabel: "Español",
        flagCode: "ES",
        dir: "ltr",
    },
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleCode = SupportedLocale["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const LOCALE_CODES: LocaleCode[] = SUPPORTED_LOCALES.map(
    (locale) => locale.code,
);

export const RTL_LOCALES = new Set<LocaleCode>(
    SUPPORTED_LOCALES.filter((locale) => locale.dir === "rtl").map(
        (locale) => locale.code,
    ),
);
