"use client";

import Autoplay from "embla-carousel-autoplay";
import { QuoteIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import type { VideoTestimonial } from "@/payload-types";
import { ReviewAnimation } from "./animations/review";
import { SectionHeader } from "./section-header";
import { YotubeVideo } from "./youtube-video";

interface VideoTestimonialsSectionContent {
    dividerTitle: string;
    title: string;
    titleHighlight: string;
    description: string;
}

interface VideoTestimonialsSectionProps {
    content?: VideoTestimonialsSectionContent;
    testimonials?: VideoTestimonial[];
}

export const VideoTestimonialsSection = ({
    content,
    testimonials = [],
}: VideoTestimonialsSectionProps) => {
    // Default fallback content if no CMS content provided
    const defaultContent: VideoTestimonialsSectionContent = {
        dividerTitle: "Success Reviews",
        title: "What Our Traders Are Saying",
        titleHighlight: "Traders",
        description:
            "Real feedback from real traders who've leveled up their game with us.",
    };

    const sectionContent = content || defaultContent;

    // Use CMS testimonials if available, otherwise fall back to hardcoded items
    const fallbackItems = [
        {
            name: "Evgeny Mikhaylov",
            country: "mx",
            price: "$35,393",
            videoUrl: "https://www.youtube.com/watch?v=HKlT7OOg2-c",
            thumbnail:
                "https://fundedtradermarkets.com/wp-content/uploads/2025/07/EVGENY-COVER_0.png",
            review: "FTM don't scam traders. That was a huge emotional stress when others did.",
        },
        {
            name: "Njieng",
            country: "mx",
            price: "$12,656",
            videoUrl: "https://www.youtube.com/watch?v=18FsgY_w3eg",
            thumbnail:
                "https://fundedtradermarkets.com/wp-content/uploads/2025/04/Njieng-C_0.png",
            review: "I say FTM is really a very good platform",
        },
        // ... other fallback items can be added as needed
    ];

    // Use CMS testimonials if available, otherwise use fallback
    const items =
        testimonials.length > 0
            ? testimonials
                  .filter((t) => t.isActive)
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
            : fallbackItems;

    return (
        <div className="relative space-y-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <SectionHeader
                    dividerTitle={sectionContent.dividerTitle}
                    title={sectionContent.title}
                    titleHighlight={sectionContent.titleHighlight}
                    description={sectionContent.description}
                    animation={<ReviewAnimation />}
                />
            </div>
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 4000,
                    }),
                ]}
                className="w-full px-12"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {items.map((item, index) => (
                        <CarouselItem
                            key={`${item.name}-${index}`}
                            className="basis-full py-1 pl-2 md:basis-1/2 md:pl-4 lg:basis-1/3 xl:basis-1/4"
                        >
                            <Card
                                wrapperClassName="h-full"
                                className="h-full overflow-hidden border-none bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-0 outline outline-white/10"
                            >
                                <CardContent className="flex h-full flex-col p-0">
                                    <div className="p-3">
                                        <div className="relative rounded-lg ring ring-black/50">
                                            <YotubeVideo
                                                videoUrl={item.videoUrl}
                                                customThumbnail={item.thumbnail}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col space-y-4 p-4">
                                        <div className="flex items-start gap-4">
                                            <QuoteIcon className="size-6 shrink-0 stroke-1 text-white opacity-50" />
                                            <p className="text-white/90">
                                                {item.review}
                                            </p>
                                        </div>
                                        <div className="mt-auto">
                                            <p className="flex-1 font-semibold text-white">
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-white/70">
                                                Payout:{" "}
                                                <strong className="text-blue-500 text-xl">
                                                    {item.price}
                                                </strong>
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 border-stone-800 bg-stone-900 text-white hover:bg-stone-800" />
                <CarouselNext className="right-0 border-stone-800 bg-stone-900 text-white hover:bg-stone-800" />
            </Carousel>
        </div>
    );
};
