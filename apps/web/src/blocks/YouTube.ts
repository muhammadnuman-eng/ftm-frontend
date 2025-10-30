import type { Block } from "payload";

export function extractVideoID(url: string): string | null {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];

    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];

    const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (embedMatch) return embedMatch[1];

    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

    return null;
}

export const YouTube: Block = {
    slug: "youtube",
    interfaceName: "YouTubeBlock",
    labels: {
        singular: "YouTube Video",
        plural: "YouTube Videos",
    },
    fields: [
        {
            name: "url",
            type: "text",
            required: true,
            label: "YouTube URL",
            admin: {
                description:
                    "Paste the full YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
                placeholder: "https://www.youtube.com/watch?v=...",
            },
        },
    ],
    admin: {
        components: {},
    },
};
