"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    createPayoutRequest,
    type PayoutRequestData,
} from "@/lib/payout-request-actions";

interface PayoutRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unpaidEarnings: number;
}

export function PayoutRequestModal({
    open,
    onOpenChange,
    unpaidEarnings,
}: PayoutRequestModalProps) {
    const [formData, setFormData] = useState<PayoutRequestData>({
        amount: 0,
        paymentMethod: "crypto_usdt_trc20",
        paymentEmail: "",
        walletAddress: "",
        notes: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await createPayoutRequest(formData);

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onOpenChange(false);
                    setSuccess(false);
                    setFormData({
                        amount: 0,
                        paymentMethod: "crypto_usdt_trc20",
                        paymentEmail: "",
                        walletAddress: "",
                        notes: "",
                    });
                }, 2000);
            } else {
                setError(result.error || "Failed to submit request");
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-stone-800 bg-[#1a1a1a] sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="font-bold text-2xl text-white">
                        Request Payout
                    </DialogTitle>
                </DialogHeader>

                {success ? (
                    <div className="rounded-lg bg-green-500/10 p-4 text-center">
                        <p className="font-medium text-green-400">
                            Payout request submitted successfully!
                        </p>
                        <p className="mt-2 text-sm text-stone-300">
                            We'll process your request soon.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Amount */}
                        <div>
                            <label
                                htmlFor="amount"
                                className="mb-2 block font-medium text-sm text-white"
                            >
                                Amount (USD)
                            </label>
                            <input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                max={unpaidEarnings}
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        amount: Number.parseFloat(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-white placeholder-stone-500 focus:border-cyan-500 focus:outline-none"
                                required
                            />
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label
                                htmlFor="paymentMethod"
                                className="mb-2 block font-medium text-sm text-white"
                            >
                                Payment Method
                            </label>
                            <select
                                id="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        paymentMethod: e.target
                                            .value as PayoutRequestData["paymentMethod"],
                                    })
                                }
                                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                required
                            >
                                <option value="crypto_usdt_trc20">
                                    Crypto - USDT - TRC20
                                </option>
                                <option value="crypto_usdt_erc20">
                                    Crypto - USDT - ERC20
                                </option>
                                <option value="rise">Rise</option>
                            </select>
                        </div>

                        {/* Payment Email (for Rise) */}
                        {formData.paymentMethod === "rise" && (
                            <div>
                                <label
                                    htmlFor="paymentEmail"
                                    className="mb-2 block font-medium text-sm text-white"
                                >
                                    Payment Email Address
                                </label>
                                <input
                                    id="paymentEmail"
                                    type="email"
                                    value={formData.paymentEmail}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            paymentEmail: e.target.value,
                                        })
                                    }
                                    placeholder="your@email.com"
                                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-white placeholder-stone-500 focus:border-cyan-500 focus:outline-none"
                                    required
                                />
                            </div>
                        )}

                        {/* Wallet Address (for Crypto) */}
                        {(formData.paymentMethod === "crypto_usdt_trc20" ||
                            formData.paymentMethod === "crypto_usdt_erc20") && (
                            <div>
                                <label
                                    htmlFor="walletAddress"
                                    className="mb-2 block font-medium text-sm text-white"
                                >
                                    Payment Wallet Address
                                </label>
                                <input
                                    id="walletAddress"
                                    type="text"
                                    value={formData.walletAddress}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            walletAddress: e.target.value,
                                        })
                                    }
                                    placeholder="Enter your wallet address"
                                    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-white placeholder-stone-500 focus:border-cyan-500 focus:outline-none"
                                    required
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label
                                htmlFor="notes"
                                className="mb-2 block font-medium text-sm text-white"
                            >
                                Additional Notes (Optional)
                            </label>
                            <textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder="Any additional information..."
                                rows={3}
                                className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-white placeholder-stone-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-lg bg-red-500/10 p-3">
                                <p className="text-center text-red-400 text-sm">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 font-medium text-white transition-colors hover:bg-stone-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting
                                    ? "Submitting..."
                                    : "Submit Request"}
                            </button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
