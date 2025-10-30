import { DataTable } from "@/components/affiliate/data-table";
import { getCoupons } from "@/lib/affiliate-actions";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

export default async function CouponsPage() {
    const coupons = await getCoupons();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="mb-2 font-bold text-3xl text-white">Coupons</h1>
                <p className="text-stone-400">
                    Your affiliate coupons for tracking referrals
                </p>
            </div>

            <DataTable
                columns={[
                    {
                        key: "code",
                        header: "Coupon Code",
                        render: (val) => (
                            <span className="font-mono font-semibold text-cyan-400">
                                {val}
                            </span>
                        ),
                    },
                    { key: "amount", header: "Discount" },
                    {
                        key: "description",
                        header: "Description",
                        render: (val) =>
                            val || (
                                <span className="text-stone-500">&mdash;</span>
                            ),
                    },
                    {
                        key: "status",
                        header: "Status",
                        render: (val) => (
                            <span
                                className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${
                                    val === "active"
                                        ? "bg-green-500/20 text-green-400"
                                        : val === "scheduled"
                                          ? "bg-blue-500/20 text-blue-400"
                                          : "bg-stone-500/20 text-stone-400"
                                }`}
                            >
                                {val.charAt(0).toUpperCase() + val.slice(1)}
                            </span>
                        ),
                    },
                ]}
                data={coupons}
                emptyMessage="No coupons assigned to you yet. Contact support to get your affiliate coupons."
            />
        </div>
    );
}
