"use client";
import { Button } from "@payloadcms/ui";

type Props = {
    href?: string;
    label?: string;
};

export default function ViewSiteButton({
    href = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001",
    label = "View site",
}: Props) {
    return (
        <Button
            buttonStyle="transparent"
            onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
        >
            {label}
        </Button>
    );
}
