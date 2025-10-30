import { config } from "dotenv";
config();

import { getPayloadClient } from "../src/lib/payload";

async function check() {
    const payload = await getPayloadClient();

    // Get first Spanish FAQ
    const spanishFaqs = await payload.find({
        collection: "faqs",
        locale: "es",
        depth: 0,
        limit: 1,
        fallbackLocale: false,
    });

    if (spanishFaqs.docs.length === 0) {
        console.log("No Spanish FAQs found");
        return;
    }

    const faq = spanishFaqs.docs[0];

    console.log("=== SPANISH FAQ ===");
    console.log("Question:", faq.question);
    console.log("\nAnswer structure:");
    console.log(JSON.stringify(faq.answer, null, 2));
}

check()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });






