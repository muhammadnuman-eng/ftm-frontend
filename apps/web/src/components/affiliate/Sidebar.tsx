"use client";

import {
    BarChartIcon,
    CreditCardIcon,
    DollarSignIcon,
    EyeIcon,
    HomeIcon,
    ImageIcon,
    LinkIcon,
    TagIcon,
    TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
    { name: "Dashboard", href: "/affiliate-area", icon: HomeIcon },
    { name: "Affiliate URLs", href: "/affiliate-area/urls", icon: LinkIcon },
    {
        name: "Statistics",
        href: "/affiliate-area/statistics",
        icon: BarChartIcon,
    },
    { name: "Graphs", href: "/affiliate-area/graphs", icon: TrendingUpIcon },
    {
        name: "Referrals",
        href: "/affiliate-area/referrals",
        icon: CreditCardIcon,
    },
    { name: "Payouts", href: "/affiliate-area/payouts", icon: DollarSignIcon },
    { name: "Visits", href: "/affiliate-area/visits", icon: EyeIcon },
    { name: "Coupons", href: "/affiliate-area/coupons", icon: TagIcon },
    { name: "Creatives", href: "/affiliate-area/creatives", icon: ImageIcon },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="min-h-screen w-72 border-stone-800 border-r bg-[#1a1f2e]">
            <div className="p-6">
                <div className="mb-8 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400" />
                    <div>
                        <h1 className="font-bold text-white text-xl">
                            FTM Affiliate
                        </h1>
                    </div>
                </div>

                <nav className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-sm transition-colors ${
                                    isActive
                                        ? "bg-stone-800 text-white"
                                        : "text-stone-400 hover:bg-stone-800/50 hover:text-white"
                                } `}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
