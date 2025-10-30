import { Suspense } from "react";
import {
    getActiveCouponsForDisplay,
    getFeaturedCoupon,
} from "../app/actions/get-active-coupons";
import { CouponBanner, CouponPreview } from "./coupon-preview";
import { Skeleton } from "./ui/skeleton";

/**
 * Server component to display active coupons
 */
async function ActiveCouponsContent() {
    const [couponsResult, featuredResult] = await Promise.all([
        getActiveCouponsForDisplay(3),
        getFeaturedCoupon(),
    ]);

    return (
        <div className="space-y-8">
            {/* Featured Coupon Banner */}
            {featuredResult.success && featuredResult.coupon && (
                <div className="mb-8">
                    <CouponBanner
                        code={featuredResult.coupon.code}
                        discountText={featuredResult.coupon.discountText}
                        description={featuredResult.coupon.description}
                        ctaText="Copy Code"
                    />
                </div>
            )}

            {/* Active Coupons Grid */}
            {couponsResult.success && couponsResult.coupons.length > 0 && (
                <div>
                    <div className="mb-6 text-center">
                        <h3 className="font-bold text-2xl text-white">
                            Active Discount Codes
                        </h3>
                        <p className="mt-2 text-white/70">
                            Save on your next program purchase
                        </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {couponsResult.coupons.map((coupon) => (
                            <CouponPreview
                                key={coupon.code}
                                code={coupon.code}
                                discountText={coupon.discountText}
                                description={coupon.description}
                                expiresAt={coupon.validTo}
                                isNewCoupon={coupon.isNewCoupon}
                            />
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-white/60">
                            Codes can be applied at checkout.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Loading skeleton for the coupons section
 */
function ActiveCouponsLoading() {
    return (
        <div className="space-y-8">
            {/* Featured coupon skeleton */}
            <Skeleton className="h-24 w-full rounded-lg" />

            {/* Coupons grid skeleton */}
            <div>
                <div className="mb-6 text-center">
                    <Skeleton className="mx-auto h-8 w-64" />
                    <Skeleton className="mx-auto mt-2 h-4 w-48" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map(
                        (id) => (
                            <Skeleton
                                key={id}
                                className="h-32 w-full rounded-lg"
                            />
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Main component with suspense wrapper
 */
export function ActiveCouponsSection({
    className = "",
}: {
    className?: string;
}) {
    return (
        <section className={`py-16 ${className}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <Suspense fallback={<ActiveCouponsLoading />}>
                    <ActiveCouponsContent />
                </Suspense>
            </div>
        </section>
    );
}
