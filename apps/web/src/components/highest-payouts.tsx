import { Squircle } from "@squircle-js/react";
import { connection } from "next/server";
import ReactCountryFlag from "react-country-flag";
import { getPayloadClient } from "@/lib/payload";
import { toCountryCode } from "@/lib/utils";
import type { Payout } from "@/payload-types";
import { CupAnimation } from "./animations/cup";
import { SectionHeader } from "./section-header";
import { Marquee } from "./ui/marquee";

interface HighestPayoutsContent {
    title: string;
    titleHighlight: string;
    description: string;
}

interface HighestPayoutsProps {
    content?: HighestPayoutsContent;
}

function parseProcessingTime(timeStr: string | null | undefined): number {
    if (!timeStr) return 0;

    const str = timeStr.trim();
    const match = str.match(/^(\d+):(\d+):(\d+)$/);

    if (!match) return 0;

    const hours = Number.parseInt(match[1], 10);
    const minutes = Number.parseInt(match[2], 10);
    const seconds = Number.parseInt(match[3], 10);

    return hours * 3600 + minutes * 60 + seconds;
}

function formatAvg(seconds: number): string {
    const totalSeconds = Math.max(1, Math.round(seconds));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
}

export const HighestPayouts = async ({ content }: HighestPayoutsProps) => {
    await connection();
    const payload = await getPayloadClient();

    // Default fallback content if no CMS content provided
    const defaultContent: HighestPayoutsContent = {
        title: "Milestone Rewards for Trading Champions",
        titleHighlight: "Trading Champions",
        description:
            "Celebrating our biggest single payouts from successful traders",
    };

    const sectionContent = content || defaultContent;

    // Fetch top 4 biggest single payouts from the Payouts collection
    const payoutsResult = await payload.find({
        collection: "payouts",
        limit: 3000,
        sort: "-amount",
    });

    const groupedPayouts = payoutsResult.docs
        .filter((doc) => doc.amount > 0 && doc.country !== "Vietnam")
        .reduce(
            (acc, doc) => {
                const email = doc.email || "no-email";
                if (!acc[email]) {
                    acc[email] = [];
                }
                acc[email].push(doc);
                return acc;
            },
            {} as Record<string, Payout[]>,
        );

    // Calculate total amount for each person (grouped by email) and get their details
    const topPayouts = Object.entries(groupedPayouts)
        .map(([_email, payouts]) => {
            // Sum up all amounts for this person
            const totalAmount = payouts.reduce(
                (sum, payout) => sum + (Number(payout.amount) || 0),
                0,
            );

            // Use the most recent payout for name, country and link (first in sorted array)
            const representativePayout = payouts[0];

            return {
                name: (representativePayout.name as string) || "Anonymous",
                countryCode: toCountryCode(
                    representativePayout.country as string,
                ),
                amount: totalAmount,
                avgProcessing: formatAvg(
                    payouts.reduce(
                        (sum, payout) =>
                            sum + parseProcessingTime(payout.processingTime),
                        0,
                    ) / payouts.length,
                ),
                detailsUrl:
                    (representativePayout.transactionLink as string) || "#",
            };
        })
        .filter((payout) => payout.amount > 0)
        .sort((a, b) => b.amount - a.amount);

    const first4Payouts = topPayouts.slice(0, 4);
    const restPayouts = topPayouts.slice(4, 14);

    return (
        <section className="bg-gradient-to-b from-indigo-950/30 via-indigo-950/10 to-indigo-950/30 py-12">
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div
                    aria-hidden="true"
                    className="-top-3 absolute inset-x-0 transform-gpu overflow-hidden px-24 blur-3xl"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="mx-auto aspect-1155/678 w-288.75 bg-linear-to-tr from-blue-500 via-lime-500 to-rose-500 opacity-10"
                    />
                </div>

                <div className="relative">
                    <SectionHeader
                        title={sectionContent.title}
                        titleHighlight={sectionContent.titleHighlight}
                        description={sectionContent.description}
                        animation={<CupAnimation />}
                    />

                    <div className="mt-8 grid grid-cols-2 gap-2 sm:mt-16 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                        {first4Payouts.map((payout, index) => (
                            <div
                                key={`${payout.name}-${index}`}
                                className="group relative flex"
                            >
                                {/* Clean card */}
                                <Squircle
                                    cornerRadius={24}
                                    cornerSmoothing={1}
                                    className="relative flex flex-1 cursor-pointer flex-col bg-white/[0.02] p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] hover:ring-white/10 sm:p-8"
                                >
                                    {/* Flag */}
                                    <div className="mb-6 hidden justify-center sm:flex">
                                        <ReactCountryFlag
                                            countryCode={payout.countryCode}
                                            svg
                                            style={{
                                                fontSize: "1.3rem",
                                                width: "1.3em",
                                                height: "1.3em",
                                            }}
                                            className="overflow-hidden rounded"
                                        />
                                    </div>
                                    <div className="mb-2 flex justify-center sm:hidden">
                                        <ReactCountryFlag
                                            countryCode={payout.countryCode}
                                            svg
                                            style={{
                                                fontSize: "1rem",
                                                width: "1em",
                                                height: "1em",
                                            }}
                                            className="overflow-hidden rounded"
                                        />
                                    </div>

                                    {/* Name */}
                                    <h3 className="mb-3 text-center font-medium text-sm text-white/90 capitalize sm:mb-6 sm:text-base">
                                        {payout.name.toLowerCase()}
                                    </h3>

                                    {/* Amount */}
                                    <div className="mt-auto text-center sm:mt-0 sm:mb-6">
                                        <div className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-transparent text-xl sm:text-3xl">
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            }).format(payout.amount)}
                                        </div>
                                    </div>

                                    {/* Link */}
                                    <div className="hidden text-center sm:block">
                                        <span className="text-white/60 text-xs">
                                            View Details{" "}
                                            <span aria-hidden="true">→</span>
                                        </span>
                                    </div>

                                    {/* Subtle glow on hover */}
                                    <div className="absolute inset-0 hidden rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 sm:block" />
                                </Squircle>
                            </div>
                        ))}
                    </div>

                    <Marquee className="mt-6" pauseOnHover fade fadeWidth="15%">
                        {restPayouts.map((item, index) => (
                            <div
                                key={index.toString()}
                                className="relative my-1 flex w-56 flex-col rounded-lg bg-gradient-to-br from-blue-700/10 to-indigo-700/10 p-4 outline-1 outline-blue-300/20 outline-offset-2 sm:aspect-video sm:w-72"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-xs uppercase tracking-wide opacity-50">
                                        avg. payout time
                                    </span>
                                    <span className="font-bold text-white text-xs uppercase tracking-wide">
                                        {item.avgProcessing}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between sm:mt-auto">
                                    <div className="bg-gradient-to-br from-blue-200 to-indigo-400 bg-clip-text font-bold font-mono text-lg text-transparent sm:text-xl">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        }).format(item.amount)}
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <ReactCountryFlag
                                        svg
                                        style={{
                                            fontSize: "1rem",
                                            width: "1rem",
                                            height: "1rem",
                                        }}
                                        countryCode={item.countryCode.toUpperCase()}
                                    />
                                    <p className="line-clamp-1 font-medium text-xs">
                                        {item.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </Marquee>
                </div>
            </div>
        </section>
    );
};
