# Affiliate Tracking Rules & System Documentation

## Overview

The affiliate tracking system manages commission attribution for sales through both **TrackNow** (postbacks) and **AffiliateWP** (internal referrals). This document explains how customer binding, commission eligibility, and the 60-day lifetime tracking work.

## Cookie-Based Tracking

### Affiliate Cookies

Two cookies are set when a customer clicks an affiliate link:

1. **`affiliate_username`** (AffiliateWP)
   - Set via: `/ref/{username}` route or `?affiliate_username={username}` parameter
   - Duration: 30 days
   - Used for: AffiliateWP referral creation

2. **`click_id`** (TrackNow)
   - Set via: `?click_id={id}` parameter
   - Duration: 30 days
   - Used for: TrackNow postback attribution

### Cookie Expiration

- Cookies expire after **30 days**
- If a customer doesn't purchase within 30 days, they need to click a new affiliate link
- **Exception:** Once a customer makes their first purchase, they are permanently bound to that affiliate (see Customer Binding below)

## Customer Binding Rules

### First Purchase = Permanent Binding

When a customer makes their **first purchase** with an affiliate link:

1. The customer is **permanently bound** to that affiliate
2. This binding is based on **email address**
3. The binding **cannot be changed** - clicking a different affiliate link won't reassign them
4. All future commission eligibility is tied to this original affiliate

### Identification

- Customers are identified by **email address only** (not user ID)
- Same email = same customer across all purchases
- Email matching is case-sensitive and exact

## Commission Payment Rules

### The 60-Day Lifetime Window

Commissions are paid based on a **60-day rolling window**:

```
Purchase 1 (Day 0) → ✅ Commission paid
    ↓
  [60-day window starts]
    ↓
Purchase 2 (Day 30) → ✅ Commission paid (within window)
    ↓
  [60-day window RESETS from Day 30]
    ↓
Purchase 3 (Day 50) → ✅ Commission paid (within window from Purchase 2)
    ↓
  [60-day window RESETS from Day 50]
    ↓
Purchase 4 (Day 140) → ❌ NO commission (>60 days since Purchase 3)
    ↓
  [60-day window RESETS from Day 140]
    ↓
Purchase 5 (Day 170) → ✅ Commission paid (within 60 days of Purchase 4)
```

### Key Rules

1. **New Customer (First Purchase)**
   - ✅ Commission is ALWAYS paid
   - Customer is bound to the affiliate
   - 60-day timer starts

2. **Returning Customer - Within 60 Days**
   - ✅ Commission is paid
   - Window resets from this purchase date
   - Same affiliate as original

3. **Returning Customer - After 60 Days**
   - ❌ NO commission paid
   - Window still resets from this purchase
   - Customer remains bound to original affiliate
   - Next purchase (if within 60 days) WILL get commission

4. **Affiliate Remains the Same**
   - Customer is permanently bound to first affiliate
   - No re-assignment even if they click a new affiliate link
   - Even if outside 60-day window, binding persists

## Purchase Type Exclusions

Certain purchase types **never** receive affiliate commission:

- ❌ `purchaseType: "reset-order"` - Account resets
- ❌ `purchaseType: "activation-order"` - Account activations
- ✅ `purchaseType: "original-order"` - New account purchases (only type that pays commission)

### Failed Purchases

- Purchases with status `failed` are excluded from affiliate history
- Only these statuses count: `pending`, `completed`, `refunded`

## Detailed Scenarios

### Scenario 1: New Customer Journey

```
Day 0: Customer clicks affiliate link "John"
  → affiliate_username cookie set (30 days)
  
Day 5: Customer purchases $299 account
  → ✅ Commission paid to John
  → Customer permanently bound to John
  → 60-day window starts

Day 35: Customer purchases another $299 account
  → ✅ Commission paid to John (within 60 days)
  → 60-day window resets from Day 35

Day 50: Customer clicks different affiliate link "Sarah"
  → Cookie changes to Sarah, but...
  → Customer still bound to John (no effect)
  
Day 55: Customer purchases $500 account
  → ✅ Commission paid to John (within 60 days of Day 35)
  → Still bound to John, not Sarah
```

### Scenario 2: Expired Cookie, Bound Customer

```
Day 0: Customer clicks affiliate link "Mike"
  → affiliate_username cookie set (30 days)
  
Day 10: Customer purchases $299 account
  → ✅ Commission paid to Mike
  → Customer bound to Mike
  
Day 45: Cookie expires (30 days later)
  → Cookie gone, but customer still bound in database

Day 50: Customer returns (no cookie, no affiliate link)
  → System finds previous purchase (Day 10)
  → 40 days since last purchase (within 60)
  → ✅ Commission paid to Mike (from database binding)
```

### Scenario 3: Outside 60-Day Window

```
Day 0: Customer purchases with affiliate "Alex"
  → ✅ Commission paid to Alex
  → 60-day window starts

Day 90: Customer purchases again (no affiliate link)
  → 90 days since last purchase (>60 days)
  → ❌ NO commission paid
  → 60-day window RESETS from Day 90
  → Customer still bound to Alex

Day 110: Customer purchases again
  → 20 days since last purchase (within 60)
  → ✅ Commission paid to Alex
  → Window resets from Day 110
```

### Scenario 4: Reset Orders (No Commission)

```
Day 0: Customer purchases $299 account with affiliate "Tom"
  → purchaseType: "original-order"
  → ✅ Commission paid to Tom

Day 20: Customer purchases reset fee ($50)
  → purchaseType: "reset-order"
  → ❌ NO commission (reset orders excluded)
  → 60-day window does NOT reset

Day 30: Customer purchases new $500 account
  → purchaseType: "original-order"
  → ✅ Commission paid to Tom (30 days from Day 0)
```

## Technical Implementation

### Data Flow

1. **Affiliate Link Click**
   - Route: `/ref/{username}` or query param `?affiliate_username={username}`
   - Sets cookie: `affiliate_username` (30 days)
   - File: `apps/web/src/app/[locale]/ref/[username]/route.ts`

2. **Purchase Creation**
   - Cookie is read and stored in purchase metadata
   - Files:
     - `apps/web/src/app/api/create-purchase/route.ts`
     - `apps/web/src/app/api/inapp-create-purchase/route.ts`
     - `apps/web/src/app/api/orders/create-pending/route.ts`
     - `apps/web/src/app/api/bridgerpay/checkout/route.ts`
     - `apps/web/src/app/api/paytiko/checkout/route.ts`

3. **Payment Completion (Webhook)**
   - Webhook processes completed payment
   - Calls `processAffiliateAttribution()` for TrackNow
   - Calls `processAffiliateWPConversion()` for AffiliateWP
   - Files:
     - `apps/web/src/app/api/webhooks/confirmo/route.ts`
     - `apps/web/src/app/api/webhooks/bridgerpay/route.ts`

4. **Attribution Logic**
   - `getCustomerAffiliateInfo()` checks:
     - Previous purchases by email
     - First affiliated purchase (for binding)
     - Most recent affiliated purchase (for 60-day window)
     - Days since last purchase
   - Returns: `isWithinLifetimeWindow: boolean`
   - File: `apps/web/src/lib/tracknow.ts`

5. **Commission Decision**
   - TrackNow: Sends postback if eligible
   - AffiliateWP: Creates referral if eligible
   - Files:
     - `apps/web/src/lib/tracknow.ts` (`processAffiliateAttribution`)
     - `apps/web/src/lib/affiliatewp.ts` (`processAffiliateWPConversion`)

### Key Functions

#### `getCustomerAffiliateInfo(payload, email, currentOrderNumber)`

Returns customer affiliate history:

```typescript
{
  isNewCustomer: boolean,              // Has no previous purchases
  hasPreviousPurchases: boolean,       // Has any previous purchases
  existingAffiliateId: string | null,  // First affiliate ID
  hasAnyAffiliateAssociation: boolean, // Has any previous affiliate
  isWithinLifetimeWindow: boolean,     // Within 60 days of last purchase
  daysSinceLastPurchase: number | null,// Days since most recent purchase
  lastPurchaseDate: string | null      // Date of most recent purchase
}
```

#### Commission Decision Logic

**TrackNow & AffiliateWP:**

```typescript
if (isNewCustomer) {
  → Pay commission (new customer)
} else if (hasAnyAffiliateAssociation && isWithinLifetimeWindow) {
  → Pay commission (returning customer within 60 days)
} else if (hasAnyAffiliateAssociation && !isWithinLifetimeWindow) {
  → NO commission (returning customer outside 60 days)
  → But still record purchase (resets timer)
} else {
  → NO commission (returning customer, no affiliate)
}
```

### Database Storage

**Purchase Record:**
```typescript
{
  affiliateId: string,           // Stored at root level
  affiliateEmail: string,        // Stored at root level
  affiliateUsername: string,     // Stored at root level (AffiliateWP)
  metadata: {
    clickId: string,            // TrackNow tracking
    affiliateUsername: string,  // AffiliateWP tracking
    tracknow: {
      affiliateId: string,
      postbackSent: boolean,
      timestamp: string
    },
    affiliatewp: {
      referralSent: boolean,
      referralId: number,
      affiliateId: number,
      timestamp: string
    }
  }
}
```

## Logging & Debugging

### Key Log Messages

**Customer History:**
```
[TrackNow] Customer affiliate history: {
  customerEmail,
  totalPreviousPurchases,
  firstAffiliatedPurchase,
  previousPurchases
}
```

**Lifetime Window Calculation:**
```
[TrackNow] Lifetime window calculation: {
  customerEmail,
  mostRecentAffiliatedPurchase,
  daysSinceLastPurchase,
  isWithinLifetimeWindow,
  lifetimeWindowDays: 60
}
```

**Attribution Decision:**
```
[TrackNow] Attribution decision: {
  orderId,
  isNewCustomer,
  hasAnyAffiliateAssociation,
  isWithinLifetimeWindow,
  daysSinceLastPurchase,
  shouldSendPostback,
  reason
}
```

**Conversion Decision (AffiliateWP):**
```
[AffiliateWP] Conversion decision: {
  shouldSendReferral,
  referralReason,
  isNewCustomer,
  hasAnyAffiliateAssociation,
  isWithinLifetimeWindow,
  daysSinceLastPurchase
}
```

### Reason Codes

- `new_customer_with_affiliate` - First purchase, commission paid
- `returning_customer_within_lifetime` - Within 60 days, commission paid
- `returning_customer_outside_lifetime_window` - Outside 60 days, no commission
- `returning_customer_no_affiliate` - No previous affiliate binding
- `skip_reset-order` - Reset order excluded
- `skip_activation-order` - Activation order excluded
- `referral_already_exists` - Duplicate prevention (AffiliateWP)

## Duplicate Prevention

### AffiliateWP Only

- Checks `metadata.affiliatewp.referralSent` before creating referral
- Prevents duplicate referrals from webhook retries
- TrackNow relies on their deduplication system

## Configuration

### Cookie Settings

**File:** `apps/web/src/lib/affiliatewp-config.ts`
```typescript
export const AFFILIATEWP_CONFIG = {
  cookie: {
    name: "affiliate_username",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

**File:** `apps/web/src/lib/tracknow-config.ts`
```typescript
export const TRACKNOW_CONFIG = {
  cookie: {
    name: "click_id",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};
```

### Lifetime Window

The 60-day window is hardcoded in:
- `apps/web/src/lib/tracknow.ts` (line ~209)
- Check: `daysSince <= 60`

To change, modify the comparison value.

## Summary Table

| Scenario | Commission Paid | Window Resets | Binding Changes |
|----------|----------------|---------------|-----------------|
| New customer with affiliate | ✅ Yes | Starts | Binds to affiliate |
| Returning, within 60 days | ✅ Yes | Yes | No (stays with original) |
| Returning, after 60 days | ❌ No | Yes | No (stays with original) |
| Reset/Activation order | ❌ No | No | No change |
| No affiliate link/cookie | ❌ No* | No* | No change |

*Unless customer was previously bound and within 60-day window

## Testing Checklist

When testing affiliate tracking:

- [ ] New customer with affiliate link gets commission
- [ ] Returning customer within 60 days gets commission
- [ ] Returning customer after 60 days does NOT get commission
- [ ] Purchase after >60 days resets timer correctly
- [ ] Customer clicking different affiliate stays with original
- [ ] Reset orders do not pay commission
- [ ] Activation orders do not pay commission
- [ ] Cookie expiration doesn't affect bound customers
- [ ] Email-based identification works across sessions
- [ ] Duplicate webhooks don't create duplicate referrals (AffiliateWP)

## Maintenance Notes

### Changing the Lifetime Window

To change from 60 days to a different duration:

1. Edit `apps/web/src/lib/tracknow.ts`
2. Find: `isWithinLifetimeWindow = daysSince <= 60;`
3. Change `60` to desired number of days
4. This affects both TrackNow and AffiliateWP (shared function)

### Adding New Purchase Types

To exclude new purchase types from commission:

1. Edit both `apps/web/src/lib/tracknow.ts` and `apps/web/src/lib/affiliatewp.ts`
2. Add to the exclusion check:
   ```typescript
   if (
     purchase.purchaseType === "reset-order" ||
     purchase.purchaseType === "activation-order" ||
     purchase.purchaseType === "your-new-type"
   ) {
     // Skip commission
   }
   ```

### Monitoring Commission Accuracy

Key metrics to monitor:
- Total commissions paid vs expected
- Commission rejection rate (outside window)
- Average days between customer purchases
- Percentage of customers with >60 day gaps
- Duplicate referral occurrences

