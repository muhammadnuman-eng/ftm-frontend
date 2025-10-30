"use server";

import { redirect } from "next/navigation";
import {
    clearAffiliateSessionCookie,
    createAffiliateSession,
    setAffiliateSessionCookie,
} from "./affiliate-auth";
import { getAffiliateWPConfig, lookupAffiliateByUsername } from "./affiliatewp";
import { getPostHogServer } from "./posthog-server";

/**
 * Login action for affiliate dashboard
 */
export async function loginAffiliate(
    username: string,
    password: string,
    locale?: string,
): Promise<{ success: boolean; error?: string }> {
    const posthog = getPostHogServer();

    try {
        const config = getAffiliateWPConfig();

        console.log("[Affiliate Login] Attempting login for:", username);

        posthog.capture({
            distinctId: `affiliate_${username}`,
            event: "affiliatewp_login_attempt",
            properties: {
                username,
                timestamp: new Date().toISOString(),
            },
        });

        // First, try Simple JWT Login plugin if available
        // See: https://simplejwtlogin.com/docs/authentication
        const jwtAuthUrl = `${config.apiUrl}/wp-json/simple-jwt-login/v1/auth`;

        try {
            const jwtResponse = await fetch(jwtAuthUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    login: username, // Can be username or email
                    password: password,
                }),
            });

            if (jwtResponse.ok) {
                const jwtData = await jwtResponse.json();

                if (jwtData.success && jwtData.data?.jwt) {
                    console.log(
                        "[Affiliate Login] JWT authentication successful",
                        jwtData,
                    );

                    // Extract actual WordPress username from JWT response
                    // User can log in with email, but we need the actual username for affiliate lookup
                    // Simple JWT Login plugin may return username in different locations
                    let actualUsername =
                        jwtData.data?.user?.user_login ||
                        jwtData.data?.user?.user_nicename ||
                        jwtData.data?.user_login ||
                        jwtData.data?.user_nicename ||
                        jwtData.data?.username || // Often in data.username
                        jwtData.username || // Sometimes at root level
                        username;

                    // If we still have an email, try to decode the JWT to get the username
                    if (actualUsername.includes("@") && jwtData.data?.jwt) {
                        try {
                            // Decode JWT payload (middle part of token)
                            const payload = JSON.parse(
                                Buffer.from(
                                    jwtData.data.jwt.split(".")[1],
                                    "base64",
                                ).toString(),
                            );
                            const usernameFromToken =
                                payload.username || payload.user_login;
                            if (
                                usernameFromToken &&
                                !usernameFromToken.includes("@")
                            ) {
                                actualUsername = usernameFromToken;
                                console.log(
                                    "[Affiliate Login] Extracted username from JWT token:",
                                    actualUsername,
                                );
                            }
                        } catch (decodeError) {
                            console.log(
                                "[Affiliate Login] Could not decode JWT:",
                                decodeError,
                            );
                        }
                    }

                    console.log(
                        "[Affiliate Login] Using username for lookup:",
                        actualUsername,
                    );

                    // Look up affiliate by actual username
                    const affiliate =
                        await lookupAffiliateByUsername(actualUsername);

                    if (!affiliate) {
                        console.error(
                            "[Affiliate Login] No affiliate found for user:",
                            actualUsername,
                        );

                        posthog.capture({
                            distinctId: `affiliate_${actualUsername}`,
                            event: "affiliatewp_login_failed",
                            properties: {
                                username: actualUsername,
                                error: "affiliate_not_found",
                                authMethod: "jwt",
                                timestamp: new Date().toISOString(),
                            },
                        });

                        return {
                            success: false,
                            error: "Invalid username or password",
                        };
                    }

                    if (affiliate.status !== "active") {
                        console.error(
                            "[Affiliate Login] Affiliate not active:",
                            affiliate.status,
                        );

                        posthog.capture({
                            distinctId: `affiliate_${actualUsername}`,
                            event: "affiliatewp_login_failed",
                            properties: {
                                username: actualUsername,
                                affiliateId: affiliate.affiliate_id,
                                error: "affiliate_not_active",
                                affiliateStatus: affiliate.status,
                                authMethod: "jwt",
                                timestamp: new Date().toISOString(),
                            },
                        });

                        return {
                            success: false,
                            error: "Invalid username or password",
                        };
                    }

                    // Create session with affiliate data
                    // actualUsername already contains the correct WordPress username from JWT
                    // Extract email from JWT response or decode token
                    let userEmail =
                        jwtData.data?.user?.user_email ||
                        jwtData.data?.user_email ||
                        jwtData.data?.email ||
                        jwtData.email;

                    // If email not found, try to get it from decoded JWT payload
                    if (!userEmail && jwtData.data?.jwt) {
                        try {
                            const payload = JSON.parse(
                                Buffer.from(
                                    jwtData.data.jwt.split(".")[1],
                                    "base64",
                                ).toString(),
                            );
                            userEmail = payload.email || payload.user_email;
                        } catch {
                            // Ignore decode errors
                        }
                    }

                    // Fallback to affiliate payment email
                    if (!userEmail) {
                        userEmail = affiliate.payment_email;
                    }

                    const sessionToken = await createAffiliateSession({
                        userId: affiliate.user_id,
                        affiliateId: affiliate.affiliate_id,
                        username: actualUsername,
                        email: userEmail,
                    });

                    await setAffiliateSessionCookie(sessionToken);

                    console.log("[Affiliate Login] Login successful (JWT):", {
                        userId: affiliate.user_id,
                        affiliateId: affiliate.affiliate_id,
                        username: actualUsername,
                        email: userEmail,
                    });

                    posthog.capture({
                        distinctId: `affiliate_${actualUsername}`,
                        event: "affiliatewp_login_success",
                        properties: {
                            username: actualUsername,
                            affiliateId: affiliate.affiliate_id,
                            userId: affiliate.user_id,
                            authMethod: "jwt",
                            timestamp: new Date().toISOString(),
                        },
                    });

                    // Server-side redirect to ensure layout properly loads with session
                    const dashboardPath =
                        locale === "en" || !locale
                            ? "/affiliate-area"
                            : `/${locale}/affiliate-area`;
                    redirect(dashboardPath);
                }
            }
        } catch (jwtError) {
            // Check if this is a Next.js redirect (which is expected on success)
            if (
                jwtError &&
                typeof jwtError === "object" &&
                "digest" in jwtError &&
                typeof jwtError.digest === "string" &&
                jwtError.digest.includes("NEXT_REDIRECT")
            ) {
                // Re-throw the redirect to let it complete
                throw jwtError;
            }

            console.log(
                "[Affiliate Login] JWT auth not available, falling back to Basic Auth:",
                jwtError instanceof Error ? jwtError.message : "Unknown error",
            );
        }

        // Fallback to Application Passwords (Basic Auth)
        // Requires WordPress 5.6+ with Application Passwords enabled
        const userUrl = `${config.apiUrl}/wp-json/wp/v2/users/me`;

        const response = await fetch(userUrl, {
            method: "GET",
            headers: {
                Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error(
                "[Affiliate Login] WordPress auth failed:",
                response.status,
            );

            posthog.capture({
                distinctId: `affiliate_${username}`,
                event: "affiliatewp_login_failed",
                properties: {
                    username,
                    error:
                        response.status === 401
                            ? "invalid_credentials"
                            : "auth_failed",
                    authMethod: "basic",
                    statusCode: response.status,
                    timestamp: new Date().toISOString(),
                },
            });

            return {
                success: false,
                error: "Invalid username or password",
            };
        }

        const user = await response.json();

        // Extract actual WordPress username from authenticated user
        // User can log in with email, but we need the actual username for affiliate lookup
        const actualUsername =
            user.slug ||
            user.name ||
            user.user_login ||
            user.user_nicename ||
            username;

        console.log(
            "[Affiliate Login] Using username for lookup:",
            actualUsername,
        );

        // Look up affiliate by actual username using AffiliateWP API
        const affiliate = await lookupAffiliateByUsername(actualUsername);

        if (!affiliate) {
            console.error(
                "[Affiliate Login] No affiliate found for user:",
                actualUsername,
            );

            posthog.capture({
                distinctId: `affiliate_${actualUsername}`,
                event: "affiliatewp_login_failed",
                properties: {
                    username: actualUsername,
                    error: "affiliate_not_found",
                    authMethod: "basic",
                    timestamp: new Date().toISOString(),
                },
            });

            return {
                success: false,
                error: "Invalid username or password",
            };
        }

        if (affiliate.status !== "active") {
            console.error(
                "[Affiliate Login] Affiliate not active:",
                affiliate.status,
            );

            posthog.capture({
                distinctId: `affiliate_${actualUsername}`,
                event: "affiliatewp_login_failed",
                properties: {
                    username: actualUsername,
                    affiliateId: affiliate.affiliate_id,
                    error: "affiliate_not_active",
                    affiliateStatus: affiliate.status,
                    authMethod: "basic",
                    timestamp: new Date().toISOString(),
                },
            });

            return {
                success: false,
                error: "Invalid username or password",
            };
        }

        // Create session with actual WordPress username already extracted above

        const sessionToken = await createAffiliateSession({
            userId: user.id,
            affiliateId: affiliate.affiliate_id,
            username: actualUsername,
            email: user.email || affiliate.payment_email,
        });

        // Set cookie
        await setAffiliateSessionCookie(sessionToken);

        console.log("[Affiliate Login] Login successful:", {
            userId: user.id,
            affiliateId: affiliate.affiliate_id,
            username: actualUsername,
        });

        posthog.capture({
            distinctId: `affiliate_${actualUsername}`,
            event: "affiliatewp_login_success",
            properties: {
                username: actualUsername,
                affiliateId: affiliate.affiliate_id,
                userId: user.id,
                authMethod: "basic",
                timestamp: new Date().toISOString(),
            },
        });

        // Server-side redirect to ensure layout properly loads with session
        const dashboardPath =
            locale === "en" || !locale
                ? "/affiliate-area"
                : `/${locale}/affiliate-area`;
        redirect(dashboardPath);
    } catch (error) {
        // Check if this is a Next.js redirect (which is expected on success)
        if (
            error &&
            typeof error === "object" &&
            "digest" in error &&
            typeof error.digest === "string" &&
            error.digest.includes("NEXT_REDIRECT")
        ) {
            // Re-throw the redirect to let it complete
            throw error;
        }

        console.error("[Affiliate Login] Error:", error);

        posthog.capture({
            distinctId: `affiliate_${username}`,
            event: "affiliatewp_login_error",
            properties: {
                username,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: false,
            error: "An error occurred during login. Please try again.",
        };
    }
}

/**
 * Register new affiliate
 */
export async function registerAffiliate(data: {
    name: string;
    username: string;
    accountEmail: string;
    paymentEmail: string;
    websiteUrl: string;
    promotionMethod: string;
    password: string;
}): Promise<{ success: boolean; error?: string }> {
    const posthog = getPostHogServer();

    try {
        const config = getAffiliateWPConfig();

        console.log(
            "[Affiliate Register] Attempting to register:",
            data.username,
        );

        posthog.capture({
            distinctId: `affiliate_${data.username}`,
            event: "affiliatewp_registration_attempt",
            properties: {
                username: data.username,
                accountEmail: data.accountEmail,
                hasWebsite: !!data.websiteUrl,
                hasPromotionMethod: !!data.promotionMethod,
                timestamp: new Date().toISOString(),
            },
        });

        // Create WordPress user first
        const createUserUrl = `${config.apiUrl}/wp-json/wp/v2/users`;

        const userResponse = await fetch(createUserUrl, {
            method: "POST",
            headers: {
                Authorization: `Basic ${Buffer.from(`${config.publicKey}:${config.token}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: data.username,
                email: data.accountEmail,
                password: data.password,
                name: data.name,
                roles: ["subscriber"], // Default role
            }),
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.json().catch(() => ({}));
            console.error(
                "[Affiliate Register] Failed to create user:",
                errorData,
            );

            posthog.capture({
                distinctId: `affiliate_${data.username}`,
                event: "affiliatewp_registration_failed",
                properties: {
                    username: data.username,
                    error: "user_creation_failed",
                    errorMessage: errorData.message || "Unknown error",
                    statusCode: userResponse.status,
                    timestamp: new Date().toISOString(),
                },
            });

            if (userResponse.status === 400) {
                return {
                    success: false,
                    error:
                        errorData.message || "Username or email already exists",
                };
            }

            return {
                success: false,
                error: "Failed to create account. Please try again.",
            };
        }

        const user = await userResponse.json();
        console.log("[Affiliate Register] User created:", user.id);

        posthog.capture({
            distinctId: `affiliate_${data.username}`,
            event: "affiliatewp_user_created",
            properties: {
                username: data.username,
                userId: user.id,
                timestamp: new Date().toISOString(),
            },
        });

        // Now create affiliate in AffiliateWP
        // Build notes with website and promotion method info
        const notes = `Website: ${data.websiteUrl || "Not provided"}\nPromotion Method: ${data.promotionMethod || "Not provided"}`;

        const createAffiliateUrl = `${config.apiUrl}/wp-json/affwp/v1/affiliates`;

        const queryParams = new URLSearchParams({
            user_id: String(user.id),
            payment_email: data.paymentEmail,
            status: "active", // Automatically activate new affiliates
            notes: notes,
        });

        const affiliateResponse = await fetch(
            `${createAffiliateUrl}?${queryParams}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Basic ${Buffer.from(`${config.publicKey}:${config.token}`).toString("base64")}`,
                    "Content-Type": "application/json",
                },
            },
        );

        if (!affiliateResponse.ok) {
            console.error(
                "[Affiliate Register] Failed to create affiliate:",
                affiliateResponse.status,
            );

            posthog.capture({
                distinctId: `affiliate_${data.username}`,
                event: "affiliatewp_registration_failed",
                properties: {
                    username: data.username,
                    userId: user.id,
                    error: "affiliate_creation_failed",
                    statusCode: affiliateResponse.status,
                    timestamp: new Date().toISOString(),
                },
            });

            return {
                success: false,
                error: "Account created but affiliate registration failed. Please contact support.",
            };
        }

        const affiliate = await affiliateResponse.json();
        console.log(
            "[Affiliate Register] Affiliate created:",
            affiliate.affiliate_id,
        );

        posthog.capture({
            distinctId: `affiliate_${data.username}`,
            event: "affiliatewp_registration_success",
            properties: {
                username: data.username,
                userId: user.id,
                affiliateId: affiliate.affiliate_id,
                affiliateStatus: affiliate.status,
                hasWebsite: !!data.websiteUrl,
                hasPromotionMethod: !!data.promotionMethod,
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: true,
        };
    } catch (error) {
        console.error("[Affiliate Register] Error:", error);

        posthog.capture({
            distinctId: `affiliate_${data.username}`,
            event: "affiliatewp_registration_error",
            properties: {
                username: data.username,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: false,
            error: "An error occurred during registration. Please try again.",
        };
    }
}

/**
 * Logout action
 */
export async function logoutAffiliate(): Promise<void> {
    const posthog = getPostHogServer();

    posthog.capture({
        distinctId: "affiliate_logout",
        event: "affiliatewp_logout",
        properties: {
            timestamp: new Date().toISOString(),
        },
    });

    await clearAffiliateSessionCookie();
    redirect("/affiliate-area/login");
}

/**
 * Request password reset for affiliate
 * Sends reset code via email using bdvs-password-reset plugin
 */
export async function requestPasswordReset(
    email: string,
): Promise<{ success: boolean; error?: string }> {
    const posthog = getPostHogServer();

    try {
        const config = getAffiliateWPConfig();

        console.log("[Affiliate Password Reset] Requesting reset for:", email);

        posthog.capture({
            distinctId: `affiliate_${email}`,
            event: "affiliatewp_password_reset_requested",
            properties: {
                email,
                timestamp: new Date().toISOString(),
            },
        });

        // Use bdvs-password-reset plugin endpoint
        const resetUrl = `${config.apiUrl}/wp-json/bdpwr/v1/reset-password`;

        const response = await fetch(resetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.code) {
            console.error("[Affiliate Password Reset] Request failed:", data);

            posthog.capture({
                distinctId: `affiliate_${email}`,
                event: "affiliatewp_password_reset_failed",
                properties: {
                    email,
                    error: data.message || "reset_request_failed",
                    errorCode: data.code,
                    statusCode: response.status,
                    timestamp: new Date().toISOString(),
                },
            });

            return {
                success: false,
                error:
                    data.message ||
                    "Unable to process password reset request. Please try again.",
            };
        }

        console.log("[Affiliate Password Reset] Reset code sent successfully");

        posthog.capture({
            distinctId: `affiliate_${email}`,
            event: "affiliatewp_password_reset_code_sent",
            properties: {
                email,
                timestamp: new Date().toISOString(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("[Affiliate Password Reset] Error:", error);

        posthog.capture({
            distinctId: `affiliate_${email}`,
            event: "affiliatewp_password_reset_error",
            properties: {
                email,
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: false,
            error: "An error occurred. Please try again.",
        };
    }
}

/**
 * Reset password with code
 * Uses the code sent via email to set a new password
 * Uses bdvs-password-reset plugin endpoint
 */
export async function resetPassword(
    email: string,
    code: string,
    newPassword: string,
): Promise<{ success: boolean; error?: string }> {
    const posthog = getPostHogServer();

    try {
        const config = getAffiliateWPConfig();

        console.log("[Affiliate Password Reset] Resetting password with code");

        posthog.capture({
            distinctId: `affiliate_${email}`,
            event: "affiliatewp_password_reset_attempt",
            properties: {
                email,
                hasCode: !!code,
                timestamp: new Date().toISOString(),
            },
        });

        // Use bdvs-password-reset plugin endpoint
        const resetUrl = `${config.apiUrl}/wp-json/bdpwr/v1/set-password`;

        const response = await fetch(resetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                code: code,
                password: newPassword,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.code) {
            console.error("[Affiliate Password Reset] Reset failed:", data);

            posthog.capture({
                distinctId: `affiliate_${email}`,
                event: "affiliatewp_password_reset_failed",
                properties: {
                    email,
                    error: data.message || "reset_failed",
                    errorCode: data.code,
                    statusCode: response.status,
                    timestamp: new Date().toISOString(),
                },
            });

            // Provide user-friendly error messages
            if (data.code === "bad_request") {
                return {
                    success: false,
                    error:
                        data.message ||
                        "Invalid or expired reset code. Please request a new one.",
                };
            }

            return {
                success: false,
                error:
                    data.message ||
                    "Unable to reset password. Please try again.",
            };
        }

        console.log("[Affiliate Password Reset] Password reset successful");

        posthog.capture({
            distinctId: `affiliate_${email}`,
            event: "affiliatewp_password_reset_success",
            properties: {
                email,
                timestamp: new Date().toISOString(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("[Affiliate Password Reset] Error:", error);

        posthog.capture({
            distinctId: `affiliate_${email}`,
            event: "affiliatewp_password_reset_error",
            properties: {
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
        });

        return {
            success: false,
            error: "An error occurred. Please try again.",
        };
    }
}
