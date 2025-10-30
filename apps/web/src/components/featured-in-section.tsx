import Image from "next/image";
import type { Homepage, Media } from "@/payload-types";

import { Marquee } from "./ui/marquee";

interface FeaturedInSectionProps {
    content: Homepage["featuredIn"];
}

export const FeaturedInSection = ({ content }: FeaturedInSectionProps) => {
    if (!content || !content.logos?.length) {
        return null;
    }

    return (
        <div className="space-y-4">
            <h5 className="text-center font-bold text-xs uppercase tracking-widest">
                {content.heading}
            </h5>
            <div className="relative border-stone-900 border-t border-b bg-black py-8">
                <Marquee
                    pauseOnHover
                    className="[--duration:40s] [--gap:3rem] [&_img]:h-4 sm:[&_img]:h-8"
                >
                    {content.logos
                        .map((logo, index) => {
                            const logoMedia = logo.logo as Media;

                            // Skip if no media or URL
                            if (!logoMedia?.url) {
                                return null;
                            }

                            const logoComponent = (
                                <div className="flex items-center">
                                    <Image
                                        src={logoMedia.url}
                                        alt={logo.name}
                                        width={logoMedia.width || 200}
                                        height={logoMedia.height || 50}
                                        className="h-auto max-h-8 w-auto object-contain"
                                        priority={index < 3} // Prioritize first 3 logos
                                    />
                                </div>
                            );

                            if (logo.url) {
                                return (
                                    <a
                                        key={logo.id || `${logo.name}-${index}`}
                                        href={logo.url}
                                        className="flex items-center"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {logoComponent}
                                    </a>
                                );
                            }

                            return (
                                <div
                                    key={logo.id || `${logo.name}-${index}`}
                                    className="flex items-center"
                                >
                                    {logoComponent}
                                </div>
                            );
                        })
                        .filter(Boolean)}
                </Marquee>
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-black to-transparent md:w-32 md:from-25%" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent md:w-32 md:from-25%" />
            </div>
        </div>
    );
};
