import { redirect } from "next/navigation";
import { URLGenerator } from "@/components/affiliate/url-generator";
import { getAffiliateSession } from "@/lib/affiliate-auth";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

export default async function URLsPage() {
    const session = await getAffiliateSession();

    if (!session) {
        redirect("/affiliate-area/login");
    }

    // Get the base URL from environment or use default
    const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://fundedtradermarkets.com";

    return (
        <div className="space-y-8">
            <div>
                <h1 className="mb-2 font-bold text-3xl text-white">
                    Affiliate URLs
                </h1>
                <p className="text-stone-400">
                    Share your referral URL with your audience to earn
                    commission.
                </p>
            </div>

            <URLGenerator username={session.username} baseUrl={baseUrl} />
        </div>
    );
}
