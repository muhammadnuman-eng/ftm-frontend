interface AnimationDisplayProps {
    videoName: string;
    className?: string;
    alt?: string;
}

export const AnimationDisplay = ({
    videoName,
    className = "",
    alt = "",
}: AnimationDisplayProps) => {
    return (
        <div
            className={`relative flex items-center justify-center ${className}`}
        >
            {/* Mobile: Use original GIF for best quality */}
            {/** biome-ignore lint/performance/noImgElement: dont use next/image */}
            <img
                className={`pointer-events-none relative rounded-lg bg-transparent md:hidden ${className}`}
                src={`/animations/${videoName}.gif`}
                alt={alt}
                loading="lazy"
                style={{ backgroundColor: "transparent" }}
            />

            {/* Desktop Safari: Use original GIF for transparency + quality */}
            {/** biome-ignore lint/performance/noImgElement: dont use next/image */}
            <img
                className={`pointer-events-none relative hidden rounded-lg bg-transparent md:safari:block ${className}`}
                src={`/animations/${videoName}.gif`}
                alt={alt}
                loading="lazy"
                style={{ backgroundColor: "transparent" }}
            />

            {/* Desktop non-Safari: Use video for better performance */}
            <video
                className={`pointer-events-none relative hidden rounded-lg bg-transparent md:non-safari:block ${className}`}
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                style={{ backgroundColor: "transparent" }}
            >
                <source
                    src={`/animations/${videoName}.webm`}
                    type="video/webm"
                />
                <source
                    src={`/animations/${videoName}_h264.mp4`}
                    type="video/mp4"
                />
            </video>
        </div>
    );
};
