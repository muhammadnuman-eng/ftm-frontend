import { DataTable } from "@/components/affiliate/data-table";
import { Pagination } from "@/components/affiliate/pagination";
import { getVisits } from "@/lib/affiliate-actions";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

interface VisitsPageProps {
    searchParams: Promise<{ page?: string }>;
}

export default async function VisitsPage({ searchParams }: VisitsPageProps) {
    const params = await searchParams;
    const currentPage = Number(params.page) || 1;
    const pageSize = 15;
    const offset = (currentPage - 1) * pageSize;

    const visits = await getVisits({
        number: pageSize,
        offset,
        orderby: "date",
        order: "desc",
    });

    // Determine if there are more pages (if we got a full page, assume there might be more)
    const hasNextPage = visits.length === pageSize;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="mb-2 font-bold text-3xl text-white">Visits</h1>
                <p className="text-stone-400">
                    Showing {visits.length > 0 ? offset + 1 : 0}-
                    {offset + visits.length} visits
                </p>
            </div>

            <DataTable
                columns={[
                    {
                        key: "url",
                        header: "URL",
                        render: (val) => (
                            <a
                                href={val}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                            >
                                {val?.replace(/^https?:\/\//, "") ||
                                    "fundedtradermarkets.com"}
                            </a>
                        ),
                    },
                    {
                        key: "referrer",
                        header: "Referring URL",
                        render: (val) => val || "Direct Traffic",
                    },
                    {
                        key: "converted",
                        header: "Converted",
                        render: (val) => (
                            <span className="text-red-500">
                                {val ? "✓" : "✗"}
                            </span>
                        ),
                    },
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
                ]}
                data={visits}
                emptyMessage="No visits yet"
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
