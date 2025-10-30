import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_CODES } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";

export default getRequestConfig(async ({ requestLocale }) => {
    // Get locale from request or use default
    // requestLocale will be undefined when middleware doesn't run (e.g., /admin routes)
    let locale: string;

    try {
        const resolvedLocale = await requestLocale;

        // Validate that the incoming `locale` parameter is valid
        if (
            resolvedLocale &&
            LOCALE_CODES.includes(
                resolvedLocale as (typeof LOCALE_CODES)[number],
            )
        ) {
            locale = resolvedLocale;
        } else {
            locale = DEFAULT_LOCALE;
        }
    } catch {
        // If requestLocale throws (when middleware didn't run), use default
        locale = DEFAULT_LOCALE;
    }

    return {
        locale,
        messages: await getMessages(locale),
    };
});
