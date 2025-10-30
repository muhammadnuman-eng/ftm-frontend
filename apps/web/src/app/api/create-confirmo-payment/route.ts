import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { formatAmountForConfirmo, getConfirmoGateway } from "@/lib/confirmo";

interface SelectedAddOnPayload {
    addOnId: string;
    priceIncreasePercentage?: number;
    flatPriceIncrease?: number;
    additionalDailyDrawdownPercentage?: number;
    profitSplitMode?: "override" | "additive" | "none";
    profitSplitOverride?: number;
    metadata?: Record<string, unknown>;
}

interface CreateConfirmoPaymentRequest {
    amount: number; // in cents
    currency: string;
    programId: string;
    programName?: string;
    accountSize: string;
    purchaseId: string;
    selectedAddOns?: SelectedAddOnPayload[];
    customerData?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
}

export async function POST(request: NextRequest) {
    try {
        const body: CreateConfirmoPaymentRequest = await request.json();
        const {
            amount,
            currency,
            programId,
            programName,
            accountSize,
            purchaseId,
            customerData,
        } = body;
        body;

        // Validate required fields
        if (!amount || !currency || !programId || !accountSize || !purchaseId) {
            return NextResponse.json(
                {
                    error: "Missing required fields: amount, currency, programId, accountSize, purchaseId",
                },
                { status: 400 },
            );
        }

        if (!customerData?.email) {
            return NextResponse.json(
                { error: "Customer email is required for Confirmo payments" },
                { status: 400 },
            );
        }

        const confirmoGateway = getConfirmoGateway();

        // Convert amount from cents to decimal for Confirmo
        const confirmoAmount = formatAmountForConfirmo(amount);

        // Store payment metadata in the reference field for webhook processing
        // Format: ftm-{purchaseId}-{programId}-{accountSize}-{email}-{firstName}-{lastName}-{timestamp}
        const enhancedReference = `ftm-${purchaseId}-${programId}-${accountSize}-${encodeURIComponent(customerData.email)}-${customerData.firstName}-${customerData.lastName}-${Date.now()}`;

        const upperCaseCurrency = currency.toUpperCase();

        const invoice = await confirmoGateway.createPayment({
            invoice: {
                amount: confirmoAmount.toFixed(2),
                currencyFrom: upperCaseCurrency,
            },
            settlement: {
                currency: upperCaseCurrency,
            },
            reference: enhancedReference,
            product: {
                name: programName || `FTM Program ${programId}`,
                description: `Account Size: ${accountSize}`,
            },
            customerEmail: customerData.email,
            notifyUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/api/webhooks/confirmo`,
            returnUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/en/checkout/order-received?orderId=${purchaseId}&gateway=confirmo`,
        });

        return NextResponse.json({
            payment: invoice,
        });
    } catch (error) {
        console.error("Error creating Confirmo payment:", error);
        return NextResponse.json(
            { error: "Failed to create Confirmo payment" },
            { status: 500 },
        );
    }
}
