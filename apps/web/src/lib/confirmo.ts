import CryptoJS from "crypto-js";

export interface ConfirmoCustomerData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
}

export interface ConfirmoPaymentRequest {
    invoice: {
        amount: string;
        currencyFrom: string;
        currencyTo?: string;
    };
    settlement: {
        currency: string;
    };
    reference?: string;
    product: {
        name: string;
        description?: string;
    };
    notifyUrl?: string;
    notifyEmail?: string;
    returnUrl?: string;
    customerEmail?: string;
}

export interface ConfirmoPayment {
    id: string;
    url: string;
    address: string;
    cryptoUri: string;
    createdAt: number;
    timeoutTime: number;
    preparedSince?: number;
    activeSince?: number;
    confirmingSince?: number;
    paidSince?: number;
    expiredSince?: number;
    errorSince?: number;
    reference?: string;
    returnUrl?: string;
    notifyUrl?: string;
    notifyEmail?: string;
    customerEmail?: string;
    product: {
        name: string;
        description?: string;
    };
    status: "prepared" | "active" | "expired" | "confirming" | "error" | "paid";
    rate?: {
        currencyFrom: string;
        currencyTo: string;
        value: number;
    };
    cryptoTransactions?: Array<{
        txid: string;
        amount: number;
        confirmations: number;
        createdAt: number;
        sourceAddresses?: string[];
    }>;
    customerAmount: {
        amount: number;
        currency: string;
    };
    merchantAmount?: {
        amount: number;
        currency: string;
    };
    settlementAmount?: {
        amount: number;
        currency: string;
    };
    paid?: {
        amount: number;
        amountUnconfirmed?: number;
        currency: string;
        diff: number;
    };
    confirmations?: number;
    requiredConfirmations?: number;
    flags?: {
        refundable?: boolean;
        resolvableStatus?: string;
        overpaymentResolvable?: boolean;
        notRefundableCause?: string;
    };
    unhandledExceptions?: boolean;
}

export interface ConfirmoWebhookPayload {
    id: string;
    status: "prepared" | "active" | "expired" | "confirming" | "error" | "paid";
    reference?: string;
    product: {
        name: string;
        description?: string;
    };
    customerAmount: {
        amount: number;
        currency: string;
    };
    merchantAmount?: {
        amount: number;
        currency: string;
    };
    settlementAmount?: {
        amount: number;
        currency: string;
    };
    rate: {
        currencyFrom: string;
        currencyTo: string;
        value: number;
    };
    cryptoTransactions?: Array<{
        txid: string;
        amount: number;
        confirmations: number;
    }>;
    paid?: {
        amount: number;
        currency: string;
        diff: number;
    };
    createdAt: number;
    paidSince?: number;
    confirmingSince?: number;
    expiredSince?: number;
}

export interface ConfirmoPaymentMethod {
    id: string;
    name: string;
    currency: string;
    minAmount: number;
    maxAmount: number;
    fee: number;
    icon?: string;
}

class ConfirmoGateway {
    private apiKey: string;
    private baseUrl: string;
    private callbackPassword?: string;

    constructor(apiKey: string, callbackPassword?: string) {
        this.apiKey = apiKey;
        this.baseUrl = "https://confirmo.net/api/v3";
        this.callbackPassword = callbackPassword;
    }

    /**
     * Create a new payment session for cryptocurrency payment gateway
     */
    async createPayment(
        request: ConfirmoPaymentRequest,
    ): Promise<ConfirmoPayment> {
        try {
            const response = await fetch(`${this.baseUrl}/invoices`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Confirmo Gateway Error:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                });
                throw new Error(
                    `Confirmo Gateway Error: ${response.status} ${response.statusText}`,
                );
            }

            const payment: ConfirmoPayment = await response.json();
            return payment;
        } catch (error) {
            console.error("Error creating Confirmo payment:", error);
            throw error;
        }
    }

    /**
     * Get payment details by ID
     */
    async getPayment(paymentId: string): Promise<ConfirmoPayment> {
        try {
            const response = await fetch(
                `${this.baseUrl}/invoices/${paymentId}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Confirmo Gateway Error:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                });
                throw new Error(
                    `Confirmo Gateway Error: ${response.status} ${response.statusText}`,
                );
            }

            const payment: ConfirmoPayment = await response.json();
            return payment;
        } catch (error) {
            console.error("Error fetching Confirmo payment:", error);
            throw error;
        }
    }

    /**
     * Validate webhook signature
     */
    validateWebhookSignature(payload: string, signature: string): boolean {
        if (!this.callbackPassword) {
            console.warn(
                "No callback password configured for webhook validation",
            );
            return false;
        }

        try {
            const expectedSignature = CryptoJS.SHA256(
                payload + this.callbackPassword,
            ).toString();
            return expectedSignature === signature;
        } catch (error) {
            console.error("Error validating webhook signature:", error);
            return false;
        }
    }

    /**
     * Get supported crypto payment methods
     */
    async getCryptoPaymentMethods(): Promise<ConfirmoPaymentMethod[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/payment-methods/crypto`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Confirmo Gateway Error:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                });
                throw new Error(
                    `Confirmo Gateway Error: ${response.status} ${response.statusText}`,
                );
            }

            return await response.json();
        } catch (error) {
            console.error("Error fetching crypto payment methods:", error);
            throw error;
        }
    }
}

/**
 * Get Confirmo gateway instance
 */
export function getConfirmoGateway(): ConfirmoGateway {
    const apiKey = process.env.CONFIRMO_API_KEY;
    const callbackPassword = process.env.CONFIRMO_CALLBACK_PASSWORD;

    if (!apiKey) {
        throw new Error(
            "CONFIRMO_API_KEY environment variable is not configured",
        );
    }

    return new ConfirmoGateway(apiKey, callbackPassword);
}

/**
 * Helper function to format amount for Confirmo (they expect decimal format)
 */
export function formatAmountForConfirmo(amountInCents: number): number {
    return amountInCents / 100;
}

/**
 * Helper function to convert Confirmo status to our internal status
 */
export function mapConfirmoStatusToInternal(
    confirmoStatus: string,
): "pending" | "completed" | "failed" | "refunded" {
    switch (confirmoStatus) {
        case "prepared":
        case "active":
        case "confirming":
            return "pending";
        case "paid":
            return "completed";
        case "expired":
        case "error":
            return "failed";
        default:
            return "pending";
    }
}

/**
 * Payment gateway types
 */
export type PaymentGateway = "confirmo" | "paytiko" | "bridger";

export interface PaymentGatewayOption {
    id: PaymentGateway;
    name: string;
    description: string;
    icon: string;
    supportedCurrencies: string[];
}
