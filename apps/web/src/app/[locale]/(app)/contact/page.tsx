"use client";

import { MailIcon, MapPinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ContactPage() {
    const t = useTranslations("contactPage");
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<{
        type: "success" | "error" | null;
        message: string;
    }>({ type: null, message: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus({ type: null, message: "" });

        try {
            const response = await fetch("/api/contact-submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus({
                    type: "success",
                    message: data.message || t("form.success"),
                });
                // Reset form
                setFormData({
                    name: "",
                    phone: "",
                    email: "",
                    message: "",
                });
            } else {
                setSubmitStatus({
                    type: "error",
                    message: data.error || t("form.error"),
                });
            }
        } catch (error) {
            console.error("Contact form error:", error);
            setSubmitStatus({
                type: "error",
                message: t("form.error"),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-16 space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm">
                        {t("badge")}
                    </div>
                </div>
                <h1 className="font-bold text-4xl text-white sm:text-5xl lg:text-6xl">
                    {t("title")}
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-stone-100/70">
                    {t("description")}
                </p>
            </div>

            {/* Main Content */}
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Contact Form */}
                <div className="rounded-2xl bg-[#1e1e2e] p-8 lg:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder={t("form.namePlaceholder")}
                                required
                                className="w-full rounded-lg border border-white/10 bg-[#2a2a3e] px-4 py-3 text-white placeholder:text-stone-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Phone and Email */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder={t("form.phonePlaceholder")}
                                    className="w-full rounded-lg border border-white/10 bg-[#2a2a3e] px-4 py-3 text-white placeholder:text-stone-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder={t("form.emailPlaceholder")}
                                    required
                                    className="w-full rounded-lg border border-white/10 bg-[#2a2a3e] px-4 py-3 text-white placeholder:text-stone-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        {/* Message */}
                        <div>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder={t("form.messagePlaceholder")}
                                required
                                rows={5}
                                className="w-full resize-none rounded-lg border border-white/10 bg-[#2a2a3e] px-4 py-3 text-white placeholder:text-stone-400 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn(
                                "w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:from-cyan-400 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50",
                                isSubmitting && "cursor-not-allowed opacity-50",
                            )}
                        >
                            {isSubmitting
                                ? t("form.sending")
                                : t("form.submit")}
                        </button>

                        {/* Status Messages */}
                        {submitStatus.type && (
                            <div
                                className={cn(
                                    "rounded-lg p-4 text-sm",
                                    submitStatus.type === "success"
                                        ? "bg-green-500/10 text-green-500"
                                        : "bg-red-500/10 text-red-500",
                                )}
                            >
                                {submitStatus.message}
                            </div>
                        )}

                        {/* Response Time */}
                        <p className="text-center text-sm text-stone-400">
                            {t("form.responseTime")}
                        </p>
                    </form>
                </div>

                {/* Contact Information */}
                <div className="space-y-8">
                    <div>
                        <h2 className="mb-4 font-bold text-2xl text-white">
                            {t("info.title")}
                        </h2>
                        <p className="text-stone-100/70">
                            {t("info.description")}
                        </p>
                    </div>

                    {/* Office */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                                <MapPinIcon className="size-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="mb-2 font-semibold text-lg text-white">
                                    {t("info.office")}
                                </h3>
                                <p className="text-stone-100/70">
                                    {t("info.address")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                                <MailIcon className="size-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="mb-2 font-semibold text-lg text-white">
                                    {t("info.email")}
                                </h3>
                                <a
                                    href={`mailto:${t("info.emailAddress")}`}
                                    className="text-yellow-400 hover:text-yellow-300"
                                >
                                    {t("info.emailAddress")}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
