import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { normalizeLocale } from "@/lib/i18n/messages";
import { LogoIcon } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { Button } from "./ui/button";

type SvgIconProps = {
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
};

type FooterLink = {
    href: string;
    labelKey: string;
    external?: boolean;
};

type FooterProps = {
    locale: string;
};

const NAVIGATION_GROUPS: Array<{
    titleKey: string;
    links: FooterLink[];
}> = [
    {
        titleKey: "groups.resources",
        links: [
            { href: "/blog", labelKey: "links.blog" },
            { href: "/how-it-works", labelKey: "links.howItWorks" },
            { href: "/tools", labelKey: "links.tools" },
        ],
    },
    {
        titleKey: "groups.important",
        links: [
            { href: "/programs", labelKey: "links.programs" },
            { href: "/faq", labelKey: "links.faq" },
            {
                href: "https://intercom.help/fundedtradermarkets/en",
                labelKey: "links.helpCenter",
                external: true,
            },
        ],
    },
    {
        titleKey: "groups.policies",
        links: [
            { href: "/terms-conditions", labelKey: "links.terms" },
            { href: "/affiliate-policy", labelKey: "links.affiliates" },
            { href: "/privacy-policy", labelKey: "links.privacy" },
            { href: "/refund-policy", labelKey: "links.refund" },
            { href: "/aml-policy", labelKey: "links.aml" },
        ],
    },
    {
        titleKey: "groups.community",
        links: [
            {
                href: "https://discord.com/invite/ftmarkets",
                labelKey: "links.discord",
                external: true,
            },
            {
                href: "https://x.com/FTMarketslive",
                labelKey: "links.x",
                external: true,
            },
            {
                href: "/contact",
                labelKey: "links.contact",
            },
        ],
    },
];

const SOCIAL_LINKS: Array<{
    nameKey: string;
    href: string;
    icon: (props: SvgIconProps) => React.JSX.Element;
}> = [
    {
        nameKey: "social.facebook",
        href: "https://www.facebook.com/FundedTraderMarketsOfficial/",
        icon: (props: SvgIconProps) => (
            <svg
                role="graphics-symbol"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                {...props}
            >
                <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
    {
        nameKey: "social.instagram",
        href: "https://www.instagram.com/fundedtradermarkets/",
        icon: (props: SvgIconProps) => (
            <svg
                role="graphics-symbol"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                {...props}
            >
                <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    },
    {
        nameKey: "social.tiktok",
        href: "https://www.tiktok.com/@fundedtradermarket_",
        icon: (props: SvgIconProps) => (
            <svg
                role="graphics-symbol"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                {...props}
            >
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.5.2-2.11 1.45-4.11 3.28-5.22 1.67-1.03 3.8-1.31 5.72-.73.01 1.23-.03 2.45-.02 3.68-.82-.26-1.76-.17-2.47.3-.63.41-1.11 1.07-1.25 1.82-.14.66-.05 1.36.25 1.95.34.68.96 1.23 1.69 1.48.63.22 1.34.17 1.94-.13.74-.36 1.3-1.09 1.48-1.9.08-.36.05-.73.05-1.09.01-4.18-.01-8.36.02-12.54 1.52.01 3.05-.01 4.57.02.06 1.21.54 2.42 1.35 3.32.86.95 2.08 1.52 3.34 1.67v4.06c-1.69-.13-3.36-.64-4.78-1.54-.36-.22-.68-.48-1.02-.73.02 2.52.05 5.03-.03 7.54-.17 2.37-1.3 4.7-3.06 6.32-1.56 1.42-3.6 2.29-5.7 2.32-1.49.07-2.99-.26-4.29-.95-2.2-1.12-3.87-3.24-4.43-5.62-.59-2.44-.17-5.1 1.22-7.2 1.52-2.29 4.15-3.79 6.88-3.88.17 0 .34-.02.51-.01V6.8c1.32-.01 2.64-.01 3.96-.01z" />
            </svg>
        ),
    },
    {
        nameKey: "social.youtube",
        href: "https://www.youtube.com/@fundedtradermarkets",
        icon: (props: SvgIconProps) => (
            <svg
                role="graphics-symbol"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                {...props}
            >
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.376.55A3.016 3.016 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136C4.495 20.5 12 20.5 12 20.5s7.505 0 9.376-.55a3.016 3.016 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
    },
    {
        nameKey: "social.linkedin",
        href: "https://www.linkedin.com/company/fundedtradersmarkets/",
        icon: (props: SvgIconProps) => (
            <svg
                role="graphics-symbol"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                {...props}
            >
                <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 5 2.12 5 3.5zM.22 8.08h4.56V23H.22V8.08zM8.4 8.08h4.37v2.03h.06c.61-1.16 2.12-2.38 4.36-2.38 4.66 0 5.52 3.07 5.52 7.07V23h-4.56v-6.57c0-1.57-.03-3.6-2.19-3.6-2.19 0-2.52 1.71-2.52 3.48V23H8.4V8.08z" />
            </svg>
        ),
    },
];

export const Footer = async ({ locale }: FooterProps) => {
    const normalizedLocale = normalizeLocale(locale);
    const t = await getTranslations({
        locale: normalizedLocale,
        namespace: "footer",
    });

    return (
        <footer className="mt-12 bg-stone-950/80 text-white sm:mt-24">
            <div className="mx-auto mb-6 grid max-w-7xl gap-6 px-4 sm:px-0 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-blue-500/10">
                    <div
                        className="flex h-full flex-col rounded-3xl p-6 lg:p-8"
                        style={{
                            background:
                                "radial-gradient(158.33% 101.7% at 104.55% -1.7%, rgba(89, 106, 197, 0.3) 0%, rgba(89, 106, 197, 0) 100%)",
                        }}
                    >
                        <div className="-ml-6 lg:-ml-8 mb-6">
                            {/** biome-ignore lint/performance/noImgElement: remote image */}
                            <img
                                src="/images/newsletter.png"
                                alt={t("callouts.newsletter.imageAlt")}
                            />
                        </div>
                        <h2 className="max-w-lg text-balance font-bold text-2xl lg:text-4xl">
                            {t("callouts.newsletter.title")}
                        </h2>
                        <p className="mt-4 text-white/80 lg:text-lg">
                            {t("callouts.newsletter.description")}
                        </p>

                        <div className="mt-auto pt-6">
                            <NewsletterForm />
                        </div>
                    </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-indigo-500/10">
                    <div
                        className="flex h-full flex-col rounded-3xl p-6 lg:p-8"
                        style={{
                            background:
                                "radial-gradient(158.33% 101.7% at 104.55% -1.7%, rgba(89, 106, 197, 0.3) 0%, rgba(89, 106, 197, 0) 100%)",
                        }}
                    >
                        <div className="-ml-6 lg:-ml-8 mb-6">
                            {/** biome-ignore lint/performance/noImgElement: remote image */}
                            <img
                                src="/images/discord.png"
                                alt={t("callouts.community.imageAlt")}
                            />
                        </div>
                        <h2 className="max-w-lg text-balance font-bold text-2xl lg:text-4xl">
                            {t("callouts.community.title")}
                        </h2>
                        <p className="mt-4 text-white/80 lg:text-lg">
                            {t("callouts.community.description")}
                        </p>

                        <div className="mt-auto pt-6">
                            <Button size="lg" variant="outline" asChild>
                                <a
                                    href="https://discord.com/invite/ftmarkets"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    {t("callouts.community.button")}
                                    <ArrowUpRightIcon />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mx-auto mb-8 max-w-7xl rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 px-6 py-16 lg:px-8">
                <div className="xl:grid xl:grid-cols-3 xl:gap-8">
                    <div className="space-y-6">
                        <LogoIcon className="h-12" />
                        <p className="text-sm/6 text-white/60">
                            {t("tagline")}
                        </p>
                        <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm text-white/80">
                                {t("social.title")}
                            </span>
                            <div className="flex gap-3">
                                {SOCIAL_LINKS.map(
                                    ({ nameKey, href, icon: Icon }) => (
                                        <a
                                            key={nameKey}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={t(nameKey)}
                                            className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
                                        >
                                            <Icon className="size-4" />
                                        </a>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4 xl:col-span-2 xl:mt-0">
                        {NAVIGATION_GROUPS.map(({ titleKey, links }) => (
                            <div key={titleKey}>
                                <h3 className="font-semibold text-sm text-white/80 uppercase tracking-wide">
                                    {t(titleKey)}
                                </h3>
                                <ul className="mt-4 space-y-3 text-sm text-white/60">
                                    {links.map(
                                        ({ href, labelKey, external }) => (
                                            <li key={`${titleKey}-${labelKey}`}>
                                                {external ? (
                                                    <a
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="transition hover:text-white hover:underline hover:underline-offset-4"
                                                    >
                                                        {t(labelKey)}
                                                    </a>
                                                ) : (
                                                    <Link
                                                        className="transition hover:text-white hover:underline hover:underline-offset-4"
                                                        href={href}
                                                    >
                                                        {t(labelKey)}
                                                    </Link>
                                                )}
                                            </li>
                                        ),
                                    )}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 border-white/10 border-t pt-8">
                    <h4 className="font-semibold text-sm text-white/80 uppercase tracking-wide">
                        {t("legal.heading")}
                    </h4>
                    <p className="mt-4 text-white/50 text-xs">
                        {t("legal.body")}
                    </p>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-white/10 border-t pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
                    <p>{t("copyright", { year: new Date().getFullYear() })}</p>
                </div>
            </div>

            <div className="mx-auto max-w-7xl space-y-4 px-6 pb-6 text-white/40 text-xs lg:px-8">
                <h4 className="font-semibold text-sm text-white/60 uppercase tracking-wide">
                    Disclaimer: Educational Use Only
                </h4>
                <p>
                    All content provided by FTM Funded Trader Markets LTD
                    ("FTM") and its affiliates is for general informational and
                    educational purposes only. The information on
                    www.fundedtradermarkets.com does not constitute: (a)
                    investment advice; (b) an offer or solicitation to buy or
                    sell any financial product; or (c) a recommendation or
                    endorsement of any broker, financial instrument, or trading
                    platform.
                </p>
                <p>
                    FTM Funded Trader Markets LTD (FTM) is a broker offering
                    demo accounts for educational purposes in a non-live
                    environment. FTM does not offer investment or financial
                    advice, nor does it provide trading strategies or
                    recommendations related to financial instruments or market
                    participation. In the event that a client engages in live
                    trading, any trading activity will only be conducted through
                    real trading accounts.
                </p>
                <h5 className="pt-2 font-semibold text-white/60 uppercase tracking-wide">
                    Company Details
                </h5>
                <p>
                    FTM Funded Trader Markets LTD is a technology and education
                    company incorporated in Cyprus under registration number
                    HE462185, with its registered office at 56 Alekou
                    Konstantinou, Strovolos, 2024, Nicosia, Cyprus.
                </p>
                <p>
                    Funded Trader Markets LTD is a legal entity incorporated in
                    Saint Lucia under registration number 2025-00239, located at
                    Ground Floor, The Sotheby Building, Rodney Village, Rodney
                    Bay, Gros-Islet, Saint Lucia, and provides brokerage
                    services.
                </p>
                <p>
                    <strong>Risk Warning:</strong> Trading in financial markets
                    involves substantial risk and may not be suitable for all
                    individuals. You may incur significant losses. Always
                    consult with a licensed financial advisor before making any
                    trading decisions. Testimonials featured on this website are
                    not indicative of future results, and individual performance
                    will vary.
                </p>
                <h5 className="pt-2 font-semibold text-white/60 uppercase tracking-wide">
                    Jurisdictional Restrictions
                </h5>
                <p>
                    Our services are not available to residents of the following
                    jurisdictions: Cuba, Syria, Iran, Lebanon, Iraq, Yemen,
                    North Korea, and Cyprus. CTrader and MetaTrader "MT5"
                    services and related content on this site are not intended
                    for U.S. residents or for use in jurisdictions where such
                    use would violate applicable laws or regulations.
                </p>
                <p>
                    For additional information, please review our Terms of Use,
                    Privacy Policy, and Risk Disclosures, or contact
                    support@fundedtradermarkets.com.
                </p>
                <p>
                    <strong>CFTC RULE 4.41</strong> - Hypothetical or simulated
                    performance results have certain limitations. Unlike an
                    actual performance record, simulated results do not
                    represent actual trading. Also, since the trades have not
                    been executed, the results may have under-or-over
                    compensated for the impact, if any, of certain market
                    factors, including but not limited to, lack of liquidity.
                    Simulated trading programs in general, are also subject to
                    the fact that they are designed with the benefit of
                    hindsight. No representation is being made that any account
                    will or is likely to achieve profit or losses similar to
                    those depicted on the www.fundedtradermarkets.com website.
                </p>
            </div>
        </footer>
    );
};
