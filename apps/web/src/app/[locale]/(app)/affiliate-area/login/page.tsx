"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    loginAffiliate,
    requestPasswordReset,
    resetPassword,
} from "@/lib/affiliate-auth-actions";

export default function LoginPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = params?.locale as string;
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [showResetStep, setShowResetStep] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [resetEmail, setResetEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    const dashboardPath =
        locale === "en" ? "/affiliate-area" : `/${locale}/affiliate-area`;

    // Check if already logged in, redirect to dashboard
    useEffect(() => {
        async function checkSession() {
            try {
                const response = await fetch("/api/affiliatewp/session");
                const data = await response.json();

                if (data.authenticated) {
                    router.push(dashboardPath);
                } else {
                    setChecking(false);
                }
            } catch {
                setChecking(false);
            }
        }

        checkSession();
    }, [router, dashboardPath]);

    // Check for URL parameters
    useEffect(() => {
        const registered = searchParams.get("registered");
        const passwordReset = searchParams.get("reset");

        if (passwordReset === "success") {
            // Redirected after successful password reset
            setSuccessMessage(
                "Password reset successful! You can now sign in with your new password.",
            );
        } else if (registered === "true") {
            setSuccessMessage(
                "Registration successful! Welcome aboard—please sign in to continue.",
            );
        }
    }, [searchParams]);

    async function handleLoginSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Server action will redirect on success, so we only handle errors
            const result = await loginAffiliate(username, password, locale);

            // If we reach here, login failed (success case redirects)
            if (result?.error) {
                setError(result.error);
            } else {
                setError("Login failed");
            }
        } catch (error) {
            // Check if this is a Next.js redirect (which is expected on success)
            if (
                error &&
                typeof error === "object" &&
                "digest" in error &&
                typeof error.digest === "string" &&
                error.digest.includes("NEXT_REDIRECT")
            ) {
                // This is a successful login redirect, let it happen
                return;
            }
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    async function handleRequestCodeSubmit(e: React.FormEvent) {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");
        setForgotLoading(true);

        try {
            // Call the backend (will send email if user exists)
            await requestPasswordReset(resetEmail);

            // Always show generic success message for security
            // Don't reveal whether the email exists or not
            setForgotSuccess(
                "If you are registered as an affiliate, you'll receive the reset code in your email. Please check your inbox.",
            );
            setShowResetStep(true);
        } catch {
            // Even on error, show generic message
            setForgotSuccess(
                "If you are registered as an affiliate, you'll receive the reset code in your email. Please check your inbox.",
            );
            setShowResetStep(true);
        } finally {
            setForgotLoading(false);
        }
    }

    async function handleResetPasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setForgotError("Passwords do not match");
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            setForgotError("Password must be at least 8 characters long");
            return;
        }

        if (!resetCode) {
            setForgotError("Please enter the reset code from your email");
            return;
        }

        setForgotLoading(true);

        try {
            const result = await resetPassword(
                resetEmail,
                resetCode,
                newPassword,
            );

            if (result.success) {
                // Close modal and show success message
                setShowForgotModal(false);
                setShowResetStep(false);
                setResetEmail("");
                setResetCode("");
                setNewPassword("");
                setConfirmPassword("");
                setSuccessMessage(
                    "Password reset successful! You can now sign in with your new password.",
                );
            } else {
                setForgotError(result.error || "Failed to reset password");
            }
        } catch {
            setForgotError("An unexpected error occurred");
        } finally {
            setForgotLoading(false);
        }
    }

    // Show loading while checking session
    if (checking) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md text-center">
                    <div className="text-stone-400">
                        Checking authentication...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto max-w-md">
                    <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-8 shadow-lg">
                        <div className="mb-8 text-center">
                            <h1 className="mb-2 font-bold text-2xl text-white">
                                Affiliate Portal
                            </h1>
                            <p className="text-stone-400">
                                Sign in to access your dashboard
                            </p>
                        </div>

                        {/* Success and Error Messages */}
                        {successMessage && (
                            <div className="mb-6 rounded-lg border border-green-500/50 bg-green-900/20 p-3">
                                <p className="text-green-500 text-sm">
                                    {successMessage}
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 rounded-lg border border-red-500/50 bg-red-900/20 p-3">
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Login Form */}
                        <form
                            onSubmit={handleLoginSubmit}
                            className="space-y-6"
                        >
                            <div>
                                <label
                                    htmlFor="username"
                                    className="mb-2 block font-medium text-sm text-stone-300"
                                >
                                    Username or Email
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    required
                                    className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Enter your username or email"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block font-medium text-sm text-stone-300"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div className="text-right">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-cyan-400 text-sm hover:text-cyan-300"
                                >
                                    Forgot password?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </form>

                        {/* Register Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-stone-400">
                                Don't have an account?{" "}
                                <a
                                    href={
                                        locale === "en"
                                            ? "/affiliate-area/register"
                                            : `/${locale}/affiliate-area/register`
                                    }
                                    className="text-cyan-400 hover:text-cyan-300"
                                >
                                    Register here
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            <Dialog
                open={showForgotModal}
                onOpenChange={(open) => {
                    setShowForgotModal(open);
                    if (!open) {
                        // Reset state when modal closes
                        setShowResetStep(false);
                        setResetEmail("");
                        setResetCode("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setForgotError("");
                        setForgotSuccess("");
                    }
                }}
            >
                <DialogContent
                    className="border-stone-800 bg-[#1a1a1a] sm:max-w-md"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle className="font-bold text-2xl text-white">
                            Reset Password
                        </DialogTitle>
                    </DialogHeader>

                    {forgotSuccess && (
                        <div className="rounded-lg border border-green-500/50 bg-green-900/20 p-3">
                            <p className="text-green-500 text-sm">
                                {forgotSuccess}
                            </p>
                        </div>
                    )}

                    {forgotError && (
                        <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-3">
                            <p className="text-red-500 text-sm">
                                {forgotError}
                            </p>
                        </div>
                    )}

                    {!showResetStep ? (
                        <>
                            <p className="text-sm text-stone-400">
                                Enter your email address and we'll send you a
                                code to reset your password.
                            </p>

                            <form
                                onSubmit={handleRequestCodeSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label
                                        htmlFor="resetEmail"
                                        className="mb-2 block font-medium text-sm text-stone-300"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        id="resetEmail"
                                        type="email"
                                        value={resetEmail}
                                        onChange={(e) =>
                                            setResetEmail(e.target.value)
                                        }
                                        required
                                        className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Enter your email address"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {forgotLoading
                                        ? "Sending..."
                                        : "Send Reset Code"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-stone-400">
                                Enter the code from your email and your new
                                password.
                            </p>

                            <form
                                onSubmit={handleResetPasswordSubmit}
                                className="space-y-4"
                            >
                                <div>
                                    <label
                                        htmlFor="resetCode"
                                        className="mb-2 block font-medium text-sm text-stone-300"
                                    >
                                        Reset Code
                                    </label>
                                    <input
                                        id="resetCode"
                                        type="text"
                                        value={resetCode}
                                        onChange={(e) =>
                                            setResetCode(e.target.value)
                                        }
                                        required
                                        className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Enter code from email"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="mb-2 block font-medium text-sm text-stone-300"
                                    >
                                        New Password
                                    </label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) =>
                                            setNewPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Enter new password (min 8 characters)"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="mb-2 block font-medium text-sm text-stone-300"
                                    >
                                        Confirm Password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                        minLength={8}
                                        className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {forgotLoading
                                        ? "Resetting..."
                                        : "Reset Password"}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowResetStep(false);
                                            setResetCode("");
                                            setNewPassword("");
                                            setConfirmPassword("");
                                            setForgotError("");
                                            setForgotSuccess("");
                                        }}
                                        className="text-cyan-400 text-sm hover:text-cyan-300"
                                    >
                                        Back to email entry
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
