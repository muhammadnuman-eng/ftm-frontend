"use client";

import { useEffect, useRef } from "react";

export const IntercomClientComponent = () => {
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        let idleId: number | null = null;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const loadIntercom = () => {
            if (hasLoadedRef.current) return;
            hasLoadedRef.current = true;

            if (window.Intercom) {
                window.Intercom("reattach_activator");
                window.Intercom("update", window.intercomSettings);
                return;
            }

            // Avoid duplicate script injection
            if (!document.getElementById("intercom-widget-script")) {
                const intercomScript = document.createElement("script");
                intercomScript.id = "intercom-widget-script";
                intercomScript.type = "text/javascript";
                intercomScript.async = true;
                intercomScript.src =
                    "https://widget.intercom.io/widget/vb20lazv";
                intercomScript.onload = () => {
                    if (window.Intercom) {
                        window.Intercom("update", window.intercomSettings);
                    }
                };
                document.body.appendChild(intercomScript);
            }
        };

        const intentHandler = () => {
            cleanupListeners();
            cancelIdle();
            loadIntercom();
        };

        const cleanupListeners = () => {
            events.forEach((event) => {
                window.removeEventListener(event, intentHandler, false);
            });
        };

        const cancelIdle = () => {
            // Cancel any scheduled idle or timeout
            if (idleId !== null && "cancelIdleCallback" in window) {
                (
                    window as unknown as {
                        cancelIdleCallback: (id: number) => void;
                    }
                ).cancelIdleCallback(idleId);
                idleId = null;
            }
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        const events: Array<keyof WindowEventMap> = [
            "click",
            "mousemove",
            "keydown",
            "touchstart",
            "pointerdown",
            "scroll",
        ];

        events.forEach((event) => {
            window.addEventListener(event, intentHandler, false);
        });

        // Idle load with fallback after 5s
        if ("requestIdleCallback" in window) {
            idleId = (
                window as unknown as {
                    requestIdleCallback: (
                        cb: IdleRequestCallback,
                        opts?: { timeout?: number },
                    ) => number;
                }
            ).requestIdleCallback(
                () => {
                    cleanupListeners();
                    loadIntercom();
                },
                { timeout: 5000 },
            );
        } else {
            timeoutId = setTimeout(() => {
                cleanupListeners();
                loadIntercom();
            }, 5000);
        }

        return () => {
            cleanupListeners();
            cancelIdle();
        };
    }, []);

    return null;
};
