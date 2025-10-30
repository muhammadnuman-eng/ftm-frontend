"use client";

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
    currentPage: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    baseUrl?: string;
    pageParamName?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    baseUrl,
    pageParamName = "page",
}: PaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Calculate hasNextPage and hasPrevPage from totalPages if provided
    const hasNext =
        totalPages !== undefined
            ? currentPage < totalPages
            : (hasNextPage ?? false);
    const hasPrev =
        totalPages !== undefined ? currentPage > 1 : (hasPrevPage ?? false);
    const lastPage = totalPages ?? currentPage + 1;

    const navigateToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(pageParamName, String(page));
        const url = baseUrl || pathname;
        router.push(`${url}?${params.toString()}`);
    };

    // Generate page numbers to show (show 5 pages at a time)
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;
        const halfRange = Math.floor(maxPagesToShow / 2);

        let startPage = Math.max(1, currentPage - halfRange);
        let endPage = startPage + maxPagesToShow - 1;

        // If we know totalPages, cap endPage
        if (totalPages !== undefined) {
            endPage = Math.min(endPage, totalPages);
            // Adjust startPage if we're near the end
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        } else if (hasNext && endPage < currentPage + 1) {
            // If we don't know totalPages but know there's a next page
            endPage = currentPage + 1;
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) {
                pages.push("ellipsis-start");
            }
        }

        // Add page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        // Add ellipsis and last page if needed
        if (totalPages !== undefined && endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push("ellipsis-end");
            }
            pages.push(totalPages);
        } else if (hasNext && totalPages === undefined) {
            pages.push("ellipsis-end");
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-stone-800 bg-[#1a1a1a] px-6 py-4">
            {/* First Page */}
            <button
                type="button"
                onClick={() => navigateToPage(1)}
                disabled={!hasPrev}
                className="flex items-center justify-center rounded-lg bg-stone-800 p-2 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="First page"
            >
                <ChevronsLeftIcon className="h-4 w-4" />
            </button>

            {/* Previous Page */}
            <button
                type="button"
                onClick={() => navigateToPage(currentPage - 1)}
                disabled={!hasPrev}
                className="flex items-center justify-center rounded-lg bg-stone-800 p-2 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Previous page"
            >
                <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {pageNumbers.map((page) =>
                    typeof page === "string" ? (
                        <span key={page} className="px-3 py-2 text-stone-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            onClick={() => navigateToPage(page)}
                            className={`min-w-[40px] rounded-lg px-3 py-2 font-medium text-sm transition-colors ${
                                page === currentPage
                                    ? "bg-cyan-500 text-white"
                                    : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                            }`}
                        >
                            {page}
                        </button>
                    ),
                )}
            </div>

            {/* Next Page */}
            <button
                type="button"
                onClick={() => navigateToPage(currentPage + 1)}
                disabled={!hasNext}
                className="flex items-center justify-center rounded-lg bg-stone-800 p-2 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Next page"
            >
                <ChevronRightIcon className="h-4 w-4" />
            </button>

            {/* Last Page (only show if we know total pages) */}
            {totalPages !== undefined && totalPages > 1 && (
                <button
                    type="button"
                    onClick={() => navigateToPage(lastPage)}
                    disabled={!hasNext}
                    className="flex items-center justify-center rounded-lg bg-stone-800 p-2 text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Last page"
                >
                    <ChevronsRightIcon className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
