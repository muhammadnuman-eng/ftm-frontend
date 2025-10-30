import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
    /**
     * Optional CSS class name to apply custom styles
     */
    className?: string;
    /**
     * Whether to reverse the animation direction
     * @default false
     */
    reverse?: boolean;
    /**
     * Whether to pause the animation on hover
     * @default false
     */
    pauseOnHover?: boolean;
    /**
     * Content to be displayed in the marquee
     */
    children: React.ReactNode;
    /**
     * Whether to animate vertically instead of horizontally
     * @default false
     */
    vertical?: boolean;
    /**
     * Number of times to repeat the content
     * @default 4
     */
    repeat?: number;
    /**
     * Whether to apply fade gradient on both sides
     * @default false
     */
    fade?: boolean;
    /**
     * Size of the fade gradient in pixels
     * @default 10% of width/height
     */
    fadeWidth?: string;
}

export function Marquee({
    className,
    reverse = false,
    pauseOnHover = false,
    children,
    vertical = false,
    repeat = 4,
    fade = false,
    fadeWidth = "10%",
    ...props
}: MarqueeProps) {
    const maskImage = fade
        ? vertical
            ? `linear-gradient(to bottom, transparent, black ${fadeWidth}, black calc(100% - ${fadeWidth}), transparent)`
            : `linear-gradient(to right, transparent, black ${fadeWidth}, black calc(100% - ${fadeWidth}), transparent)`
        : undefined;

    return (
        <div
            {...props}
            className={cn(
                "group flex overflow-hidden [--duration:40s] [--gap:1rem] [gap:var(--gap)]",
                {
                    "flex-row": !vertical,
                    "flex-col": vertical,
                },
                className,
            )}
            style={{
                maskImage,
                WebkitMaskImage: maskImage,
                ...props.style,
            }}
        >
            {Array(repeat)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i.toString()}
                        className={cn(
                            "flex shrink-0 justify-around will-change-transform [gap:var(--gap)]",
                            {
                                "animate-marquee flex-row": !vertical,
                                "animate-marquee-vertical flex-col": vertical,
                                "group-hover:[animation-play-state:paused]":
                                    pauseOnHover,
                                "[animation-direction:reverse]": reverse,
                            },
                        )}
                    >
                        {children}
                    </div>
                ))}
        </div>
    );
}
