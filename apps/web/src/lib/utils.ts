import { type ClassValue, clsx } from "clsx";
import countriesLib from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Countries utility: ISO 3166-1 alpha-2 codes and English names
// Kept minimal dependency footprint; can be expanded if needed.
export type Country = {
    code: string; // lower-case ISO alpha-2
    name: string;
    flagEmoji: string; // Unicode flag for quick display when SVG is not desired
    continent?: string;
};

// Note: List includes UN recognized and common territories. Keep codes lower-case.
// Source basis: ISO 3166-1; names normalized. This is a curated subset; expand as needed.
countriesLib.registerLocale(enLocale);

// Build full ISO 3166-1 list (alpha-2) with English names.
export const COUNTRIES: Country[] = Object.entries(
    countriesLib.getNames("en", { select: "official" }),
).map(([codeUpper, name]) => {
    const code = codeUpper.toLowerCase();
    // Derive flag emoji from regional indicator symbols
    const flagEmoji = codeUpper
        .toUpperCase()
        .replace(/./g, (char) =>
            String.fromCodePoint(127397 + char.charCodeAt(0)),
        );
    return { code, name, flagEmoji };
});

export const groupCountriesByContinent = (countries: Country[]) => {
    const groups = new Map<string, Country[]>();
    for (const c of countries) {
        const key = c.continent || "Other";
        const current = groups.get(key) ?? [];
        current.push(c);
        groups.set(key, current);
    }
    return Array.from(groups.entries()).map(([continent, items]) => ({
        continent,
        items,
    }));
};

export const toCountryName = (code: string): string => {
    if (!code) return "";
    const upper = code.toUpperCase();
    return (
        (countriesLib.getName(upper, "en", { select: "official" }) as string) ||
        upper
    );
};

// Convert a country name or code to a 2-letter ISO code (lowercase).
// Handles common aliases (e.g., "USA", "UK", "Turkey"). Returns empty string if unknown.
export const toCountryCode = (nameOrCode: string | undefined): string => {
    if (!nameOrCode) return "";
    const input = nameOrCode.trim();
    if (!input) return "";
    const lc = input.toLowerCase();

    // If already a known 2-letter code
    const byCode = COUNTRIES.find((c) => c.code === lc);
    if (byCode) return byCode.code;

    const ALIASES: Record<string, string> = {
        usa: "us",
        "united states": "us",
        "united states of america": "us",
        uk: "gb",
        "united kingdom": "gb",
        britain: "gb",
        england: "gb",
        turkey: "tr",
        türkiye: "tr",
        korea: "kr",
        "south korea": "kr",
        russia: "ru",
        czechia: "cz",
        "czech republic": "cz",
        uae: "ae",
        "united arab emirates": "ae",
        "hong kong": "hk",
        "saudi arabia": "sa",
        "south africa": "za",
        tunisia: "tn",
        pakistan: "pk",
        romania: "ro",
        uganda: "ug",
        laos: "la",
        "lao pdr": "la",
        vietnam: "vn",
        "viet nam": "vn",
        chile: "cl",
        philippines: "ph",
        phillipines: "ph",
        malaysia: "my",
        indonesia: "id",
        hungary: "hu",
        bangladesh: "bd",
        slovenia: "si",
        algeria: "dz",
        tanzania: "tz",
        "united republic of tanzania": "tz",
        oman: "om",
        jordan: "jo",
        jersey: "je",
        albania: "al",
        moldova: "md",
        "moldova, republic of": "md",
        "south georgia and the south sandwich islands": "gs",
        ghana: "gh",
        maldives: "mv",
        colombia: "co",
        cambodia: "kh",
    };
    if (ALIASES[lc]) return ALIASES[lc];

    // Exact name from the ISO dataset
    const isoCode = countriesLib.getAlpha2Code(input, "en");
    if (isoCode) return isoCode.toLowerCase();

    // Try title-cased lookup (handles mixed-case inputs)
    const title = input.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    const isoCode2 = countriesLib.getAlpha2Code(title, "en");
    if (isoCode2) return isoCode2.toLowerCase();

    return "";
};

export const getRegionFromCountryCode = (
    countryCode: string | undefined,
): string => {
    if (!countryCode) {
        return "other";
    }
    const code = countryCode.toLowerCase();

    switch (code) {
        // North America
        case "us":
        case "ca":
        case "mx":
            return "north-america";

        // Latin America
        case "br":
        case "ar":
        case "cl":
        case "co":
        case "pe":
        case "ve":
        case "ec":
        case "bo":
        case "py":
        case "uy":
        case "gy":
        case "sr":
        case "cr":
        case "pa":
        case "ni":
        case "hn":
        case "sv":
        case "gt":
        case "bz":
        case "cu":
        case "do":
        case "ht":
        case "jm":
        case "tt":
        case "bb":
            return "latin-america";

        // Europe
        case "gb":
        case "fr":
        case "de":
        case "it":
        case "es":
        case "nl":
        case "be":
        case "se":
        case "no":
        case "dk":
        case "fi":
        case "ie":
        case "ch":
        case "at":
        case "pt":
        case "gr":
        case "pl":
        case "cz":
        case "hu":
        case "ro":
        case "bg":
        case "hr":
        case "rs":
        case "ua":
        case "sk":
        case "si":
        case "ee":
        case "lv":
        case "lt":
        case "lu":
        case "mt":
        case "cy":
        case "is":
        case "al":
        case "mk":
        case "ba":
        case "me":
        case "md":
        case "by":
            return "europe";

        // Asia (East and Southeast)
        case "cn":
        case "jp":
        case "kr":
        case "tw":
        case "hk":
        case "mo":
        case "mn":
        case "id":
        case "ph":
        case "vn":
        case "th":
        case "my":
        case "sg":
        case "mm":
        case "kh":
        case "la":
        case "bn":
        case "tl":
            return "asia";

        // South Asia
        case "in":
        case "pk":
        case "bd":
        case "lk":
        case "np":
        case "bt":
        case "mv":
        case "af":
            return "south-asia";

        // Middle East
        case "sa":
        case "ae":
        case "qa":
        case "kw":
        case "om":
        case "bh":
        case "ye":
        case "jo":
        case "lb":
        case "sy":
        case "iq":
        case "ir":
        case "il":
        case "ps":
        case "eg":
        case "tr":
            return "middle-east";

        // Africa
        case "ng":
        case "za":
        case "ke":
        case "gh":
        case "et":
        case "tz":
        case "ug":
        case "dz":
        case "sd":
        case "ma":
        case "ao":
        case "mz":
        case "mg":
        case "cm":
        case "ci":
        case "ne":
        case "bf":
        case "ml":
        case "mw":
        case "zm":
        case "sn":
        case "so":
        case "gn":
        case "rw":
        case "bj":
        case "tn":
        case "bi":
        case "ss":
        case "tg":
        case "sl":
        case "ly":
        case "lr":
        case "mr":
        case "cf":
        case "er":
        case "gm":
        case "bw":
        case "na":
        case "ga":
        case "sz":
        case "ls":
        case "gw":
        case "gq":
        case "mu":
        case "dj":
        case "km":
        case "cv":
        case "sc":
        case "st":
            return "africa";

        // Oceania
        case "au":
        case "nz":
        case "pg":
        case "fj":
        case "sb":
        case "nc":
        case "pf":
        case "vu":
        case "ws":
        case "ki":
        case "to":
        case "fm":
        case "pw":
        case "mh":
        case "nr":
        case "tv":
            return "oceania";

        default:
            return "other";
    }
};
