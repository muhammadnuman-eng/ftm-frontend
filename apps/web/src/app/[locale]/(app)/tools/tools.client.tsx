"use client";

import IframeResizer from "@iframe-resizer/react";
import { BarChart3, Calculator, DollarSign, TrendingUp } from "lucide-react";
import { type ComponentType, useMemo, useState } from "react";
import { IframeLoader } from "@/components/iframe-loader";
import { cn } from "@/lib/utils";

type ToolItem = {
    id: string;
    name: string;
    description?: string;
    url: string;
    icon?: string;
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
    Calculator,
    TrendingUp,
    DollarSign,
    BarChart3,
};

export default function ToolsClient({ tools }: { tools: ToolItem[] }) {
    const defaultActive = tools[0]?.id || "";
    const [activeTab, setActiveTab] = useState(defaultActive);
    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
        () => Object.fromEntries(tools.map((t) => [t.id, true])),
    );

    const activeTool = useMemo(
        () => tools.find((t) => t.id === activeTab) || tools[0],
        [activeTab, tools],
    );

    const handleIframeLoad = () => {
        setLoadingStates((prev) => ({ ...prev, [activeTab]: false }));
    };

    if (!tools.length) {
        return (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-white/70">
                No tools configured.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-6">
                <div className="flex justify-center">
                    <div className="flex w-full max-w-2xl flex-col rounded-md border border-white/10 bg-white/5 p-1 sm:max-w-none sm:flex-row sm:rounded-full">
                        {tools.map((tool) => {
                            const Icon = tool.icon
                                ? iconMap[tool.icon]
                                : undefined;
                            return (
                                <button
                                    key={tool.id}
                                    type="button"
                                    onClick={() => {
                                        setLoadingStates((prev) => ({
                                            ...prev,
                                            [tool.id]: true,
                                        }));
                                        setActiveTab(tool.id);
                                    }}
                                    className={cn(
                                        "relative flex-1 rounded px-3 py-3 font-semibold text-sm transition-all duration-300 sm:rounded-full sm:px-6 sm:py-4 sm:text-base",
                                        "whitespace-nowrap text-center hover:text-white focus:outline-none",
                                        activeTab === tool.id
                                            ? "bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                                            : "text-white/80 hover:bg-white/5 hover:text-white/80",
                                    )}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        {Icon ? (
                                            <Icon className="h-4 w-4" />
                                        ) : null}
                                        {tool.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative w-full overflow-hidden">
                    {loadingStates[activeTab] && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
                            <IframeLoader
                                isLoading={loadingStates[activeTab]}
                                toolName={activeTool?.name || ""}
                            />
                        </div>
                    )}
                    <IframeResizer
                        key={activeTab}
                        license="GPLv3"
                        checkOrigin={false}
                        // Keep it visually full-size even if remote doesn't cooperate
                        style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "0.5rem",
                        }}
                        className="rounded-lg border border-white/10 bg-white/5"
                        title={`${activeTool?.name || "Tool"} Calculator`}
                        src={activeTool?.url || ""}
                        onLoad={handleIframeLoad}
                    />
                </div>
            </div>
        </div>
    );
}
