"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
            api_host:
                process.env.NEXT_PUBLIC_POSTHOG_HOST ||
                "https://eu.i.posthog.com",
            person_profiles: "always",
            defaults: "2025-05-24",
            // Session recording configuration
            session_recording: {
                recordCrossOriginIframes: true,
                maskAllInputs: false, // We want to see form interactions (but sensitive data is masked by default)
                maskTextSelector: "[data-ph-mask]", // Custom selector for masking
            },
            // Capture additional context
            capture_pageview: true,
            capture_pageleave: true,
            // Enable autocapture for heatmaps
            autocapture: {
                dom_event_allowlist: ["click", "change", "submit"],
                capture_copied_text: true,
            },
            // Enable console logs in recordings
            enable_recording_console_log: true,
            // Capture performance metrics
            capture_performance: true,
        });
    }, []);

    return <PHProvider client={posthog}>{children}</PHProvider>;
}
