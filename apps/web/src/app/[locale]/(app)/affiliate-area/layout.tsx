import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AffiliateSidebar } from "@/components/affiliate/affiliate-sidebar";
import { getAffiliateSession } from "@/lib/affiliate-auth";

// Force dynamic rendering - this layout checks authentication
export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0; // Never cache, always check session

type AffiliateLayoutProps = {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
};

export default async function AffiliateLayout({
    children,
    params,
}: AffiliateLayoutProps) {
    const { locale } = await params;
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";

    // Skip auth check for login and register pages
    const isPublicPage =
        pathname.includes("/affiliate-area/login") ||
        pathname.includes("/affiliate-area/register");

    if (!isPublicPage) {
        try {
            const session = await getAffiliateSession();

            console.log(
                "[Affiliate Layout] Session check:",
                session ? "Valid session found" : "No session",
            );

            if (!session) {
                console.log(
                    "[Affiliate Layout] Redirecting to login - no session",
                );
                // Use as-needed locale prefix (only show non-default locales)
                const loginPath =
                    locale === "en"
                        ? "/affiliate-area/login"
                        : `/${locale}/affiliate-area/login`;
                redirect(loginPath);
            }

            // Ensure session has required fields
            if (!session.username || !session.email) {
                console.error(
                    "[Affiliate Layout] Invalid session data - missing fields",
                );
                const loginPath =
                    locale === "en"
                        ? "/affiliate-area/login"
                        : `/${locale}/affiliate-area/login`;
                redirect(loginPath);
            }

            console.log(
                "[Affiliate Layout] Rendering dashboard with sidebar for:",
                session.username,
            );

            // Show dashboard layout with sidebar
            return (
                <div className="container mx-auto px-4 py-8">
                    <div className="flex gap-8">
                        <AffiliateSidebar locale={locale} session={session} />
                        <div className="flex-1">{children}</div>
                    </div>
                </div>
            );
        } catch (error) {
            console.error("[Affiliate Layout] Error checking session:", error);

            // If there's an error checking the session, redirect to login
            const loginPath =
                locale === "en"
                    ? "/affiliate-area/login"
                    : `/${locale}/affiliate-area/login`;
            redirect(loginPath);
        }
    }

    // Public pages (login/register) don't get sidebar
    return <>{children}</>;
}
