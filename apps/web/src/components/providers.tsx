"use client";

import { PostHogProvider } from "./posthog-provider";
import { Toaster } from "./ui/sonner";

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <PostHogProvider>
            {children}
            <Toaster richColors />
        </PostHogProvider>
    );
};
