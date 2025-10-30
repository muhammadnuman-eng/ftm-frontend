"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface NewsletterFormProps {
    className?: string;
}

export const NewsletterForm = ({ className }: NewsletterFormProps) => {
    const t = useTranslations("newsletterForm");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            setMessage(t("invalidEmail"));
            setIsSuccess(false);
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/newsletter-subscribe", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data?.message || t("success"));
                setIsSuccess(true);
                setEmail(""); // Clear the form
            } else {
                setMessage(data?.error || t("error"));
                setIsSuccess(false);
            }
        } catch (error) {
            console.error("Newsletter subscription error:", error);
            setMessage(t("error"));
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={className}>
            <div className="flex gap-2">
                <Input
                    className="flex-1 bg-black/30"
                    placeholder={t("emailPlaceholder")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                />
                <Button
                    size="lg"
                    variant="outline"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? t("sending") : t("submit")}
                </Button>
            </div>
            {message && (
                <p
                    className={`mt-2 text-sm ${
                        isSuccess ? "text-green-400" : "text-red-400"
                    }`}
                >
                    {message}
                </p>
            )}
        </form>
    );
};
