import crypto from "node:crypto";

export type BridgerPayEnvironment = "sandbox" | "production";

export interface BridgerPayConfig {
    apiUrl: string;
    apiKey: string;
    cashierKey: string;
    username: string;
    password: string;
    environment: BridgerPayEnvironment;
}

export interface BridgerPayAuthRequest {
    user_name: string;
    password: string;
}

export interface BridgerPayAuthResponse {
    response: {
        status: string;
        code: number;
        message: string;
    };
    result: {
        access_token: {
            token: string;
            expires_in: number; // 7200 seconds (2 hours)
        };
        refresh_token: string;
    };
}

export interface BridgerPaySessionRequest {
    cashier_key: string;
    order_id: string;
    currency: string;
    country: string;
    amount: number;
    theme?: "dark" | "light" | "bright" | "transparent";
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    payload?: string;
    mid_type?: string;
    currency_lock?: boolean;
    amount_lock?: boolean;
    custom_data?: {
        affiliate_id?: string;
        tracking_id?: string;
        platform_id?: string;
    };
    single_payment_method?:
        | "credit_card"
        | "apm"
        | "wire_transfer"
        | "crypto"
        | "external_link";
    single_payment_provider?: string;
    single_payment_mid_alias?: string;
    hide_languages_dropdown?: boolean;
    language?: string;
    hide_header?: boolean;
    button_text?: string;
    validate_inputs_on_focus_out?: boolean;
    tick_save_credit_card_checkbox_by_default?: boolean;
    hide_save_credit_card_checkbox?: boolean;
    show_placeholder_for_cvv?: boolean;
    dont_render_card_holder_name_in_uppercase?: boolean;
    hide_payment_methods?: string[];
    hide_payment_providers?: string[];
    deposit_button_text?: string;
    hide_card_holder_name_when_full_name_is_available?: boolean;
    skip_recurring?: string;
    paywith_max_instances_limit?: number;
}

export interface BridgerPaySessionResponse {
    response: {
        status: string;
        code: number;
        message: string;
    };
    result: {
        cashier_token: string;
    };
}

export type BridgerPayCheckoutResponse =
    | { ok: true; data: BridgerPaySessionResponse }
    | { ok: false; error: string; status: number };

/**
 * In-memory token cache with expiry management
 * Note: In production with multiple servers, consider using Redis or similar
 */
class TokenCache {
    private token: string | null = null;
    private expiryTime = 0;

    set(token: string, expiresIn: number): void {
        this.token = token;
        // Set expiry to 1 minute before actual expiry for safety margin
        this.expiryTime = Date.now() + (expiresIn - 60) * 1000;
    }

    get(): string | null {
        if (!this.token || Date.now() >= this.expiryTime) {
            this.token = null;
            return null;
        }
        return this.token;
    }

    clear(): void {
        this.token = null;
        this.expiryTime = 0;
    }
}

const tokenCache = new TokenCache();

export function getBridgerPayConfig(): BridgerPayConfig {
    const apiUrl =
        process.env.BRIDGERPAY_API_URL?.trim() || "https://api.bridgerpay.com";
    const apiKey = process.env.BRIDGERPAY_API_KEY?.trim() || "";
    const cashierKey = process.env.BRIDGERPAY_CASHIER_KEY?.trim() || "";
    const username = process.env.BRIDGERPAY_USERNAME?.trim() || "";
    const password = process.env.BRIDGERPAY_PASSWORD?.trim() || "";
    const envRaw = (
        process.env.BRIDGERPAY_ENV?.trim() || "production"
    ).toLowerCase();
    const environment: BridgerPayEnvironment =
        envRaw === "sandbox" ? "sandbox" : "production";

    if (!apiKey || !cashierKey || !username || !password) {
        throw new Error(
            "BridgerPay configuration missing. Required: BRIDGERPAY_API_KEY, BRIDGERPAY_CASHIER_KEY, BRIDGERPAY_USERNAME, BRIDGERPAY_PASSWORD",
        );
    }

    return { apiUrl, apiKey, cashierKey, username, password, environment };
}

/**
 * Authenticate with BridgerPay and get access token
 * Tokens are valid for 2 hours and cached for reuse
 */
export async function authenticateBridgerPay(
    configOverride?: Partial<BridgerPayConfig>,
): Promise<string> {
    // Check cache first
    const cachedToken = tokenCache.get();
    if (cachedToken) {
        return cachedToken;
    }

    const config = { ...getBridgerPayConfig(), ...configOverride };
    const url = new URL("/v2/auth/login", config.apiUrl).toString();

    const requestBody: BridgerPayAuthRequest = {
        user_name: config.username,
        password: config.password,
    };

    if (process.env.BRIDGERPAY_DEBUG === "1") {
        console.log("[BridgerPay] Authenticating", {
            url,
            username: config.username,
        });
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        console.error("[BridgerPay] Authentication failed", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
        });
        throw new Error(
            `BridgerPay authentication failed: ${response.status} ${response.statusText}`,
        );
    }

    const data = (await response.json()) as BridgerPayAuthResponse;

    if (data.response.status !== "OK" || !data.result?.access_token?.token) {
        throw new Error(
            `BridgerPay authentication failed: ${data.response.message}`,
        );
    }

    const token = data.result.access_token.token;
    const expiresIn = data.result.access_token.expires_in;

    // Cache the token
    tokenCache.set(token, expiresIn);

    if (process.env.BRIDGERPAY_DEBUG === "1") {
        console.log("[BridgerPay] Authentication successful", {
            expiresIn,
            tokenPrefix: token.slice(0, 8),
        });
    }

    return token;
}

/**
 * Create a checkout session with BridgerPay
 */
export async function createBridgerPaySession(
    body: BridgerPaySessionRequest,
    configOverride?: Partial<BridgerPayConfig>,
): Promise<BridgerPayCheckoutResponse> {
    try {
        const config = { ...getBridgerPayConfig(), ...configOverride };

        // Get valid access token (will use cached if available)
        const accessToken = await authenticateBridgerPay(configOverride);

        const url = new URL(
            `/v2/cashier/session/create/${config.apiKey}`,
            config.apiUrl,
        ).toString();

        if (process.env.BRIDGERPAY_DEBUG === "1") {
            console.log("[BridgerPay] Creating session", {
                url,
                orderId: body.order_id,
                amount: body.amount,
                currency: body.currency,
            });
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Host: "api.bridgerpay.com",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorMessage = "Unknown error";
            try {
                const errorData = await response.json();
                errorMessage =
                    errorData.message ||
                    errorData.error ||
                    JSON.stringify(errorData);
            } catch {
                errorMessage = await response
                    .text()
                    .catch(() => "Unknown error");
            }

            console.error("[BridgerPay] Session creation failed", {
                status: response.status,
                statusText: response.statusText,
                error: errorMessage,
            });

            // If unauthorized, clear token cache and retry once
            if (response.status === 401) {
                console.log(
                    "[BridgerPay] Token expired, retrying with new token",
                );
                tokenCache.clear();
                const newToken = await authenticateBridgerPay(configOverride);

                const retryResponse = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Host: "api.bridgerpay.com",
                        Authorization: `Bearer ${newToken}`,
                    },
                    body: JSON.stringify(body),
                });

                if (!retryResponse.ok) {
                    const retryError = await retryResponse
                        .text()
                        .catch(() => "Unknown error");
                    return {
                        ok: false,
                        error: `Session creation failed after retry: ${retryError}`,
                        status: retryResponse.status,
                    };
                }

                const retryData = await retryResponse.json();
                return { ok: true, data: retryData };
            }

            return {
                ok: false,
                error: errorMessage,
                status: response.status,
            };
        }

        const data = await response.json();

        if (process.env.BRIDGERPAY_DEBUG === "1") {
            console.log("[BridgerPay] Session created successfully", {
                orderId: body.order_id, // Use the order_id we sent
                hasToken: !!data.result?.cashier_token,
                response: data.response?.status,
            });
        }

        return { ok: true, data };
    } catch (error) {
        console.error("[BridgerPay] Error creating session:", error);
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Unknown error",
            status: 500,
        };
    }
}

/**
 * Verify BridgerPay webhook signature
 * Note: Update this based on BridgerPay's actual webhook signature mechanism
 */
export function verifyBridgerPayWebhook(
    payload: string,
    signature: string,
    secret: string,
): boolean {
    try {
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex");

        const a = Buffer.from(signature);
        const b = Buffer.from(expectedSignature);
        return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (error) {
        console.error("Error verifying BridgerPay webhook:", error);
        return false;
    }
}

/**
 * Map BridgerPay transaction status to internal status
 */
export function mapBridgerPayStatusToInternal(
    status: string,
): "pending" | "completed" | "failed" | "cancelled" {
    const normalized = status.toLowerCase();

    // Handle webhook event types - we only process "approved" and "declined"
    switch (normalized) {
        case "approved":
        case "success":
        case "completed":
        case "captured":
        case "settled":
            return "completed";
        case "declined":
        case "rejected":
        case "failed":
        case "error":
            return "failed";
        case "pending":
        case "processing":
        case "authorized":
            return "pending";
        case "cancelled":
        case "canceled":
        case "voided":
        case "refunded":
            return "cancelled";
        default:
            console.log(
                `[BridgerPay] Unknown status: ${status}, defaulting to pending`,
            );
            return "pending";
    }
}

/**
 * Get the checkout widget script URL
 */
export function getBridgerPayCheckoutScriptUrl(): string {
    return "https://checkout.bridgerpay.com/v2/launcher";
}
