import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrderReceivedPage() {
    return (
        <div className="relative mx-auto max-w-2xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
            <Card
                className="!bg-none border-white/10 py-6"
                wrapperClassName="border border-white/10"
            >
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                        <CheckCircleIcon className="h-8 w-8 text-green-400" />
                    </div>
                    <CardTitle className="text-2xl text-white/90">
                        Payment Successful!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <div className="space-y-2 text-balance">
                        <p className="text-white/70">
                            Thank you for your purchase. Your payment has been
                            processed successfully.
                        </p>
                        <p className="text-sm text-white/50">
                            You will receive a confirmation email shortly with
                            your account details and next steps.
                        </p>
                    </div>
                    <div className="flex gap-4 pt-4">
                        <Button asChild className="flex-1 font-bold" size="lg">
                            <Link
                                href="https://dash.fundedtradermarkets.com"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Go to Dashboard
                            </Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="flex-1"
                            size="lg"
                        >
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
