# Pricing Cache Configuration

## Overview

The pricing system includes in-memory caching to improve performance and reduce database queries. This document explains how to configure and control the caching behavior.

## Cache Types

The system caches three types of data:

1. **Programs Cache** - Stores program data (1 minute TTL)
2. **Discounts Cache** - Stores calculated discounts (30 seconds TTL)
3. **Coupons Cache** - Stores active coupons (2 minutes TTL)

## Disabling Cache

To disable all pricing caches, set the following environment variable:

```bash
DISABLE_PRICING_CACHE=true
```

### When to Disable Cache

Disable caching in these scenarios:

- **Debugging pricing issues** - Ensures you always see fresh data
- **Testing new pricing logic** - Prevents stale cached results
- **Investigating discount problems** - Verifies calculations in real-time
- **Development** - Makes testing changes easier

### How to Disable

#### Local Development

Add to your `.env.local` file:

```bash
DISABLE_PRICING_CACHE=true
```

Then restart your development server:

```bash
pnpm dev
```

#### Production (Use with caution)

Only disable in production for temporary debugging:

```bash
DISABLE_PRICING_CACHE=true pnpm start
```

**Warning:** Disabling cache in production will increase database load significantly.

## Cache Status

The cache is enabled by default. When disabled via environment variable, all pricing data will be fetched fresh on every request.

## Performance Impact

| Cache Status | Database Queries | Response Time | Recommended For |
|--------------|-----------------|---------------|-----------------|
| Enabled (default) | Low | Fast (~50-100ms) | Production |
| Disabled | High | Slower (~200-500ms) | Development/Debugging |

## Cache TTL Values

Current cache durations:

- **Programs**: 1 minute (60,000ms)
- **Discounts**: 30 seconds (30,000ms)
- **Coupons**: 2 minutes (120,000ms)

These values are optimized for:
- Fresh pricing when users switch between programs
- Reduced database load
- Better user experience in the variations page

## Troubleshooting

### Issue: Prices not updating when switching programs

1. Try disabling cache temporarily: `DISABLE_PRICING_CACHE=true`
2. If it works with cache disabled, the cache TTL might be too long
3. If it still doesn't work, check the variations page state management

### Issue: Slow performance

1. Ensure cache is enabled (remove or set to `false`)
2. Check cache hit rate in logs
3. Consider increasing TTL values if appropriate

## Code References

The cache implementation is in:
- `apps/web/src/data/programs.ts` - Main cache logic
- `apps/web/src/app/[locale]/(app)/variations/` - Variations page components
- `apps/web/src/hooks/useDiscountedPricing.ts` - Client-side pricing hook

## Related Issues

This cache control was added to help debug:
- Price not updating when switching between 1-step programs
- Stale discount data in variations page
- Race conditions in pricing calculations

