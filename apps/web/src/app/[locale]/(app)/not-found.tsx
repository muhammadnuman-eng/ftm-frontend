import { HomeIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="mx-6 max-w-lg rounded-lg border border-white/10 bg-gradient-to-br from-stone-900/50 to-stone-800/50 shadow-2xl backdrop-blur-sm">
                    <div className="p-8 text-center sm:p-12">
                        {/* 404 Number with gradient */}
                        <div className="mb-6">
                            <h1 className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 bg-clip-text font-bold text-8xl text-transparent sm:text-9xl">
                                404
                            </h1>
                        </div>

                        {/* Title and Description */}
                        <div className="mb-8 space-y-4">
                            <h2 className="font-semibold text-2xl text-white sm:text-3xl">
                                Page Not Found
                            </h2>
                            <p className="text-stone-300 leading-relaxed">
                                Oops! The page you're looking for doesn't exist.
                                It might have been moved or deleted.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="w-full sm:w-auto"
                            >
                                <Link href="/">
                                    <HomeIcon className="h-4 w-4" />
                                    Back to Home
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="w-full hover:bg-white/5 sm:w-auto"
                            >
                                <Link href="/blog">
                                    <SearchIcon className="h-4 w-4" />
                                    Browse Blog
                                </Link>
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
            </div>
        </div>
    );
}
