import type * as React from "react";

import { cn } from "@/lib/utils";

const gradientPositions = {
    "top-left": "158.33% 101.7% at -4.55% -1.7%",
    "top-center": "158.33% 101.7% at 50% -1.7%",
    "top-right": "158.33% 101.7% at 104.55% -1.7%",
    "bottom-left": "158.33% 101.7% at -4.55% 101.7%",
    "bottom-center": "158.33% 101.7% at 50% 101.7%",
    "bottom-right": "158.33% 101.7% at 104.55% 101.7%",
    center: "100% 100% at 50% 50%",
} as const;

export type GradientPosition = keyof typeof gradientPositions;

function Card({
    className,
    wrapperClassName,
    children,
    grit = true,
    gradientPosition = "top-right",
    ...props
}: React.ComponentProps<"div"> & {
    wrapperClassName?: string;
    grit?: boolean;
    gradientPosition?: GradientPosition;
}) {
    return (
        <div
            data-slot="card"
            className={cn(
                "overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm",
                wrapperClassName,
            )}
            {...props}
        >
            <div
                className={cn("flex h-full flex-col gap-6", className)}
                style={{
                    backgroundImage: grit
                        ? `radial-gradient(${gradientPositions[gradientPosition]}, rgba(89,106,147,0.3) 0%, transparent 100%), url("/images/grit.png")`
                        : `radial-gradient(${gradientPositions[gradientPosition]}, rgba(89,106,147,0.3) 0%, transparent 100%)`,
                    ...(grit && {
                        backgroundSize: "auto, 50px 50px",
                        backgroundPosition: "center, center",
                        backgroundRepeat: "no-repeat, repeat",
                    }),
                }}
            >
                {children}
            </div>
        </div>
    );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-header"
            className={cn(
                "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
                className,
            )}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-title"
            className={cn("font-semibold leading-none", className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-description"
            className={cn("text-muted-foreground text-sm", className)}
            {...props}
        />
    );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-action"
            className={cn(
                "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
                className,
            )}
            {...props}
        />
    );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-content"
            className={cn("px-6", className)}
            {...props}
        />
    );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card-footer"
            className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
            {...props}
        />
    );
}

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardAction,
    CardDescription,
    CardContent,
};
