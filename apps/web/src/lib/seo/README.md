# Global SEO System

Complete SEO management system for controlling metadata, canonical URLs, robots directives, and JSON-LD structured data across all pages.

## Features

### 1. **Canonical URLs**
Control canonical URLs for each page to avoid duplicate content issues.

**In Payload CMS:**
- Navigate to **Settings → Global SEO**
- Go to the specific page tab (e.g., "Home Page", "Programs Page")
- Enable custom SEO
- Fill in the **Canonical URL** field (or leave empty to auto-generate)

**In Code:**
```typescript
const metadata = await generateGlobalMetadata({
    locale,
    pageType: "homePage",
    pageCanonicalUrl: "https://fundedtradermarkets.com/",
});
```

### 2. **Robots Meta Tags**
Control search engine indexing and crawling behavior per page.

**In Payload CMS:**
- Navigate to **Settings → Global SEO → Defaults**
- Configure **Default Robots** settings (index, follow)
- Or override per page in the page-specific tabs

**What it does:**
- `index: true` - Allows search engines to index the page
- `index: false` - Prevents search engines from indexing
- `follow: true` - Allows search engines to follow links on the page
- `follow: false` - Prevents search engines from following links

### 3. **JSON-LD Structured Data**
Add schema.org structured data to help search engines understand your content.

#### Global Organization Schema
Add a global organization schema that appears on all pages:

**In Payload CMS:**
- Navigate to **Settings → Global SEO → Default SEO**
- Scroll to **Organization Schema** textarea
- Paste your schema.org Organization JSON

**Example JSON-LD for Organization:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Funded Trader Markets",
  "url": "https://fundedtradermarkets.com",
  "logo": "https://fundedtradermarkets.com/logo.png",
  "sameAs": [
    "https://twitter.com/ftmarkets",
    "https://facebook.com/ftmarkets",
    "https://linkedin.com/company/ftmarkets"
  ]
}
```

**In Code:**
```tsx
import { JsonLdSchema } from "@/components/seo/json-ld-schema";
import { getOrganizationSchema } from "@/lib/seo/global-seo";

export default async function MyPage({ params }) {
    const { locale } = await params;
    const orgSchema = await getOrganizationSchema(locale);
    
    return (
        <>
            <JsonLdSchema schema={orgSchema} />
            {/* Your page content */}
        </>
    );
}
```

#### Page-Specific Schema
Add page-specific schema (e.g., Product, Article, FAQPage):

**In Payload CMS:**
- Navigate to **Settings → Global SEO**
- Go to the specific page tab
- Enable custom SEO
- Scroll to **JSON-LD Schema** textarea
- Paste your schema.org JSON (the SEO team can create this)

**In Code:**
```tsx
import { JsonLdSchema } from "@/components/seo/json-ld-schema";
import { getPageJsonLdSchema, getOrganizationSchema } from "@/lib/seo/global-seo";

export default async function MyPage({ params }) {
    const { locale } = await params;
    
    // Get both organization and page-specific schema
    const [orgSchema, pageSchema] = await Promise.all([
        getOrganizationSchema(locale),
        getPageJsonLdSchema(locale, "homePage"),
    ]);
    
    return (
        <>
            {/* Organization schema (global) */}
            <JsonLdSchema schema={orgSchema} />
            
            {/* Page-specific schema */}
            <JsonLdSchema schema={pageSchema} />
            
            {/* Your page content */}
        </>
    );
}
```

## Usage Example

Here's a complete example of using all SEO features in a page:

```tsx
import type { Metadata } from "next";
import { JsonLdSchema } from "@/components/seo/json-ld-schema";
import { generateGlobalMetadata, getPageJsonLdSchema } from "@/lib/seo/global-seo";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;

    return generateGlobalMetadata({
        locale,
        pageType: "homePage",
        pageTitle: "Home",
        pageDescription: "Welcome to Funded Trader Markets",
        pageCanonicalUrl: "https://fundedtradermarkets.com/",
    });
}

export default async function HomePage({ params }) {
    const { locale } = await params;
    
    // Get both organization and page-specific schema
    const [orgSchema, pageSchema] = await Promise.all([
        getOrganizationSchema(locale),
        getPageJsonLdSchema(locale, "homePage"),
    ]);

    return (
        <>
            {/* Global organization schema */}
            <JsonLdSchema schema={orgSchema} />
            
            {/* Page-specific schema */}
            <JsonLdSchema schema={pageSchema} />
            
            {/* Your page content */}
        </>
    );
}
```

## Available Page Types

- `homePage` - Home/landing page
- `programsPage` - Programs listing page
- `blogPage` - Blog listing page
- `faqPage` - FAQ listing page
- `oneStepPage` - 1-Step program page
- `twoStepPage` - 2-Step program page
- `instantPage` - Instant funding page
- `howItWorksPage` - How It Works page
- `affiliatesPage` - Affiliates page

## Priority Order

The system uses the following priority for SEO values:

1. **Page-specific parameters** (passed to `generateGlobalMetadata`)
2. **Page type overrides** (from Global SEO CMS, if enabled)
3. **Global defaults** (from Global SEO → Defaults tab)
4. **Hardcoded fallbacks** (in the code)

## Resources

- [Schema.org](https://schema.org/) - Reference for JSON-LD structured data
- [Google Rich Results Test](https://search.google.com/test/rich-results) - Validate your JSON-LD
- [Robots Meta Tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) - Google's documentation

