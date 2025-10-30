# Posts Translation Script

This is an optimized translation script specifically designed for translating the Posts collection in PayloadCMS. It's much faster and more efficient than the original `translate-payload.ts` script.

## Key Improvements

### Performance Optimizations
- **Focused on Posts only**: Only processes the Posts collection, not all collections and globals
- **Parallel processing**: Processes multiple posts simultaneously instead of sequentially
- **Larger batch sizes**: Increased from 8 to 20 items per batch
- **Reduced delays**: Decreased request delay from 150ms to 50ms
- **Larger page sizes**: Processes 100 posts at once instead of 50
- **Better caching**: Improved translation caching system

### Posts Collection Support
- Translates `title` (text field)
- Translates `excerpt` (textarea field)  
- Translates `content` (richText field with lexical editor)
- Preserves `slug` field (not localized for SEO)
- Handles complex rich text structures properly

## Usage

### Quick Start
```bash
# Set your OpenAI API key
export OPENAI_API_KEY="your-api-key-here"

# Run with default settings (translates all locales)
./apps/web/scripts/run-translate-posts.sh

# Dry run to see what would be translated
./apps/web/scripts/run-translate-posts.sh --dry-run

# Overwrite existing translations
./apps/web/scripts/run-translate-posts.sh --overwrite

# Translate only specific locales
./apps/web/scripts/run-translate-posts.sh --locales=tr,de

# Verbose output
./apps/web/scripts/run-translate-posts.sh --verbose
```

### Environment Variables

You can customize the script behavior with these environment variables:

```bash
# Translation settings
export TRANSLATION_BATCH_SIZE=20          # Items per batch (default: 20)
export TRANSLATION_REQUEST_DELAY_MS=50     # Delay between requests (default: 50ms)
export POSTS_PAGE_SIZE=100                # Posts per page (default: 100)
export TRANSLATION_CACHE_FILE="./cache.json"  # Cache file path

# OpenAI settings
export OPENAI_API_KEY="your-api-key"      # Required
export OPENAI_TRANSLATE_MODEL="gpt-4o-mini"  # Model to use
export OPENAI_BASE_URL="https://api.openai.com/v1"  # API base URL
```

### Command Line Options

- `--dry-run`: Show what would be translated without making changes
- `--overwrite`: Overwrite existing translations (default: skip if exists)
- `--verbose`: Show detailed output
- `--locales=tr,de,ar,ms`: Translate only specific locales (comma-separated)

## Supported Locales

- `en` (English) - Source locale
- `tr` (Turkish)
- `de` (German) 
- `ar` (Arabic)
- `ms` (Malay)

## Translation Quality

The script uses specialized prompts for:
- **Prop trading and fintech terminology**
- **Formal address forms** (Sie in German, usted in Spanish, etc.)
- **Consistent terminology** (funded account, evaluation phase, payout, etc.)
- **Preserving brand names** (FTM, MT5, etc.)
- **Natural, fluent translations**

## Caching

The script includes intelligent caching:
- **Persistent cache**: Saves translations to avoid re-translating
- **Cache file**: Configurable location (default: `./translation-cache.json`)
- **Automatic cache loading**: Loads existing cache on startup
- **Incremental updates**: Only translates new or changed content

## Error Handling

- **Retry logic**: Up to 3 retries with exponential backoff
- **Graceful fallbacks**: Falls back to English if translation fails
- **Detailed logging**: Shows progress and errors clearly
- **Dry run mode**: Test without making changes

## Performance Comparison

| Metric | Original Script | Posts Script | Improvement |
|--------|----------------|--------------|-------------|
| Batch Size | 8 items | 20 items | 2.5x faster |
| Request Delay | 150ms | 50ms | 3x faster |
| Page Size | 50 posts | 100 posts | 2x faster |
| Processing | Sequential | Parallel | 5-10x faster |
| Scope | All collections | Posts only | Focused |

## Troubleshooting

### Common Issues

1. **Missing API Key**
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```

2. **Rate Limiting**
   - Increase `TRANSLATION_REQUEST_DELAY_MS`
   - Reduce `TRANSLATION_BATCH_SIZE`

3. **Memory Issues**
   - Reduce `POSTS_PAGE_SIZE`
   - Process fewer posts at once

4. **Translation Quality**
   - Check the system prompt in the script
   - Verify locale-specific terminology

### Debug Mode

Run with verbose output to see detailed information:
```bash
./apps/web/scripts/run-translate-posts.sh --verbose --dry-run
```

## Example Output

```
Starting Posts translation with options: --verbose
Cache file: ./translation-cache.json
Batch size: 20
Request delay: 50ms
Page size: 100

Translating Posts from "en" to ["tr", "de", "ar", "ms"] (verbose).

[Posts] Starting translation process...

[Posts] Processing page 1 (25 posts)...

[Post] How to Start Trading with FTM (ID: 123)
[Success] Post 123 updated for locale tr (3 fields).
[Success] Post 123 updated for locale de (3 fields).
[Success] Post 123 updated for locale ar (3 fields).
[Success] Post 123 updated for locale ms (3 fields).

[Posts] Completed processing 25 posts.
Posts translation completed.
```
