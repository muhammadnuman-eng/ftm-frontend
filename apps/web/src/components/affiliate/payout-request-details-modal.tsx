"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface PayoutRequestDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    request: {
        id: string;
        amount: number;
        paymentMethod: string;
        paymentEmail: string;
        walletAddress: string;
        notes: string;
        status: string;
        createdAt: string;
    } | null;
}

export function PayoutRequestDetailsModal({
    open,
    onOpenChange,
    request,
}: PayoutRequestDetailsModalProps) {
    if (!request) return null;

    const getPaymentMethodLabel = (method: string) => {
        if (method === "crypto_usdt_trc20") return "Crypto - USDT - TRC20";
        if (method === "crypto_usdt_erc20") return "Crypto - USDT - ERC20";
        if (method === "rise") return "Rise";
        return method;
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: "text-yellow-400",
            approved: "text-blue-400",
            paid: "text-green-400",
            rejected: "text-red-400",
        };
        return colors[status] || "text-stone-400";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-stone-800 bg-[#1a1a1a] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-bold text-2xl text-white">
                        Payout Request Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Amount */}
                    <div>
                        <div className="mb-1 block font-medium text-sm text-stone-400">
                            Amount
                        </div>
                        <p className="font-semibold text-white text-xl">
                            ${request.amount.toFixed(2)}
                        </p>
                    </div>

                    {/* Status */}
                    <div>
                        <div className="mb-1 block font-medium text-sm text-stone-400">
                            Status
                        </div>
                        <p
                            className={`font-semibold text-lg ${getStatusColor(request.status)}`}
                        >
                            {request.status.charAt(0).toUpperCase() +
                                request.status.slice(1)}
                        </p>
                    </div>

                    {/* Payment Method */}
                    <div>
                        <div className="mb-1 block font-medium text-sm text-stone-400">
                            Payment Method
                        </div>
                        <p className="text-white">
                            {getPaymentMethodLabel(request.paymentMethod)}
                        </p>
                    </div>

                    {/* Payment Email (for Rise) */}
                    {request.paymentEmail && (
                        <div>
                            <div className="mb-1 block font-medium text-sm text-stone-400">
                                Payment Email
                            </div>
                            <p className="break-all text-white">
                                {request.paymentEmail}
                            </p>
                        </div>
                    )}

                    {/* Wallet Address (for Crypto) */}
                    {request.walletAddress && (
                        <div>
                            <div className="mb-1 block font-medium text-sm text-stone-400">
                                Wallet Address
                            </div>
                            <p className="break-all font-mono text-sm text-white">
                                {request.walletAddress}
                            </p>
                        </div>
                    )}

                    {/* Your Notes */}
                    {request.notes && (
                        <div>
                            <div className="mb-1 block font-medium text-sm text-stone-400">
                                Your Notes
                            </div>
                            <p className="text-white">{request.notes}</p>
                        </div>
                    )}

                    {/* Request Date */}
                    <div>
                        <div className="mb-1 block font-medium text-sm text-stone-400">
                            Request Date
                        </div>
                        <p className="text-white">
                            {new Date(request.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                },
                            )}
                        </p>
                    </div>

                    {/* Close Button */}
                    <div className="pt-4">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="w-full rounded-lg bg-stone-800 px-4 py-2 font-medium text-white transition-colors hover:bg-stone-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
