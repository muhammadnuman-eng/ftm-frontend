import { SectionHeader } from "@/components/section-header";
import { getPayloadClient } from "@/lib/payload";
import ToolsClient from "./tools.client";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
    const payload = await getPayloadClient();
    const data = (await payload.findGlobal({ slug: "tools" })) as {
        tools?: Array<{
            enabled?: boolean;
            id: string;
            name: string;
            description?: string;
            url: string;
            icon?: string;
        }>;
    };

    const tools = (data?.tools || []).filter((t) => t?.enabled !== false);

    return (
        <div className="mx-auto max-w-7xl space-y-24 px-4 py-12 sm:py-24 md:px-6 lg:px-8">
            <SectionHeader
                title="Trading Calculators"
                titleHighlight="Calculators"
                description="Maximize your precision and efficiency with our essential trading tools. From sizing your positions to calculating your profit, margin, and consistency.."
            />
            <ToolsClient tools={tools} />
        </div>
    );
}
