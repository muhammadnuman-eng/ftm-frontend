"use client";

import { ChevronRightIcon } from "lucide-react";
import type React from "react";

interface TOCItem {
    id: string;
    text: string;
    level: number;
    parentId?: string;
}

interface TableOfContentsProps {
    headings: TOCItem[];
    className?: string;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({
    headings,
    className = "",
}) => {
    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            // Get the element's position relative to the viewport
            const elementRect = element.getBoundingClientRect();
            const elementTop = elementRect.top + window.pageYOffset;

            // Account for any fixed header (adjust this value based on your header height)
            const headerOffset = 100; // Adjust this value if needed

            // Calculate the target scroll position
            const targetPosition = elementTop - headerOffset;

            // Smooth scroll to the target position
            window.scrollTo({
                top: targetPosition,
                behavior: "smooth",
            });

            // Add a subtle highlight effect to the target element
            element.style.transition = "background-color 0.3s ease";
            element.style.backgroundColor = "rgba(99, 102, 241, 0.1)"; // Indigo with low opacity

            // Remove the highlight after a short delay
            setTimeout(() => {
                element.style.backgroundColor = "";
            }, 2000);
        }
    };

    if (headings.length === 0) {
        return (
            <div
                className={`rounded-lg border border-slate-700/50 bg-slate-800/50 p-6 ${className}`}
            >
                <h3 className="mb-4 font-bold text-lg text-white">
                    Table of Contents
                </h3>
                <p className="text-slate-400 text-sm">
                    No headings available in this article.
                </p>
            </div>
        );
    }

    return (
        <div
            className={`rounded-lg border border-slate-700/50 bg-slate-800/50 p-6 ${className}`}
        >
            <h3 className="mb-6 font-bold text-lg text-white">
                Table of Contents
            </h3>
            <nav className="space-y-1">
                {headings.map((heading) => {
                    // Calculate indent level based on hierarchy
                    let indentLevel = 0;
                    let currentParent = heading.parentId;

                    while (currentParent) {
                        indentLevel++;
                        const parent = headings.find(
                            (h) => h.id === currentParent,
                        );
                        currentParent = parent?.parentId;
                    }

                    indentLevel = Math.min(indentLevel, 3); // Max 3 levels of indentation

                    return (
                        <button
                            key={heading.id}
                            type="button"
                            onClick={() => scrollToHeading(heading.id)}
                            className="group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-700/50 hover:text-white"
                            style={{
                                marginLeft: `${indentLevel * 8}px`,
                                fontSize: `${Math.max(14 - (heading.level - 1) * 1, 12)}px`,
                                fontWeight: heading.level <= 2 ? "600" : "400",
                            }}
                        >
                            <ChevronRightIcon className="h-3 w-3 text-slate-500 transition-colors group-hover:text-indigo-400" />
                            <span className="line-clamp-2">{heading.text}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default TableOfContents;
