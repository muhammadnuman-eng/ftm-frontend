import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import NextTopLoader from "nextjs-toploader";
import { CookieConsent } from "@/components/cookie-consent";
import { Providers } from "@/components/providers";
import { LOCALE_CODES } from "@/lib/i18n/locales";
import { getMessages, isSupportedLocale } from "@/lib/i18n/messages";
import type { AppLocale } from "../../../i18n.config";
import { localeMetadata } from "../../../i18n.config";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

type LayoutProps = {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
};

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale = localeParam as AppLocale;

    if (!isSupportedLocale(locale)) {
        return {
            title: "Funded Trader Markets",
            description:
                "Funded Trader Markets: Faster payouts, better conditions, transparent rules.",
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                },
            },
        };
    }

    const t = await getTranslations({ locale, namespace: "metadata" });

    const defaultTitle = t("titleDefault");
    const template = t("titleTemplate");
    const description = t("description");

    return {
        metadataBase: new URL("https://fundedtradermarkets.com"),
        title: {
            default: defaultTitle,
            template,
        },
        description,
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
        openGraph: {
            siteName: t("ogSiteName"),
            type: t("ogType") as "website",
            url: "/",
        },
        twitter: {
            card: "summary_large_image",
        },
    };
}

export const generateStaticParams = () =>
    LOCALE_CODES.map((locale) => ({
        locale,
    }));

const LocaleLayout = async ({ children, params }: LayoutProps) => {
    const { locale: localeParam } = await params;

    if (!isSupportedLocale(localeParam)) {
        notFound();
    }

    const locale = localeParam as AppLocale;
    const messages = await getMessages(locale);
    const meta = localeMetadata[locale];

    return (
        <html lang={locale} dir={meta.dir}>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <NextTopLoader height={4} color="#fff" />
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <Providers>{children}</Providers>
                    <CookieConsent locale={locale} />
                </NextIntlClientProvider>

                <Analytics />
                <GoogleTagManager gtmId="GTM-56FTWHLW" />
                {process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY && (
                    <Script
                        strategy="afterInteractive"
                        src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY}`}
                    />
                )}
                <Script
                    strategy="afterInteractive"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for affiliate_username and visit tracking
                    dangerouslySetInnerHTML={{
                        __html: `
                            function getQueryParamAffwp(name) {
                                const urlParams = new URLSearchParams(window.location.search);
                                return urlParams.get(name);
                            }

                            function setCookieAffwp(name, value, days) {
                                const maxAge = days * 24 * 60 * 60;
                                const hostname = window.location.hostname;
                                let domain = hostname;
                                
                                if (!hostname.includes('localhost') && !hostname.match(/^[0-9.]+$/)) {
                                    const parts = hostname.split('.');
                                    if (parts.length >= 2) {
                                        domain = "." + parts.slice(-2).join('.');
                                    }
                                }

                                document.cookie = name + "=" + encodeURIComponent(value) + "; path=/; domain=" + domain + "; max-age=" + maxAge + "; secure; samesite=Lax";
                            }

                            function getCookieAffwp(name) {
                                const nameEQ = name + "=";
                                const ca = document.cookie.split(';');
                                for(let i = 0; i < ca.length; i++) {
                                    let c = ca[i];
                                    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                                    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
                                }
                                return null;
                            }

                            (function () {
                                // Check for affiliate_username in query params first
                                const affiliateUsernameFromUrl = getQueryParamAffwp("affiliate_username");
                                const campaign = getQueryParamAffwp("campaign") || getQueryParamAffwp("utm_campaign");
                                
                                // If found in URL, update the cookie
                                if (affiliateUsernameFromUrl) {
                                    setCookieAffwp("affiliate_username", affiliateUsernameFromUrl, 30);
                                }
                                
                                // Get affiliate username from cookie (either just set or previously stored)
                                const affiliateUsername = getCookieAffwp("affiliate_username");
                                
                                if (affiliateUsername) {
                                    // Only create visit if we haven't created one for this affiliate recently
                                    const existingVisitId = getCookieAffwp("affwp_visit_id");
                                    
                                    if (!existingVisitId) {
                                        // Send visit creation request to our API
                                        fetch('/api/affiliatewp/create-visit', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                affiliateUsername: affiliateUsername,
                                                url: window.location.href,
                                                referrer: document.referrer || '',
                                                campaign: campaign || ''
                                            })
                                        })
                                        .then(res => res.json())
                                        .then(data => {
                                            if (data.success && data.visit_id) {
                                                // Store visit_id for 30 days to prevent duplicates
                                                setCookieAffwp("affwp_visit_id", data.visit_id, 30);
                                            }
                                        })
                                        .catch(err => console.error('Visit tracking failed:', err));
                                    }
                                }
                            })();
                        `,
                    }}
                />
                <Script
                    strategy="afterInteractive"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for dynamic script injection
                    dangerouslySetInnerHTML={{
                        __html: `
                            var head = document.head;
                            var script = document.createElement('script');
                            script.type = 'text/javascript';
                            script.src = "https://t.fundedtradermarkets.com/v1/lst/universal-script?ph=324c7198f9c9aa70fef667b1a1bed82c5e31139d37bc5694bcd53a4e5a40a9fa&tag=!clicked&ref_url=" + encodeURI(document.URL);
                            head.appendChild(script);
                        `,
                    }}
                />
                <Script
                    strategy="afterInteractive"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for dynamic script injection
                    dangerouslySetInnerHTML={{
                        __html: `
                                window.intercomSettings = {
                                    api_base: "https://api-iam.intercom.io",
                                    app_id: "vb20lazv",
                                };
                            `,
                    }}
                />
            </body>
        </html>
    );
};

export default LocaleLayout;
