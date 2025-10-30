import { Decimal } from "decimal.js";
import { PaymentMethods } from "@/components/checkout/payment-methods";
import { getCommerceConfig, getPayloadClient } from "@/lib/payload";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ locale: string; orderId: string }>;

async function getPurchase(orderNumber: string) {
    const payload = await getPayloadClient();
    try {
        const res = await payload.find({
            collection: "purchases",
            where: { orderNumber: { equals: orderNumber } },
            limit: 1,
        });
        return res.docs?.[0] || null;
    } catch {
        return null;
    }
}

type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PayOrderPage({
    params,
    searchParams,
}: {
    params: PageParams;
    searchParams: PageSearchParams;
}) {
    const { orderId } = await params;
    const sp = await searchParams;
    const payload = await getPayloadClient();
    const [purchase, commerceConfig] = await Promise.all([
        getPurchase(orderId),
        getCommerceConfig(),
    ]);

    if (!purchase) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16">
                <h1 className="font-semibold text-white/90 text-xl">
                    Order not found
                </h1>
                <p className="mt-2 text-white/60">
                    Please check the link or contact support.
                </p>
            </div>
        );
    }

    // Extract minimal program/platform/tier info from purchase/metadata
    const meta = (purchase.metadata as Record<string, unknown> | null) || {};
    const rawProgram = (
        purchase as unknown as { program?: number | { id?: number } }
    ).program;
    const programId =
        typeof rawProgram === "number" ? rawProgram : rawProgram?.id || 0;
    const platformId =
        (purchase as unknown as { platformSlug?: string }).platformSlug ||
        (meta.platformId as string) ||
        "";
    let accountSize =
        (purchase as unknown as { accountSize?: string }).accountSize || "";

    // Derive accountSize from tierId if missing
    if (!accountSize && typeof meta.tierId === "string") {
        const tierId = meta.tierId as string;
        const parts = tierId.split("-");
        if (parts.length >= 3) {
            const digits = parts.slice(2).join("");
            // Convert like "10-000" -> 10000 then compare numerically
            const numeric = Number(digits.replace(/[^0-9]/g, ""));
            if (Number.isFinite(numeric) && numeric > 0) {
                // We'll match to program tiers by numeric value below
                accountSize = `$${numeric.toLocaleString()}`;
            }
        }
    }

    // Fetch program minimal fields for checkout display
    let programName = "Program";
    let programCategory: "1-step" | "2-step" | "instant" | "reset" = "1-step";
    let price =
        (purchase as unknown as { totalPrice?: number }).totalPrice || 0;
    let originalPrice =
        (purchase as unknown as { purchasePrice?: number }).purchasePrice ||
        price;

    if (programId) {
        try {
            const program = await payload.findByID({
                collection: "programs",
                id: programId,
                select: {
                    id: true,
                    name: true,
                    category: true,
                    pricingTiers: { accountSize: true, price: true },
                },
            });
            programName =
                (program as unknown as { name?: string }).name || programName;
            const cat = (program as unknown as { category?: string }).category;
            if (
                cat === "1-step" ||
                cat === "2-step" ||
                cat === "instant" ||
                cat === "reset"
            ) {
                programCategory = cat;
            }

            // If price is 0, try to resolve from pricingTiers by matching account size numerically
            if (
                (!price || price <= 0) &&
                Array.isArray(
                    (
                        program as unknown as {
                            pricingTiers?: Array<{
                                accountSize?: string;
                                price?: number;
                                resetFee?: number | null;
                                resetFeeFunded?: number | null;
                            }>;
                        }
                    ).pricingTiers,
                )
            ) {
                const tiers =
                    (
                        program as unknown as {
                            pricingTiers?: Array<{
                                accountSize?: string;
                                price?: number;
                                resetFee?: number | null;
                                resetFeeFunded?: number | null;
                            }>;
                        }
                    ).pricingTiers || [];
                const normalize = (size?: string) => {
                    if (!size) return 0;
                    const s = size.toUpperCase().replace(/[^0-9K]/g, "");
                    if (s.endsWith("K")) {
                        return Number.parseInt(s.slice(0, -1), 10) * 1000;
                    }
                    return Number.parseInt(s, 10) || 0;
                };
                const target = normalize(accountSize);
                const match =
                    tiers.find((t) => normalize(t.accountSize) === target) ||
                    tiers[0];

                // Determine price based on purchase type
                const purchaseType = (
                    purchase as unknown as {
                        purchaseType?:
                            | "original-order"
                            | "reset-order"
                            | "activation-order";
                    }
                ).purchaseType;
                const resetProductType = meta.reset_product_type as
                    | "evaluation"
                    | "funded"
                    | undefined;

                if (purchaseType === "reset-order") {
                    // Use appropriate reset fee based on reset_product_type
                    const resetFeePrice =
                        resetProductType === "funded" && match?.resetFeeFunded
                            ? match.resetFeeFunded
                            : match?.resetFee || 0;

                    if (resetFeePrice) {
                        price = resetFeePrice;
                        originalPrice = resetFeePrice;
                    }
                } else if (purchaseType === "activation-order") {
                    const activationFee = (
                        program as unknown as {
                            activationFeeValue?: number | null;
                        }
                    ).activationFeeValue;
                    if (activationFee) {
                        price = activationFee;
                        originalPrice = activationFee;
                    }
                } else {
                    // Regular order
                    if (match?.price) {
                        price = match.price;
                        originalPrice = match.price;
                    }
                }

                // Ensure accountSize string is populated for UI
                if (!accountSize && match?.accountSize)
                    accountSize = match.accountSize;
            }
        } catch {
            // ignore
        }
    }

    // Build summary details
    const orderNumber =
        (purchase as unknown as { orderNumber?: string }).orderNumber || "";
    const platformName =
        (purchase as unknown as { platformName?: string }).platformName ||
        platformId;
    const addOnValue = new Decimal(price)
        .minus(originalPrice)
        .toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .toNumber();

    // Customer data from metadata/billing (not displayed, used for gateways)
    const md = meta as {
        customerDetails?: {
            firstName?: string;
            lastName?: string;
            email?: string;
            phone?: string;
            address?: {
                line1?: string;
                city?: string;
                state?: string;
                postalCode?: string;
                country?: string;
            };
        };
    };
    const emailFromQuery = (() => {
        const raw = sp?.email;
        if (typeof raw === "string") return raw;
        if (Array.isArray(raw)) return raw[0];
        return undefined;
    })();
    const purchaseName = (purchase as unknown as { customerName?: string })
        .customerName;
    const nameParts = (purchaseName || "").trim().split(/\s+/);
    const nameFirst = nameParts[0] || "";
    const nameLast = nameParts.slice(1).join(" ") || "";
    const billing =
        (
            purchase as unknown as {
                billingAddress?: {
                    address?: string;
                    city?: string;
                    state?: string;
                    postalCode?: string;
                    country?: string;
                };
            }
        ).billingAddress || {};
    const customerData = {
        firstName:
            md.customerDetails?.firstName ||
            (meta.customerFirstName as string) ||
            nameFirst ||
            "",
        lastName:
            md.customerDetails?.lastName ||
            (meta.customerLastName as string) ||
            nameLast ||
            "",
        email:
            (md.customerDetails?.email as string) ||
            (meta.customerEmail as string) ||
            (purchase as unknown as { customerEmail?: string }).customerEmail ||
            emailFromQuery ||
            "",
        phone:
            md.customerDetails?.phone || (meta.customerPhone as string) || "",
        address: md.customerDetails?.address?.line1 || billing.address || "",
        city: md.customerDetails?.address?.city || billing.city || "",
        state: md.customerDetails?.address?.state || billing.state || "",
        postalCode:
            md.customerDetails?.address?.postalCode || billing.postalCode || "",
        country: (md.customerDetails?.address?.country || billing.country || "")
            .toString()
            .toUpperCase(),
    };

    // Selected add-ons from purchase
    const selectedAddOns = (
        (
            purchase as unknown as {
                selectedAddOns?: Array<{
                    addOn?: number | string;
                    priceIncreasePercentage?: number;
                    metadata?: Record<string, unknown>;
                }>;
            }
        ).selectedAddOns || []
    )
        .map((item) => {
            const id =
                typeof item.addOn === "object"
                    ? (item.addOn as { id?: number | string })?.id
                    : item.addOn;
            return id
                ? {
                      addOnId: String(id),
                      priceIncreasePercentage: item.priceIncreasePercentage,
                      ...(item.metadata ? { metadata: item.metadata } : {}),
                  }
                : null;
        })
        .filter(Boolean) as Array<{
        addOnId: string;
        priceIncreasePercentage?: number;
        metadata?: Record<string, unknown>;
    }>;

    const purchaseType = (
        purchase as unknown as {
            purchaseType?:
                | "original-order"
                | "reset-order"
                | "activation-order";
        }
    ).purchaseType;

    // Extract reset_product_type from metadata for funded vs evaluation reset orders
    const resetProductType = meta.reset_product_type as
        | "evaluation"
        | "funded"
        | undefined;

    return (
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-16">
            <div>
                <h1 className="font-semibold text-white/90 text-xl">
                    Complete Your Payment
                </h1>
                <p className="mt-2 text-white/60">Order #{orderNumber}</p>
            </div>

            {/* Order Summary */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                    {/* Show order type for reset and activation orders */}
                    {(purchaseType === "reset-order" ||
                        purchaseType === "activation-order") && (
                        <>
                            <div className="text-white/60">Order Type</div>
                            <div className="text-white/90">
                                {purchaseType === "reset-order"
                                    ? `Reset Order ${resetProductType ? `(${resetProductType})` : ""}`
                                    : "Activation Order"}
                            </div>
                        </>
                    )}

                    {/* Only show Plan, Account Size, and Platform for original orders */}
                    {purchaseType !== "reset-order" &&
                        purchaseType !== "activation-order" && (
                            <>
                                <div className="text-white/60">Plan</div>
                                <div className="text-white/90">
                                    {programName}
                                </div>
                                <div className="text-white/60">
                                    Account Size
                                </div>
                                <div className="text-white/90">
                                    {accountSize || "-"}
                                </div>
                                <div className="text-white/60">Platform</div>
                                <div className="text-white/90">
                                    {platformName || "-"}
                                </div>
                            </>
                        )}

                    <div className="text-white/60">Total</div>
                    <div className="text-white/90">${price.toFixed(2)}</div>
                </div>
            </div>

            {/* Payment Methods (no customer info form) */}
            <PaymentMethods
                amount={price}
                purchasePrice={originalPrice}
                totalPrice={price}
                programId={String(programId)}
                accountSize={accountSize}
                programName={programName}
                programType={programCategory}
                programDetails={
                    (purchase as unknown as { programDetails?: string })
                        .programDetails
                }
                platformId={platformId}
                platformName={platformName}
                region={undefined}
                addOnValue={addOnValue}
                purchaseType={purchaseType}
                resetProductType={resetProductType}
                customerData={customerData}
                selectedAddOns={selectedAddOns as never}
                activeCoupon={null}
                existingPurchaseId={String(
                    (purchase as { id?: number | string }).id || "",
                )}
                commerceConfig={commerceConfig}
            />
        </div>
    );
}
