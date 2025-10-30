"use client";

import { useCallback, useState } from "react";

const CONSENT_COOKIE_NAME = "cookie-consent";
const CONSENT_COOKIE_VALUE_ACCEPTED = "accepted";
const CONSENT_COOKIE_VALUE_DENIED = "denied";
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export function useCookieConsent() {
    // Get cookie value helper
    const getCookie = useCallback((name: string): string | null => {
        if (typeof document === "undefined") return null;

        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
        return null;
    }, []);

    // Initialize state based on existing cookie
    const [consentState, setConsentState] = useState<
        "pending" | "accepted" | "denied" | null
    >(() => {
        if (typeof window === "undefined") return null;

        const existingConsent = getCookie(CONSENT_COOKIE_NAME);
        if (existingConsent === CONSENT_COOKIE_VALUE_ACCEPTED) {
            return "accepted";
        }
        if (existingConsent === CONSENT_COOKIE_VALUE_DENIED) {
            return "denied";
        }
        return "pending";
    });

    // Set cookie helper
    const setCookie = useCallback(
        (name: string, value: string, maxAge: number) => {
            // Simple cookie setting without domain specification
            // This allows the cookie to work on all environments
            // biome-ignore lint/suspicious/noDocumentCookie: Direct cookie manipulation required for consent management
            document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; samesite=Lax`;
        },
        [],
    );

    const acceptCookies = useCallback(() => {
        setCookie(
            CONSENT_COOKIE_NAME,
            CONSENT_COOKIE_VALUE_ACCEPTED,
            CONSENT_COOKIE_MAX_AGE,
        );
        setConsentState("accepted");

        // Enable analytics/tracking scripts
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("consent", "update", {
                analytics_storage: "granted",
                ad_storage: "granted",
                ad_user_data: "granted",
                ad_personalization: "granted",
            });
        }

        // Trigger a custom event that other scripts can listen to
        window.dispatchEvent(new Event("cookieConsentAccepted"));
    }, [setCookie]);

    const denyCookies = useCallback(() => {
        setCookie(
            CONSENT_COOKIE_NAME,
            CONSENT_COOKIE_VALUE_DENIED,
            CONSENT_COOKIE_MAX_AGE,
        );
        setConsentState("denied");

        // Disable analytics/tracking scripts
        if (typeof window !== "undefined" && window.gtag) {
            window.gtag("consent", "update", {
                analytics_storage: "denied",
                ad_storage: "denied",
                ad_user_data: "denied",
                ad_personalization: "denied",
            });
        }

        // Trigger a custom event that other scripts can listen to
        window.dispatchEvent(new Event("cookieConsentDenied"));
    }, [setCookie]);

    const resetConsent = useCallback(() => {
        // Remove the cookie by setting it with a past expiration
        setCookie(CONSENT_COOKIE_NAME, "", -1);
        setConsentState("pending");
    }, [setCookie]);

    return {
        consentState,
        acceptCookies,
        denyCookies,
        resetConsent,
        hasConsented: consentState === "accepted" || consentState === "denied",
        isAccepted: consentState === "accepted",
        isDenied: consentState === "denied",
        isPending: consentState === "pending",
    };
}

// Type augmentation for window.gtag
declare global {
    interface Window {
        gtag?: (
            command: string,
            action: string,
            parameters: {
                analytics_storage?: "granted" | "denied";
                ad_storage?: "granted" | "denied";
                ad_user_data?: "granted" | "denied";
                ad_personalization?: "granted" | "denied";
            },
        ) => void;
    }
}
