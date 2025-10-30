"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

interface URLGeneratorProps {
    username: string;
    baseUrl: string;
}

export function URLGenerator({ username, baseUrl }: URLGeneratorProps) {
    const [pageUrl, setPageUrl] = useState(baseUrl);
    const [campaignName, setCampaignName] = useState("");
    const [copied, setCopied] = useState<string | null>(null);

    // Generate referral URL with the ref parameter
    const baseReferralUrl = `${pageUrl}/ref/${username}`;
    const generatedUrl = campaignName
        ? `${baseReferralUrl}?campaign=${encodeURIComponent(campaignName)}`
        : baseReferralUrl;

    const copyToClipboard = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <div className="space-y-8">
            {/* Referral URL Display */}
            <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-white text-xl">
                    Referral URL
                </h2>
                <div className="flex items-center gap-3">
                    <input
                        type="text"
                        value={baseReferralUrl}
                        readOnly
                        className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white"
                    />
                    <button
                        type="button"
                        onClick={() => copyToClipboard(baseReferralUrl, "base")}
                        className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-white transition-colors hover:bg-cyan-600"
                    >
                        {copied === "base" ? (
                            <>
                                <CheckIcon className="h-5 w-5" />
                                Copied
                            </>
                        ) : (
                            <>
                                <CopyIcon className="h-5 w-5" />
                                Copy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* URL Generator */}
            <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-6 shadow-sm">
                <h2 className="mb-4 font-semibold text-white text-xl">
                    Referral URL generator
                </h2>
                <p className="mb-6 text-stone-400">
                    Use this form to generate a referral link.
                </p>

                <div className="space-y-6">
                    <div>
                        <label
                            htmlFor="page-url"
                            className="mb-2 block font-medium text-sm text-stone-300"
                        >
                            Page URL
                        </label>
                        <input
                            id="page-url"
                            type="text"
                            value={pageUrl}
                            onChange={(e) => setPageUrl(e.target.value)}
                            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="campaign-name"
                            className="mb-2 block font-medium text-sm text-stone-300"
                        >
                            Campaign name
                        </label>
                        <p className="mb-2 text-sm text-stone-400">
                            Enter an optional campaign name to help track
                            performance.
                        </p>
                        <input
                            id="campaign-name"
                            type="text"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white"
                            placeholder="e.g., My-Sales"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="generated-url"
                            className="mb-2 block font-medium text-sm text-stone-300"
                        >
                            Generated referral URL
                        </label>
                        <p className="mb-2 text-sm text-stone-400">
                            Share this URL with your audience.
                        </p>
                        <div className="flex items-center gap-3">
                            <input
                                id="generated-url"
                                type="text"
                                value={generatedUrl}
                                readOnly
                                className="flex-1 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    copyToClipboard(generatedUrl, "generated")
                                }
                                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-white transition-colors hover:bg-cyan-600"
                            >
                                {copied === "generated" ? (
                                    <>
                                        <CheckIcon className="h-5 w-5" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <CopyIcon className="h-5 w-5" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
