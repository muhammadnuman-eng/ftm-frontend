import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
                secondary:
                    "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                outline: "text-foreground",
                popular:
                    "border-transparent bg-blue-600 text-white hover:bg-blue-700",
                featured:
                    "border-transparent bg-gradient-to-r from-orange-500 to-red-500 text-white",
                primary:
                    "border-transparent bg-blue-600 text-white hover:bg-blue-700",
                success:
                    "border-transparent bg-green-600 text-white hover:bg-green-700",
            },
            size: {
                default: "px-2.5 py-0.5 text-xs",
                sm: "px-2 py-0.5 text-[10px]",
                lg: "px-3 py-1 text-sm",
            },
            appearance: {
                default: "",
                light: "bg-opacity-10 hover:bg-opacity-20",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
            appearance: "default",
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, appearance, ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                badgeVariants({ variant, size, appearance }),
                className,
            )}
            {...props}
        />
    );
}

export { Badge, badgeVariants };
