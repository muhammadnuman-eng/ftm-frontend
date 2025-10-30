export const runtime = "nodejs";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { postAxceraWooWebhook } from "@/lib/axcera";
import { getPayloadClient } from "@/lib/payload";

export async function POST(request: NextRequest) {
    try {
        const { purchaseId } = await request.json();

        if (!purchaseId) {
            return NextResponse.json(
                { error: "Purchase ID is required" },
                { status: 400 },
            );
        }

        const payload = await getPayloadClient();

        // Fetch the purchase
        const purchase = await payload.findByID({
            collection: "purchases",
            id: purchaseId,
            depth: 2,
        });

        if (!purchase) {
            return NextResponse.json(
                { error: "Purchase not found" },
                { status: 404 },
            );
        }

        // Check if purchase is pending
        if (purchase.status !== "pending") {
            return NextResponse.json(
                {
                    error: `Purchase is not pending (current status: ${purchase.status})`,
                },
                { status: 400 },
            );
        }

        console.log("[Complete Purchase API] Processing purchase:", purchaseId);

        // Extract purchase data for Axcera webhook
        const total = String(
            (purchase as unknown as { purchasePrice?: number }).purchasePrice ||
                0,
        );
        const purchaseType = (
            purchase as unknown as {
                purchaseType?:
                    | "original-order"
                    | "reset-order"
                    | "activation-order";
            }
        ).purchaseType;
        const existingMeta =
            (purchase.metadata as Record<string, unknown> | null | undefined) ||
            {};
        const accountId = existingMeta.account_id as string | undefined;
        const currency = purchase.currency || "USD";

        // Resolve product/variation via mappings
        let productIdNum = 0;
        let variationIdNum = 0;

        try {
            // Handle both populated relationship and ID
            const rawProgram = purchase.program;
            const programId =
                typeof rawProgram === "string"
                    ? rawProgram
                    : typeof rawProgram === "number"
                      ? String(rawProgram)
                      : typeof rawProgram === "object" && rawProgram !== null
                        ? String(
                              (
                                  rawProgram as {
                                      id?: string | number;
                                  }
                              ).id || "",
                          )
                        : "";
            const platformSlug =
                (
                    purchase as unknown as {
                        platformSlug?: string;
                    }
                ).platformSlug || "";
            let tierId = (existingMeta.tierId as string) || "";

            const accountSize =
                (
                    purchase as unknown as {
                        accountSize?: string;
                    }
                ).accountSize || "";

            if (!programId) {
                console.error(
                    "[Complete Purchase API] Missing programId - cannot resolve mapping",
                    {
                        purchaseId: purchase.id,
                        program: purchase.program,
                        programType: typeof purchase.program,
                    },
                );
            }

            if (programId && platformSlug) {
                // If tierId is missing, try to derive it from the program's pricing tiers
                if (!tierId && programId && accountSize) {
                    try {
                        const program = await payload.findByID({
                            collection: "programs",
                            id: Number(programId),
                        });
                        const tiers = (
                            program as {
                                pricingTiers?: Array<{
                                    id?: string;
                                    accountSize?: string;
                                }>;
                            }
                        )?.pricingTiers;
                        if (Array.isArray(tiers)) {
                            const normalizeSize = (size: string) =>
                                size.replace(/[\s$,]/g, "").toUpperCase();
                            const targetSize = normalizeSize(accountSize);
                            const matchingTier = tiers.find(
                                (t) =>
                                    normalizeSize(
                                        String(t.accountSize || ""),
                                    ) === targetSize,
                            );
                            if (matchingTier?.id) {
                                tierId = matchingTier.id;
                                console.log(
                                    "[Complete Purchase API] Derived tierId from program tiers:",
                                    tierId,
                                );
                            }
                        }
                    } catch (err) {
                        console.warn(
                            "[Complete Purchase API] Failed to derive tierId:",
                            err,
                        );
                    }
                }

                // First try: use tierId from metadata if available
                if (tierId) {
                    console.log(
                        "[Complete Purchase API] Looking up mapping with:",
                        {
                            programId: String(programId),
                            tierId,
                            platformId: platformSlug,
                            purchaseType,
                        },
                    );

                    // Fetch full mapping from global to access reset/activation product IDs
                    const mappingsGlobal = await payload.findGlobal({
                        slug: "program-product-mappings",
                    });
                    const mappings = mappingsGlobal?.mappings || [];

                    const fullMapping = mappings.find(
                        (m: {
                            program?: number | { id?: number };
                            tierId?: string;
                            platformId?: string;
                            productId?: string | null;
                            variationId?: string | null;
                            reset_fee_product_id?: string | null;
                            activation_product_id?: string | null;
                        }) => {
                            const mappingProgramId =
                                typeof m.program === "number"
                                    ? m.program
                                    : typeof m.program === "object" &&
                                        m.program !== null
                                      ? m.program.id
                                      : null;
                            return (
                                String(mappingProgramId) ===
                                    String(programId) &&
                                m.tierId === tierId &&
                                m.platformId === platformSlug
                            );
                        },
                    );

                    console.log(
                        "[Complete Purchase API] Full mapping result:",
                        fullMapping,
                    );

                    if (fullMapping) {
                        // Use appropriate product ID based on order type
                        if (purchaseType === "reset-order") {
                            // Check reset_product_type from metadata
                            const resetProductType =
                                existingMeta.reset_product_type as
                                    | "evaluation"
                                    | "funded"
                                    | undefined;

                            if (
                                resetProductType === "funded" &&
                                fullMapping.reset_fee_funded_product_id
                            ) {
                                productIdNum = Number(
                                    fullMapping.reset_fee_funded_product_id,
                                );
                                // Use reset_fee_funded_variation_id if available, otherwise fall back to variationId
                                variationIdNum = Number(
                                    (fullMapping as any)
                                        .reset_fee_funded_variation_id ||
                                        fullMapping.variationId,
                                );
                                console.log(
                                    "[Complete Purchase API] Using reset fee funded product ID:",
                                    productIdNum,
                                    "variation ID:",
                                    variationIdNum,
                                );
                            } else if (fullMapping.reset_fee_product_id) {
                                // Default to evaluation (backwards compatibility)
                                productIdNum = Number(
                                    fullMapping.reset_fee_product_id,
                                );
                                variationIdNum = Number(
                                    fullMapping.variationId,
                                );
                                console.log(
                                    "[Complete Purchase API] Using reset fee product ID:",
                                    productIdNum,
                                    "variation ID:",
                                    variationIdNum,
                                );
                            }
                        } else if (
                            purchaseType === "activation-order" &&
                            fullMapping.activation_product_id
                        ) {
                            productIdNum = Number(
                                fullMapping.activation_product_id,
                            );
                            variationIdNum = Number(fullMapping.variationId);
                            console.log(
                                "[Complete Purchase API] Using activation product ID:",
                                productIdNum,
                                "variation ID:",
                                variationIdNum,
                            );
                        } else if (
                            fullMapping.productId &&
                            fullMapping.variationId
                        ) {
                            // Original order or fallback
                            productIdNum = Number(fullMapping.productId);
                            variationIdNum = Number(fullMapping.variationId);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(
                "[Complete Purchase API] Failed to resolve product/variation mapping:",
                e,
            );
        }

        // Resolve billing info from purchase
        const billingAddress =
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

        // Extract customer name from purchase
        const customerEmail =
            (purchase as unknown as { customerEmail?: string }).customerEmail ||
            "";
        const customerName =
            (purchase as unknown as { customerName?: string }).customerName ||
            "";
        const nameParts = customerName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const countryUpper = (billingAddress.country || "")
            .toString()
            .toUpperCase();

        // Resolve add-on keys -> fee_lines
        const selectedAddOns =
            (
                purchase as unknown as {
                    selectedAddOns?: Array<{ addOn?: number | string }>;
                }
            ).selectedAddOns || [];
        const addOnKeys: string[] = [];
        try {
            for (const item of selectedAddOns) {
                const addOnId =
                    typeof item.addOn === "object"
                        ? (item.addOn as { id?: number | string })?.id
                        : item.addOn;
                if (!addOnId) continue;
                try {
                    const addOnDoc = await payload.findByID({
                        collection: "add-ons",
                        id: String(addOnId),
                    });
                    const key = (addOnDoc as { key?: string }).key;
                    if (typeof key === "string" && key) {
                        addOnKeys.push(key);
                    }
                } catch {
                    // ignore missing add-on
                }
            }
        } catch {
            console.error(
                "[Complete Purchase API] Failed to collect add-on keys",
            );
        }

        const orderNumber =
            (purchase as unknown as { orderNumber?: string }).orderNumber ||
            String(purchase.id);

        // Build metadata array for reset/activation orders
        const orderMetadata: Array<{
            key: string;
            value: string | number;
        }> = [];
        if (
            (purchaseType === "reset-order" ||
                purchaseType === "activation-order") &&
            accountId
        ) {
            orderMetadata.push({
                key: "account_id",
                value: accountId,
            });
        }

        // Send to Axcera
        try {
            await postAxceraWooWebhook({
                id: Number(orderNumber),
                status: "completed",
                currency: currency || "USD",
                date_created: new Date().toISOString(),
                total,
                ...(accountId ? { account_id: accountId } : {}),
                billing: {
                    first_name: firstName,
                    last_name: lastName,
                    company: "",
                    address_1: (billingAddress.address as string) || "",
                    address_2: "",
                    city: (billingAddress.city as string) || "",
                    state: (billingAddress.state as string) || "",
                    postcode: (billingAddress.postalCode as string) || "",
                    country: countryUpper,
                    email: customerEmail,
                    phone: "",
                },
                line_items: [
                    {
                        name: purchase.programName || "Program",
                        product_id: variationIdNum,
                        variation_id: productIdNum,
                        total,
                    },
                ],
                fee_lines: addOnKeys.length
                    ? [
                          {
                              meta_data: [
                                  {
                                      id: 4182315,
                                      key: "_wc_checkout_add_on_value",
                                      value: addOnKeys,
                                  },
                              ],
                          },
                      ]
                    : [],
                meta_data: orderMetadata,
            });

            console.log(
                "[Complete Purchase API] Axcera webhook sent successfully",
            );
        } catch (axceraError) {
            console.error(
                "[Complete Purchase API] Axcera webhook failed:",
                axceraError,
            );
            return NextResponse.json(
                {
                    error: `Axcera webhook failed: ${axceraError instanceof Error ? axceraError.message : "Unknown error"}`,
                },
                { status: 500 },
            );
        }

        // Update purchase status to completed
        try {
            await payload.update({
                collection: "purchases",
                id: purchaseId,
                data: {
                    status: "completed",
                },
            });

            console.log(
                "[Complete Purchase API] Purchase status updated to completed",
            );
        } catch (updateError) {
            console.error(
                "[Complete Purchase API] Failed to update purchase status:",
                updateError,
            );
            return NextResponse.json(
                {
                    error: `Failed to update purchase status: ${updateError instanceof Error ? updateError.message : "Unknown error"}`,
                },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "Purchase completed and Axcera notified successfully",
        });
    } catch (error) {
        console.error("[Complete Purchase API] Error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            },
            { status: 500 },
        );
    }
}
