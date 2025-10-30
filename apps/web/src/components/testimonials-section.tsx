"use client";

import { SectionHeader } from "@/components/section-header";
import { Marquee } from "@/components/ui/marquee";
import type { Testimonial } from "@/payload-types";
import { ReviewUserAnimation } from "./animations/review-user";

const testimonials1 = [
    {
        text: "FTM is the most authentic and Trusted prop firm where the CEO works like full time employee and respond to every matter or complain in the Discord channel.",
        author: "Usman Bin Mannan",
        avatar: "UB",
    },
    {
        text: "Can't believe, just had payout... Can't believe I just had a payout with FTM 3 days ago and now I have already got my 2nd payout in like 10 mins after placing ????",
        author: "Arsh K.",
        avatar: "AK",
    },
    {
        text: "Recieved my first withdrawal... Alhamdullilah received my first withdrawal 50% split. Can't believe my payout processed and received into my wallet in just 2 minutes ????. FTM is the most legit prop firm ever find. Highly recommended.",
        author: "Muhammad M",
        avatar: "MW",
    },
    {
        text: "FTM is the best prop firm I've seen come around in a while. Great customer service, Great Prices, Fastest payouts I've seen, Multiple options to choose from. It's crazy. Definitely setting a standard. Please don't change what you're doing",
        author: "Michael Lanham",
        avatar: "ML",
    },
    {
        text: "Got paid within 3 hours. I've had lots of questions and every question has been answered. There was even a delay in one of my accounts and they gifted me a free 25k. Most legit firm out there. Thanks guys.",
        author: "Marc Bonner",
        avatar: "MB",
    },
    {
        text: "What I admire most about this firm is transparent and well-defined rules, exceptional customer support, and a commitment to long-term sustainability of the firm! I am excited to grow alongside this organization and look forward to many more achievements together.????",
        author: "Aditya Doshi",
        avatar: "AD",
    },
];

const testimonials2 = [
    {
        text: "Fast payout I got paid within 13 minutes of withdrawal request, responsive customer support, 100% profit split of upto $10k, payouts on demand at no extra charge, this is the best platform outsider.",
        author: "Shogo Abel",
        avatar: "SA",
    },
    {
        text: "It's my first time trying FTM service and it's pretty good actually. The supports are quick and overall trading conditions are also good as well.",
        author: "Suraaj BK",
        avatar: "SB",
    },
    {
        text: "My experience using this firm has been great so far I haven't seen any payout delays or denials their costumer support has been very responsive, helpful and professional I really like this firm",
        author: "Godwin Ogbenjuwa",
        avatar: "GO",
    },
    {
        text: "FTM is the most authentic and Trusted prop firm where the CEO works like full time employee and respond to every matter or complain in the Discord channel. The customer support is 24/7 available with highly professional trained staff. My first payout is just receive in 2 minutes of requesting it. Highly recommended prop firm which meet the actual desires of the Traders.",
        author: "Usman Bin Mannan",
        avatar: "UB",
    },
    {
        text: "Can't believe, just had payout... Can't believe I just had a payout with FTM 3 days ago and now I have already got my 2nd payout in like 10 mins after placing ????",
        author: "Arsh K.",
        avatar: "AK",
    },
    {
        text: "Recieved my first withdrawal... Alhamdullilah received my first withdrawal 50% split. Can't believe my payout processed and received into my wallet in just 2 minutes ????. FTM is the most legit prop firm ever find. Highly recommended.",
        author: "Muhammad M.",
        avatar: "MM",
    },
];

const testimonials3 = [
    {
        text: "FTM is the best prop firm I've seen come around in a while. Great customer service, Great Prices, Fastest payouts I've seen, Multiple options to choose from. It's crazy. Definitely setting a standard. Please don't change what you're doing",
        author: "Michael Lanham",
        avatar: "ML",
    },
    {
        text: "Got paid within 3 hours. I've had lots of questions and every question has been answered. There was even a delay in one of my accounts and they gifted me a free 25k. Most legit firm out there. Thanks guys.",
        author: "Marc Bonner",
        avatar: "MB",
    },
    {
        text: "What I admire most about this firm is transparent and well-defined rules, exceptional customer support, and a commitment to long-term sustainability of the firm! I am excited to grow alongside this organization and look forward to many more achievements together.????",
        author: "Aditya Doshi",
        avatar: "AD",
    },
    {
        text: "Fast payout I got paid within 13 minutes of withdrawal request, responsive customer support, 100% profit split of upto $10k, payouts on demand at no extra charge, this is the best platform outsider.",
        author: "Aditya Doshi",
        avatar: "CB",
    },
    {
        text: "Highly recommended which meet the actual desires of the Traders.",
        author: "Godwin",
        avatar: "MC",
    },
    {
        text: "Full time employee and respond to every matter or complain in the Discord channel.",
        author: "Daniel Green",
        avatar: "DG",
    },
];

function TestimonialCard({
    text,
    author,
    avatar,
    horizontal = false,
}: {
    text: string;
    author: string;
    avatar: string;
    horizontal?: boolean;
}) {
    return (
        <div
            className={`relative flex flex-col gap-4 rounded-xl border border-white/10 bg-card p-6 shadow-sm ${
                horizontal ? "mr-4 h-auto w-80" : "mb-4 w-full"
            }`}
        >
            <div className="text-sm/6 text-white/80">"{text}"</div>
            <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 font-medium text-sm text-white">
                        {avatar}
                    </div>
                    <div className="font-medium text-sm">{author}</div>
                </div>
                <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                        <span key={i.toString()} className="text-yellow-400">
                            ★
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface TestimonialsSectionContent {
    title: string;
    titleHighlight: string;
    description: string;
}

interface TestimonialsSectionProps {
    content?: TestimonialsSectionContent;
    testimonials?: Testimonial[];
}

export function TestimonialsSection({
    content,
    testimonials = [],
}: TestimonialsSectionProps) {
    // Default fallback content if no CMS content provided
    const defaultContent: TestimonialsSectionContent = {
        title: "100+ Satisfied Traders",
        titleHighlight: "Satisfied",
        description:
            "Don't take our word for it, see what our traders have to say",
    };

    const sectionContent = content || defaultContent;

    // Group testimonials by column or use fallback data
    const getTestimonialsByColumn = (column: string) => {
        if (testimonials.length > 0) {
            return testimonials
                .filter((t) => t.isActive && t.column === column)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
        }
        // Return fallback data based on column
        switch (column) {
            case "column1":
                return testimonials1;
            case "column2":
                return testimonials2;
            case "column3":
                return testimonials3;
            default:
                return [];
        }
    };

    const column1Data = getTestimonialsByColumn("column1");
    const column2Data = getTestimonialsByColumn("column2");
    const column3Data = getTestimonialsByColumn("column3");

    return (
        <section className="relative mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
            <SectionHeader
                title={sectionContent.title}
                titleHighlight={sectionContent.titleHighlight}
                description={sectionContent.description}
                animation={<ReviewUserAnimation />}
            />

            <div className="relative">
                {/* Mobile: Horizontal scroll */}
                <div className="overflow-hidden md:hidden">
                    <Marquee className="[--duration:90s]" fade fadeWidth="10%">
                        {[...column1Data, ...column2Data, ...column3Data].map(
                            (testimonial, idx) => (
                                <TestimonialCard
                                    key={`mobile-${testimonial.author}-${idx}`}
                                    {...testimonial}
                                    horizontal={true}
                                />
                            ),
                        )}
                    </Marquee>
                </div>

                {/* Desktop: Three columns */}
                <div
                    className="hidden gap-4 overflow-hidden md:flex"
                    style={{ height: "600px" }}
                >
                    {/* First column - moves up */}
                    <Marquee
                        className="flex-1 [--duration:40s]"
                        vertical
                        fade
                        fadeWidth="25%"
                    >
                        {column1Data.map((testimonial, idx) => (
                            <TestimonialCard
                                key={`t1-${testimonial.author}-${idx}`}
                                {...testimonial}
                            />
                        ))}
                    </Marquee>

                    {/* Second column - moves down */}
                    <Marquee
                        className="flex-1 [--duration:40s]"
                        vertical
                        reverse
                        fade
                        fadeWidth="25%"
                    >
                        {column2Data.map((testimonial, idx) => (
                            <TestimonialCard
                                key={`t2-${testimonial.author}-${idx}`}
                                {...testimonial}
                            />
                        ))}
                    </Marquee>

                    {/* Third column - moves up */}
                    <Marquee
                        className="flex-1 [--duration:40s]"
                        vertical
                        fade
                        fadeWidth="25%"
                    >
                        {column3Data.map((testimonial, idx) => (
                            <TestimonialCard
                                key={`t3-${testimonial.author}-${idx}`}
                                {...testimonial}
                            />
                        ))}
                    </Marquee>
                </div>
            </div>
        </section>
    );
}
