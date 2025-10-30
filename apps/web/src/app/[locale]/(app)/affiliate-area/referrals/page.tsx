import { DataTable } from "@/components/affiliate/data-table";
import { Pagination } from "@/components/affiliate/pagination";
import { getReferrals } from "@/lib/affiliate-actions";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

interface ReferralsPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function ReferralsPage({
    searchParams,
}: ReferralsPageProps) {
    const params = await searchParams;
    const currentPage = Number(params.page) || 1;
    const pageSize = 15;
    const offset = (currentPage - 1) * pageSize;

    const referrals = await getReferrals({
        number: pageSize,
        offset,
        orderby: "date",
        order: "desc",
    });

    // Determine if there are more pages (if we got a full page, assume there might be more)
    const hasNextPage = referrals.length === pageSize;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="mb-2 font-bold text-3xl text-white">
                    Referrals
                </h1>
                <p className="text-stone-400">
                    Showing {referrals.length > 0 ? offset + 1 : 0}-
                    {offset + referrals.length} referrals
                </p>
            </div>

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
                                {val.charAt(0).toUpperCase() + val.slice(1)}
                            </span>
                        ),
                    },
                    {
                        key: "date",
                        header: "Date",
                        render: (val) =>
                            new Date(val).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            }),
                    },
                    {
                        key: "id",
                        header: "Lifetime Referral",
                        render: (_, row) => (
                            <span className="text-stone-400">
                                {row.custom &&
                                typeof row.custom === "object" &&
                                "lifetime_referral" in row.custom &&
                                row.custom.lifetime_referral === true
                                    ? "✓"
                                    : ""}
                            </span>
                        ),
                    },
                ]}
                data={referrals}
                emptyMessage="No referrals yet"
            />

            {(currentPage > 1 || hasNextPage) && (
                <Pagination
                    currentPage={currentPage}
                    hasNextPage={hasNextPage}
                    hasPrevPage={currentPage > 1}
                />
            )}
        </div>
    );
}
