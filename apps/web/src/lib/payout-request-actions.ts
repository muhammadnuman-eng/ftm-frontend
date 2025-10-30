"use server";

import { requireAffiliateAuth } from "./affiliate-auth";
import { getPayloadClient } from "./payload";

export interface PayoutRequestData {
    amount: number;
    paymentMethod: "crypto_usdt_trc20" | "crypto_usdt_erc20" | "rise";
    paymentEmail?: string;
    walletAddress?: string;
    notes?: string;
}

/**
 * Create a new payout request
 */
export async function createPayoutRequest(
    data: PayoutRequestData,
): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
        const session = await requireAffiliateAuth();
        const payload = await getPayloadClient();

        // Validate amount
        if (data.amount <= 0) {
            return {
                success: false,
                error: "Amount must be greater than 0",
            };
        }

        // Validate payment details based on method
        const isCrypto =
            data.paymentMethod === "crypto_usdt_trc20" ||
            data.paymentMethod === "crypto_usdt_erc20";
        const isRise = data.paymentMethod === "rise";

        if (isCrypto && !data.walletAddress) {
            return {
                success: false,
                error: "Wallet address is required for crypto payments",
            };
        }

        if (isRise && !data.paymentEmail) {
            return {
                success: false,
                error: "Email address is required for Rise payments",
            };
        }

        // Create the payout request
        const result = await payload.create({
            collection: "payout-requests",
            data: {
                affiliateId: session.affiliateId,
                affiliateUsername: session.username,
                affiliateEmail: session.email,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                paymentEmail: data.paymentEmail || "",
                walletAddress: data.walletAddress || "",
                notes: data.notes || "",
                status: "pending",
            },
        });

        return {
            success: true,
            id: String(result.id),
        };
    } catch (error) {
        console.error("[Payout Request] Error creating request:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create payout request",
        };
    }
}

/**
 * Get payout requests for the current affiliate
 */
export async function getPayoutRequests(): Promise<
    Array<{
        id: string;
        amount: number;
        paymentMethod: string;
        paymentEmail: string;
        walletAddress: string;
        notes: string;
        status: string;
        createdAt: string;
    }>
> {
    try {
        const session = await requireAffiliateAuth();
        const payload = await getPayloadClient();

        const { docs } = await payload.find({
            collection: "payout-requests",
            where: {
                affiliateId: {
                    equals: session.affiliateId,
                },
            },
            sort: "-createdAt",
            limit: 100,
        });

        return docs.map((doc) => ({
            id: String(doc.id),
            amount: doc.amount,
            paymentMethod: doc.paymentMethod,
            paymentEmail: doc.paymentEmail || "",
            walletAddress: doc.walletAddress || "",
            notes: doc.notes || "",
            status: doc.status,
            createdAt: doc.createdAt,
        }));
    } catch (error) {
        console.error("[Payout Request] Error fetching requests:", error);
        return [];
    }
}
