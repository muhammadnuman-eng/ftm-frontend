import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { logApiError } from "@/lib/posthog-error";

function normalizeProcessingTime(
    input: string | undefined,
): string | undefined {
    if (!input) return undefined;
    let raw = input.trim();
    if (!raw) return undefined;
    raw = raw
        .toLowerCase()
        .replace(/ago/g, " ")
        .replace(/,/g, " ")
        .replace(/\s+/g, " ")
        .replace(/mis\b/g, "min") // common typo: mis -> min
        .replace(/mins\b/g, "min")
        .replace(/minute(s)?\b/g, "min")
        .replace(/min\b/g, "m")
        .replace(/hours?\b/g, "h")
        .replace(/hrs?\b/g, "h")
        .replace(/hour\b/g, "h")
        .replace(/second(s)?\b/g, "s")
        .replace(/secs?\b/g, "s");

    if (/^n\/?a$/.test(raw) || raw === "n" || raw === "na") return undefined;

    // If colon format exists, prefer it (supports D:H:M:S | H:M:S | M:S | S)
    if (raw.includes(":")) {
        const parts = raw
            .split(":")
            .map((p) => p.trim())
            .filter(Boolean);
        const nums = parts.map((p) => Number(p));
        if (!nums.some((n) => Number.isNaN(n))) {
            let total = 0;
            if (nums.length === 4) {
                total =
                    ((nums[0] * 24 + nums[1]) * 60 + nums[2]) * 60 + nums[3];
            } else if (nums.length === 3) {
                total = (nums[0] * 60 + nums[1]) * 60 + nums[2];
            } else if (nums.length === 2) {
                total = nums[0] * 60 + nums[1];
            } else if (nums.length === 1) {
                total = nums[0];
            }
            const h = Math.floor(total / 3600);
            const m = Math.floor((total % 3600) / 60);
            const s = total % 60;
            return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        }
    }

    // Extract hours (supports decimals like 14.5h)
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    const hourMatches = [...raw.matchAll(/(\d+(?:\.\d+)?)\s*h\b/g)];
    for (const m of hourMatches) {
        const val = Number(m[1]);
        hours += Math.trunc(val);
        const fractional = val - Math.trunc(val);
        if (fractional > 0) minutes += Math.round(fractional * 60);
    }
    raw = raw.replace(/(\d+(?:\.\d+)?)\s*h\b/g, " ");

    // Handle compact form like 3h30
    const compactHM = [...raw.matchAll(/(\d+)h(\d+)(?![a-z])/g)];
    for (const m of compactHM) {
        hours += Number(m[1]);
        minutes += Number(m[2]);
    }
    raw = raw.replace(/(\d+)h(\d+)(?![a-z])/g, " ");

    // Extract minutes (supports decimals -> seconds)
    const minuteMatches = [...raw.matchAll(/(\d+(?:\.\d+)?)\s*m\b/g)];
    for (const m of minuteMatches) {
        const val = Number(m[1]);
        minutes += Math.trunc(val);
        const fractional = val - Math.trunc(val);
        if (fractional > 0) seconds += Math.round(fractional * 60);
    }
    raw = raw.replace(/(\d+(?:\.\d+)?)\s*m\b/g, " ");

    // Extract seconds
    const secondMatches = [...raw.matchAll(/(\d+(?:\.\d+)?)\s*s\b/g)];
    for (const m of secondMatches) {
        seconds += Math.round(Number(m[1]));
    }
    raw = raw.replace(/(\d+(?:\.\d+)?)\s*s\b/g, " ");

    // Residual numbers without units
    const residualNums = [...raw.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map(
        (m) => m[1],
    );
    if (residualNums.length > 0) {
        const val = Number(residualNums[0]);
        if (!Number.isNaN(val)) {
            // If we already have hours, assume leftover are minutes; otherwise treat as minutes by default
            if (hours > 0) minutes += Math.round(val);
            else minutes += Math.round(val);
        }
    }

    // Normalize carry overs
    minutes += Math.floor(seconds / 60);
    seconds = seconds % 60;
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;

    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function parseApprovedDate(input: string | undefined): string | undefined {
    if (!input) return undefined;
    try {
        const normalized = input.replace(/,/g, " ").replace(/\s+/g, " ").trim();
        const match = normalized.match(
            /^(\d{2})\/(\d{2})\/(\d{4})\s+UTC\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i,
        );
        if (!match) {
            const fallback = new Date(normalized);
            if (!Number.isNaN(fallback.getTime()))
                return fallback.toISOString();
            return undefined;
        }
        const [_, dd, mm, yyyy, hhStr, minStr, secStr, ampm] = match;
        let hh = Number(hhStr);
        const minutes = Number(minStr);
        const seconds = Number(secStr);
        const day = Number(dd);
        const monthIndex = Number(mm) - 1;
        if (ampm.toUpperCase() === "PM" && hh !== 12) hh += 12;
        if (ampm.toUpperCase() === "AM" && hh === 12) hh = 0;
        const date = new Date(
            Date.UTC(Number(yyyy), monthIndex, day, hh, minutes, seconds),
        );
        return date.toISOString();
    } catch {
        return undefined;
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = await getPayloadClient();
        const body = await request.json();

        const name = (body?.Name ?? "").toString().trim();
        const email = (body?.Email ?? "").toString().trim();
        const country = (body?.Country ?? "").toString().trim();
        const processingTime = (body?.["Processing Time"] ?? "")
            .toString()
            .trim();
        const txLink = (body?.TxLink ?? "").toString().trim();
        const amountRaw = body?.Amount;
        const approvedDateISO = parseApprovedDate(
            (body?.["Date Approved"] ?? "").toString().trim(),
        );

        if (
            !name ||
            !country ||
            amountRaw === undefined ||
            amountRaw === null
        ) {
            return NextResponse.json(
                { error: "Missing required fields: Name, Country, Amount" },
                { status: 400 },
            );
        }

        const amountNumber =
            typeof amountRaw === "number" ? amountRaw : Number(amountRaw);
        if (Number.isNaN(amountNumber)) {
            return NextResponse.json(
                { error: "Amount must be a number" },
                { status: 400 },
            );
        }

        const created = await payload.create({
            collection: "payouts",
            overrideAccess: true,
            data: {
                name,
                email: email || undefined,
                country,
                processingTime:
                    normalizeProcessingTime(processingTime) || "1:00:00",
                transactionLink: txLink || undefined,
                amount: amountNumber,
                approvedDate: approvedDateISO,
            },
        });

        return NextResponse.json(
            {
                success: true,
                payout: {
                    id: created.id,
                    name: created.name,
                    amount: created.amount,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown error";
        console.error("Error creating payout:", error);
        logApiError({
            endpoint: "payout-tracker",
            error,
            method: "POST",
            statusCode: 500,
        });
        return NextResponse.json(
            { error: "Failed to create payout", details: message },
            { status: 500 },
        );
    }
}
