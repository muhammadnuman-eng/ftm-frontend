"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export const GlowingDotsCSS = () => {
    const columns = 42;
    const rows = 6;
    const totalDots = columns * rows;

    // Generate deterministic, evenly-distributed pseudo-random pattern to avoid hydration mismatch
    const dotsPattern = useMemo(() => {
        const SEED = 1337;
        const glowCount = 33;

        function mulberry32(initial: number) {
            // Keep internal state in a local variable to avoid parameter mutation
            let a = initial >>> 0;
            return () => {
                a = (a + 0x6d2b79f5) >>> 0;
                let t = a;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        }

        function seededShuffle<T>(array: T[], seed: number) {
            const rand = mulberry32(seed);
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(rand() * (i + 1));
                const tmp = array[i];
                array[i] = array[j];
                array[j] = tmp;
            }
            return array;
        }

        // Row-balanced selection: distribute 33 glowing dots roughly evenly across rows
        const perRowBase = Math.floor(glowCount / rows);
        let remainder = glowCount - perRowBase * rows; // rows that get +1
        const rowsOrder = seededShuffle(
            Array.from({ length: rows }, (_, r) => r),
            SEED ^ 0x9e3779b1,
        );

        const glowSet = new Set<number>();
        for (let idx = 0; idx < rows; idx++) {
            const row = rowsOrder[idx];
            const picksInRow = perRowBase + (remainder > 0 ? 1 : 0);
            if (remainder > 0) remainder -= 1;

            if (picksInRow <= 0) continue;

            // Pick columns deterministically for this row
            const cols = seededShuffle(
                Array.from({ length: columns }, (_, c) => c),
                SEED ^ ((row + 1) * 0x85ebca6b),
            );
            for (let c = 0; c < picksInRow; c++) {
                const col = cols[c];
                const index = row * columns + col;
                glowSet.add(index);
            }
        }

        // Build pattern with deterministic per-dot timing
        return Array.from({ length: totalDots }).map((_, index) => {
            if (glowSet.has(index)) {
                const rand = mulberry32(SEED ^ ((index + 1) * 0x27d4eb2d));
                const delay = rand() * 10; // 0-10s
                const duration = 8 + rand() * 4; // 8-12s
                return { shouldGlow: true, delay, duration };
            }
            return { shouldGlow: false };
        });
    }, [totalDots]);

    return (
        <>
            <style jsx global>{`
                @keyframes glow-opacity {
                    0%, 100% { opacity: 0.15; }
                    50% { opacity: 1; }
                }

                .dot-glow { position: relative; }

                /* Core bright dot overlay (opacity only) */
                .dot-glow::before {
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 2px;
                    height: 2px;
                    border-radius: 9999px;
                    background-color: #7eb4e9;
                    transform: translate(-50%, -50%);
                    will-change: opacity;
                    animation: glow-opacity var(--duration) ease-in-out var(--delay) infinite;
                    pointer-events: none;
                }

                /* Multi-layer glow using box-shadows (opacity only) */
                .dot-glow::after {
                    content: "";
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 2px;
                    height: 2px;
                    border-radius: 9999px;
                    box-shadow: 0 0 4px #7eb4e9, 0 0 8px #7eb4e9, 0 0 12px #7eb4e9;
                    transform: translate(-50%, -50%);
                    will-change: opacity;
                    animation: glow-opacity var(--duration) ease-in-out var(--delay) infinite;
                    pointer-events: none;
                }

                @media (prefers-reduced-motion: reduce) {
                    .dot-glow::before, .dot-glow::after {
                        animation-duration: 0.001ms !important;
                        animation-iteration-count: 1 !important;
                    }
                }
            `}</style>
            <div
                className="relative grid min-h-[74px] w-full max-w-[514px] grid-cols-[repeat(42,1fr)] grid-rows-[repeat(6,1fr)] gap-px"
                style={{
                    clipPath:
                        "polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)",
                    contain: "paint",
                }}
            >
                {dotsPattern.map((dot, index) => (
                    <div
                        key={`dot-${Math.floor(index / columns)}-${index % columns}`}
                        className={cn(
                            "h-[2px] w-[2px] self-center justify-self-center rounded-full bg-[#0f4452]",
                            dot.shouldGlow ? "dot-glow" : undefined,
                        )}
                        style={
                            dot.shouldGlow
                                ? ({
                                      "--delay": `${dot.delay}s`,
                                      "--duration": `${dot.duration}s`,
                                  } as React.CSSProperties)
                                : undefined
                        }
                    />
                ))}
            </div>
        </>
    );
};
