export function getCashierScriptSrc(coreUrl?: string): string {
    const base =
        coreUrl?.trim() ||
        process.env.NEXT_PUBLIC_PAYTIKO_CORE_URL?.trim() ||
        "https://core.paytiko.com";
    const u = new URL("/cdn/js/sdk/paytiko-sdk.1.0.min.js", base);
    return u.toString();
}
