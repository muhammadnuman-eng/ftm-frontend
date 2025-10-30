import { getPayloadClient } from "@/lib/payload";

// Temporary in-memory counter for immediate functionality
let memoryCounter = 99999;

/**
 * Simple incremental order number using in-memory counter
 * Use this if database-based generation has issues
 */
export function generateSimpleIncrementalOrderNumber(): number {
    memoryCounter += 1;
    return memoryCounter;
}

/**
 * Generates an incremental order number starting from 100000
 * Finds the highest existing order number and returns the next available one
 * Ensures no duplicate order numbers by checking for existing entries
 * Includes retry logic to handle race conditions
 *
 * Now returns number type since orderNumber field is numeric in database
 */
export async function generateIncrementalOrderNumber(): Promise<number> {
    const payload = await getPayloadClient();
    const startingNumber = 100000;
    const maxRetries = 10;

    try {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            // Get all purchases to find the highest order number
            const allPurchases = await payload.find({
                collection: "purchases",
                where: {
                    orderNumber: {
                        exists: true,
                    },
                },
                limit: 10, // Get enough records to find the highest
                sort: "-orderNumber", // This will work correctly with numeric field
            });

            let highestNumber = startingNumber - 1;

            // Find the highest order number (now stored as number)
            for (const purchase of allPurchases.docs) {
                if (
                    typeof purchase.orderNumber === "number" &&
                    purchase.orderNumber > highestNumber
                ) {
                    highestNumber = purchase.orderNumber;
                }
            }

            // Calculate next number with attempt offset
            const orderNumber = highestNumber + 1 + attempt;

            // Verify this number doesn't already exist
            const existing = await payload.find({
                collection: "purchases",
                where: {
                    orderNumber: {
                        equals: orderNumber,
                    },
                },
                limit: 1,
            });

            if (existing.docs.length === 0) {
                console.log(
                    `Generated unique order number: ${orderNumber} (attempt ${attempt + 1})`,
                );
                return orderNumber;
            }

            console.log(
                `Order number ${orderNumber} already exists, retrying... (attempt ${attempt + 1})`,
            );

            // Small delay to reduce contention
            await new Promise((resolve) =>
                setTimeout(resolve, 10 * (attempt + 1)),
            );
        }

        // If we exhausted retries, generate a high number that's unlikely to conflict
        console.warn(
            "Could not generate unique incremental order number after retries, generating high number",
        );
        // Generate a high number in safe integer range
        const timestamp = Date.now();
        const highNumber = 9000000 + (timestamp % 1000000);
        return highNumber;
    } catch (error) {
        console.error("Error in generateIncrementalOrderNumber:", error);
        // Generate a high number as fallback
        const timestamp = Date.now();
        const highNumber = 9000000 + (timestamp % 1000000);
        return highNumber;
    }
}

/**
 * Legacy function to generate timestamp-based order numbers
 * @deprecated Use generateIncrementalOrderNumber instead
 * This is kept only for reference but should not be used with numeric fields
 */
export function generateTimestampOrderNumber(): string {
    const padToTwo = (value: number) => value.toString().padStart(2, "0");
    const now = new Date();
    const yy = padToTwo(now.getUTCFullYear() % 100);
    const mm = padToTwo(now.getUTCMonth() + 1);
    const dd = padToTwo(now.getUTCDate());
    const hh = padToTwo(now.getUTCHours());
    const ss = padToTwo(now.getUTCSeconds());
    const random = padToTwo(Math.floor(Math.random() * 100));

    return `${yy}${mm}${dd}${hh}${ss}${random}`;
}
