## The Updated Affiliate Tracking System

### Cookie Duration: 30 Days

When someone clicks an affiliate link, cookies are set for 30 days:
- If they don't purchase within 30 days, they need to click a new affiliate link
- Two cookies are set:
  - `affiliate_username` (AffiliateWP) - 30 days
  - `click_id` (TrackNow) - 30 days

### Customer Binding: PERMANENT

Once a customer makes their **first purchase** using an affiliate link:

1. They are **permanently bound** to that affiliate (based on email address)
2. This binding **cannot be changed** - even if they click a different affiliate's link later
3. The affiliate link is no longer needed after the first purchase
4. All future commission eligibility is tied to this original affiliate

**Key Point:** The old dashboard had a 30-day window after which affiliates needed customers to click their link again. **This has changed.** Customers are now permanently attributed after their first purchase.

### Commission Payment Window: 60-Day Rolling

While customers are permanently attributed, commissions are only paid for purchases made within **60 days** of the customer's last purchase:

- The window **resets** with each new purchase
- This is a **rolling window**, not a fixed period

**Example:**
```
Day 0:   First purchase  → ✅ Commission paid (60-day window starts)
Day 30:  Second purchase → ✅ Commission paid (window resets to Day 30)
Day 50:  Third purchase  → ✅ Commission paid (within 60 days of Day 30)
Day 150: Fourth purchase → ❌ No commission (more than 60 days since Day 50)
```

**Why this matters:** A customer could make purchases on Day 0, 40, 80, 120, 160, and the affiliate would get commission on ALL of them because each purchase resets the 60-day window. But if a customer goes silent for 61+ days, the next purchase won't generate a commission.

---

## Coupon-Based Tracking

In addition to cookie tracking, we support **coupon-based affiliate attribution**:

### How It Works

- Affiliates can have discount coupons tied to their account
- When a customer enters/uses an affiliate coupon, they get attributed to that affiliate
- **NO EXPIRATION** - Coupons don't have the 30-day cookie limitation
- **HIGHER PRIORITY** - Coupons override cookies if both are present

### Cookie vs Coupon Comparison

| Aspect | Cookie-Based | Coupon-Based |
|--------|--------------|--------------|
| **Duration** | 30 days | No expiration (tied to coupon) |
| **Priority** | Lower | **Higher (overrides cookie)** |
| **Visibility** | Silent/background | Visible (discount applied) |
| **Customer Action** | Click link | Enter code or automatic |
| **Reliability** | Cookie can be cleared | More reliable (in transaction) |
| **Affiliate Certainty** | Cookie can be blocked | Tied to specific code |
| **Tracking** | Anonymous until purchase | Tied to specific code |

### Example Scenario

```
Day 0:  Customer clicks /ref/john
        → Cookie set (30-day expiration)

Day 35: Cookie expired
        → Customer visits site directly
        → Customer uses coupon "JOHN15"
        → ✅ Coupon provides affiliate info
        → ✅ Works (doesn't need cookie)
        → Commission attributed to John
```

### Benefits of Coupon Tracking

**For Affiliates:**
- Coupons work even after the 30-day cookie expires
- Easy to share and remember (e.g., "Use code JOHN15")
- Customers motivated by discount
- Can track specific campaigns with different codes

**For Business:**
- More reliable (not affected by cookie blocking/clearing)
- Better attribution (know exactly which code was used)
- Less dependency on browser cookies

**For Customers:**
- Get discount + support affiliate
- Easy to use
- Transparent (see discount applied)

---

## What "Lifetime Customers" Actually Means

Looking at the implementation (`scripts/wordpress-custom-endpoint.php:373`):

```php
'lifetime_customers' => $days ? $total_referrals : (int) $affiliate->referrals,
```

**Current Reality:** "Lifetime Customers" is a bit of a misnomer. It currently shows:
- For date-filtered stats (e.g., last 30 days): total referrals in that period
- For all-time stats: total referrals count

**What it's NOT doing:**
- NOT counting unique customers (by email)
- NOT showing how many customers are still active within the 60-day window

**Essentially:** Right now, "Lifetime Customers" = "Total Referrals"

This could be improved in the future to show actual unique customer counts, but currently it's just another way of displaying total referrals.

---

## Summary: How It All Works Together

### Attribution Methods (In Priority Order)

1. **Coupon Code** (Highest Priority)
   - No expiration
   - Overrides any existing cookie
   - More reliable

2. **Affiliate Link/Cookie** (Lower Priority)
   - 30-day expiration
   - Can be blocked/cleared
   - Works silently

3. **Previous Purchase Attribution** (Fallback)
   - If customer is already bound to an affiliate
   - Permanent binding based on email

### Complete Flow Example

```
Scenario 1: Link + Purchase
─────────────────────────────
Day 0:  Customer clicks /ref/sarah
Day 5:  Customer purchases $1000 account
        → Cookie still valid
        → Customer permanently bound to Sarah
        → ✅ Commission to Sarah

Day 40: Customer purchases another $1000 account
        → Cookie expired
        → But customer already bound to Sarah
        → Within 60-day window (35 days since last purchase)
        → ✅ Commission to Sarah


Scenario 2: Expired Cookie + Coupon
────────────────────────────────────
Day 0:  Customer clicks /ref/mike
Day 35: Customer visits site (cookie expired)
        → Uses coupon "MIKE20"
        → Coupon overrides/sets attribution
        → ✅ Commission to Mike


Scenario 3: Outside 60-Day Window
──────────────────────────────────
Day 0:  Customer clicks /ref/john, purchases
        → Bound to John
        → ✅ Commission to John

Day 100: Customer purchases again
         → Bound to John (permanent)
         → But 100 days since last purchase
         → ❌ NO commission (outside 60-day window)
```

### Key Takeaways

✅ **Customers are permanently attributed** after first purchase (not just 30 days)  
✅ **Coupons provide reliable attribution** without cookie dependency  
✅ **Coupons override cookies** if both are present  
✅ **Commission window is 60 days rolling** from last purchase  
❌ **"Lifetime Customers" metric** currently just equals total referrals (could be improved)

### Multiple Attribution Paths

Affiliates can drive sales through:
1. **Affiliate links** → Sets 30-day cookie for initial clicks
2. **Coupon codes** → No expiration, more reliable, includes discount incentive
3. **Combination** → Link for initial awareness, coupon for conversion
4. **Email campaigns** → Share coupon codes directly
5. **Social media** → Both links and coupon codes work

