"use client";

import { EyeIcon } from "lucide-react";
import { useState } from "react";
import { DataTable } from "./data-table";
import { PayoutRequestDetailsModal } from "./payout-request-details-modal";

interface PayoutRequest {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentEmail: string;
    walletAddress: string;
    notes: string;
    status: string;
    createdAt: string;
}

interface PayoutRequestsTableProps {
    requests: PayoutRequest[];
}

export function PayoutRequestsTable({ requests }: PayoutRequestsTableProps) {
    const [selectedRequest, setSelectedRequest] =
        useState<PayoutRequest | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleShowDetails = (request: PayoutRequest) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    return (
        <>
            <DataTable
                columns={[
                    {
                        key: "createdAt",
                        header: "Request Date",
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
                        key: "paymentMethod",
                        header: "Payment Method",
                        render: (val) => {
                            if (val === "crypto_usdt_trc20")
                                return "Crypto - USDT - TRC20";
                            if (val === "crypto_usdt_erc20")
                                return "Crypto - USDT - ERC20";
                            if (val === "rise") return "Rise";
                            return val || "N/A";
                        },
                    },
                    {
                        key: "status",
                        header: "Status",
                        render: (val) => {
                            const statusColors: Record<string, string> = {
                                pending: "bg-yellow-500/20 text-yellow-400",
                                approved: "bg-blue-500/20 text-blue-400",
                                paid: "bg-green-500/20 text-green-400",
                                rejected: "bg-red-500/20 text-red-400",
                            };
                            const colorClass =
                                statusColors[val as string] ||
                                "bg-stone-500/20 text-stone-400";
                            return (
                                <span
                                    className={`inline-flex rounded-full px-2 py-1 font-semibold text-xs ${colorClass}`}
                                >
                                    {val
                                        ? val.charAt(0).toUpperCase() +
                                          val.slice(1)
                                        : "Pending"}
                                </span>
                            );
                        },
                    },
                    {
                        key: "actions",
                        header: "Actions",
                        render: (_val, row) => (
                            <button
                                type="button"
                                onClick={() =>
                                    handleShowDetails(row as PayoutRequest)
                                }
                                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-1.5 font-medium text-sm text-white transition-colors hover:bg-cyan-600"
                            >
                                <EyeIcon className="h-4 w-4" />
                                Show Details
                            </button>
                        ),
                    },
                ]}
                data={requests}
                emptyMessage="No payout requests yet"
            />

            <PayoutRequestDetailsModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                request={selectedRequest}
            />
        </>
    );
}
