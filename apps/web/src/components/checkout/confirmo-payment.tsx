"use client";

import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Decimal } from "decimal.js";
import { AlertCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface ConfirmoPaymentProps {
    amount: number;
    programId: string;
    accountSize: string;
    tierId?: string;
    programName: string;
    programDetails?: string;
    platformId?: string;
    platformName?: string;
    currency?: string;
    purchasePrice?: number;
    totalPrice?: number;
    addOnValue?: number;
    purchaseType?: "original-order" | "reset-order" | "activation-order";
    resetProductType?: "evaluation" | "funded";
    customerData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    selectedAddOns?: SelectedAddOn[];
    existingPurchaseId?: string; // If provided, reuse existing purchase instead of creating new one
    couponCode?: string | null;
    disabled?: boolean;
    onCouponRemoved?: () => void;
}

interface SelectedAddOn {
    addOnId: string;
    priceIncreasePercentage?: number;
    additionalDailyDrawdownPercentage?: number;
    profitSplitMode?: "override" | "additive" | "none";
    profitSplitOverride?: number;
    metadata?: Record<string, unknown>;
}

interface ConfirmoPaymentData {
    id: string;
    url: string;
    address: string;
    cryptoUri: string;
    amount: string;
    currency: string;
    rate: string;
    timeoutTime: number;
    status: string;
}

export function ConfirmoPayment({
    amount,
    programId,
    accountSize,
    tierId,
    programName,
    programDetails,
    platformId,
    platformName,
    currency = "usd",
    purchasePrice,
    totalPrice,
    addOnValue,
    purchaseType,
    resetProductType,
    customerData,
    selectedAddOns,
    existingPurchaseId,
    couponCode,
    disabled = false,
    onCouponRemoved,
}: ConfirmoPaymentProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [paymentData, setPaymentData] = useState<ConfirmoPaymentData | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [, setPurchaseId] = useState<string | null>(
        existingPurchaseId ? String(existingPurchaseId) : null,
    );

    const createPayment = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let purchaseId = existingPurchaseId;

            // Create purchase record only if it doesn't exist
            if (!existingPurchaseId) {
                const purchaseResponse = await fetch("/api/create-purchase", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include", // Include cookies in the request
                    body: JSON.stringify({
                        programId,
                        accountSize,
                        tierId,
                        purchasePrice,
                        totalPrice,
                        currency: "USD",
                        customerData,
                        selectedAddOns,
                        couponCode,
                        addOnValue,
                        purchaseType,
                        resetProductType,
                        programDetails,
                        platformId,
                        platformName,
                        programName,
                    }),
                });

                if (!purchaseResponse.ok) {
                    const errorData = await purchaseResponse.json();
                    // Check if it's a coupon-related error
                    if (
                        errorData.error?.includes(
                            "This coupon is not applicable",
                        )
                    ) {
                        toast.error(errorData.error);
                        if (onCouponRemoved) {
                            onCouponRemoved();
                        }
                        setIsLoading(false);
                        return; // Stop further processing
                    }
                    throw new Error(
                        errorData.error || "Failed to create purchase record",
                    );
                }

                const purchaseData = await purchaseResponse.json();
                purchaseId = String(purchaseData.purchase.id);
                setPurchaseId(purchaseId);
            }

            // Then create Confirmo payment with purchase ID
            const response = await fetch("/api/create-confirmo-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: new Decimal(amount).times(100).round().toNumber(), // Convert to cents
                    currency: currency.toLowerCase(),
                    programId,
                    programName,
                    accountSize,
                    purchaseId: String(purchaseId),
                    customerData,
                    selectedAddOns,
                    programDetails,
                    platformId,
                    platformName,
                    purchasePrice: purchasePrice ?? amount,
                    totalPrice: totalPrice ?? amount,
                    addOnValue: addOnValue ?? 0,
                    purchaseType,
                    resetProductType,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Check if it's a coupon-related error
                if (
                    errorData.error?.includes("This coupon is not applicable")
                ) {
                    toast.error(errorData.error);
                    if (onCouponRemoved) {
                        onCouponRemoved();
                    }
                    setIsLoading(false);
                    return;
                }
                throw new Error(errorData.error || "Failed to create payment");
            }

            const data = await response.json();
            const payment = data.payment ?? {};
            const invoiceAmount =
                (payment.invoice?.amount as string | undefined) ?? "";
            const invoiceCurrency =
                (payment.invoice?.currency as string | undefined) ?? "USD";
            const timeoutTimestamp = Number(payment.timeoutTime);

            const cryptoUri = (payment.cryptoUri as string | undefined) ?? "";
            const directAddress = (payment.address as string | undefined) ?? "";
            const arrayAddress = Array.isArray(payment.addresses)
                ? ((payment.addresses[0]?.address as string | undefined) ?? "")
                : "";
            const uriAddress = (() => {
                if (!cryptoUri) return "";
                try {
                    const [, maybeAddress = ""] = cryptoUri.split(":");
                    if (!maybeAddress) return "";
                    const [address] = maybeAddress.split("?");
                    return address;
                } catch (err) {
                    console.error(
                        "Failed to derive address from crypto URI",
                        err,
                    );
                    return "";
                }
            })();
            const resolvedAddress = directAddress || arrayAddress || uriAddress;

            setPaymentData({
                id: payment.id ?? "",
                url: payment.url ?? "",
                address: resolvedAddress,
                cryptoUri,
                amount: invoiceAmount,
                currency: invoiceCurrency,
                rate: (payment.rate?.rate as string | undefined) ?? "",
                timeoutTime: Number.isFinite(timeoutTimestamp)
                    ? timeoutTimestamp
                    : 0,
                status: payment.status ?? "active",
            });

            if (typeof window !== "undefined" && payment.url) {
                window.open(
                    payment.url as string,
                    "_blank",
                    "noopener,noreferrer",
                );
            }

            // Set up countdown timer
            if (Number.isFinite(timeoutTimestamp)) {
                const timeout = timeoutTimestamp * 1000; // API returns seconds
                const now = Date.now();
                setTimeLeft(Math.max(0, Math.floor((timeout - now) / 1000)));

                // Update countdown every second
                const countdownInterval = setInterval(() => {
                    const remaining = Math.max(
                        0,
                        Math.floor((timeout - Date.now()) / 1000),
                    );
                    setTimeLeft(remaining);

                    if (remaining <= 0) {
                        clearInterval(countdownInterval);
                    }
                }, 1000);
            } else {
                setTimeLeft(0);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    };

    if (error) {
        return (
            <Card className="!bg-none border-red-500/20 py-6">
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-semibold">Payment Error</span>
                    </div>
                    <p className="text-white/70">{error}</p>
                    <Button
                        onClick={createPayment}
                        variant="outline"
                        className="w-full"
                    >
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!paymentData) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <QuestionMarkCircledIcon
                        className="h-4 w-4 text-blue-200/80"
                        strokeWidth={1}
                    />
                    <p className="text-sm text-white/70">
                        You will be redirected to the Confirmo payment widget to
                        complete your purchase securely.
                    </p>
                </div>

                <Button
                    onClick={createPayment}
                    disabled={disabled || isLoading}
                    className="h-14 w-full cursor-pointer font-bold text-base text-shadow-md"
                    size="lg"
                >
                    {isLoading
                        ? "Creating Payment..."
                        : "Place Order with Crypto"}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <Label className="font-semibold text-white/80">
                    Cryptocurrency Payment
                </Label>

                <div className="space-y-6">
                    {/* Countdown Timer */}
                    {timeLeft > 0 && (
                        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                            <div className="flex items-center justify-center space-x-2 text-yellow-400">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium">
                                    Payment expires in: {formatTime(timeLeft)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Payment Address */}
                    <div className="space-y-3">
                        <Label className="font-medium text-sm text-white/70">
                            Payment Address
                        </Label>
                        <div className="flex items-center space-x-2">
                            <div className="flex-1 break-all rounded-lg bg-white/5 p-3 font-mono text-white/90 text-xs">
                                {paymentData.url}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    copyToClipboard(
                                        paymentData.address,
                                        "Address",
                                    )
                                }
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* QR Code & Payment Options */}
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Button
                            onClick={() =>
                                window.open(paymentData.url, "_blank")
                            }
                            className="flex-1"
                            size="lg"
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open Payment Page
                        </Button>

                        {paymentData.cryptoUri && (
                            <Button
                                onClick={() =>
                                    window.open(paymentData.cryptoUri, "_self")
                                }
                                variant="outline"
                                className="flex-1"
                                size="lg"
                            >
                                Open in Wallet
                            </Button>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                        <h4 className="mb-2 font-medium text-blue-400">
                            Payment Instructions:
                        </h4>
                        <ol className="space-y-1 text-blue-400/80 text-sm">
                            <li>1. Copy the payment address above</li>
                            <li>
                                2. Send exactly {paymentData.amount}{" "}
                                {paymentData.currency.toUpperCase()} to this
                                address
                            </li>
                            <li>3. Wait for blockchain confirmation</li>
                            <li>
                                4. Keep this page open; we'll notify you here as
                                soon as Confirmo marks the payment confirmed
                            </li>
                        </ol>
                    </div>

                    {/* Support Note */}
                    <div className="text-center text-white/40 text-xs">
                        Having trouble? The payment page will show a QR code and
                        detailed instructions.
                    </div>
                </div>
            </div>
        </div>
    );
}
