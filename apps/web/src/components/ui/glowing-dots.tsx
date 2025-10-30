/** biome-ignore-all lint/suspicious/noArrayIndexKey: no key :D */
"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DotData {
    glowing: boolean;
}

// Memoized dot component to prevent unnecessary re-renders
const Dot = memo(({ glowing }: { glowing: boolean }) => {
    return (
        <div
            className={cn(
                "h-[2px] w-[2px] self-center justify-self-center rounded-full",
                glowing
                    ? "animate-glow-pulse bg-[#7eb4e9] shadow-glow"
                    : "bg-[#0f4452]",
            )}
        />
    );
});
Dot.displayName = "Dot";

export const GlowingDots = () => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const dotsArrayRef = useRef<DotData[]>([]);
    const activeDotsRef = useRef<Set<number>>(new Set());
    const updateQueueRef = useRef<Set<number>>(new Set());
    const rafRef = useRef<number>(0);

    const targetGlowCount = 33;
    const columns = 42; // Back to original
    const rows = 6; // Back to original
    const totalDots = columns * rows;

    const [dots, setDots] = useState<DotData[]>([]);

    // Initialize dots
    useEffect(() => {
        const initialDots: DotData[] = Array.from(
            { length: totalDots },
            () => ({
                glowing: false,
            }),
        );

        dotsArrayRef.current = initialDots;
        setDots(initialDots);
    }, [totalDots]);

    // Batch updates using requestAnimationFrame
    const batchUpdate = useCallback(() => {
        if (updateQueueRef.current.size > 0) {
            const updatedIndices = Array.from(updateQueueRef.current);
            updateQueueRef.current.clear();

            setDots((currentDots) => {
                const newDots = [...currentDots];
                updatedIndices.forEach((index) => {
                    newDots[index] = { ...dotsArrayRef.current[index] };
                });
                return newDots;
            });
        }
        rafRef.current = 0;
    }, []);

    // Add glow to a random non-glowing dot
    const addGlow = useCallback(() => {
        const nonGlowingIndices: number[] = [];
        dotsArrayRef.current.forEach((dot, index) => {
            if (!dot.glowing) nonGlowingIndices.push(index);
        });

        if (nonGlowingIndices.length === 0) return;

        const randomIndex =
            nonGlowingIndices[
                Math.floor(Math.random() * nonGlowingIndices.length)
            ];
        dotsArrayRef.current[randomIndex].glowing = true;
        activeDotsRef.current.add(randomIndex);
        updateQueueRef.current.add(randomIndex);

        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(batchUpdate);
        }
    }, [batchUpdate]);

    // Remove glow from a random glowing dot
    const removeGlow = useCallback(() => {
        if (activeDotsRef.current.size === 0) return;

        const activeIndices = Array.from(activeDotsRef.current);
        const randomIndex =
            activeIndices[Math.floor(Math.random() * activeIndices.length)];

        dotsArrayRef.current[randomIndex].glowing = false;
        activeDotsRef.current.delete(randomIndex);
        updateQueueRef.current.add(randomIndex);

        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(batchUpdate);
        }
    }, [batchUpdate]);

    // Adjust glow density to maintain target count with variation
    const adjustGlowDensity = useCallback(() => {
        const currentCount = activeDotsRef.current.size;
        const variation = Math.min(
            targetGlowCount + Math.floor(Math.random() * 6) - 3,
            totalDots,
        );

        if (currentCount < variation) {
            addGlow();
        } else if (currentCount > variation) {
            removeGlow();
        }
    }, [addGlow, removeGlow, totalDots]);

    // Set up animation intervals with reduced frequency
    useEffect(() => {
        const intervalOne = setInterval(() => {
            adjustGlowDensity();
        }, 200); // Reduced frequency

        const intervalTwo = setInterval(() => {
            // Add or remove multiple dots for more dynamic effect
            const actions = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < actions; i++) {
                adjustGlowDensity();
            }
        }, 1000); // Reduced frequency

        // Initial glow to reach the target
        const initialTimeout = setTimeout(() => {
            for (let i = 0; i < targetGlowCount; i++) {
                addGlow();
            }
        }, 100);

        return () => {
            clearInterval(intervalOne);
            clearInterval(intervalTwo);
            clearTimeout(initialTimeout);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [addGlow, adjustGlowDensity]);

    return (
        <>
            <style jsx global>{`
                @keyframes glow-pulse {
                    0%, 100% {
                        opacity: 0.8;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }
                
                .animate-glow-pulse {
                    animation: glow-pulse 2s ease-in-out infinite;
                    will-change: opacity, transform;
                }
                
                .shadow-glow {
                    box-shadow: 0 0 4px #7eb4e9, 0 0 8px #7eb4e9, 0 0 12px #7eb4e9;
                }
            `}</style>
            <div
                ref={canvasRef}
                className="relative grid min-h-[74px] w-full max-w-[514px] grid-cols-[repeat(42,1fr)] grid-rows-[repeat(6,1fr)] gap-px"
                style={{
                    clipPath:
                        "polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)",
                }}
            >
                {dots.map((dot, index) => (
                    <Dot key={index} glowing={dot.glowing} />
                ))}
            </div>
        </>
    );
};
