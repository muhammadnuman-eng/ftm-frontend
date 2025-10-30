/** biome-ignore-all lint/performance/noImgElement: dont use nextimage */
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { Media } from "@/payload-types";
import { Marquee } from "./ui/marquee";

// Define the marquee item interface
interface MarqueeItem {
    id?: string | null;
    image: string | number | Media;
    url?: string | null;
    openInNewTab?: boolean | null;
    nofollow?: boolean | null;
    status?: "active" | "passive" | null;
    visibleFrom?: string | null; // ISO string from Payload
    visibleUntil?: string | null; // ISO string from Payload
}

interface BannerDisplayProps {
    viewType: string;
    images: MarqueeItem[];
    speed: string;
    backgroundClass: string;
}

export const BannerDisplay = ({
    viewType,
    images,
    speed,
    backgroundClass,
}: BannerDisplayProps) => {
    // Date-based visibility filter
    const now = new Date();
    const isWithinVisibilityWindow = (item: MarqueeItem) => {
        const fromOk = item.visibleFrom
            ? now >= new Date(item.visibleFrom)
            : true;
        const untilOk = item.visibleUntil
            ? now <= new Date(item.visibleUntil)
            : true;
        return fromOk && untilOk;
    };

    const isActive = (item: MarqueeItem) => {
        return item.status !== "passive";
    };

    // Filter only active images and within date window
    const activeImages = images.filter(
        (image) => isActive(image) && isWithinVisibilityWindow(image),
    );
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Helper function to get animation speed for marquee
    const getMarqueeSpeedClasses = (speed: string) => {
        switch (speed) {
            case "slow":
                return "[--duration:45s]";
            case "fast":
                return "[--duration:15s]";
            default:
                return "[--duration:30s]";
        }
    };

    // Helper function to get fade interval timing
    const getFadeSpeed = useCallback((speed: string) => {
        switch (speed) {
            case "slow":
                return 8000; // 8 seconds
            case "fast":
                return 3000; // 3 seconds
            default:
                return 5000; // 5 seconds
        }
    }, []);

    // Set up fade rotation effect
    useEffect(() => {
        if (viewType === "fade" && activeImages.length > 1) {
            const interval = setInterval(() => {
                setCurrentImageIndex((prevIndex) =>
                    prevIndex === activeImages.length - 1 ? 0 : prevIndex + 1,
                );
            }, getFadeSpeed(speed));

            return () => clearInterval(interval);
        }
    }, [viewType, activeImages.length, speed, getFadeSpeed]);

    if (viewType === "fade") {
        // Fade view: Show one image at a time with fade transitions, scaling with image height
        const currentItem = activeImages[currentImageIndex];
        if (!currentItem) return null;

        const media = currentItem.image as Media;
        const uniqueKey =
            currentItem.id || `${media.id || media.url}-${currentImageIndex}`;

        const ImageElement = (
            <motion.img
                key={uniqueKey}
                src={media.url || ""}
                alt={media.alt || ""}
                className="block object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
        );

        return (
            <AnimatePresence>
                <div
                    className={`h-20 overflow-hidden ${backgroundClass} [&_img]:select-none`}
                >
                    <div className="relative flex h-20 items-center justify-center gap-8 py-2">
                        <motion.div
                            key={uniqueKey}
                            className="absolute z-10 flex h-20 w-full items-center justify-center bg-inherit"
                        >
                            {currentItem.url ? (
                                <a
                                    href={currentItem.url}
                                    target={
                                        currentItem.openInNewTab
                                            ? "_blank"
                                            : undefined
                                    }
                                    rel={
                                        currentItem.nofollow
                                            ? "nofollow noopener noreferrer"
                                            : currentItem.openInNewTab
                                              ? "noopener noreferrer"
                                              : undefined
                                    }
                                >
                                    {ImageElement}
                                </a>
                            ) : (
                                ImageElement
                            )}
                        </motion.div>
                    </div>
                </div>
            </AnimatePresence>
        );
    }

    // Marquee view: Show all images scrolling
    const speedClass = getMarqueeSpeedClasses(speed);

    return (
        <div
            className={`h-20 overflow-hidden ${backgroundClass} [&_img]:select-none`}
        >
            <Marquee className={speedClass}>
                {activeImages.map((item: MarqueeItem, index: number) => {
                    const media = item.image as Media;
                    const uniqueKey =
                        item.id || `${media.id || media.url}-${index}`;
                    const ImageElement = (
                        <img
                            src={media.url || ""}
                            alt={media.alt || ""}
                            className="my-1 block h-18 object-contain"
                        />
                    );

                    const anchorRel = item.nofollow
                        ? "nofollow noopener noreferrer"
                        : item.openInNewTab
                          ? "noopener noreferrer"
                          : undefined;

                    return (
                        <div key={uniqueKey}>
                            {item.url ? (
                                <a
                                    href={item.url}
                                    target={
                                        item.openInNewTab ? "_blank" : undefined
                                    }
                                    rel={anchorRel}
                                >
                                    {ImageElement}
                                </a>
                            ) : (
                                ImageElement
                            )}
                        </div>
                    );
                })}
            </Marquee>
        </div>
    );
};
