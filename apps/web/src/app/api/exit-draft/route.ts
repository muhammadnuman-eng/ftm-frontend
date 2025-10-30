import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

export async function GET(): Promise<void> {
    const draft = await draftMode();
    draft.disable();
    redirect("/");
}
