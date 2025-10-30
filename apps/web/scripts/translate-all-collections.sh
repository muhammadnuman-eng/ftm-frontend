#!/bin/bash

# Batch translation script for multiple collections and locales
# Uses the existing translate-payload.ts script
# Usage: ./scripts/translate-all-collections.sh

set -e

cd "$(dirname "$0")/.."

# Configuration
LOCALES="${TARGET_LOCALES:-es}"
COLLECTIONS="${COLLECTION_SLUGS:-faqs posts}"
DRY_RUN_FLAG=""

if [ "${DRY_RUN:-false}" = "true" ]; then
    DRY_RUN_FLAG="--dry-run"
fi

echo "🌍 Batch Collection Translation"
echo "================================"
echo "Locales: $LOCALES"
echo "Collections: $COLLECTIONS"
echo "Dry Run: ${DRY_RUN:-false}"
echo ""

# Convert to comma-separated for translate-payload.ts
LOCALES_CSV=$(echo "$LOCALES" | tr ' ' ',')
COLLECTIONS_CSV=$(echo "$COLLECTIONS" | tr ' ' ',')

pnpm tsx --env-file=.env.local scripts/translate-payload.ts \
    --collections=$COLLECTIONS_CSV \
    --locales=$LOCALES_CSV \
    $DRY_RUN_FLAG

echo ""
echo "✅ All collections translated!"

