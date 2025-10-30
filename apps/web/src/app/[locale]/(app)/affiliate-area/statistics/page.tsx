import { DataTable } from "@/components/affiliate/data-table";
import { Pagination } from "@/components/affiliate/pagination";
import { StatCard } from "@/components/affiliate/stat-card";
import { getCampaigns, getStatistics } from "@/lib/affiliate-actions";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

interface StatisticsPageProps {
    searchParams: Promise<{
        campaignPage?: string;
    }>;
}

export default async function StatisticsPage({
    searchParams,
}: StatisticsPageProps) {
    const params = await searchParams;
    const campaignPage = Number(params.campaignPage) || 1;

    const [statistics, campaignsData] = await Promise.all([
        getStatistics(),
        getCampaigns({ page: campaignPage }),
    ]);

    if (!statistics) {
        return (
            <div className="text-white">
                <p>Error loading statistics</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="mb-2 font-bold text-3xl text-white">
                    Statistics
                </h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Unpaid referrals"
                    value={statistics.unpaidReferrals}
                />
                <StatCard
                    title="Paid referrals"
                    value={statistics.paidReferrals}
                />
                <StatCard title="Visits" value={statistics.visits} />
                <StatCard
                    title="Conversion rate"
                    value={`${statistics.conversionRate}%`}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Unpaid earnings"
                    value={`$${statistics.unpaidEarnings.toFixed(2)}`}
                />
                <StatCard
                    title="Paid earnings"
                    value={`$${statistics.paidEarnings.toFixed(2)}`}
                />
                <StatCard
                    title="Commission rate"
                    value={`${statistics.commissionRate}%`}
                />
                <StatCard
                    title="Lifetime customers"
                    value={statistics.lifetimeCustomers}
                />
            </div>

            {/* Campaigns Table */}
            <div className="space-y-4">
                <h2 className="mb-6 font-bold text-2xl text-white">
                    Campaigns
                </h2>
                <DataTable
                    columns={[
                        { key: "campaign", header: "Campaign" },
                        { key: "visits", header: "Visits" },
                        { key: "uniqueLinks", header: "Unique Links" },
                        { key: "converted", header: "Converted" },
                        { key: "conversionRate", header: "Conversion Rate" },
                    ]}
                    data={campaignsData.campaigns}
                    emptyMessage="No campaigns yet"
                />
                {campaignsData.totalPages > 1 && (
                    <Pagination
                        currentPage={campaignsData.currentPage}
                        totalPages={campaignsData.totalPages}
                        baseUrl="/affiliate-area/statistics"
                        pageParamName="campaignPage"
                    />
                )}
            </div>
        </div>
    );
}
