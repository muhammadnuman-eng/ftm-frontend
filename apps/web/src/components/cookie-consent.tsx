import { getPayload } from "payload";
import configPromise from "@/payload.config";
import type { AppLocale } from "../../i18n.config";
import { CookieConsentClient } from "./cookie-consent-client";

export async function CookieConsent({ locale }: { locale: AppLocale }) {
    const payload = await getPayload({ config: configPromise });

    const cookieConsentGlobal = await payload.findGlobal({
        slug: "cookie-consent",
        locale,
    });

    // If cookie consent is disabled, don't render anything
    if (!cookieConsentGlobal?.enabled) {
        return null;
    }

    return (
        <CookieConsentClient
            message={cookieConsentGlobal.message || ""}
            acceptButtonText={cookieConsentGlobal.acceptButtonText || "Accept"}
            denyButtonText={cookieConsentGlobal.denyButtonText || "Deny"}
            cookiePolicyLinkText={
                cookieConsentGlobal.cookiePolicyLinkText || "Cookie Policy"
            }
            privacyPolicyLinkText={
                cookieConsentGlobal.privacyPolicyLinkText || "Privacy Statement"
            }
            cookiePolicyUrl={
                cookieConsentGlobal.cookiePolicyUrl || "/cookie-policy"
            }
            privacyPolicyUrl={
                cookieConsentGlobal.privacyPolicyUrl || "/privacy-policy"
            }
            locale={locale}
        />
    );
}
