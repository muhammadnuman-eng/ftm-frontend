import Script from "next/script";

interface JsonLdSchemaProps {
    schema: string | null;
}

/**
 * Component to inject JSON-LD structured data into the page
 * The SEO team can provide the schema.org JSON in the CMS
 */
export function JsonLdSchema({ schema }: JsonLdSchemaProps) {
    if (!schema) return null;

    // Try to parse and validate JSON
    let parsedSchema: unknown;
    try {
        parsedSchema = JSON.parse(schema);
    } catch (error) {
        console.error("Invalid JSON-LD schema:", error);
        return null;
    }

    return (
        <Script
            id="json-ld-schema"
            type="application/ld+json"
            strategy="beforeInteractive"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema requires script tag with JSON content
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(parsedSchema),
            }}
        />
    );
}
