import { DataTable } from "@/components/affiliate/data-table";
import { Pagination } from "@/components/affiliate/pagination";
import { PayoutRequestButton } from "@/components/affiliate/payout-request-button";
import { PayoutRequestsTable } from "@/components/affiliate/payout-requests-table";
import { getPayouts, getStatistics } from "@/lib/affiliate-actions";
import { getPayoutRequests } from "@/lib/payout-request-actions";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

interface PayoutsPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function PayoutsPage({ searchParams }: PayoutsPageProps) {
    const params = await searchParams;
    const currentPage = Number(params.page) || 1;
    const pageSize = 15;
    const offset = (currentPage - 1) * pageSize;

    const [payouts, statistics, payoutRequests] = await Promise.all([
        getPayouts({
            number: pageSize,
            offset,
            orderby: "date",
            order: "desc",
        }),
        getStatistics(),
        getPayoutRequests(),
    ]);

    // Determine if there are more pages (if we got a full page, assume there might be more)
    const hasNextPage = payouts.length === pageSize;
    const unpaidEarnings = statistics?.unpaidEarnings || 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="mb-2 font-bold text-3xl text-white">
                        Payouts
                    </h1>
                    <p className="text-stone-400">
                        Showing {payouts.length > 0 ? offset + 1 : 0}-
                        {offset + payouts.length} payouts
                    </p>
                </div>
                {unpaidEarnings > 0 && (
                    <PayoutRequestButton unpaidEarnings={unpaidEarnings} />
                )}
            </div>

            <DataTable
                columns={[
                    {
                        key: "date",
                        header: "Date",
                        render: (val) =>
                            val
                                ? new Date(val).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                  })
                                : "N/A",
                    },
                    {
                        key: "amount",
                        header: "Amount",
                        render: (val) =>
                            val ? `$${Number(val).toFixed(2)}` : "$0.00",
                    },
                    {
                        key: "payout_method",
                        header: "Payout Method",
                        render: (val) => val || "Manual Payout",
                    },
                    {
                        key: "status",
                        header: "Status",
                        render: (val) => (
                            <span className="inline-flex rounded-full bg-green-500/20 px-2 py-1 font-semibold text-green-400 text-xs">
                                {val || "Paid"}
                            </span>
                        ),
                    },
                ]}
                data={payouts}
                emptyMessage="No payouts yet"
            />

            {(currentPage > 1 || hasNextPage) && (
                <Pagination
                    currentPage={currentPage}
                    hasNextPage={hasNextPage}
                    hasPrevPage={currentPage > 1}
                />
            )}

            {/* Payout Requests Section */}
            <div className="mt-12">
                <h2 className="mb-4 font-bold text-2xl text-white">
                    Payout Requests
                </h2>
                <PayoutRequestsTable requests={payoutRequests} />
            </div>
        </div>
    );
}
