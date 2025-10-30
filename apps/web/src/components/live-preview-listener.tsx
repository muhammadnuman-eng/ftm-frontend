"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

interface LivePreviewProps {
    serverURL?: string;
}

export function LivePreview({ serverURL }: LivePreviewProps) {
    const router = useRouter();

    return (
        <RefreshRouteOnSave
            serverURL={
                serverURL ||
                process.env.NEXT_PUBLIC_SERVER_URL ||
                "http://localhost:3000"
            }
            refresh={() => {
                router.refresh();
            }}
        />
    );
}
