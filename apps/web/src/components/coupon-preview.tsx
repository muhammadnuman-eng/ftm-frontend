import { Sparkles, Tag } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface CouponPreviewProps {
    code: string;
    discountText: string;
    description?: string;
    expiresAt?: string | null;
    isNewCoupon?: boolean;
    className?: string;
}

export function CouponPreview({
    code,
    discountText,
    description,
    expiresAt,
    isNewCoupon = false,
    className = "",
}: CouponPreviewProps) {
    const formatExpiryDate = (dateString: string | null) => {
        if (!dateString) return "Never expires";

        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return "Expired";
        if (diffDays === 1) return "Expires tomorrow";
        if (diffDays <= 7) return `Expires in ${diffDays} days`;
        return `Expires ${date.toLocaleDateString()}`;
    };

    return (
        <Card
            className={`border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ${className}`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                <Tag className="h-4 w-4 text-green-600" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-bold font-mono text-green-900 text-lg">
                                    {code}
                                </span>
                                {isNewCoupon && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-red-100 text-red-800"
                                    >
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        NEW
                                    </Badge>
                                )}
                            </div>
                            <p className="font-semibold text-green-700">
                                {discountText}
                            </p>
                            {description && (
                                <p className="mt-1 text-green-600 text-sm">
                                    {description}
                                </p>
                            )}
                            <p className="mt-2 text-green-500 text-xs">
                                {formatExpiryDate(expiresAt || null)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Compact version for inline display
 */
export function CouponPreviewCompact({
    code,
    discountText,
    className = "",
}: {
    code: string;
    discountText: string;
    className?: string;
}) {
    return (
        <div
            className={`inline-flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 ${className}`}
        >
            <Tag className="h-4 w-4 text-green-600" />
            <span className="font-bold font-mono text-green-900 text-sm">
                {code}
            </span>
            <span className="text-green-700 text-sm">{discountText}</span>
        </div>
    );
}

/**
 * Banner version for prominent display
 */
export function CouponBanner({
    code,
    discountText,
    description,
    ctaText = "Use Code",
    className = "",
}: {
    code: string;
    discountText: string;
    description?: string;
    ctaText?: string;
    className?: string;
}) {
    return (
        <div
            className={`overflow-hidden rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white ${className}`}
        >
            <div className="flex flex-col items-center space-y-4 text-center md:flex-row md:space-x-6 md:space-y-0 md:text-left">
                <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                        <Tag className="h-6 w-6" />
                    </div>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-xl">
                        Save with code <span className="font-mono">{code}</span>
                    </h3>
                    <p className="font-semibold text-lg opacity-90">
                        {discountText}
                    </p>
                    {description && (
                        <p className="mt-1 opacity-80">{description}</p>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(code)}
                        className="rounded-lg bg-white px-4 py-2 font-semibold text-green-600 transition-colors hover:bg-white/90"
                    >
                        {ctaText}
                    </button>
                </div>
            </div>
        </div>
    );
}
