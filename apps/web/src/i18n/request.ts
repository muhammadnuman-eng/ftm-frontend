import { getRequestConfig } from "next-intl/server";
import { getMessages } from "@/lib/i18n/messages";
import type { AppLocale } from "../../i18n.config";

export default getRequestConfig(async ({ requestLocale }) => {
    const locale = await requestLocale;
    const normalized = locale as AppLocale;

    return {
        locale: normalized,
        messages: await getMessages(normalized),
    };
});
