import { formatDistanceStrict } from "date-fns";
import Image from "next/image";
import { connection } from "next/server";
import ReactCountryFlag from "react-country-flag";
import { getPayloadClient } from "@/lib/payload";
import { toCountryCode } from "../lib/utils";
import type { Payout } from "../payload-types";
import { Marquee } from "./ui/marquee";

type RecentPayout = {
    platform: { name: string; logo: string };
    name: string;
    countryFlag: string;
    timestamp: Date;
    amount: number;
    scanUrl?: string;
};

export const PayoutsSection = async () => {
    await connection();
    const payload = await getPayloadClient();

    const EXCLUDED_COUNTRIES = new Set(["vn", "id"]);

    // Recent payouts (latest 12)
    const recent = await payload.find({
        collection: "payouts",
        limit: 12,
        sort: "-approvedDate",
    });

    const recentDocs = recent.docs as unknown as Payout[];

    const recentPayouts: RecentPayout[] = recentDocs
        .map((doc): RecentPayout | undefined => {
            const timestampString =
                (doc.approvedDate as string) || (doc.createdAt as string);
            if (!timestampString) return undefined;
            const timestamp = new Date(timestampString);
            if (Number.isNaN(timestamp.getTime())) return undefined;

            return {
                platform: {
                    name: "Rise Works",
                    logo: "/images/rise-works-logo.svg",
                },
                name: (doc.name as string) || "",
                countryFlag: toCountryCode(doc.country as string),
                timestamp,
                amount: Number(doc.amount) || 0,
                scanUrl: (doc.transactionLink as string) || undefined,
            };
        })
        .filter((doc): doc is RecentPayout => {
            if (!doc) return false;
            if (EXCLUDED_COUNTRIES.has(doc.countryFlag)) return false;
            return true;
        });

    return (
        <div className="space-y-12">
            <div className="mx-auto max-w-7xl space-y-6">
                <h5 className="text-center font-bold text-xs uppercase tracking-widest">
                    Recent Payouts
                </h5>
                <Marquee
                    pauseOnHover
                    fade
                    fadeWidth="15%"
                    className="[--duration:25s] sm:[--duration:20s]"
                >
                    {recentPayouts.map((item, index) => (
                        <div
                            key={index.toString()}
                            className="my-1 flex aspect-video w-64 flex-col rounded-lg bg-blue-500/5 p-4 outline-1 outline-blue-500/10 outline-offset-2"
                        >
                            <div className="flex items-start justify-between">
                                <Image
                                    width={128}
                                    height={128}
                                    src={item.platform.logo}
                                    alt={item.platform.name}
                                    className="size-10 rounded-full"
                                />
                                <div className="font-bold font-mono text-sm">
                                    {new Intl.NumberFormat("en-US", {
                                        style: "currency",
                                        currency: "USD",
                                    }).format(item.amount)}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className="text-lg">
                                    <ReactCountryFlag
                                        svg
                                        countryCode={item.countryFlag.toUpperCase()}
                                    />
                                </span>
                                <p className="line-clamp-1 font-medium text-sm">
                                    {item.name}
                                </p>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                                <span className="line-clamp-1 rounded-md bg-indigo-500/10 px-2 py-1 text-white text-xs">
                                    {formatDistanceStrict(
                                        new Date(item.timestamp),
                                        new Date(),
                                        { addSuffix: true },
                                    )}
                                </span>
                                {item.scanUrl && (
                                    <a
                                        href={item.scanUrl}
                                        className="text-blue-500 text-xs hover:underline"
                                    >
                                        View Details{" "}
                                        <span aria-hidden="true">→</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </Marquee>
            </div>
        </div>
    );
};
