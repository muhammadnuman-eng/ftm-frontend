"use client";

import { Play } from "lucide-react";
import { useEffect, useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface YouTubeVideoInfo {
    title: string;
    thumbnail: string;
    videoId: string;
}

export const YotubeVideo = ({
    videoUrl,
    customThumbnail,
}: {
    videoUrl?: string | null;
    customThumbnail?: string | null;
}) => {
    const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!videoUrl) return;

        // Extract YouTube video ID from URL
        const getYouTubeVideoId = (url: string): string | null => {
            const regex =
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
            const match = url.match(regex);
            return match ? match[1] : null;
        };

        // Get YouTube thumbnail URL
        const getYouTubeThumbnail = (videoId: string): string => {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        };

        const videoId = getYouTubeVideoId(videoUrl);
        if (!videoId) return;

        setLoading(true);

        // If we have a custom thumbnail, use it immediately
        if (customThumbnail) {
            setVideoInfo({
                title: "Testimonial Video",
                thumbnail: customThumbnail,
                videoId,
            });
            setLoading(false);
            return;
        }

        // Fetch video title from YouTube oEmbed API
        const fetchVideoInfo = async () => {
            try {
                const response = await fetch(
                    `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
                );

                if (response.ok) {
                    const data = (await response.json()) as {
                        title?: string;
                        thumbnail_url?: string;
                    };
                    setVideoInfo({
                        title: data.title || "Testimonial Video",
                        thumbnail:
                            data.thumbnail_url || getYouTubeThumbnail(videoId),
                        videoId,
                    });
                } else {
                    // Fallback if oEmbed fails
                    setVideoInfo({
                        title: "Testimonial Video",
                        thumbnail: getYouTubeThumbnail(videoId),
                        videoId,
                    });
                }
            } catch (error) {
                console.error("Error fetching video info:", error);
                // Fallback on error
                setVideoInfo({
                    title: "Testimonial Video",
                    thumbnail: getYouTubeThumbnail(videoId),
                    videoId,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchVideoInfo();
    }, [videoUrl, customThumbnail]);

    if (!videoUrl) return null;

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="aspect-video w-full rounded-lg bg-stone-800" />
            </div>
        );
    }

    if (!videoInfo) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <div className="w-full">
                    <div className="group relative cursor-pointer overflow-hidden rounded-lg transition-all hover:scale-[1.02]">
                        <div className="relative aspect-video">
                            {/** biome-ignore lint/performance/noImgElement: remote image */}
                            <img
                                src={videoInfo.thumbnail}
                                alt={videoInfo.title}
                                className="h-full w-full object-cover"
                                onError={(
                                    e: React.SyntheticEvent<HTMLImageElement>,
                                ) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
                                }}
                            />
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:bg-black/40">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30 sm:backdrop-blur-sm">
                                <Play
                                    className="ml-1 h-6 w-6 text-white"
                                    fill="currentColor"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="p-0 sm:max-w-4xl">
                <DialogTitle className="sr-only">{videoInfo.title}</DialogTitle>
                <div className="aspect-video w-full">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoInfo.videoId}?autoplay=1&rel=0`}
                        title={videoInfo.title}
                        className="h-full w-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
