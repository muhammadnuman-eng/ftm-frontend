#!/bin/bash

# Simplified collection translation wrapper for translate-payload.ts
# Usage: COLLECTION_SLUG=faqs TARGET_LOCALE=es ./scripts/translate-collection.sh

set -e

cd "$(dirname "$0")/.."

COLLECTION_SLUG="${COLLECTION_SLUG:-faqs}"
TARGET_LOCALE="${TARGET_LOCALE:-es}"
DRY_RUN_FLAG=""

if [ "$DRY_RUN" = "true" ]; then
    DRY_RUN_FLAG="--dry-run"
fi

echo "🌍 Collection Translation"
echo "========================"
echo "Collection: $COLLECTION_SLUG"
echo "Target Locale: $TARGET_LOCALE"
echo "Dry Run: ${DRY_RUN:-false}"
echo ""

pnpm tsx --env-file=.env.local scripts/translate-payload.ts \
    --collections=$COLLECTION_SLUG \
    --locales=$TARGET_LOCALE \
    $DRY_RUN_FLAG

echo ""
echo "✅ Done!"

