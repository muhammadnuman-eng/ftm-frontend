import { AlertCircleIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
    searchParams: Promise<{
        gateway?: string;
        order_id?: string;
        error?: string;
        reason?: string;
    }>;
}

export default async function PaymentErrorPage({ searchParams }: PageProps) {
    const { gateway, order_id, error, reason } = await searchParams;

    // Decode error message if it's URL encoded
    const errorMessage = error ? decodeURIComponent(error) : null;
    const failureReason = reason ? decodeURIComponent(reason) : null;

    return (
        <div className="relative mx-auto max-w-2xl space-y-12 px-4 py-16 sm:px-6 lg:px-8">
            <Card
                className="!bg-none border-white/10 py-6"
                wrapperClassName="border border-white/10"
            >
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                        <XCircleIcon className="h-8 w-8 text-red-400" />
                    </div>
                    <CardTitle className="text-2xl text-white/90">
                        Payment Failed
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 text-center">
                    <div className="space-y-4">
                        <p className="text-white/70">
                            We were unable to process your payment. Please try
                            again.
                        </p>

                        {(errorMessage || failureReason) && (
                            <Alert className="border-red-500/20 bg-red-500/10">
                                <AlertCircleIcon className="h-4 w-4 text-red-400" />
                                <AlertDescription className="text-white/70">
                                    {errorMessage || failureReason}
                                </AlertDescription>
                            </Alert>
                        )}

                        {order_id && (
                            <p className="text-sm text-white/50">
                                Order ID: {order_id}
                            </p>
                        )}

                        {gateway && (
                            <p className="text-sm text-white/50">
                                Payment Gateway:{" "}
                                {gateway.charAt(0).toUpperCase() +
                                    gateway.slice(1)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3 pt-4">
                        <div className="text-sm text-white/60">
                            <p>Common reasons for payment failure:</p>
                            <ul className="mt-2 space-y-1 text-left">
                                <li>• Insufficient funds</li>
                                <li>• Card declined by issuer</li>
                                <li>• Incorrect card details</li>
                                <li>• Transaction limit exceeded</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        {order_id && (
                            <Button
                                asChild
                                className="flex-1 font-bold"
                                size="lg"
                            >
                                <Link href={`/orders/${order_id}/pay`}>
                                    Try Again
                                </Link>
                            </Button>
                        )}
                        <Button
                            asChild
                            variant="outline"
                            className={order_id ? "flex-1" : "w-full"}
                            size="lg"
                        >
                            <Link href="/">Back to Home</Link>
                        </Button>
                    </div>

                    <div className="border-white/10 border-t pt-6">
                        <p className="text-sm text-white/50">
                            Need help? Contact our support team at{" "}
                            <a
                                href="mailto:support@fundedtradermarkets.com"
                                className="text-white/70 underline hover:text-white/90"
                            >
                                support@fundedtradermarkets.com
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
