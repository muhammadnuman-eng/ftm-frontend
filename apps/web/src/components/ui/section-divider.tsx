import type { ElementType } from "react";
import { cn } from "@/lib/utils";

interface SectionDividerProps {
    title: string;
    as?: ElementType;
    className?: string;
}

export function SectionDivider({
    title,
    as: Component = "div",
    className,
}: SectionDividerProps) {
    return (
        <div
            className={cn(
                "mx-auto flex max-w-2xl items-center gap-4 sm:gap-6",
                className,
            )}
        >
            <div className="h-px flex-1 bg-gradient-to-r from-10% from-white/0 to-white/40 sm:h-[2px]" />
            <Component className="font-bold text-[11px] text-white/80 uppercase tracking-widest sm:text-sm">
                {title}
            </Component>
            <div className="h-px flex-1 bg-gradient-to-l from-10% from-white/0 to-white/40 sm:h-[2px]" />
        </div>
    );
}
