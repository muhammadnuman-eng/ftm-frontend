#!/bin/bash

# Batch translation script for multiple globals and locales
# Usage: ./scripts/translate-all-globals.sh

set -e

cd "$(dirname "$0")/.."

# Configuration
LOCALES="${TARGET_LOCALES:-es}"
GLOBALS="${GLOBAL_SLUGS:-how-it-works affiliates}"
DRY_RUN="${DRY_RUN:-false}"

echo "🌍 Batch Global Translation"
echo "============================"
echo "Locales: $LOCALES"
echo "Globals: $GLOBALS"
echo "Dry Run: $DRY_RUN"
echo ""

# Split into arrays
read -ra LOCALE_ARRAY <<< "$LOCALES"
read -ra GLOBAL_ARRAY <<< "$GLOBALS"

TOTAL=$((${#LOCALE_ARRAY[@]} * ${#GLOBAL_ARRAY[@]}))
CURRENT=0

for LOCALE in "${LOCALE_ARRAY[@]}"; do
    for GLOBAL in "${GLOBAL_ARRAY[@]}"; do
        CURRENT=$((CURRENT + 1))
        echo "[$CURRENT/$TOTAL] Translating $GLOBAL to $LOCALE..."
        
        if [ "$DRY_RUN" = "true" ]; then
            GLOBAL_SLUG=$GLOBAL TARGET_LOCALE=$LOCALE DRY_RUN=true pnpm tsx --env-file=.env.local scripts/translate-global.ts
        else
            GLOBAL_SLUG=$GLOBAL TARGET_LOCALE=$LOCALE pnpm tsx --env-file=.env.local scripts/translate-global.ts
        fi
        
        echo "✓ Done"
        echo ""
    done
done

echo "✅ All translations completed!"

