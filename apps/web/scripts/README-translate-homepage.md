# Global Translation Scripts

These scripts translate Payload globals to target locales using AI translation (OpenAI).

## Available Scripts

### 1. `translate-homepage.ts` - Homepage Translation with JSON Support
Translates the homepage global using existing translations from a JSON file (e.g., `ftm_homepage_es.json`) and AI for missing content.

### 2. `translate-global.ts` - Generic Global Translation
Translates any Payload global using only AI translation (no JSON file required).

## Features

- ✅ Fetches homepage data from Payload CMS
- ✅ Uses existing translations from JSON file (e.g., `ftm_homepage_es.json`)
- ✅ Translates missing content using OpenAI API
- ✅ Updates the homepage global with translated content
- ✅ Supports dry-run mode to preview changes
- ✅ Configurable target locale and translation file

## Prerequisites

1. **Environment variables** (create a `.env` file if not exists):
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   PAYLOAD_SECRET=your_payload_secret
   DATABASE_URI=your_database_connection_string
   ```

2. **Optional configuration**:
   ```bash
   # Target locale (default: es)
   TARGET_LOCALE=es
   
   # Translation file name (default: ftm_homepage_es.json)
   TRANSLATION_FILE=ftm_homepage_es.json
   
   # OpenAI model (default: gpt-4o-mini)
   OPENAI_TRANSLATE_MODEL=gpt-4o-mini
   
   # Dry run mode (default: false)
   DRY_RUN=true
   ```

## Usage

### 1. Basic Usage (Spanish)
```bash
cd apps/web
pnpm tsx scripts/translate-homepage.ts
```

### 2. Dry Run (Preview Changes)
```bash
DRY_RUN=true pnpm tsx scripts/translate-homepage.ts
```

### 3. Different Target Locale
```bash
TARGET_LOCALE=de TRANSLATION_FILE=ftm_homepage_de.json pnpm tsx scripts/translate-homepage.ts
```

### 4. Using Different Translation File
```bash
TRANSLATION_FILE=custom_translations.json pnpm tsx scripts/translate-homepage.ts
```

## How It Works

1. **Load Existing Translations**: Reads the translation JSON file (e.g., `ftm_homepage_es.json`) if available
2. **Fetch Homepage Data**: Gets the English version of the homepage from Payload CMS
3. **Analyze Content**: Identifies all translatable strings (ignores URLs, IDs, technical fields)
4. **Match Translations**: Matches English content with existing translations from the JSON file
5. **AI Translation**: For any missing translations, uses OpenAI API to translate
6. **Update CMS**: Updates the homepage global with translated content

## Translation File Format

The script expects a JSON file with this structure:

```json
{
  "translations": {
    "hero": {
      "tagline": "Translated tagline",
      "headline": "Translated headline",
      ...
    },
    "features": [
      {
        "text": "Translated feature text",
        ...
      }
    ],
    ...
  }
}
```

See `ftm_homepage_es.json` for a complete example.

## Output

The script provides detailed output:

```
🌍 Homepage Translation Script
Target Locale: es
Translation File: ftm_homepage_es.json
Dry Run: No

✓ Found translation file: ftm_homepage_es.json
Connecting to Payload CMS...
Fetching homepage data (English)...
Fetching homepage data (es)...
Analyzing content...
Found 142 translatable strings

✓ Matched 138 translations from file
⚠ Need to translate 4 strings using AI

Translating remaining strings...
  Translating batch 1/1 (4 strings)...
✓ Translation complete

Building update payload...
Updating homepage global...
✓ Homepage updated successfully for locale: es

✅ Translation process completed!
```

## Notes

- The script automatically skips non-translatable content (URLs, IDs, icons, colors, etc.)
- Existing translations in the JSON file take priority over AI translation
- All translations are batched to optimize API usage
- The script preserves the structure of arrays and nested objects
- Brand names, program names (e.g., "FTM", "MT5"), and technical terms are not translated

## Troubleshooting

### Error: "Missing OPENAI_API_KEY"
Set your OpenAI API key in the environment:
```bash
export OPENAI_API_KEY=your_key_here
```

### Error: "Translation file not found"
Either create the translation file or the script will translate everything using AI.

### Error: "Failed to connect to Payload"
Check your `DATABASE_URI` and `PAYLOAD_SECRET` environment variables.

---

## Generic Global Translation (`translate-global.ts`)

Translate any global without needing a translation JSON file.

### Usage

#### Translate How It Works
```bash
cd apps/web

# Dry run
GLOBAL_SLUG=how-it-works TARGET_LOCALE=es DRY_RUN=true pnpm tsx --env-file=.env.local scripts/translate-global.ts

# Apply translation
GLOBAL_SLUG=how-it-works TARGET_LOCALE=es pnpm tsx --env-file=.env.local scripts/translate-global.ts
```

#### Translate Affiliates
```bash
cd apps/web

# Dry run
GLOBAL_SLUG=affiliates TARGET_LOCALE=es DRY_RUN=true pnpm tsx --env-file=.env.local scripts/translate-global.ts

# Apply translation
GLOBAL_SLUG=affiliates TARGET_LOCALE=es pnpm tsx --env-file=.env.local scripts/translate-global.ts
```

#### Supported Globals
- `homepage` (but use `translate-homepage.ts` if you have a JSON file)
- `how-it-works`
- `affiliates`
- `global-seo`
- `cookie-consent`
- `policies`
- `banners`
- `tools`
- `trading-updates`
- `commerce-config`
- `program-product-mappings`

### Configuration

```bash
# Required
OPENAI_API_KEY=your_key

# Target global slug (required)
GLOBAL_SLUG=how-it-works

# Target locale (default: es)
TARGET_LOCALE=es

# OpenAI model (default: gpt-4o-mini)
OPENAI_TRANSLATE_MODEL=gpt-4o-mini

# Batch size for API calls (default: 10)
BATCH_SIZE=10

# Dry run mode (default: false)
DRY_RUN=true
```

---

## Batch Translation Script

Translate multiple globals at once:

```bash
#!/bin/bash
# save as: translate-all-globals.sh

LOCALES="es de tr ar ms"
GLOBALS="how-it-works affiliates"

for LOCALE in $LOCALES; do
    for GLOBAL in $GLOBALS; do
        echo "Translating $GLOBAL to $LOCALE..."
        GLOBAL_SLUG=$GLOBAL TARGET_LOCALE=$LOCALE pnpm tsx --env-file=.env.local scripts/translate-global.ts
        echo "✓ Done"
        echo ""
    done
done
```

---

## Related Scripts

- `import-homepage-es.ts` - Imports pre-translated homepage data from JSON
- `translate-payload.ts` - Generic translation script for all collections and globals
- `translate-global.ts` - Translate any global using AI
- `translate-homepage.ts` - Translate homepage with JSON + AI hybrid approach

