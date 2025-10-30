"use client";

import { useEffect } from "react";
import { getCashierScriptSrc } from "@/lib/paytiko-client";

declare global {
    interface Window {
        PaytikoSdk?: {
            cashier: {
                invoke: (options: {
                    environment?: "UAT" | "PRODUCTION";
                    orderId: string;
                    sessionToken: string;
                    iframeContainerSelector?: string;
                    displayMode?: string;
                    locale?: string;
                    lockCardHolderName?: boolean;
                    creditCardOnly?: boolean;
                    fixedPaymentProcessorId?: number;
                    autoGenerateOrder?: boolean;
                }) => void;
            };
        };
        PAYTIKO_CASHIER_DISPLAY_MODE?: {
            IFRAME?: string;
            REDIRECT?: string;
            REDIRECT_NEW_TAB?: string;
        };
    }
}

interface PaytikoCashierProps {
    orderId: string;
    cashierSessionToken: string;
    locale?: string; // e.g. 'en-US'
    onStatus?: (status: string, payload?: unknown) => void;
}

export function PaytikoCashier({
    orderId,
    cashierSessionToken,
    locale = "en-US",
    onStatus,
}: PaytikoCashierProps) {
    useEffect(() => {
        let mounted = true;
        let script: HTMLScriptElement | null = null;

        const loadScript = () => {
            if (!mounted) return;

            script = document.createElement("script");
            const publicCoreUrl = process.env.NEXT_PUBLIC_PAYTIKO_CORE_URL;
            script.src = getCashierScriptSrc(publicCoreUrl);
            script.async = true;
            script.onload = () => {
                if (!mounted) return;
                const environment =
                    process.env.NEXT_PUBLIC_PAYTIKO_ENV === "UAT"
                        ? "UAT"
                        : "PRODUCTION";

                type CashierOptions = {
                    environment?: "UAT" | "PRODUCTION";
                    orderId: string;
                    sessionToken: string;
                    iframeContainerSelector?: string;
                    displayMode?: string;
                    locale?: string;
                    lockCardHolderName?: boolean;
                    creditCardOnly?: boolean;
                    fixedPaymentProcessorId?: number;
                    autoGenerateOrder?: boolean;
                };

                const options: CashierOptions = {
                    environment,
                    orderId,
                    sessionToken: cashierSessionToken,
                    displayMode: window.PAYTIKO_CASHIER_DISPLAY_MODE?.REDIRECT,
                    locale,
                };

                console.log("[Paytiko] Invoking cashier with options:", {
                    environment,
                    orderId,
                    displayMode: "REDIRECT",
                });

                window.PaytikoSdk?.cashier.invoke(options);
            };

            script.onerror = () => {
                console.error("[Paytiko] Failed to load cashier script");
            };

            document.body.appendChild(script);
        };

        loadScript();

        return () => {
            mounted = false;
            try {
                if (script && document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            } catch (error) {
                console.error("[Paytiko] Error removing script:", error);
            }
        };
    }, [orderId, cashierSessionToken, locale]);

    return null;
}

export default PaytikoCashier;
