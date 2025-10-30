import crypto from "node:crypto";

/**
 * Hash sensitive data (like emails) for privacy-safe logging
 * Uses SHA-256 to create a consistent hash that can be used for tracking
 * without exposing the original data
 */
export function hashEmail(
    email: string | null | undefined,
): string | undefined {
    if (!email) return undefined;

    try {
        return crypto
            .createHash("sha256")
            .update(email.toLowerCase().trim())
            .digest("hex")
            .substring(0, 16); // Use first 16 chars for brevity
    } catch (error) {
        console.error("Error hashing email:", error);
        return undefined;
    }
}

/**
 * Hash any sensitive string data
 */
export function hashSensitiveData(
    data: string | null | undefined,
): string | undefined {
    if (!data) return undefined;

    try {
        return crypto
            .createHash("sha256")
            .update(data.trim())
            .digest("hex")
            .substring(0, 16);
    } catch (error) {
        console.error("Error hashing data:", error);
        return undefined;
    }
}
