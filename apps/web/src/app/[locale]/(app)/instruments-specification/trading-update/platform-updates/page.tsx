import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { draftMode } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { normalizeLocale } from "@/lib/i18n/messages";
import { getPayloadClient } from "@/lib/payload";
import type { TradingUpdate } from "@/payload-types";

export const revalidate = 3600;

export default async function PlatformUpdatesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { isEnabled: isDraftMode } = await draftMode();
    const payload = await getPayloadClient();
    const { locale: localeParam } = await params;
    const locale = normalizeLocale(localeParam);

    const tradingUpdates = (await payload.findGlobal({
        slug: "trading-updates",
        draft: isDraftMode,
        locale,
        depth: 0,
    })) as TradingUpdate;

    const content = tradingUpdates?.platformContent;
    const html = content ? convertLexicalToHTML({ data: content }) : "";

    return (
        <div>
            <div className="mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row">
                <Button className="rounded-full px-6" variant="ghost" asChild>
                    <Link href="/instruments-specification/trading-update/holidays-market-hours">
                        Holidays/Market Hours
                    </Link>
                </Button>
                <Button
                    className="rounded-full px-6"
                    variant="tertiary"
                    asChild
                >
                    <Link href="/instruments-specification/trading-update/platform-updates">
                        Platform Updates
                    </Link>
                </Button>
                <Button className="rounded-full px-6" variant="ghost" asChild>
                    <Link href="/instruments-specification/trading-update/instrument-updates">
                        Instrument Updates
                    </Link>
                </Button>
            </div>

            <div className="mx-auto mt-12 max-w-3xl px-4">
                <article className="prose prose-invert mx-auto mt-6 max-w-none">
                    <div
                        className="text-stone-100/90 leading-relaxed"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: Content comes from CMS
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </article>
            </div>
        </div>
    );
}
