"use client";

import { useLivePreview } from "@payloadcms/live-preview-react";
import type { Homepage } from "@/payload-types";

interface LivePreviewWrapperProps {
    initialData: Homepage;
    serverURL?: string;
    children: (data: Homepage) => React.ReactNode;
}

export function LivePreviewWrapper({
    initialData,
    serverURL,
    children,
}: LivePreviewWrapperProps) {
    const { data } = useLivePreview<Homepage>({
        serverURL:
            serverURL ||
            process.env.NEXT_PUBLIC_SERVER_URL ||
            "http://localhost:3000",
        initialData,
    });

    return <>{children(data)}</>;
}
