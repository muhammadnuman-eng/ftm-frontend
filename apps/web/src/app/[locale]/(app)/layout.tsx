import { headers } from "next/headers";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { IntercomClientComponent } from "@/components/intercom-client-component";

import "../../../index.css";

type LayoutProps = {
    children: React.ReactNode;
    params: Promise<{
        locale: string;
    }>;
};

const SiteLayout = async ({ children, params }: LayoutProps) => {
    const { locale } = await params;

    // Check if we're in embed mode via the header set by middleware
    const headersList = await headers();
    const isEmbedMode = headersList.get("x-embed-mode") === "true";

    // In embed mode, skip header, footer, and intercom
    if (isEmbedMode) {
        return <div className="min-h-svh">{children}</div>;
    }

    return (
        <>
            <div className="min-h-svh">
                <Header locale={locale} />
                {children}
                <Footer locale={locale} />
            </div>
            <IntercomClientComponent />
        </>
    );
};

export default SiteLayout;
