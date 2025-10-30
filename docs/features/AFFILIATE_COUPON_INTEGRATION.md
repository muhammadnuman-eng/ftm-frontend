# Affiliate Coupon Integration

## Overview

Coupons can be associated with specific affiliates to track sales and attribute commissions. When a coupon has affiliate information, it serves as an alternative to cookie-based affiliate tracking.

## How Coupons Work with Affiliates

### Coupon Affiliate Fields

Each coupon can have three optional affiliate fields:

1. **`affiliateId`** (TrackNow)
   - TrackNow affiliate ID
   - Used for TrackNow postback attribution
   - Example: `"12345"`

2. **`affiliateEmail`** (Legacy)
   - Affiliate's email address
   - For backward compatibility with older systems
   - Example: `"affiliate@example.com"`

3. **`affiliateUsername`** (AffiliateWP)
   - AffiliateWP username
   - Used for AffiliateWP referral creation
   - Example: `"john_affiliate"`

### Coupon as Affiliate Attribution Method

Coupons provide an **alternative** way to track affiliate attribution:

**Method 1: Cookie-Based (Standard)**
```
Customer clicks /ref/john
  → Sets affiliate_username cookie
  → Cookie stored for 30 days
  → Used at checkout
```

**Method 2: Coupon-Based (Alternative)**
```
Customer uses coupon code "JOHN20"
  → Coupon has affiliateUsername: "john"
  → Affiliate info extracted from coupon
  → Used for commission (bypasses cookie)
```

## Priority: Coupon Over Cookie

When both exist, **coupon takes priority**:

```typescript
// Code flow in create-purchase routes:
let affiliateUsername = null;

// 1. Check if coupon has affiliate info
if (couponCode) {
  const validationResult = await validateCoupon({ code: couponCode, ... });
  if (validationResult.coupon) {
    affiliateUsername = validationResult.coupon.affiliateUsername; // Coupon first!
  }
}

// 2. If no coupon affiliate, use cookie
if (!affiliateUsername && affiliateUsernameCookie) {
  affiliateUsername = affiliateUsernameCookie; // Cookie as fallback
}
```

## Coupon Affiliate Validation

### Affiliate Binding Protection

Coupons enforce the **same affiliate binding rules** as cookie-based tracking:

**Scenario: Customer Already Bound to Affiliate A**

```
Customer's first purchase was with Affiliate "John"
  → Customer permanently bound to John
  
Customer tries to use coupon "SARAH15" (owned by Affiliate "Sarah")
  → ❌ BLOCKED: "This coupon is not applicable as you are bound to another affiliate."
  
Customer uses coupon "JOHN20" (owned by Affiliate "John")
  → ✅ ALLOWED: Same affiliate as binding
```

### Validation Logic

**File:** `apps/web/src/lib/coupons/validation.ts`

```typescript
// If coupon has an affiliateId
if (coupon.affiliateId && userEmail) {
  const affiliateInfo = await getCustomerAffiliateInfo(payload, userEmail);
  
  // Customer has previous affiliate binding
  if (affiliateInfo.hasAnyAffiliateAssociation) {
    // Check if coupon's affiliate matches customer's bound affiliate
    if (affiliateInfo.existingAffiliateId !== coupon.affiliateId) {
      return { 
        valid: false, 
        error: "This coupon is not applicable as you are bound to another affiliate." 
      };
    }
  }
}
```

## Coupon Types & Affiliate Attribution

### Regular Coupons (Manual Entry)

Customer manually enters the code at checkout:

1. Coupon is validated
2. If coupon has affiliate info → extracted and used
3. If no affiliate info → falls back to cookie
4. Affiliate binding rules apply

**Example:**
```
Coupon Code: WELCOME10
Affiliate Username: mike
Discount: 10%

Customer enters "WELCOME10" at checkout
  → Discount applied: -10%
  → Affiliate: Mike (from coupon)
  → Commission paid to Mike
```

### Auto-Apply Coupons

Automatically applied based on criteria (no manual entry):

1. System finds best auto-apply coupon
2. Applies discount automatically
3. If coupon has affiliate info → extracted and used
4. Works silently in the background

**Example:**
```
Auto-Apply Coupon:
  - Code: SUMMER2025
  - Affiliate: sarah
  - Discount: 15%
  - Priority: 10
  - Auto-apply when: program = "1-step", accountSize = "$100K"

Customer selects $100K 1-Step program
  → SUMMER2025 auto-applied
  → 15% discount
  → Affiliate Sarah gets commission
```

### Auto-Apply Only Coupons

Coupons with `preventManualEntry: true`:

- Cannot be manually typed by customers
- Only applied automatically by system
- Used for targeted campaigns
- Still tracks affiliate attribution

## Data Flow: Coupon → Affiliate Attribution

### Step 1: Purchase Creation

Any of these routes:
- `/api/create-purchase`
- `/api/inapp-create-purchase`
- `/api/orders/create-pending`
- `/api/bridgerpay/checkout`
- `/api/paytiko/checkout`

```typescript
// Validate coupon and extract affiliate info
const validationResult = await validateCoupon({ code, ... });

if (validationResult.coupon) {
  affiliateId = validationResult.coupon.affiliateId || null;
  affiliateEmail = validationResult.coupon.affiliateEmail || null;
  affiliateUsername = validationResult.coupon.affiliateUsername || null;
}

// Store in purchase record
await payload.create({
  collection: "purchases",
  data: {
    affiliateId,
    affiliateEmail,
    affiliateUsername,
    discountCode: couponCode,
    metadata: {
      affiliateUsername, // Also in metadata for webhook access
    }
  }
});
```

### Step 2: Payment Completion

Webhook processes payment:

```typescript
// Extract affiliate info from purchase
const affiliateUsername = purchase.metadata.affiliateUsername;

// Process commission (same flow as cookie-based)
await processAffiliateWPConversion(payload, purchase);
await processAffiliateAttribution(payload, purchase);
```

## Use Cases

### Use Case 1: Influencer Coupon Codes

An influencer wants a custom coupon code:

```
Create Coupon:
  - Code: MIKE25
  - Affiliate Username: mike_influencer
  - Discount: 25%
  - No auto-apply

Influencer shares: "Use code MIKE25 for 25% off!"
  → Customer enters MIKE25
  → Gets 25% discount
  → Mike gets commission
  → Cookie not needed
```

### Use Case 2: Tiered Affiliate Discounts

Different affiliates get different discount amounts:

```
Affiliate John (Premium Tier):
  - Coupon: JOHN30
  - Discount: 30%
  - Commission: 15%

Affiliate Sarah (Standard Tier):
  - Coupon: SARAH15
  - Discount: 15%
  - Commission: 10%

Customers use respective codes
  → Different discounts
  → Different commission rates
  → Tracked separately in AffiliateWP
```

### Use Case 3: Campaign-Specific Tracking

Track specific marketing campaigns:

```
Summer Campaign:
  - Multiple affiliates
  - Each gets unique code: SUMMER-JOHN, SUMMER-SARAH, etc.
  - All have same discount (20%)
  - Each tracked to specific affiliate
  → Easy to measure campaign performance per affiliate
```

## Affiliate Binding with Coupons

### First Purchase with Coupon

```
Day 0: New customer uses coupon "MIKE15"
  → Coupon has affiliateUsername: "mike"
  → Purchase created with affiliateUsername: "mike"
  → ✅ Commission paid to Mike
  → Customer PERMANENTLY bound to Mike

Day 30: Customer returns (no cookie, no coupon)
  → System finds previous purchase
  → Within 60 days of last purchase
  → ✅ Commission paid to Mike (from database binding)

Day 40: Customer tries to use coupon "SARAH20"
  → Coupon has affiliateUsername: "sarah"
  → Sarah ≠ Mike (different affiliate)
  → ❌ BLOCKED: "You are bound to another affiliate"
  → Customer cannot use Sarah's coupon
```

### Multiple Coupons from Same Affiliate

```
Affiliate John has multiple coupons:
  - JOHN10 (10% off)
  - JOHN20 (20% off)
  - JOHN30 (30% off)

Customer bound to John can use ANY of John's coupons:
  → First purchase: JOHN10
  → Bound to John
  → Second purchase: JOHN30
  → ✅ Allowed (same affiliate)
```

## Coupon Validation Rules

### Complete Validation Checklist

When a coupon is used, it must pass:

1. ✅ **Exists** - Coupon code exists in database
2. ✅ **Status** - Coupon status is "active"
3. ✅ **Valid From** - Current date >= coupon's start date
4. ✅ **Valid To** - Current date <= coupon's end date (if set)
5. ✅ **Manual Entry** - If not auto-apply-only
6. ✅ **Program** - Program is allowed (whitelist/blacklist)
7. ✅ **Usage Limit** - Total usage < limit (if set)
8. ✅ **Per-User Limit** - User's usage < per-user limit (if set)
9. ✅ **Affiliate Binding** - If coupon has affiliate, must match customer's bound affiliate

### Validation Order

```
1. Coupon exists? → No: "Invalid coupon code"
2. Can be manually entered? → No: "Cannot be entered manually"
3. Status active? → No: "Coupon is not active"
4. Date valid? → No: "Coupon expired" or "Not yet valid"
5. Affiliate matches binding? → No: "Bound to another affiliate"
6. Program allowed? → No: "Not valid for this program"
7. Usage limit reached? → No: "Reached usage limit"
8. ✅ All checks passed → Coupon valid
```

## Technical Implementation

### Coupon Schema

**File:** `apps/web/src/collections/Coupons.ts`

```typescript
{
  // Basic Info
  code: string;              // SUMMER2025
  name: string;              // Summer Campaign 2025
  description?: string;
  status: "active" | "inactive" | "expired";
  
  // Discount
  discountType: "percentage" | "fixed";
  discountValue: number;     // 20 (for 20% or $20)
  accountSizeDiscounts?: []; // Different discounts per account size
  
  // Validity
  validFrom: Date;
  validTo?: Date;
  
  // Restrictions
  restrictionType: "all" | "whitelist" | "blacklist";
  applicablePrograms?: Program[];
  excludedPrograms?: Program[];
  
  // Usage Limits
  totalUsageLimit?: number;
  usagePerUser?: number;
  
  // Auto-Apply
  autoApply: boolean;
  autoApplyPriority?: number;
  preventManualEntry?: boolean;
  
  // Affiliate Settings
  affiliateId?: string;         // TrackNow ID
  affiliateEmail?: string;      // Legacy
  affiliateUsername?: string;   // AffiliateWP username
}
```

### Where Affiliate Info is Extracted

All purchase creation routes extract affiliate data from coupons:

**Pattern used in all routes:**
```typescript
let affiliateUsername: string | null = null;

if (couponCode?.trim()) {
  const validationResult = await validateCoupon({
    code: couponCode,
    programId,
    accountSize,
    userEmail: customerData.email,
  });
  
  if (validationResult.coupon) {
    affiliateId = validationResult.coupon.affiliateId || null;
    affiliateEmail = validationResult.coupon.affiliateEmail || null;
    affiliateUsername = validationResult.coupon.affiliateUsername || null;
  }
}

// Fallback to cookie if coupon doesn't have affiliate
if (!affiliateUsername && affiliateUsernameCookie) {
  affiliateUsername = affiliateUsernameCookie;
}
```

## Scenarios & Examples

### Scenario 1: Cookie vs Coupon

```
Customer clicks /ref/john
  → Cookie: affiliate_username = "john"
  
Customer uses coupon "SARAH20"
  → Coupon has affiliateUsername: "sarah"
  → Priority: Coupon wins
  → Affiliate: Sarah (from coupon, not john from cookie)
  → ✅ Commission to Sarah
```

### Scenario 2: Non-Affiliate Coupon

```
Coupon Code: HOLIDAY50
  - No affiliateId
  - No affiliateEmail
  - No affiliateUsername
  → Regular discount coupon, not tied to any affiliate

Customer with cookie: affiliate_username = "mike"
Customer uses coupon "HOLIDAY50"
  → Coupon has no affiliate info
  → Falls back to cookie
  → Affiliate: Mike (from cookie)
  → ✅ Commission to Mike
```

### Scenario 3: Returning Customer Protection

```
Customer's first purchase: Used cookie for Affiliate "Tom"
  → Customer bound to Tom
  
30 days later:
Customer tries coupon "ALEX25" (owned by Affiliate "Alex")
  → Coupon validation checks binding
  → Tom ≠ Alex
  → ❌ Coupon rejected: "You are bound to another affiliate"
  
Customer uses coupon "TOM15" (owned by Tom)
  → Tom = Tom (matches binding)
  → ✅ Coupon accepted
  → 15% discount applied
  → Commission to Tom
```

### Scenario 4: Auto-Apply with Affiliate

```
Auto-Apply Coupon Setup:
  - Code: BIGACCOUNT
  - Affiliate Username: premium_partner
  - Discount: 25%
  - Auto-apply when: accountSize >= $100K
  - Priority: 5

Customer selects $200K account:
  → System finds BIGACCOUNT (matches criteria)
  → Auto-applies 25% discount
  → Extracts affiliateUsername: "premium_partner"
  → Customer bound to premium_partner
  → ✅ Commission to premium_partner
  → Customer never saw the coupon code
```

## Commission Rules with Coupons

Coupons follow the **exact same commission rules** as cookie-based tracking:

### Rule 1: First Purchase Binding

```
Customer uses Affiliate Mike's coupon "MIKE20"
  → First purchase
  → ✅ Commission paid to Mike
  → Customer PERMANENTLY bound to Mike
  
Customer later uses another coupon "MIKE15" (also Mike's)
  → Within 60 days
  → ✅ Allowed (same affiliate)
  → Commission paid
```

### Rule 2: 60-Day Lifetime Window

```
Day 0: Customer uses coupon with Affiliate Sarah
  → ✅ Commission paid
  → 60-day window starts

Day 30: Customer uses another Sarah coupon
  → Within 60 days
  → ✅ Commission paid
  → Window resets

Day 120: Customer uses Sarah's coupon (90 days later)
  → Outside 60-day window
  → ❌ NO commission
  → Window resets from Day 120
```

### Rule 3: Different Affiliate Coupons Blocked

```
Customer bound to Affiliate "Tom"

Tries coupon from Affiliate "John"
  → ❌ BLOCKED during validation
  → Error: "You are bound to another affiliate"
  → Purchase cannot proceed with this coupon
```

### Rule 4: Non-Affiliate Coupons Always Work

```
Customer bound to Affiliate "Mike"

Uses general coupon "SALE50" (no affiliate info)
  → ✅ ALLOWED (no affiliate conflict)
  → Discount applied
  → Commission still goes to Mike (from binding)
  → Not Mike's coupon, but Mike still gets credit
```

## Edge Cases

### Edge Case 1: Coupon + Cookie Different Affiliates

```
Cookie: affiliate_username = "john"
Coupon "SARAH15": affiliateUsername = "sarah"

NEW customer (no previous purchases):
  → Coupon priority: Uses Sarah
  → Customer bound to Sarah (not John)
  → ✅ Commission to Sarah
```

### Edge Case 2: Customer Clicks Link Then Uses Coupon

```
Day 0: Customer clicks /ref/tom
  → Cookie set: affiliate_username = "tom"
  
Day 1: Customer uses coupon "MIKE20"
  → Coupon has affiliateUsername: "mike"
  → NEW customer
  → Coupon takes priority
  → Customer bound to Mike (not Tom!)
  → ✅ Commission to Mike
```

### Edge Case 3: Cookie Expired But Coupon Still Works

```
Day 0: Customer clicks /ref/john
  → Cookie expires after 30 days

Day 35: Cookie expired
  → Customer uses coupon "JOHN15"
  → Coupon provides affiliate info
  → ✅ Works (doesn't need cookie)
  → Commission to John
```

## Coupon-Based vs Cookie-Based Tracking

| Aspect | Cookie-Based | Coupon-Based |
|--------|--------------|--------------|
| **How Set** | Click `/ref/{username}` | Enter/auto-apply coupon code |
| **Duration** | 30 days | No expiration (tied to coupon) |
| **Priority** | Lower | Higher (overrides cookie) |
| **Visibility** | Silent/background | Visible (discount applied) |
| **Customer Action** | Click link | Enter code or automatic |
| **Affiliate Certainty** | Cookie can be cleared | More reliable (in transaction) |
| **Tracking** | Anonymous until purchase | Tied to specific code |

## Benefits of Coupon-Based Tracking

### For Affiliates

1. **Unique Codes** - Easy to share and remember
2. **Discount Incentive** - Customers motivated to use it
3. **Direct Attribution** - No cookie dependency
4. **Campaign Tracking** - Can track specific promotions
5. **Multiple Codes** - Can have different codes for different channels

### For Business

1. **Reliable Tracking** - Less affected by cookie blocking
2. **Better Attribution** - Know exactly which code was used
3. **Flexible Discounts** - Different rates for different affiliates
4. **Campaign Analytics** - Track performance per code
5. **Auto-Apply Options** - Strategic automatic discounts

### For Customers

1. **Discount + Attribution** - Get savings and support affiliate
2. **Easy to Use** - Just enter a code
3. **Transparent** - See the discount applied
4. **No Tracking Concerns** - Part of legitimate transaction

## Common Patterns

### Pattern 1: Affiliate-Specific Codes

Each affiliate gets their own discount code:

```
Affiliate John: JOHN15, JOHN20, JOHN25
Affiliate Sarah: SARAH10, SARAH15, SARAH20
Affiliate Mike: MIKE5, MIKE10, MIKE15

All codes:
  - Point to respective affiliate
  - Different discount amounts
  - Can be used by anyone
  - Subject to binding rules
```

### Pattern 2: Campaign Codes

Time-limited campaign codes:

```
Black Friday Campaign:
  - Codes: BF-JOHN, BF-SARAH, BF-MIKE
  - All: 50% discount
  - Valid: Nov 24-27 only
  - Each tracked to affiliate
  - Same discount, different attribution
```

### Pattern 3: Hybrid Tracking

Use both cookies and coupons:

```
Affiliate shares link: fundedtradermarkets.com/ref/john

Customer clicks link:
  → Cookie set: affiliate_username = "john"
  → Browses site for 2 weeks
  → Decides to buy
  → Uses coupon "JOHN20" for extra savings
  → Coupon confirms it's John's (matches cookie)
  → Extra discount + proper attribution
```

## Administrative Notes

### Creating Affiliate Coupons

**In Payload CMS:**

1. Go to **Coupons** → **Create New**
2. Fill in basic info (code, name, discount)
3. Navigate to **Affiliate Settings** tab
4. Set affiliate fields:
   - **Affiliate Username** (required for AffiliateWP)
   - **Affiliate ID** (optional for TrackNow)
   - **Affiliate Email** (optional, legacy)
5. Save coupon

### Best Practices

1. **Naming Convention** - Use affiliate name in code (e.g., `JOHN20`, not `ABC123`)
2. **Multiple Codes** - Give affiliates several codes with different discounts
3. **Set Limits** - Use `totalUsageLimit` to prevent abuse
4. **Track Usage** - Monitor via Coupon Usage collection
5. **Clear Dates** - Always set expiration dates for campaigns
6. **Document** - Keep internal notes about which affiliate owns which codes

### Monitoring

Check these regularly:

- Coupon usage by affiliate
- Blocked coupon attempts (wrong affiliate)
- Auto-apply success rate
- Commission accuracy for coupon-based sales
- Overlap between cookie and coupon attribution

