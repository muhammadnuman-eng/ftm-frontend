import type React from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
    children: ReactNode;
    showRadialGradient?: boolean;
}

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}: AuroraBackgroundProps) => {
    return (
        <main>
            <div
                className={cn(
                    "relative isolate transform-gpu text-foreground transition-bg",
                    className,
                )}
                {...props}
            >
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                        maskImage:
                            "linear-gradient(to bottom, transparent, black 0, black calc(100% - 100%), transparent)",
                        WebkitMaskImage:
                            "linear-gradient(to bottom, transparent, black 0, black calc(100% - 100%), transparent)",
                    }}
                >
                    <div
                        className={cn(
                            "-inset-[10px] pointer-events-none absolute opacity-50 blur-[10px] filter will-change-transform",
                            "animate-[aurora_60s_linear_infinite]",
                            showRadialGradient &&
                                "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]",
                        )}
                        style={{
                            backgroundImage: `
                                repeating-linear-gradient(100deg, #0c0a09 0%, #0c0a09 7%, transparent 10%, transparent 12%, #0c0a09 16%),
                                repeating-linear-gradient(100deg, rgba(89,106,197,0.8) 10%, rgba(89,106,147,0.6) 15%, rgba(0,177,191,0.4) 20%, rgba(89,106,197,0.3) 25%, rgba(0,121,202,0.5) 30%)
                            `,
                            backgroundSize: "300%, 200%",
                            backgroundPosition: "50% 50%, 50% 50%",
                        }}
                    />
                    <div
                        className={cn(
                            "-inset-[10px] pointer-events-none absolute opacity-40 mix-blend-screen blur-[10px] filter will-change-transform",
                            "animate-[aurora_60s_linear_infinite]",
                        )}
                        style={{
                            backgroundImage: `
                                repeating-linear-gradient(100deg, #0c0a09 0%, #0c0a09 7%, transparent 10%, transparent 12%, #0c0a09 16%),
                                repeating-linear-gradient(100deg, rgba(89,106,197,0.8) 10%, rgba(89,106,147,0.6) 15%, rgba(0,177,191,0.4) 20%, rgba(89,106,197,0.3) 25%, rgba(0,121,202,0.5) 30%)
                            `,
                            backgroundSize: "200%, 100%",
                            backgroundPosition: "50% 50%, 50% 50%",
                            backgroundAttachment: "fixed",
                        }}
                    />
                </div>
                {children}
            </div>
        </main>
    );
};
