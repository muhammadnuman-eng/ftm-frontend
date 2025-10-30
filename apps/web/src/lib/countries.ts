import type { Platform } from "@/payload-types";
import { toCountryName } from "./utils";

/**
 * Get country name from country code (uses existing utility)
 */
export function getCountryName(countryCode: string): string {
    return toCountryName(countryCode);
}

/**
 * Check if a program is restricted for a specific country
 */
export function isProgramRestrictedForCountry(
    program: {
        countryRestrictions?: {
            hasRestrictions?: boolean | null;
            restrictedCountries?: string[] | null;
            restrictionType?: "blacklist" | "whitelist" | null;
        };
    },
    userCountryCode: string,
): boolean {
    // If no restrictions are configured, program is available
    if (!program.countryRestrictions?.hasRestrictions) {
        return false;
    }

    const restrictedCountries =
        program.countryRestrictions.restrictedCountries || [];
    const restrictionType =
        program.countryRestrictions.restrictionType || "blacklist";
    const userCountry = userCountryCode.toLowerCase();

    // Check if user's country is in the restricted countries list
    const isCountryInList = restrictedCountries.some(
        (countryCode) => countryCode.toLowerCase() === userCountry,
    );

    // For blacklist: restrict if country is in the list
    // For whitelist: restrict if country is NOT in the list
    return restrictionType === "blacklist" ? isCountryInList : !isCountryInList;
}

/**
 * Get restriction message for a program
 */
export function getRestrictionMessage(program: {
    countryRestrictions?: {
        restrictionMessage?: string | null;
    };
}): string {
    return (
        program.countryRestrictions?.restrictionMessage ||
        "This program is not available in your country due to regulatory requirements."
    );
}

export function isPlatformRestrictedForCountry(
    platform: Platform,
    userCountryCode?: string,
): boolean {
    const countryCode = userCountryCode?.toLowerCase();

    if (!countryCode || countryCode === "unknown" || countryCode === "dev") {
        return false;
    }

    const restrictedCountries = platform.restrictedCountries || [];

    if (restrictedCountries.length === 0) {
        return false;
    }

    return restrictedCountries.some(
        ({ code }) => code?.toLowerCase() === countryCode,
    );
}
