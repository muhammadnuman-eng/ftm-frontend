import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { getMessages } from "@/lib/i18n/messages";
import "../index.css";

export default async function RootNotFound() {
    const messages = await getMessages(DEFAULT_LOCALE);

    return (
        <html lang={DEFAULT_LOCALE}>
            <body className="antialiased">
                <NextIntlClientProvider
                    locale={DEFAULT_LOCALE}
                    messages={messages}
                >
                    <div className="min-h-svh">
                        <Header locale={DEFAULT_LOCALE} />
                        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
                            <div className="p-8 text-center sm:p-12">
                                {/* 404 Number with gradient */}
                                <div className="mb-6">
                                    <h1 className="bg-gradient-to-br from-blue-400 to-70% to-indigo-500 bg-clip-text font-bold text-8xl text-transparent sm:text-9xl">
                                        404
                                    </h1>
                                </div>

                                {/* Title and Description */}
                                <div className="mb-8 space-y-4">
                                    <h2 className="font-semibold text-2xl text-white sm:text-3xl">
                                        Page Not Found
                                    </h2>
                                    <p className="text-stone-300 leading-relaxed">
                                        Oops! The page you're looking for
                                        doesn't exist. It might have been moved
                                        or deleted.
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                                    <Button
                                        asChild
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        <Link href="/variations">
                                            Get Funded
                                            <ArrowUpRightIcon className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="lg"
                                        className="w-full hover:bg-white/5 sm:w-auto"
                                    >
                                        <Link href="/">Home Page</Link>
                                    </Button>
                                </div>

                                {/* Help Text */}
                                <p className="mt-8 text-sm text-stone-400">
                                    Need help? Check out our{" "}
                                    <Link
                                        href="/faq"
                                        className="text-indigo-400 underline-offset-4 transition-colors hover:text-indigo-300 hover:underline"
                                    >
                                        FAQ
                                    </Link>{" "}
                                    or{" "}
                                    <Link
                                        href="/programs"
                                        className="text-indigo-400 underline-offset-4 transition-colors hover:text-indigo-300 hover:underline"
                                    >
                                        view our programs
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>
                        <Footer locale={DEFAULT_LOCALE} />
                    </div>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
