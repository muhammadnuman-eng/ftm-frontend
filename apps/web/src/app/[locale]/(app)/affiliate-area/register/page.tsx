"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoIcon } from "@/components/logo";
import { registerAffiliate } from "@/lib/affiliate-auth-actions";

export default function RegisterPage() {
    const params = useParams();
    const router = useRouter();
    const locale = params?.locale as string;
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        accountEmail: "",
        paymentEmail: "",
        websiteUrl: "",
        promotionMethod: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    const loginPath =
        locale === "en"
            ? "/affiliate-area/login"
            : `/${locale}/affiliate-area/login`;
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        // Validate password length
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters");
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setLoading(true);

        try {
            const result = await registerAffiliate({
                name: formData.name,
                username: formData.username,
                accountEmail: formData.accountEmail,
                paymentEmail: formData.paymentEmail,
                websiteUrl: formData.websiteUrl,
                promotionMethod: formData.promotionMethod,
                password: formData.password,
            });

            if (result.success) {
                // Redirect to login with success message
                router.push(`${loginPath}?registered=true`);
            } else {
                setError(result.error || "Registration failed");
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } catch {
            setError("An unexpected error occurred");
            window.scrollTo({ top: 0, behavior: "smooth" });
        } finally {
            setLoading(false);
        }
    }

    // Show loading while checking session
    if (checking) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
                    <Loader2Icon className="h-8 w-8 animate-spin text-blue-400" />
                    <div className="text-stone-400">
                        Checking authentication...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-2xl">
                <div className="rounded-lg border border-stone-800 bg-[#1a1a1a] p-8 shadow-lg">
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center">
                            <LogoIcon className="h-14" />
                        </div>
                        <h1 className="mb-2 font-bold text-2xl text-white">
                            Become an Affiliate
                        </h1>
                        <p className="text-stone-400">
                            Join our affiliate program and start earning
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="rounded-lg border border-red-500/50 bg-red-900/20 p-3">
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block font-medium text-sm text-stone-300"
                            >
                                Your Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                required
                                className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="username"
                                className="mb-2 block font-medium text-sm text-stone-300"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        username: e.target.value,
                                    })
                                }
                                required
                                className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Choose a username"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="accountEmail"
                                className="mb-2 block font-medium text-sm text-stone-300"
                            >
                                Account Email
                            </label>
                            <input
                                id="accountEmail"
                                type="email"
                                value={formData.accountEmail}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        accountEmail: e.target.value,
                                    })
                                }
                                required
                                className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="your@email.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="paymentEmail"
                                className="mb-2 block font-medium text-sm text-stone-300"
                            >
                                Payment Email
                            </label>
                            <input
                                id="paymentEmail"
                                type="email"
                                value={formData.paymentEmail}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        paymentEmail: e.target.value,
                                    })
                                }
                                required
                                className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="payment@email.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="websiteUrl"
                                className="mb-2 block font-medium text-sm text-stone-300"
                            >
                                Website URL
                            </label>
                            <input
                                id="websiteUrl"
                                type="text"
                                value={formData.websiteUrl}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        websiteUrl: e.target.value,
                                    })
                                }
                                className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="https://yourwebsite.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="promotionMethod"
                                className="mb-2 block font-medium text-sm text-stone-300"
                            >
                                How will you promote us?
                            </label>
                            <textarea
                                id="promotionMethod"
                                value={formData.promotionMethod}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        promotionMethod: e.target.value,
                                    })
                                }
                                rows={4}
                                className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="Tell us about your promotional methods (social media, blog, YouTube, etc.)"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Enter password"
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
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            confirmPassword: e.target.value,
                                        })
                                    }
                                    required
                                    className="w-full scroll-mt-32 rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 text-white placeholder-stone-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Confirm password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Creating account..." : "Register"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-stone-400">
                            Already have an account?{" "}
                            <Link
                                href={loginPath}
                                className="text-cyan-400 hover:text-cyan-300"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
