import { GraphsClient } from "@/components/affiliate/graphs-client";
import { getGraphData } from "@/lib/affiliate-actions";

// Force dynamic rendering - this page requires authentication
export const dynamic = "force-dynamic";

export default async function GraphsPage() {
    const graphData = await getGraphData();
    return <GraphsClient graphData={graphData} />;
}
