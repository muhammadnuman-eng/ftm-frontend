import { Decimal } from "decimal.js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { calculateDiscount } from "@/lib/coupons/calculation";
import { getPayloadClient } from "@/lib/payload";

interface UpdatePurchaseRequest {
    purchaseId: string;
    selectedAddOns: Array<{
        addOnId: string;
        priceIncreasePercentage: number;
        metadata?: Record<string, unknown>;
    }>;
    couponCode?: string | null;
    // NOTE: totalPrice, addOnValue, and purchasePrice are calculated server-side
    // These fields should NOT be sent from the client to prevent price manipulation
}

export async function POST(request: NextRequest) {
    try {
        const body: UpdatePurchaseRequest = await request.json();
        const { purchaseId, selectedAddOns, couponCode } = body;

        // Validate required fields
        if (!purchaseId) {
            return NextResponse.json(
                { error: "Purchase ID is required" },
                { status: 400 },
            );
        }

        const payload = await getPayloadClient();

        // Get the existing purchase with full program details
        const existingPurchase = await payload.findByID({
            collection: "purchases",
            id: purchaseId,
            depth: 2, // Need program details with pricing tiers
        });

        if (!existingPurchase) {
            return NextResponse.json(
                { error: "Purchase not found" },
                { status: 404 },
            );
        }

        // Only allow updating pending purchases
        if (existingPurchase.status !== "pending") {
            return NextResponse.json(
                { error: "Can only update pending purchases" },
                { status: 400 },
            );
        }

        // Get program and tier information
        const programId =
            typeof existingPurchase.program === "object" &&
            existingPurchase.program !== null
                ? (existingPurchase.program as { id?: number }).id
                : existingPurchase.program;
        const accountSize = (
            existingPurchase as unknown as { accountSize?: string }
        ).accountSize;

        if (!programId || !accountSize) {
            return NextResponse.json(
                {
                    error: "Purchase is missing program or account size information",
                },
                { status: 400 },
            );
        }

        // Fetch program with pricing tiers
        const program = await payload.findByID({
            collection: "programs",
            id: Number(programId),
        });

        const pricingTiers = (
            program as {
                pricingTiers?: Array<{
                    id?: string;
                    accountSize?: string;
                    price?: number;
                    resetFee?: number | null;
                    resetFeeFunded?: number | null;
                }>;
                activationFeeValue?: number | null;
            }
        )?.pricingTiers;

        // Find the matching tier
        const normalizeSize = (size: string) =>
            size.replace(/[\s$,]/g, "").toUpperCase();
        const targetSize = normalizeSize(accountSize);
        const matchingTier = pricingTiers?.find(
            (t) => normalizeSize(String(t.accountSize || "")) === targetSize,
        );

        if (!matchingTier) {
            return NextResponse.json(
                { error: "Could not find pricing tier for this purchase" },
                { status: 400 },
            );
        }

        // Get purchase type and reset product type from existing purchase
        const purchaseType = (
            existingPurchase as unknown as {
                purchaseType?:
                    | "original-order"
                    | "reset-order"
                    | "activation-order";
            }
        ).purchaseType;
        const existingMetadata =
            (existingPurchase.metadata as Record<string, unknown>) || {};
        const resetProductType = existingMetadata.reset_product_type as
            | "evaluation"
            | "funded"
            | undefined;

        // Determine base tier price based on purchase type
        let tierPrice: number;

        if (purchaseType === "reset-order") {
            // For reset orders, use resetFee or resetFeeFunded based on reset_product_type
            if (resetProductType === "funded" && matchingTier.resetFeeFunded) {
                tierPrice = matchingTier.resetFeeFunded;
            } else if (matchingTier.resetFee) {
                tierPrice = matchingTier.resetFee;
            } else {
                return NextResponse.json(
                    {
                        error: "Could not find reset fee for this purchase",
                    },
                    { status: 400 },
                );
            }
            console.log(
                `[Update Purchase] Reset order (${resetProductType || "evaluation"}): Using ${resetProductType === "funded" ? "resetFeeFunded" : "resetFee"} = ${tierPrice}`,
            );
        } else if (purchaseType === "activation-order") {
            // For activation orders, use activationFeeValue from program
            const activationFee = (
                program as { activationFeeValue?: number | null }
            ).activationFeeValue;
            if (!activationFee) {
                return NextResponse.json(
                    {
                        error: "Could not find activation fee for this purchase",
                    },
                    { status: 400 },
                );
            }
            tierPrice = activationFee;
            console.log(
                `[Update Purchase] Activation order: Using activationFeeValue = ${tierPrice}`,
            );
        } else {
            // For regular orders, use regular price
            if (!matchingTier.price) {
                return NextResponse.json(
                    { error: "Could not find pricing tier for this purchase" },
                    { status: 400 },
                );
            }
            tierPrice = matchingTier.price;
            console.log(
                `[Update Purchase] Original order: Using price = ${tierPrice}`,
            );
        }

        // Calculate add-on value from selected add-ons
        let calculatedAddOnValue = 0;
        if (selectedAddOns && selectedAddOns.length > 0) {
            for (const addOn of selectedAddOns) {
                const addOnIncrease = new Decimal(tierPrice)
                    .mul(addOn.priceIncreasePercentage)
                    .div(100)
                    .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                    .toNumber();
                calculatedAddOnValue += addOnIncrease;
            }
        }

        // Calculate price with coupon discount
        // NOTE: Coupons are only applicable to original orders, not reset/activation orders
        let finalPurchasePrice = tierPrice;
        let appliedDiscount = 0;
        let originalPrice = tierPrice;

        if (
            couponCode?.trim() &&
            purchaseType !== "reset-order" &&
            purchaseType !== "activation-order"
        ) {
            // Fetch coupon
            const couponRes = await payload.find({
                collection: "coupons",
                where: { code: { equals: couponCode.toUpperCase() } },
                limit: 1,
            });

            if (couponRes.docs.length > 0) {
                const coupon = couponRes.docs[0];

                // Validate coupon is active
                if (coupon.status === "active") {
                    const now = new Date();
                    const validFrom = new Date(coupon.validFrom);
                    const validTo = coupon.validTo
                        ? new Date(coupon.validTo)
                        : null;

                    // Check validity period
                    if (now >= validFrom && (!validTo || now <= validTo)) {
                        // Apply discount
                        const discountCalc = calculateDiscount({
                            originalPrice: tierPrice,
                            discountType: (coupon as { discountType?: string })
                                .discountType as "percentage" | "fixed",
                            discountValue:
                                (coupon as { discountValue?: number })
                                    .discountValue ?? 0,
                        });

                        finalPurchasePrice = discountCalc.finalPrice;
                        appliedDiscount = discountCalc.discountAmount;
                        originalPrice = discountCalc.originalPrice;
                    }
                }
            }
        }

        // Calculate total price = purchase price + add-ons
        // NOTE: Add-ons are not applicable to reset/activation orders
        const calculatedTotalPrice =
            purchaseType === "reset-order" ||
            purchaseType === "activation-order"
                ? finalPurchasePrice
                : new Decimal(finalPurchasePrice)
                      .add(calculatedAddOnValue)
                      .toDecimalPlaces(0, Decimal.ROUND_CEIL)
                      .toNumber();

        console.log("[Update Purchase] Server-side calculated prices:", {
            purchaseId,
            purchaseType,
            resetProductType,
            tierPrice,
            couponCode: couponCode?.trim() || null,
            appliedDiscount,
            finalPurchasePrice,
            calculatedAddOnValue,
            calculatedTotalPrice,
            originalPrice,
        });

        // Update the purchase with new add-on and coupon information
        const updatedPurchase = await payload.update({
            collection: "purchases",
            id: purchaseId,
            data: {
                hasAddOn: selectedAddOns.length > 0,
                addOnValue: calculatedAddOnValue,
                selectedAddOns: selectedAddOns.map((item) => ({
                    addOn: Number(item.addOnId),
                    priceIncreasePercentage: item.priceIncreasePercentage,
                    ...(item.metadata ? { metadata: item.metadata } : {}),
                })),
                // CRITICAL: All prices calculated server-side to prevent manipulation
                purchasePrice: finalPurchasePrice,
                totalPrice: calculatedTotalPrice,
                // Only update discountCode if explicitly provided (including null to remove it)
                ...(couponCode !== undefined
                    ? {
                          discountCode: couponCode?.trim() || undefined,
                      }
                    : {}),
                metadata: {
                    ...existingMetadata,
                    lastUpdated: new Date().toISOString(),
                    addOnsModified: true,
                    // CRITICAL: Update metadata prices to match root-level prices
                    totalPrice: calculatedTotalPrice,
                    addOnValue: calculatedAddOnValue,
                    originalPrice,
                    appliedDiscount,
                    ...(couponCode !== undefined
                        ? {
                              couponCode: couponCode?.trim() || undefined,
                          }
                        : {}),
                },
                // biome-ignore lint/suspicious/noExplicitAny: Payload CMS type workaround
            } as any,
        });

        return NextResponse.json({
            success: true,
            purchase: {
                id: updatedPurchase.id,
                status: updatedPurchase.status,
                totalPrice: updatedPurchase.totalPrice,
                purchasePrice: updatedPurchase.purchasePrice,
                addOnValue: updatedPurchase.addOnValue,
                hasAddOn: updatedPurchase.hasAddOn,
            },
        });
    } catch (error) {
        console.error("Error updating purchase:", error);
        return NextResponse.json(
            {
                error: "Failed to update purchase",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
