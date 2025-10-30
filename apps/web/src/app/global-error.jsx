// app/global-error.jsx

"use client"; // Error boundaries must be Client Components

import NextError from "next/error";
import posthog from "posthog-js";
import { useEffect } from "react";

export default function GlobalError({ error }) {
    useEffect(() => {
        posthog.capture("global_error", {
            error_message: error?.message || "Unknown error",
            error_stack: error?.stack,
            error_name: error?.name,
            timestamp: new Date().toISOString(),
        });
    }, [error]);

    return (
        // global-error must include html and body tags
        <html lang="en">
            <body>
                {/* `NextError` is the default Next.js error page component */}
                <NextError statusCode={0} />
            </body>
        </html>
    );
}
