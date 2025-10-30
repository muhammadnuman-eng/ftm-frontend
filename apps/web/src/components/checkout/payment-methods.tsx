"use client";

import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { Decimal } from "decimal.js";
import { BitcoinIcon, CreditCardIcon } from "lucide-react";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PaymentGateway } from "@/lib/confirmo";
import { trackStartedCheckout } from "@/lib/klaviyo";
import type { CommerceConfig } from "@/payload-types";
import type { AppliedCoupon } from "./applied-coupon";
import BridgerPayCashier from "./bridgerpay-cashier";
import { ConfirmoPayment } from "./confirmo-payment";
import PaytikoCashier from "./paytiko-cashier";

interface CustomerData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

interface PaymentMethodsProps {
    amount: number;
    purchasePrice: number;
    totalPrice: number;
    programId: string;
    accountSize: string;
    tierId?: string;
    programName: string;
    programType?: "1-step" | "2-step" | "instant" | "reset";
    programDetails?: string;
    platformId?: string;
    platformName?: string;
    region?: string;
    addOnValue?: number;
    purchaseType?: "original-order" | "reset-order" | "activation-order";
    resetProductType?: "evaluation" | "funded";
    customerData: CustomerData;
    selectedAddOns?: SelectedAddOn[];
    activeCoupon?: AppliedCoupon | null;
    existingPurchaseId?: string; // If provided, reuse existing purchase instead of creating new one
    commerceConfig?: CommerceConfig | null;
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

export function PaymentMethods({
    amount,
    purchasePrice,
    totalPrice,
    programId,
    accountSize,
    tierId,
    programName,
    programType,
    programDetails,
    platformId,
    platformName,
    region,
    addOnValue,
    purchaseType,
    resetProductType,
    customerData,
    selectedAddOns = [],
    activeCoupon,
    existingPurchaseId,
    commerceConfig,
    onCouponRemoved,
}: PaymentMethodsProps) {
    const [selectedGateway, setSelectedGateway] =
        useState<PaymentGateway>("confirmo");
    const [error, setError] = useState<string | null>(null);
    const [purchaseId, setPurchaseId] = useState<string | null>(
        existingPurchaseId ? String(existingPurchaseId) : null,
    );
    const [isUpdatingPurchase, setIsUpdatingPurchase] = useState(false);
    const [hasInitializedPurchase, setHasInitializedPurchase] = useState(
        !!existingPurchaseId,
    );

    const resolvedPurchasePrice = purchasePrice ?? amount;
    const resolvedTotalPrice = totalPrice ?? amount;
    const resolvedAddOnValue =
        addOnValue ??
        new Decimal(resolvedTotalPrice)
            .minus(resolvedPurchasePrice)
            .toDecimalPlaces(0, Decimal.ROUND_CEIL)
            .toNumber();

    // Validate customer form completion
    // If we are on the pay page for an existing API-created order, skip gating
    const isCustomerFormValid = useMemo(() => {
        if (existingPurchaseId) return true;

        const required = {
            firstName: customerData?.firstName?.trim(),
            lastName: customerData?.lastName?.trim(),
            email: customerData?.email?.trim(),
            phone: customerData?.phone?.trim(),
            address: customerData?.address?.trim(),
            city: customerData?.city?.trim(),
            state: customerData?.state?.trim(),
            postalCode: customerData?.postalCode?.trim(),
            country: customerData?.country?.trim(),
        };

        const allFieldsFilled = Object.values(required).every(
            (value) => value && value.length > 0,
        );

        // Basic email validation
        const emailValid =
            required.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(required.email);

        return allFieldsFilled && emailValid;
    }, [customerData, existingPurchaseId]);

    const paymentGateways = useMemo(() => {
        const allGateways = [
            {
                id: "confirmo" as PaymentGateway,
                name: "Cryptocurrency",
                description: "Bitcoin, Ethereum, USDT, and more",
                icon: BitcoinIcon,
                enabled:
                    (commerceConfig?.isConfirmoEnabled ?? true) ||
                    customerData?.email === "smhayhan@gmail.com", // Only enabled for specific test email
            },
            {
                id: "paytiko" as PaymentGateway,
                name: "Credit & Debit Cards (Paytiko)",
                description: "Cards and alternative payment methods",
                icon: CreditCardIcon,
                enabled:
                    (commerceConfig?.isPaytikoEnabled ?? true) ||
                    customerData?.email === "smhayhan@gmail.com", // Only enabled for specific test email
            },
            {
                id: "bridger" as PaymentGateway,
                name: "Credit/Debit Cards & Cryptocurrency",
                description: "Pay with credit/debit cards and cryptocurrency",
                icon: CreditCardIcon,
                enabled: commerceConfig?.isBridgerEnabled ?? true, // default enabled if config not available
            },
        ];

        // Filter to only enabled gateways
        return allGateways.filter((gateway) => gateway.enabled);
    }, [commerceConfig, customerData?.email]);

    const amountDecimal = useMemo(
        () => new Decimal(amount).toDecimalPlaces(0, Decimal.ROUND_CEIL),
        [amount],
    );

    // Paytiko state
    const [paytikoSessionToken, setPaytikoSessionToken] = useState<
        string | null
    >(null);
    const [paytikoOrderId, setPaytikoOrderId] = useState<string | null>(null);
    const [isInitializingPaytiko, setIsInitializingPaytiko] = useState(false);
    const paytikoInitStartedRef = useRef(false);
    const paytikoInitCompletedRef = useRef(false);
    const paytikoAbortedByTimeoutRef = useRef(false);
    const [showPaytiko, setShowPaytiko] = useState(false);
    const [paytikoInitRequested, setPaytikoInitRequested] = useState(false);

    // BridgerPay state
    const [bridgerPayCashierToken, setBridgerPayCashierToken] = useState<
        string | null
    >(null);
    const [bridgerPayCashierKey, setBridgerPayCashierKey] = useState<
        string | null
    >(null);
    const [isInitializingBridgerPay, setIsInitializingBridgerPay] =
        useState(false);
    const bridgerPayInitStartedRef = useRef(false);
    const bridgerPayInitCompletedRef = useRef(false);
    const bridgerPayAbortedByTimeoutRef = useRef(false);
    const [showBridgerPay, setShowBridgerPay] = useState(false);
    const [bridgerPayModalOpen, setBridgerPayModalOpen] = useState(false);
    const [bridgerPayInitRequested, setBridgerPayInitRequested] =
        useState(false);

    // Track "Started Checkout" when form becomes valid
    const hasTrackedCheckoutRef = useRef(false);
    useEffect(() => {
        if (
            isCustomerFormValid &&
            !hasTrackedCheckoutRef.current &&
            customerData.email
        ) {
            hasTrackedCheckoutRef.current = true;

            // Track Started Checkout in Klaviyo
            trackStartedCheckout({
                email: customerData.email,
                itemName: programName || `${platformName} - ${accountSize}`,
                total: resolvedTotalPrice,
                currency: "USD",
                discountCode: activeCoupon?.code || null,
                items: [
                    {
                        product_id: programId,
                        sku: `${programId}-${accountSize}`,
                        name: programName || `${platformName} - ${accountSize}`,
                        quantity: 1,
                        price: resolvedPurchasePrice,
                    },
                ],
            }).catch((error) => {
                console.error(
                    "[Klaviyo] Error tracking Started Checkout:",
                    error,
                );
            });
        }
    }, [
        isCustomerFormValid,
        customerData.email,
        programName,
        platformName,
        accountSize,
        resolvedTotalPrice,
        activeCoupon?.code,
        programId,
        resolvedPurchasePrice,
    ]);

    // Initialize Paytiko when requested
    // biome-ignore lint/correctness/useExhaustiveDependencies: customerData and isInitializingPaytiko excluded to prevent infinite loop
    useEffect(() => {
        if (selectedGateway !== "paytiko") return;
        if (!paytikoInitRequested) return;
        if (
            paytikoSessionToken ||
            isInitializingPaytiko ||
            paytikoInitStartedRef.current
        )
            return;
        if (!customerData?.email) return;

        paytikoInitStartedRef.current = true;
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            paytikoAbortedByTimeoutRef.current = true;
            controller.abort();
        }, 45000);

        const init = async () => {
            try {
                setIsInitializingPaytiko(true);

                // Track payment initialization started
                posthog.capture("checkout_payment_init_started", {
                    gateway: "paytiko",
                    amount: amountDecimal.toNumber(),
                    programId,
                    accountSize,
                });

                const response = await fetch("/api/paytiko/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // Include cookies in the request
                    signal: controller.signal,
                    body: JSON.stringify({
                        amount: amountDecimal.toNumber(),
                        currency: "usd",
                        programId,
                        accountSize,
                        tierId,
                        purchasePrice: resolvedPurchasePrice,
                        totalPrice: resolvedTotalPrice,
                        customerData,
                        selectedAddOns,
                        couponCode: activeCoupon?.code,
                        addOnValue: resolvedAddOnValue,
                        purchaseType: purchaseType ?? "original-order",
                        resetProductType,
                        programDetails,
                        platformId,
                        platformName,
                        programName,
                        programType,
                        region,
                        isInAppPurchase: false,
                        ...(existingPurchaseId ? { existingPurchaseId } : {}),
                    }),
                });

                clearTimeout(timeout);
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    // Check if it's a coupon-related error
                    if (data.error?.includes("This coupon is not applicable")) {
                        toast.error(data.error);
                        if (onCouponRemoved) {
                            onCouponRemoved();
                        }
                        // Reset states to allow retry
                        setIsInitializingPaytiko(false);
                        paytikoInitStartedRef.current = false;
                        setPaytikoInitRequested(false);
                        // Don't show error in UI, just stop the process
                        return;
                    }
                    throw new Error(
                        data.error || "Failed to initialize Paytiko checkout",
                    );
                }

                const data = await response.json();
                setPaytikoSessionToken(data.cashierSessionToken);
                setPaytikoOrderId(data.orderId);
                setPurchaseId(String(data.purchase?.id ?? ""));
                setHasInitializedPurchase(true);
                paytikoInitCompletedRef.current = true;

                // Track successful payment initialization
                posthog.capture("checkout_payment_ready", {
                    gateway: "paytiko",
                    amount: amountDecimal.toNumber(),
                    programId,
                    accountSize,
                    orderId: data.orderId,
                    purchaseId: data.purchase?.id,
                });
            } catch (e) {
                console.error("[Paytiko Client] Initialization failed:", e);

                // Track payment initialization failure
                posthog.capture("checkout_payment_init_failed", {
                    gateway: "paytiko",
                    amount: amountDecimal.toNumber(),
                    programId,
                    accountSize,
                    error: e instanceof Error ? e.message : "Unknown error",
                    errorType: e instanceof Error ? e.name : "Unknown",
                });

                if (e instanceof Error && e.name === "AbortError") {
                    if (paytikoAbortedByTimeoutRef.current) {
                        setError(
                            "Paytiko request timed out. Please retry in a moment.",
                        );
                    } else {
                        // Aborted for another reason (e.g., component unmount, manual abort)
                        console.log(
                            "[Paytiko Client] Request was aborted (not timeout)",
                        );
                    }
                    paytikoInitStartedRef.current = false;
                    setShowPaytiko(false); // Reset to allow retry
                } else {
                    const msg =
                        e instanceof Error
                            ? e.message
                            : "Failed to initialize Paytiko";
                    setError(msg);
                    paytikoInitStartedRef.current = false;
                    setShowPaytiko(false); // Reset to allow retry
                }
            } finally {
                setIsInitializingPaytiko(false);
            }
        };

        init();
        return () => {
            clearTimeout(timeout);
            if (
                !paytikoInitCompletedRef.current &&
                !controller.signal.aborted
            ) {
                controller.abort();
            }
        };
    }, [
        selectedGateway,
        paytikoInitRequested,
        customerData?.email,
        amountDecimal,
        programId,
        accountSize,
        tierId,
        resolvedPurchasePrice,
        resolvedTotalPrice,
        selectedAddOns,
        activeCoupon?.code,
        resolvedAddOnValue,
        purchaseType,
        programDetails,
        platformId,
        platformName,
        programName,
        programType,
        region,
        paytikoSessionToken,
        // Don't include isInitializingPaytiko or customerData object as it causes infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ]);

    const handlePaytikoClick = () => {
        console.log("[Paytiko Client] Place order button clicked");
        setShowPaytiko(true);
        setError(null); // Clear any previous errors
        // Reset refs for fresh initialization
        paytikoInitStartedRef.current = false;
        paytikoAbortedByTimeoutRef.current = false;
        paytikoInitCompletedRef.current = false;
        if (!paytikoSessionToken && !isInitializingPaytiko) {
            setPaytikoInitRequested(true);
        }
    };

    // Initialize BridgerPay when requested
    // biome-ignore lint/correctness/useExhaustiveDependencies: customerData and isInitializingBridgerPay excluded to prevent infinite loop
    useEffect(() => {
        console.log("[BridgerPay Client] useEffect triggered", {
            selectedGateway,
            bridgerPayInitRequested,
            bridgerPayCashierToken: !!bridgerPayCashierToken,
            isInitializingBridgerPay,
            bridgerPayInitStartedRef: bridgerPayInitStartedRef.current,
            hasEmail: !!customerData?.email,
        });

        if (selectedGateway !== "bridger") {
            console.log("[BridgerPay Client] Skipped: Not bridger gateway");
            return;
        }
        if (!bridgerPayInitRequested) {
            console.log("[BridgerPay Client] Skipped: Init not requested");
            return;
        }
        if (
            bridgerPayCashierToken ||
            isInitializingBridgerPay ||
            bridgerPayInitStartedRef.current
        ) {
            console.log(
                "[BridgerPay Client] Skipped: Already initialized or initializing",
            );
            return;
        }
        if (!customerData?.email) {
            console.log("[BridgerPay Client] Skipped: No customer email");
            return;
        }

        console.log(
            "[BridgerPay Client] All checks passed, starting initialization",
        );

        bridgerPayInitStartedRef.current = true;
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            bridgerPayAbortedByTimeoutRef.current = true;
            controller.abort();
        }, 45000);

        const init = async () => {
            try {
                setIsInitializingBridgerPay(true);
                setError(null); // Clear any previous errors

                console.log("[BridgerPay Client] Initializing checkout...", {
                    amount: amountDecimal.toNumber(),
                    programId,
                    accountSize,
                    email: customerData.email,
                });

                // Track payment initialization started
                posthog.capture("checkout_payment_init_started", {
                    gateway: "bridger",
                    amount: amountDecimal.toNumber(),
                    programId,
                    accountSize,
                });

                const response = await fetch("/api/bridgerpay/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // Include cookies in the request
                    signal: controller.signal,
                    body: JSON.stringify({
                        amount: amountDecimal.toNumber(),
                        currency: "usd",
                        programId,
                        accountSize,
                        tierId,
                        purchasePrice: resolvedPurchasePrice,
                        totalPrice: resolvedTotalPrice,
                        customerData,
                        selectedAddOns,
                        couponCode: activeCoupon?.code,
                        addOnValue: resolvedAddOnValue,
                        purchaseType: purchaseType ?? "original-order",
                        resetProductType,
                        programDetails,
                        platformId,
                        platformName,
                        programName,
                        programType,
                        region,
                        isInAppPurchase: false,
                        ...(existingPurchaseId ? { existingPurchaseId } : {}),
                    }),
                });

                clearTimeout(timeout);

                console.log(
                    "[BridgerPay Client] Response status:",
                    response.status,
                );

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    console.error("[BridgerPay Client] Error response:", data);
                    // Check if it's a coupon-related error
                    if (data.error?.includes("This coupon is not applicable")) {
                        toast.error(data.error);
                        if (onCouponRemoved) {
                            onCouponRemoved();
                        }
                        // Reset states to allow retry
                        setIsInitializingBridgerPay(false);
                        bridgerPayInitStartedRef.current = false;
                        setBridgerPayInitRequested(false);
                        // Don't show error in UI, just stop the process
                        return;
                    }
                    throw new Error(
                        data.error ||
                            data.details ||
                            "Failed to initialize BridgerPay checkout",
                    );
                }

                const data = await response.json();
                console.log("[BridgerPay Client] Success! Token received:", {
                    hasToken: !!data.cashierToken,
                    hasKey: !!data.cashierKey,
                    keyLength: data.cashierKey?.length,
                    orderId: data.orderId,
                    responseKeys: Object.keys(data),
                });

                if (!data.cashierToken || !data.cashierKey) {
                    throw new Error(
                        "Missing cashier token or key from BridgerPay",
                    );
                }

                setBridgerPayCashierToken(data.cashierToken);
                setBridgerPayCashierKey(data.cashierKey);
                setPurchaseId(String(data.purchase?.id ?? ""));
                setHasInitializedPurchase(true);
                bridgerPayInitCompletedRef.current = true;

                // Track successful payment initialization
                posthog.capture("checkout_payment_ready", {
                    gateway: "bridger",
                    amount: amountDecimal.toNumber(),
                    programId,
                    accountSize,
                    orderId: data.orderId,
                    purchaseId: data.purchase?.id,
                });

                // Open modal when token is received
                setBridgerPayModalOpen(true);
            } catch (e) {
                console.error("[BridgerPay Client] Initialization failed:", e);

                // Track payment initialization failure
                posthog.capture("checkout_payment_init_failed", {
                    gateway: "bridger",
                    amount: amountDecimal.toNumber(),
                    programId,
                    accountSize,
                    error: e instanceof Error ? e.message : "Unknown error",
                    errorType: e instanceof Error ? e.name : "Unknown",
                });

                if (e instanceof Error && e.name === "AbortError") {
                    if (bridgerPayAbortedByTimeoutRef.current) {
                        setError(
                            "BridgerPay request timed out. Please retry in a moment.",
                        );
                    } else {
                        // Aborted for another reason (e.g., component unmount, manual abort)
                        console.log(
                            "[BridgerPay Client] Request was aborted (not timeout)",
                        );
                    }
                    bridgerPayInitStartedRef.current = false;
                    setShowBridgerPay(false); // Reset to allow retry
                } else {
                    const msg =
                        e instanceof Error
                            ? e.message
                            : "Failed to initialize BridgerPay";
                    setError(msg);
                    bridgerPayInitStartedRef.current = false;
                    setShowBridgerPay(false); // Reset to allow retry
                }
            } finally {
                setIsInitializingBridgerPay(false);
            }
        };

        init();
        return () => {
            clearTimeout(timeout);
            if (
                !bridgerPayInitCompletedRef.current &&
                !controller.signal.aborted
            ) {
                controller.abort();
            }
        };
    }, [
        selectedGateway,
        bridgerPayInitRequested,
        customerData?.email,
        amountDecimal,
        programId,
        accountSize,
        tierId,
        resolvedPurchasePrice,
        resolvedTotalPrice,
        selectedAddOns,
        activeCoupon?.code,
        resolvedAddOnValue,
        purchaseType,
        programDetails,
        platformId,
        platformName,
        programName,
        programType,
        region,
        bridgerPayCashierToken,
        // Don't include isInitializingBridgerPay or customerData object as it causes infinite loop
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ]);

    const handleBridgerPayClick = () => {
        console.log("[BridgerPay Client] Place order button clicked");
        setShowBridgerPay(true);
        setError(null); // Clear any previous errors
        // Reset refs for fresh initialization
        bridgerPayInitStartedRef.current = false;
        bridgerPayAbortedByTimeoutRef.current = false;
        bridgerPayInitCompletedRef.current = false;
        if (!bridgerPayCashierToken && !isInitializingBridgerPay) {
            setBridgerPayInitRequested(true);
        }
    };

    // Feature flag default gateway - select first available enabled gateway
    // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only
    useEffect(() => {
        if (paymentGateways.length === 0) return;

        // Priority 1: Use defaultPaymentMethod from commerceConfig if available
        const configDefault = commerceConfig?.defaultPaymentMethod;

        // Priority 2: Fall back to environment variable
        const envDefault = (
            process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_DEFAULT || ""
        ).toLowerCase();

        // Check which defaults are available in enabled gateways
        const isConfigDefaultAvailable =
            configDefault &&
            paymentGateways.some((g) => g.id === configDefault);
        const isEnvDefaultAvailable = paymentGateways.some(
            (g) => g.id === envDefault,
        );

        // Select based on priority
        if (isConfigDefaultAvailable) {
            setSelectedGateway(configDefault as PaymentGateway);
        } else if (isEnvDefaultAvailable) {
            setSelectedGateway(envDefault as PaymentGateway);
        } else {
            // Priority 3: Select first available gateway
            setSelectedGateway(paymentGateways[0].id);
        }
        // run once on mount only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset error state when switching gateways
    // biome-ignore lint/correctness/useExhaustiveDependencies: setError is a stable function
    useEffect(() => {
        setError(null);
    }, [selectedGateway]);

    // Update purchase when add-ons or coupon changes (after initial creation)
    useEffect(() => {
        // Skip if we haven't created a purchase yet
        if (!purchaseId || !hasInitializedPurchase) {
            return;
        }

        // Skip if using an existing purchase and nothing to update
        // (prevents unnecessary API call on pay page mount)
        if (
            existingPurchaseId &&
            selectedAddOns.length === 0 &&
            !activeCoupon?.code
        ) {
            return;
        }

        let cancelled = false;

        const updatePurchase = async () => {
            setIsUpdatingPurchase(true);
            try {
                const response = await fetch("/api/update-purchase", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        purchaseId,
                        selectedAddOns,
                        totalPrice: resolvedTotalPrice,
                        addOnValue: resolvedAddOnValue,
                        purchasePrice: resolvedPurchasePrice,
                        couponCode: activeCoupon?.code ?? null,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error(
                        "Failed to update purchase:",
                        errorData.error,
                    );
                }
            } catch (err) {
                console.error("Error updating purchase:", err);
            } finally {
                if (!cancelled) {
                    setIsUpdatingPurchase(false);
                }
            }
        };

        updatePurchase();

        return () => {
            cancelled = true;
        };
    }, [
        selectedAddOns,
        resolvedTotalPrice,
        resolvedAddOnValue,
        resolvedPurchasePrice,
        activeCoupon?.code,
        purchaseId,
        hasInitializedPurchase,
        existingPurchaseId,
    ]);

    // Don't show error UI for coupon-related errors since we're using toast
    if (error && !error.includes("This coupon is not applicable")) {
        return (
            <div className="rounded-lg border border-white/20 bg-white/5 p-6">
                <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    // No payment methods enabled
    if (paymentGateways.length === 0) {
        return (
            <div className="rounded-lg border border-white/20 bg-white/5 p-6">
                <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <p className="text-sm text-yellow-400">
                        No payment methods are currently available. Please
                        contact support.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative space-y-6">
            {/* Customer form validation message */}
            {!isCustomerFormValid && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <p className="text-sm text-yellow-400">
                        ⚠️ Please fill in all customer information fields above
                        before selecting a payment method.
                    </p>
                </div>
            )}

            {/* Loading overlay when updating purchase */}
            {isUpdatingPurchase && (
                <div className="-inset-2 absolute z-50 m-0 flex items-center justify-center rounded-md bg-black/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-500 border-t-transparent" />
                        <p className="text-sm text-white/80">
                            Updating order...
                        </p>
                    </div>
                </div>
            )}
            {/* Payment Gateway Selection */}
            {paymentGateways.length > 1 && (
                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {paymentGateways.map((gateway) => {
                            const Icon = gateway.icon;
                            const isSelected = selectedGateway === gateway.id;
                            const isDisabled = !isCustomerFormValid;

                            return (
                                <button
                                    type="button"
                                    key={gateway.id}
                                    disabled={isDisabled}
                                    className={`rounded-lg border text-left transition-all duration-200 ${
                                        isDisabled
                                            ? "cursor-not-allowed border-white/5 bg-white/5 opacity-50"
                                            : isSelected
                                              ? "cursor-pointer border-blue-500/50 bg-blue-500/10"
                                              : "cursor-pointer border-white/5 hover:border-white/30 hover:bg-white/5"
                                    }`}
                                    onClick={() => {
                                        if (!isDisabled) {
                                            setSelectedGateway(gateway.id);
                                            posthog.capture(
                                                "checkout_payment_gateway_selected",
                                                {
                                                    gateway: gateway.id,
                                                    gatewayName: gateway.name,
                                                    amount: resolvedTotalPrice,
                                                    programId,
                                                    accountSize,
                                                },
                                            );
                                        }
                                    }}
                                    data-ph-capture-attribute-gateway={
                                        gateway.id
                                    }
                                >
                                    <div className="flex flex-col items-start space-y-2 p-4">
                                        <div className="flex w-full items-center justify-between">
                                            <div
                                                className={`rounded-lg p-2 ${
                                                    isSelected
                                                        ? "bg-blue-500/20 text-blue-400"
                                                        : "bg-white/10 text-white/60"
                                                }`}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>

                                            <div
                                                className={`h-4 w-4 rounded-full border-2 ${
                                                    isSelected
                                                        ? "border-blue-500 bg-blue-500"
                                                        : "border-white/30"
                                                } flex items-center justify-center`}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3
                                                        className={`font-medium ${
                                                            isSelected
                                                                ? "text-white"
                                                                : "text-white/80"
                                                        }`}
                                                    >
                                                        {gateway.name}
                                                    </h3>
                                                </div>
                                                <p
                                                    className={`text-sm ${
                                                        isSelected
                                                            ? "text-white/70"
                                                            : "text-white/50"
                                                    }`}
                                                >
                                                    {gateway.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Confirmo Payment Form */}
            {selectedGateway === "confirmo" && (
                <ConfirmoPayment
                    amount={amount}
                    programId={programId}
                    accountSize={accountSize}
                    tierId={tierId}
                    programName={programName}
                    programDetails={programDetails}
                    platformName={platformName}
                    platformId={platformId}
                    customerData={customerData}
                    currency="usd"
                    purchasePrice={resolvedPurchasePrice}
                    totalPrice={resolvedTotalPrice}
                    addOnValue={resolvedAddOnValue}
                    purchaseType={purchaseType}
                    resetProductType={resetProductType}
                    selectedAddOns={selectedAddOns}
                    couponCode={activeCoupon?.code ?? null}
                    existingPurchaseId={
                        purchaseId || existingPurchaseId || undefined
                    }
                    disabled={!isCustomerFormValid}
                    onCouponRemoved={onCouponRemoved}
                />
            )}

            {/* Paytiko Button + Redirect */}
            {selectedGateway === "paytiko" && (
                <>
                    {!showPaytiko ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <QuestionMarkCircledIcon
                                    className="h-4 w-4 text-blue-200/80"
                                    strokeWidth={1}
                                />
                                <p className="text-sm text-white/70">
                                    You will be redirected to a secure payment
                                    page to complete your purchase.
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="lg"
                                className="h-14 w-full cursor-pointer font-bold text-base text-shadow-md"
                                onClick={handlePaytikoClick}
                                disabled={
                                    !isCustomerFormValid ||
                                    isInitializingPaytiko
                                }
                            >
                                {isInitializingPaytiko
                                    ? "Preparing..."
                                    : "Place Order with Credit/Debit Card"}
                            </Button>
                        </div>
                    ) : !paytikoSessionToken || isInitializingPaytiko ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center py-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-lime-500" />
                            </div>
                            <p className="text-center text-sm text-white/60">
                                Redirecting to secure payment page...
                            </p>
                        </div>
                    ) : null}

                    {/* Paytiko Cashier - will trigger redirect */}
                    {paytikoSessionToken && paytikoOrderId && (
                        <PaytikoCashier
                            orderId={paytikoOrderId}
                            cashierSessionToken={paytikoSessionToken}
                            locale="en-US"
                            onStatus={(status, detail) => {
                                console.log("[Paytiko] Status callback:", {
                                    status,
                                    detail,
                                });
                                if (status === "Success") {
                                    toast.success(
                                        "Payment successful! Redirecting...",
                                    );
                                    // Redirect to thank you page with order details
                                    const params = new URLSearchParams({
                                        gateway: "paytiko",
                                        order_id: paytikoOrderId || "",
                                        amount: amount.toString(),
                                        campaign_id: "1",
                                    });
                                    window.location.href = `/checkout/order-received?${params.toString()}`;
                                } else if (
                                    status === "Rejected" ||
                                    status === "Failed"
                                ) {
                                    const message =
                                        typeof detail === "object" &&
                                        detail !== null &&
                                        "message" in detail
                                            ? String(detail.message)
                                            : "Payment failed. Please try again.";
                                    toast.error(message);
                                } else if (
                                    status === "Cancelled" ||
                                    status === "SubscriptionCancelled"
                                ) {
                                    toast.info("Payment cancelled");
                                }
                            }}
                        />
                    )}
                </>
            )}

            {/* BridgerPay Button + Cashier */}
            {selectedGateway === "bridger" && (
                <>
                    {!showBridgerPay ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <QuestionMarkCircledIcon
                                    className="h-4 w-4 text-blue-200/80"
                                    strokeWidth={1}
                                />
                                <p className="text-sm text-white/70">
                                    A secure payment modal will open to complete
                                    your purchase.
                                    <br />
                                    You can use credit/debit cards or
                                    cryptocurrency.
                                </p>
                            </div>
                            <Button
                                type="button"
                                size="lg"
                                className="h-14 w-full cursor-pointer font-bold text-base text-shadow-md"
                                onClick={handleBridgerPayClick}
                                disabled={
                                    !isCustomerFormValid ||
                                    isInitializingBridgerPay
                                }
                            >
                                {isInitializingBridgerPay
                                    ? "Preparing..."
                                    : "Place Order"}
                            </Button>
                        </div>
                    ) : !bridgerPayCashierToken ||
                      !bridgerPayCashierKey ||
                      isInitializingBridgerPay ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center py-8">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-lime-500" />
                            </div>
                            <p className="text-center text-sm text-white/60">
                                Preparing secure payment modal...
                            </p>
                        </div>
                    ) : null}

                    {/* BridgerPay Modal */}
                    {bridgerPayCashierToken && bridgerPayCashierKey && (
                        <BridgerPayCashier
                            cashierKey={bridgerPayCashierKey}
                            cashierToken={bridgerPayCashierToken}
                            open={bridgerPayModalOpen}
                            onOpenChange={(open) => {
                                setBridgerPayModalOpen(open);
                                if (!open) {
                                    // Reset state when modal is closed
                                    setShowBridgerPay(false);
                                    setBridgerPayCashierToken(null);
                                    setBridgerPayCashierKey(null);
                                    setBridgerPayInitRequested(false);
                                    bridgerPayInitStartedRef.current = false;
                                }
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
}
