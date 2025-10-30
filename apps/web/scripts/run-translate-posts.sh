#!/bin/bash

# Posts Translation Script
# Usage: ./run-translate-posts.sh [options]
# Options:
#   --dry-run          Show what would be translated without making changes
#   --overwrite        Overwrite existing translations
#   --verbose          Show detailed output
#   --locales=tr,de    Translate only specific locales (comma-separated)
#   --cache-file=path  Use specific cache file

# Set default environment variables
export TRANSLATION_BATCH_SIZE=${TRANSLATION_BATCH_SIZE:-20}
export TRANSLATION_REQUEST_DELAY_MS=${TRANSLATION_REQUEST_DELAY_MS:-50}
export POSTS_PAGE_SIZE=${POSTS_PAGE_SIZE:-100}
export TRANSLATION_CACHE_FILE=${TRANSLATION_CACHE_FILE:-"./translation-cache.json"}

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable is not set."
    echo "Please set your OpenAI API key:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    exit 1
fi

# Run the translation script with all passed arguments
echo "Starting Posts translation with options: $@"
echo "Cache file: $TRANSLATION_CACHE_FILE"
echo "Batch size: $TRANSLATION_BATCH_SIZE"
echo "Request delay: ${TRANSLATION_REQUEST_DELAY_MS}ms"
echo "Page size: $POSTS_PAGE_SIZE"
echo ""

# Use pnpm to run the script (following user preference)
pnpm tsx apps/web/scripts/translate-posts.ts "$@"
