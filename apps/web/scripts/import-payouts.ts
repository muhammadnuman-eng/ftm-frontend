import { config } from "dotenv";
config();

import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayloadClient } from "../src/lib/payload";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic import for xlsx to handle ESM/CommonJS compatibility
const xlsxModule = await import("xlsx");
const XLSX = xlsxModule.default || xlsxModule;

interface PayoutRow {
    date: string | Date | undefined;
    name: string;
    email: string;
    amount: number;
    country: string;
    hyperlink: string;
    processingTime: string | undefined;
}

interface ExcelCell {
    v?: string | number | Date;
    l?: {
        Target?: string;
    };
}

function parseExcelDate(
    excelDate: string | number | Date | undefined,
): Date | null {
    if (!excelDate) return null;

    // If it's already a Date object
    if (excelDate instanceof Date) {
        return excelDate;
    }

    // If it's an Excel serial date number
    if (typeof excelDate === "number") {
        // Excel epoch starts on 1900-01-01
        const excelEpoch = new Date(1899, 11, 30);
        const milliseconds = (excelDate - 1) * 24 * 60 * 60 * 1000;
        return new Date(excelEpoch.getTime() + milliseconds);
    }

    // Try parsing as string
    if (typeof excelDate === "string") {
        const parsed = new Date(excelDate);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    return null;
}

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

function parseHyperlink(cell: ExcelCell | undefined): string {
    // If cell has hyperlink, extract the actual URL from the Target
    if (cell?.l?.Target) {
        const target = cell.l.Target;
        // Handle both absolute URLs and relative URLs
        if (target.startsWith("http://") || target.startsWith("https://")) {
            return target;
        }
        // If it's a relative URL, assume it needs https://
        return target.startsWith("//")
            ? `https:${target}`
            : `https://${target}`;
    }
    // Otherwise return the text value (fallback)
    if (cell?.v) {
        const value = String(cell.v);
        // If the value looks like a URL, return it
        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value;
        }
    }
    return "";
}

async function updateExistingPayouts() {
    const filePath = path.join(__dirname, "payouts.xlsx");

    console.log(`Reading Excel file for updates: ${filePath}`);

    // Read the workbook
    const workbook = XLSX.readFile(filePath, {
        cellFormula: false,
        cellHTML: false,
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get the range of the sheet
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

    const payouts: PayoutRow[] = [];

    // Start from row 2 (skip header row 1)
    for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
        // Column A (0) = date
        const dateCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 0 })];
        // Column B (1) = name
        const nameCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 1 })];
        // Column C (2) = email
        const emailCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 2 })];
        // Column P (15) = amount
        const amountCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 15 })];
        // Column Q (16) = country
        const countryCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 16 })];
        // Column U (20) = hyperlink
        const hyperlinkCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 20 })];
        // Column V (21) = processing time
        const processingTimeCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 21 })];

        const name = nameCell?.v ? String(nameCell.v).trim() : "";
        const amount = amountCell?.v ? Number(amountCell.v) : 0;

        // Skip rows with no name or no amount
        if (!name || !amount) {
            continue;
        }

        const payout: PayoutRow = {
            date: dateCell?.v,
            name,
            email: emailCell?.v ? String(emailCell.v).trim() : "",
            amount,
            country: countryCell?.v ? String(countryCell.v).trim() : "",
            hyperlink: parseHyperlink(hyperlinkCell),
            processingTime: processingTimeCell?.v
                ? normalizeProcessingTime(String(processingTimeCell.v))
                : undefined,
        };

        payouts.push(payout);
    }

    console.log(`Found ${payouts.length} payout records to update`);

    // Initialize Payload
    const payload = await getPayloadClient();

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const payout of payouts) {
        try {
            const parsedDate = parseExcelDate(payout.date);

            // Find existing payout by name, email, and amount
            const existing = await payload.find({
                collection: "payouts",
                where: {
                    and: [
                        { name: { equals: payout.name } },
                        { email: { equals: payout.email } },
                        { amount: { equals: payout.amount } },
                    ],
                },
                limit: 1,
            });

            if (existing.docs.length === 0) {
                notFound++;
                console.log(`Not found: ${payout.name} - $${payout.amount}`);
                continue;
            }

            const doc = existing.docs[0];

            // Update the record
            await payload.update({
                collection: "payouts",
                id: doc.id,
                data: {
                    processingTime: payout.processingTime || undefined,
                    transactionLink: payout.hyperlink || undefined,
                    approvedDate: parsedDate?.toISOString() || undefined,
                },
            });

            updated++;
            console.log(
                `✓ Updated payout: ${payout.name} - $${payout.amount} - Processing time: ${payout.processingTime || "N/A"}`,
            );
        } catch (error) {
            errors++;
            console.error(`✗ Error updating payout for ${payout.name}:`, error);
        }
    }

    console.log("\n=== Update Summary ===");
    console.log(`Total records processed: ${payouts.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Errors: ${errors}`);
}

async function importPayouts() {
    const filePath = path.join(__dirname, "payouts.xlsx");

    console.log(`Reading Excel file: ${filePath}`);

    // Read the workbook
    const workbook = XLSX.readFile(filePath, {
        cellFormula: false,
        cellHTML: false,
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get the range of the sheet
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");

    const payouts: PayoutRow[] = [];

    // Start from row 2 (skip header row 1)
    for (let rowNum = range.s.r + 1; rowNum <= range.e.r; rowNum++) {
        // Column A (0) = date
        const dateCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 0 })];
        // Column B (1) = name
        const nameCell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 1 })];
        // Column C (2) = email
        const emailCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 2 })];
        // Column P (15) = amount
        const amountCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 15 })];
        // Column Q (16) = country
        const countryCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 16 })];
        // Column U (20) = hyperlink
        const hyperlinkCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 20 })];
        // Column V (21) = processing time
        const processingTimeCell =
            worksheet[XLSX.utils.encode_cell({ r: rowNum, c: 21 })];

        const name = nameCell?.v ? String(nameCell.v).trim() : "";
        const amount = amountCell?.v ? Number(amountCell.v) : 0;

        // Skip rows with no name or no amount
        if (!name || !amount) {
            continue;
        }

        const payout: PayoutRow = {
            date: dateCell?.v,
            name,
            email: emailCell?.v ? String(emailCell.v).trim() : "",
            amount,
            country: countryCell?.v ? String(countryCell.v).trim() : "",
            hyperlink: parseHyperlink(hyperlinkCell),
            processingTime: processingTimeCell?.v
                ? normalizeProcessingTime(String(processingTimeCell.v))
                : undefined,
        };

        payouts.push(payout);
    }

    console.log(`Found ${payouts.length} payout records to import`);

    // Initialize Payload
    const payload = await getPayloadClient();

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const payout of payouts) {
        try {
            const parsedDate = parseExcelDate(payout.date);

            // Check if payout already exists (by name, email, and amount to avoid duplicates)
            const existing = await payload.find({
                collection: "payouts",
                where: {
                    and: [
                        { name: { equals: payout.name } },
                        { email: { equals: payout.email } },
                        { amount: { equals: payout.amount } },
                    ],
                },
                limit: 1,
            });

            if (existing.docs.length > 0) {
                skipped++;
                console.log(
                    `Skipping duplicate: ${payout.name} - $${payout.amount}`,
                );
                continue;
            }

            await payload.create({
                collection: "payouts",
                data: {
                    name: payout.name,
                    email: payout.email || undefined,
                    country: payout.country,
                    amount: payout.amount,
                    processingTime: payout.processingTime || undefined,
                    approvedDate: parsedDate?.toISOString() || undefined,
                    transactionLink: payout.hyperlink || undefined,
                },
            });

            created++;
            console.log(
                `✓ Created payout: ${payout.name} - $${payout.amount} (${payout.country})`,
            );
        } catch (error) {
            errors++;
            console.error(`✗ Error creating payout for ${payout.name}:`, error);
        }
    }

    console.log("\n=== Import Summary ===");
    console.log(`Total records processed: ${payouts.length}`);
    console.log(`Created: ${created}`);
    console.log(`Skipped (duplicates): ${skipped}`);
    console.log(`Errors: ${errors}`);
}

// Check command line argument
const args = process.argv.slice(2);
const mode = args[0] || "import";

if (mode === "update") {
    // Run the update
    updateExistingPayouts()
        .then(() => {
            console.log("Update completed");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Update failed:", error);
            process.exit(1);
        });
} else {
    // Run the import
    importPayouts()
        .then(() => {
            console.log("Import completed");
            process.exit(0);
        })
        .catch((error) => {
            console.error("Import failed:", error);
            process.exit(1);
        });
}
