import { headers } from "next/headers";

export type UserLocation = {
    country: string;
    countryCode: string; // ISO alpha-2 upper-case or 'Unknown'
    ip: string;
};

export async function getUserLocation(): Promise<UserLocation> {
    const headersList = await headers();

    const forwarded = headersList.get("x-forwarded-for");
    const realIp = headersList.get("x-real-ip");
    const cfConnectingIp = headersList.get("cf-connecting-ip");

    let ip = forwarded?.split(",")[0] || realIp || cfConnectingIp || "Unknown";
    ip = ip.trim();

    if (
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip === "localhost" ||
        ip.startsWith("192.168.") ||
        ip.startsWith("10.")
    ) {
        try {
            const publicIpResponse = await fetch(
                "https://api.ipify.org?format=json",
            );
            const publicIpData = (await publicIpResponse.json()) as {
                ip?: string;
            };
            ip = publicIpData.ip || ip;
        } catch {
            return {
                country: "Development",
                countryCode: "DEV",
                ip: "Local Development",
            };
        }
    }

    try {
        const response = await fetch(
            `http://ip-api.com/json/${ip}?fields=country,countryCode`,
        );
        const data = (await response.json()) as {
            country?: string;
            countryCode?: string;
        };
        return {
            country: data.country || "Unknown",
            countryCode: data.countryCode || "Unknown",
            ip,
        };
    } catch {
        return { country: "Unknown", countryCode: "Unknown", ip };
    }
}

export async function detectCountryCodeLower(): Promise<string | undefined> {
    const loc = await getUserLocation();
    const cc = loc.countryCode?.toLowerCase();
    if (!cc || cc === "unknown" || cc === "dev") return undefined;
    return cc;
}
