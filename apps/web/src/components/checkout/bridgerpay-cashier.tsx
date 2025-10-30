"use client";

import { useEffect, useId, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

declare global {
    interface Window {
        BridgerPayCheckout?: {
            init?: (options: {
                cashierKey: string;
                cashierToken: string;
                containerId?: string;
            }) => void;
        };
    }
}

interface BridgerPayCashierProps {
    cashierKey: string;
    cashierToken: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function BridgerPayCashier({
    cashierKey,
    cashierToken,
    open = true,
    onOpenChange,
}: BridgerPayCashierProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const containerId = useId();
    const scriptLoadedRef = useRef(false);

    console.log("[BridgerPay] Cashier component received:", {
        hasKey: !!cashierKey,
        hasToken: !!cashierToken,
        keyLength: cashierKey?.length,
        tokenLength: cashierToken?.length,
        open,
    });

    useEffect(() => {
        let mounted = true;
        let script: HTMLScriptElement | null = null;

        // Only load script when modal is open
        if (!open) {
            return;
        }

        // Prevent duplicate script loading
        if (scriptLoadedRef.current) {
            return;
        }

        // Small delay to ensure modal is fully rendered
        const loadScript = () => {
            if (!mounted) return;

            script = document.createElement("script");
            script.src = "https://checkout.bridgerpay.com/v2/launcher";
            script.async = true;
            script.setAttribute("data-cashier-key", cashierKey);
            script.setAttribute("data-cashier-token", cashierToken);
            script.setAttribute("data-container-id", containerId);

            script.onload = () => {
                scriptLoadedRef.current = true;
                if (!mounted) return;

                if (process.env.NEXT_PUBLIC_BRIDGERPAY_DEBUG === "1") {
                    console.log("[BridgerPay] Checkout widget loaded", {
                        cashierKey,
                        tokenPrefix: cashierToken.slice(0, 8),
                    });
                }

                // BridgerPay automatically renders into the container with data attributes
                // No need to manually invoke if using data attributes approach
            };

            script.onerror = () => {
                console.error("[BridgerPay] Failed to load checkout widget");
            };

            // Append script to container to ensure it renders within it
            if (containerRef.current) {
                containerRef.current.appendChild(script);
            } else {
                document.body.appendChild(script);
            }
        };

        // Load script after a small delay to ensure modal is rendered
        setTimeout(() => {
            console.log(
                "[BridgerPay] Loading script, container available:",
                !!containerRef.current,
            );
            loadScript();
        }, 100);

        // Listen for BridgerPay redirect event
        const handleBridgerPayRedirect = (event: Event) => {
            const customEvent = event as CustomEvent<{ url?: string }>;
            const redirectUrl = customEvent.detail?.url;

            console.log("[BridgerPay] Redirect event received:", {
                url: redirectUrl,
                detail: customEvent.detail,
            });

            if (redirectUrl) {
                console.log("[BridgerPay] Redirecting to:", redirectUrl);
                // Close modal first
                onOpenChange?.(false);
                // Then redirect
                window.location.href = redirectUrl;
            }
        };

        // Listen for BridgerPay's custom redirect event
        window.addEventListener(
            "[bp]:redirect",
            handleBridgerPayRedirect as EventListener,
        );

        return () => {
            mounted = false;
            window.removeEventListener(
                "[bp]:redirect",
                handleBridgerPayRedirect as EventListener,
            );

            try {
                if (script && containerRef.current?.contains(script)) {
                    containerRef.current.removeChild(script);
                } else if (script && document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            } catch (error) {
                console.error("[BridgerPay] Error removing script:", error);
            }
        };
    }, [cashierKey, cashierToken, onOpenChange, open, containerId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-white text-black">
                <DialogHeader>
                    <DialogTitle>Complete Your Payment</DialogTitle>
                    <DialogDescription>
                        Securely complete your purchase with BridgerPay
                    </DialogDescription>
                </DialogHeader>
                <div
                    id={containerId}
                    ref={containerRef}
                    className="min-h-[500px] w-full border-stone-200 border-t pt-4"
                    data-cashier-key={cashierKey}
                    data-cashier-token={cashierToken}
                    data-container-id={containerId}
                />
            </DialogContent>
        </Dialog>
    );
}

export default BridgerPayCashier;
