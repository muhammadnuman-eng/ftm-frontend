import crypto from "node:crypto";

export type PaytikoEnvironment = "UAT" | "PRODUCTION";

export interface PaytikoConfig {
    coreUrl: string;
    merchantSecret: string;
    environment: PaytikoEnvironment;
}

export interface PaytikoCheckoutRequestBody {
    firstName: string; // required
    lastName?: string;
    email: string; // required
    currency: string; // ISO 4217, required
    countryCode: string; // ISO 3166-1 alpha-2, required
    orderId: string; // merchant order id, required
    lockedAmount?: number;
    phone: string; // required by CC processors
    city?: string;
    street?: string;
    region?: string;
    zipCode?: string;
    dateOfBirth?: string; // MM/dd/yyyy
    signature: string; // SHA256(email;timestamp;merchantSecret)
    timestamp: number; // Unix epoch seconds
    gender?: "Male" | "Female";
    disabledPspIds?: number[];
    isPayOut?: boolean;
    cashierDescription?: string;
    useEventBasedRedirects?: boolean;
    merchantId?: number; // Optional: set via env if Paytiko requires explicit merchant mapping
}

export interface PaytikoCheckoutSuccessResponse {
    cashierSessionToken: string;
}

export interface PaytikoCheckoutErrorResponse {
    errorMessage?: string;
    ForbiddenByAcl?: boolean;
}

export type PaytikoCheckoutResponse =
    | { ok: true; data: PaytikoCheckoutSuccessResponse }
    | { ok: false; error: PaytikoCheckoutErrorResponse; status: number };

export function getPaytikoConfig(): PaytikoConfig {
    const coreUrl =
        process.env.PAYTIKO_CORE_URL?.trim() || "https://core.paytiko.com";
    const merchantSecret = process.env.PAYTIKO_MERCHANT_SECRET?.trim() || "";
    const envRaw = (
        process.env.PAYTIKO_ENV?.trim() || "PRODUCTION"
    ).toUpperCase();
    const environment: PaytikoEnvironment =
        envRaw === "UAT" ? "UAT" : "PRODUCTION";

    if (!merchantSecret) {
        throw new Error(
            "PAYTIKO_MERCHANT_SECRET is not configured. Please set it in environment.",
        );
    }

    return { coreUrl, merchantSecret, environment };
}

export function generateCheckoutSignature(
    email: string,
    timestampSeconds: number,
    merchantSecret: string,
): string {
    // Per docs and confirmed by working request:
    // rawSignature = `${email};${timestamp};${MERCHANT_SECRET}`
    // signature = SHA256(rawSignature) encoded as hex or base64
    const lower = ["1", "true", "yes"].includes(
        String(
            process.env.PAYTIKO_LOWERCASE_EMAIL_FOR_SIGNATURE || "",
        ).toLowerCase(),
    );
    const emailForSig = (lower ? email.toLowerCase() : email).trim();
    const raw = `${emailForSig};${timestampSeconds};${merchantSecret}`;

    // Support both hex and base64 encoding
    const encoding = (
        process.env.PAYTIKO_SIGNATURE_ENCODING || "hex"
    ).toLowerCase();
    if (encoding === "base64") {
        return crypto.createHash("sha256").update(raw).digest("base64");
    }
    return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateWebhookSignature(
    orderId: string,
    merchantSecret: string,
): string {
    const raw = `${merchantSecret}:${orderId}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
}

export function verifyWebhookSignature(
    orderId: string,
    signatureFromHeaderOrBody: string | null | undefined,
    merchantSecret: string,
): boolean {
    if (!signatureFromHeaderOrBody) return false;
    const expected = generateWebhookSignature(orderId, merchantSecret);
    // Constant-time comparison to avoid timing attacks
    const a = Buffer.from(signatureFromHeaderOrBody);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createCheckoutSession(
    body: PaytikoCheckoutRequestBody,
    configOverride?: Partial<PaytikoConfig>,
): Promise<PaytikoCheckoutResponse> {
    const config = { ...getPaytikoConfig(), ...configOverride };
    const url = new URL("/api/sdk/checkout", config.coreUrl).toString();

    // Optionally include MerchantId in body and header if configured
    const outboundBody: PaytikoCheckoutRequestBody = {
        ...body,
    };

    if (process.env.PAYTIKO_DEBUG === "1") {
        console.log("[Paytiko] Creating checkout", {
            url,
            headers: {
                "X-Merchant-Secret": `${config.merchantSecret}`,
            },
            body: JSON.stringify(outboundBody),
        });
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Merchant-Secret": config.merchantSecret,
            Accept: "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "SDK API",
        },
        body: JSON.stringify(outboundBody),
    });

    if (!response.ok) {
        // Log minimal diagnostic info without secrets
        console.error("[Paytiko] HTTP error on checkout", {
            status: response.status,
            statusText: response.statusText,
        });
        let error: PaytikoCheckoutErrorResponse = {};
        try {
            error = (await response.json()) as PaytikoCheckoutErrorResponse;
        } catch {
            try {
                const text = await response.text();
                error = { errorMessage: text };
            } catch {}
        }
        return { ok: false, error, status: response.status };
    }

    const data = (await response.json()) as PaytikoCheckoutSuccessResponse;
    if (process.env.PAYTIKO_DEBUG === "1") {
        console.log("[Paytiko] Checkout success (sanitized)", {
            tokenPrefix: String(data.cashierSessionToken).slice(0, 8),
        });
    }
    return { ok: true, data };
}

export function getCashierScriptSrc(coreUrl?: string): string {
    const base =
        coreUrl?.trim() ||
        process.env.PAYTIKO_CORE_URL?.trim() ||
        "https://core.paytiko.com";
    const u = new URL("/cdn/js/sdk/paytiko-sdk.1.0.min.js", base);
    return u.toString();
}

export type PaytikoTransactionStatus =
    | "Success"
    | "Rejected"
    | "Failed"
    | "SubscriptionCancelled";

export function mapPaytikoStatusToInternal(
    status: PaytikoTransactionStatus,
): "pending" | "completed" | "failed" | "cancelled" {
    switch (status) {
        case "Success":
            return "completed";
        case "Rejected":
        case "Failed":
            return "failed";
        case "SubscriptionCancelled":
            return "cancelled";
        default:
            return "failed";
    }
}
