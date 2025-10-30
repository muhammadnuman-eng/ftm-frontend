# Collection Translation

Translate Payload collections (FAQs, Posts, etc.) to target locales using the existing `translate-payload.ts` script.

## ✅ Use Existing Script

**Good news!** You already have a powerful collection translation script: `translate-payload.ts`

It handles:
- ✅ All localized fields automatically
- ✅ Rich text with structure preservation  
- ✅ Nested arrays and groups
- ✅ Batch processing
- ✅ Caching
- ✅ Retry logic

## Available Scripts

### 1. `translate-collection.sh` - Simple Wrapper
Convenient wrapper for translating a single collection.

### 2. `translate-all-collections.sh` - Batch Translation
Batch translate multiple collections at once.

### 3. `translate-payload.ts` - Full-Featured (Recommended)
The original comprehensive script with all features.

## Features

- ✅ Translates any collection with localized fields
- ✅ Processes documents in pages (handles large collections)
- ✅ Preserves non-translatable fields (IDs, dates, relationships, etc.)
- ✅ Supports dry-run mode
- ✅ Smart content detection (skips URLs, IDs, etc.)
- ✅ Batch API calls for efficiency
- ✅ Progress tracking and error handling

## Prerequisites

**Environment variables** (in `.env.local`):
```bash
OPENAI_API_KEY=your_openai_api_key
PAYLOAD_SECRET=your_payload_secret
DATABASE_URI=your_database_connection_string
```

## Quick Start

### Method 1: Using the Wrapper (Easiest)

```bash
cd apps/web

# Translate FAQs to Spanish (dry run)
COLLECTION_SLUG=faqs TARGET_LOCALE=es DRY_RUN=true ./scripts/translate-collection.sh

# Apply translation
COLLECTION_SLUG=faqs TARGET_LOCALE=es ./scripts/translate-collection.sh

# Translate Posts to Spanish
COLLECTION_SLUG=posts TARGET_LOCALE=es ./scripts/translate-collection.sh
```

### Method 2: Using translate-payload.ts Directly (Most Powerful)

```bash
cd apps/web

# Translate FAQs to Spanish
pnpm tsx --env-file=.env.local scripts/translate-payload.ts --collections=faqs --locales=es --dry-run

# Apply
pnpm tsx --env-file=.env.local scripts/translate-payload.ts --collections=faqs --locales=es

# Multiple collections
pnpm tsx --env-file=.env.local scripts/translate-payload.ts --collections=faqs,posts --locales=es,de,tr

# With overwrite
pnpm tsx --env-file=.env.local scripts/translate-payload.ts --collections=faqs --locales=es --overwrite
```

### Method 3: Batch Translation

```bash
cd apps/web

# Batch translate multiple collections to multiple locales
COLLECTION_SLUGS="faqs posts" TARGET_LOCALES="es de tr ar ms" ./scripts/translate-all-collections.sh

# Dry run
COLLECTION_SLUGS="faqs posts" TARGET_LOCALES="es" DRY_RUN=true ./scripts/translate-all-collections.sh
```

## Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_key

# Collection slug (required)
COLLECTION_SLUG=faqs

# Target locale (default: es)
TARGET_LOCALE=es

# OpenAI model (default: gpt-4o-mini)
OPENAI_TRANSLATE_MODEL=gpt-4o-mini

# Batch size for API calls (default: 10)
BATCH_SIZE=10

# Page size for fetching documents (default: 50)
PAGE_SIZE=50

# Dry run mode (default: false)
DRY_RUN=true
```

## Supported Collections

Any collection with localized fields, including:
- `faqs` - FAQ questions and answers
- `posts` - Blog posts with content
- `testimonials` - Customer testimonials
- `video-testimonials` - Video testimonial descriptions
- `categories` - Category names and descriptions
- `tags` - Tag names and descriptions
- `authors` - Author bios
- And any custom collections with localized fields

## Output Example

```
🌍 Collection Translation Script
Collection: faqs
Target Locale: es
Dry Run: No

Connecting to Payload CMS...
Found 25 documents in faqs

📄 Processing page 1/1...

  📝 Translating: "What is a Forex Prop Firm?"
    Found 4 translatable strings
    ✓ Updated successfully

  📝 Translating: "What is a Forex Funded Account?"
    Found 3 translatable strings
    ✓ Updated successfully

  📝 Translating: "How Do You Qualify for a Simulated Funded Account?"
    Found 5 translatable strings
    ✓ Updated successfully

==================================================
✅ Translation completed!
   Translated: 25 documents
   Skipped: 0 documents
==================================================
```

## How It Works

1. **Fetch Documents**: Gets all documents from the collection (paginated)
2. **Analyze Each**: Identifies translatable strings in each document
3. **Translate**: Uses OpenAI API to translate content
4. **Merge Data**: Combines translations with original structure
5. **Update**: Saves translated version for target locale

## What Gets Translated

- ✅ Text fields (`question`, `title`, etc.)
- ✅ Textarea fields (`answer`, `excerpt`, etc.)
- ✅ Rich text fields (`content`, etc.)
- ✅ Arrays with localized fields
- ✅ Nested localized fields

## What Doesn't Get Translated

- ❌ IDs and slugs
- ❌ Dates and timestamps
- ❌ URLs and links
- ❌ Status fields
- ❌ Numbers and booleans
- ❌ Relationships
- ❌ Media uploads

## Notes

- The script processes documents in pages for memory efficiency
- Rich text fields are translated while preserving HTML structure
- Each document is updated independently (isolated failures)
- Progress is logged for each document
- Dry run mode shows what would be translated without applying changes

## Troubleshooting

### Error: "No translatable content found"
Some documents may not have any localized text fields. This is normal and they are skipped.

### Error: "Failed to translate batch"
Check your `OPENAI_API_KEY` and internet connection. The script will stop on errors to prevent partial translations.

### Slow Performance
Adjust `BATCH_SIZE` and `PAGE_SIZE`:
- Increase `BATCH_SIZE` for fewer API calls (but larger payloads)
- Decrease `PAGE_SIZE` if running into memory issues

## Examples

### Translate All Blog Content
```bash
# Just posts
COLLECTION_SLUG=posts TARGET_LOCALE=es pnpm tsx --env-file=.env.local scripts/translate-collection.ts

# Posts, categories, tags, and authors
COLLECTION_SLUGS="posts categories tags authors" TARGET_LOCALES="es de tr" ./scripts/translate-all-collections.sh
```

### Translate FAQs to All Locales
```bash
COLLECTION_SLUGS="faqs faq-categories" TARGET_LOCALES="es de tr ar ms" ./scripts/translate-all-collections.sh
```

## Related Scripts

- `translate-global.ts` - Translate globals (homepage, affiliates, etc.)
- `translate-homepage.ts` - Translate homepage with JSON + AI
- `translate-payload.ts` - Generic translation for all collections and globals

