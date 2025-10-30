"use client";

import Link from "next/link";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import type { AppLocale } from "../../i18n.config";
import { Button } from "./ui/button";

interface CookieConsentClientProps {
    message: string;
    acceptButtonText: string;
    denyButtonText: string;
    cookiePolicyLinkText: string;
    privacyPolicyLinkText: string;
    cookiePolicyUrl: string;
    privacyPolicyUrl: string;
    locale: AppLocale;
}

export function CookieConsentClient({
    message,
    acceptButtonText,
    denyButtonText,
    cookiePolicyLinkText,
    privacyPolicyLinkText,
    cookiePolicyUrl,
    privacyPolicyUrl,
    locale,
}: CookieConsentClientProps) {
    const { isPending, acceptCookies, denyCookies } = useCookieConsent();

    // Don't show the popup if consent has already been given or denied
    if (!isPending) {
        return null;
    }

    // Add locale prefix to URLs if they're relative
    const getCookiePolicyUrl = () => {
        if (cookiePolicyUrl.startsWith("http")) return cookiePolicyUrl;
        return `/${locale}${cookiePolicyUrl}`;
    };

    const getPrivacyPolicyUrl = () => {
        if (privacyPolicyUrl.startsWith("http")) return privacyPolicyUrl;
        return `/${locale}${privacyPolicyUrl}`;
    };

    return (
        <div
            className="fixed right-0 bottom-0 left-0 z-50 p-4 sm:right-auto sm:bottom-6 sm:left-6 sm:p-0"
            role="dialog"
            aria-label="Cookie consent"
            aria-describedby="cookie-consent-message"
        >
            <div className="relative w-full rounded-lg bg-stone-950/80 p-6 ring-1 ring-white/10 backdrop-blur-md sm:max-w-md md:max-w-lg">
                <div className="flex flex-col gap-4">
                    <p
                        id="cookie-consent-message"
                        className="text-sm text-white/90 leading-relaxed"
                    >
                        {message}
                    </p>
                    <div className="flex gap-3">
                        <Button
                            onClick={acceptCookies}
                            className="flex-1 bg-white text-stone-900 hover:bg-stone-100"
                            size="sm"
                        >
                            {acceptButtonText}
                        </Button>
                        <Button
                            onClick={denyCookies}
                            variant="ghost"
                            className="flex-1 text-white hover:bg-white/10"
                            size="sm"
                        >
                            {denyButtonText}
                        </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
                        <Link
                            href={getCookiePolicyUrl()}
                            className="text-white/70 underline hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {cookiePolicyLinkText}
                        </Link>
                        <Link
                            href={getPrivacyPolicyUrl()}
                            className="text-white/70 underline hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {privacyPolicyLinkText}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
