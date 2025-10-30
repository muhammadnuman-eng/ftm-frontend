export type ManualDiscountOverrides = {
    [programSlug: string]: {
        [accountSize: string]: {
            originalPrice: number;
            discountedPrice: number;
        };
    };
};

// No manual discount overrides - all pricing should come from Payload CMS and auto-apply coupons
export const manualDiscountOverrides: ManualDiscountOverrides = {};
