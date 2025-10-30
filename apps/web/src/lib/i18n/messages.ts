import type { AbstractIntlMessages } from "next-intl";
import type { AppLocale } from "../../../i18n.config";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./locales";

type Messages = AbstractIntlMessages;

type MessageLoader = () => Promise<{ default: Messages }>;

const loaders: Record<AppLocale, MessageLoader> = {
    en: () => import("@/locales/en.json"),
    tr: () => import("@/locales/tr.json"),
    de: () => import("@/locales/de.json"),
    ar: () => import("@/locales/ar.json"),
    ms: () => import("@/locales/ms.json"),
    es: () => import("@/locales/es.json"),
};

export const isSupportedLocale = (locale: string): locale is AppLocale =>
    SUPPORTED_LOCALES.some((item) => item.code === locale);

export const getMessages = async (locale: string): Promise<Messages> => {
    if (!isSupportedLocale(locale)) {
        return loaders[DEFAULT_LOCALE as AppLocale]().then(
            (mod) => mod.default,
        );
    }

    const loader = loaders[locale];
    return loader().then((mod) => mod.default);
};

export const normalizeLocale = (locale: string): AppLocale =>
    (isSupportedLocale(locale) ? locale : DEFAULT_LOCALE) as AppLocale;
