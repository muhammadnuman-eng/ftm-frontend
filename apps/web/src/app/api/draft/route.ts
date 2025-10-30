import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(request: Request): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path") || "/";
    const secret = searchParams.get("secret");

    // Check if the secret is provided
    if (!secret) {
        return new Response("Missing secret", { status: 401 });
    }

    // Verify the secret
    if (secret !== process.env.PAYLOAD_SECRET) {
        return new Response("Invalid secret", { status: 401 });
    }

    // Enable Draft Mode
    const draft = await draftMode();
    draft.enable();

    // Redirect to the path
    redirect(path);
}
