import {
    DollarSignIcon,
    EyeIcon,
    PercentIcon,
    TrendingUpIcon,
} from "lucide-react";
import { DataTable } from "@/components/affiliate/data-table";
import { StatCard } from "@/components/affiliate/stat-card";
import {
    getAffiliateProfile,
    getReferrals,
    getStatistics,
} from "@/lib/affiliate-actions";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
    try {
        const [profile, last30DaysStats, allTimeStats, allReferrals] =
            await Promise.all([
                getAffiliateProfile(),
                getStatistics({ days: 30 }),
                getStatistics(),
                getReferrals({ number: 100 }),
            ]);

        // Filter referrals to last 30 days for the recent activity table
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentReferrals = allReferrals
            .filter((r) => new Date(r.date) >= thirtyDaysAgo)
            .slice(0, 10);

        if (!profile || !last30DaysStats || !allTimeStats) {
            return (
                <div className="flex min-h-[400px] items-center justify-center">
                    <div className="rounded-lg bg-red-500/10 p-8 text-center">
                        <h2 className="mb-2 font-bold text-2xl text-red-400">
                            Error Loading Dashboard
                        </h2>
                        <p className="text-red-300">
                            Unable to load dashboard data. Please try again
                            later.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                <div>
                    <h1 className="mb-2 font-bold text-3xl text-white">
                        Dashboard
                    </h1>
                    <p className="text-stone-400">Last 30 days</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Referrals"
                        value={
                            last30DaysStats.unpaidReferrals +
                            last30DaysStats.paidReferrals
                        }
                        icon={<TrendingUpIcon className="h-8 w-8" />}
                    />
                    <StatCard
                        title="Visits"
                        value={last30DaysStats.visits}
                        icon={<EyeIcon className="h-8 w-8" />}
                    />
                    <StatCard
                        title="Conversion Rate"
                        value={`${last30DaysStats.conversionRate}%`}
                        icon={<PercentIcon className="h-8 w-8" />}
                    />
                    <StatCard
                        title="Unpaid Earnings"
                        value={`$${last30DaysStats.unpaidEarnings.toFixed(2)}`}
                        icon={<DollarSignIcon className="h-8 w-8" />}
                    />
                </div>

                {/* All-time Stats */}
                <div>
                    <h2 className="mb-6 font-bold text-2xl text-white">
                        All-time
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Referrals"
                            value={
                                allTimeStats.paidReferrals +
                                allTimeStats.unpaidReferrals
                            }
                        />
                        <StatCard title="Visits" value={profile.visits} />
                        <StatCard
                            title="Conversion Rate"
                            value={`${allTimeStats.conversionRate}%`}
                        />
                        <StatCard
                            title="Lifetime Customers"
                            value={allTimeStats.lifetimeCustomers}
                        />
                    </div>
                </div>

                <div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Paid Referrals"
                            value={allTimeStats.paidReferrals}
                        />
                        <StatCard
                            title="Unpaid Referrals"
                            value={allTimeStats.unpaidReferrals}
                        />
                        <StatCard
                            title="Unpaid Earnings"
                            value={`$${allTimeStats.unpaidEarnings.toFixed(2)}`}
                        />
                        <StatCard
                            title="Total Earnings"
                            value={`$${allTimeStats.paidEarnings.toFixed(2)}`}
                        />
                    </div>
                </div>

                {/* Recent Referral Activity */}
                <div>
                    <h2 className="mb-6 font-bold text-2xl text-white">
                        Recent referral activity
                    </h2>
                    <DataTable
                        columns={[
                            { key: "reference", header: "Reference" },
                            {
                                key: "amount",
                                header: "Amount",
                                render: (val) => `$${val}`,
                            },
                            { key: "description", header: "Description" },
                            {
                                key: "status",
                                header: "Status",
                                render: (val) => (
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                                            val === "unpaid"
                                                ? "bg-blue-500/20 text-blue-400"
                                                : val === "paid"
                                                  ? "bg-green-500/20 text-green-400"
                                                  : val === "rejected"
                                                    ? "bg-red-500/20 text-red-400"
                                                    : "bg-yellow-500/20 text-yellow-400"
                                        }`}
                                    >
                                        {val.charAt(0).toUpperCase() +
                                            val.slice(1)}
                                    </span>
                                ),
                            },
                            {
                                key: "date",
                                header: "Date",
                                render: (val) =>
                                    new Date(val).toLocaleDateString(),
                            },
                        ]}
                        data={recentReferrals}
                        emptyMessage="No referrals yet"
                    />
                </div>
            </div>
        );
    } catch (error) {
        console.error("[Affiliate Dashboard] Error loading dashboard:", error);

        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="max-w-md rounded-lg bg-red-500/10 p-8 text-center">
                    <h2 className="mb-4 font-bold text-2xl text-red-400">
                        Configuration Error
                    </h2>
                    <p className="mb-4 text-red-300">
                        The affiliate dashboard is not properly configured.
                        Please contact support.
                    </p>
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-4 rounded bg-black/30 p-3 text-left font-mono text-red-200 text-sm">
                            <p className="mb-2 font-bold">Error Details:</p>
                            <p className="break-words">
                                {error instanceof Error
                                    ? error.message
                                    : "Unknown error"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
