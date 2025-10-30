import { useId } from "react";

export const GridBackground = () => {
    const patternId = useId();

    return (
        <>
            <svg
                aria-hidden="true"
                className="-z-10 mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] absolute inset-0 size-full stroke-white/10"
            >
                <defs>
                    <pattern
                        x="50%"
                        y={-1}
                        id={patternId}
                        width={200}
                        height={200}
                        patternUnits="userSpaceOnUse"
                    >
                        <path d="M.5 200V.5H200" fill="none" />
                    </pattern>
                </defs>

                <rect
                    fill={`url(#${patternId})`}
                    width="100%"
                    height="100%"
                    strokeWidth={0}
                />
            </svg>
            <div
                aria-hidden="true"
                className="-z-10 absolute top-10 left-[calc(50%-4rem)] transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:top-[calc(50%-30rem)] lg:left-48 xl:left-[calc(50%-24rem)]"
            >
                <div
                    style={{
                        clipPath:
                            "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
                    }}
                    className="aspect-1108/632 w-277 bg-linear-to-r from-yellow-500 via-indigo-300 to-sky-400 opacity-20"
                />
            </div>
        </>
    );
};
