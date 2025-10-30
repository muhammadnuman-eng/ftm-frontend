"use client";

import {
    BarChartIcon,
    CreditCardIcon,
    DollarSignIcon,
    EyeIcon,
    HomeIcon,
    LinkIcon,
    LogOutIcon,
    TagIcon,
    TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAffiliate } from "@/lib/affiliate-auth-actions";

interface AffiliateSidebarProps {
    locale: string;
    session: {
        username: string;
        email: string;
    };
}

const getNavigation = (locale: string) => {
    // Use as-needed locale prefix (only show non-default locales)
    const prefix = locale === "en" ? "" : `/${locale}`;

    return [
        {
            name: "Dashboard",
            href: `${prefix}/affiliate-area`,
            icon: HomeIcon,
        },
        {
            name: "Affiliate URLs",
            href: `${prefix}/affiliate-area/urls`,
            icon: LinkIcon,
        },
        {
            name: "Statistics",
            href: `${prefix}/affiliate-area/statistics`,
            icon: BarChartIcon,
        },
        {
            name: "Graphs",
            href: `${prefix}/affiliate-area/graphs`,
            icon: TrendingUpIcon,
        },
        {
            name: "Referrals",
            href: `${prefix}/affiliate-area/referrals`,
            icon: CreditCardIcon,
        },
        {
            name: "Payouts",
            href: `${prefix}/affiliate-area/payouts`,
            icon: DollarSignIcon,
        },
        {
            name: "Visits",
            href: `${prefix}/affiliate-area/visits`,
            icon: EyeIcon,
        },
        {
            name: "Coupons",
            href: `${prefix}/affiliate-area/coupons`,
            icon: TagIcon,
        },
    ];
};

export function AffiliateSidebar({ locale, session }: AffiliateSidebarProps) {
    const pathname = usePathname();
    const navigation = getNavigation(locale);

    return (
        <aside className="w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-4">
                {/* User Info */}
                <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-6">
                    <div>
                        <h2 className="font-semibold text-white">
                            {session.username}
                        </h2>
                        <p className="mb-4 text-sm text-stone-400">
                            {session.email}
                        </p>
                    </div>
                    <form action={logoutAffiliate}>
                        <button
                            type="submit"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-stone-800 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-stone-700"
                        >
                            <LogOutIcon className="h-4 w-4" />
                            Logout
                        </button>
                    </form>
                </div>

                {/* Navigation */}
                <nav className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-3">
                    <ul className="space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
                                            isActive
                                                ? "bg-cyan-500/10 text-cyan-400"
                                                : "text-stone-300 hover:bg-stone-800"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
