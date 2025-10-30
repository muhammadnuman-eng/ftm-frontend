# Klaviyo Events Documentation

## Overview

This document describes all Klaviyo events tracked in the FTM Next.js application. These events replace the WooCommerce Klaviyo integration and track the complete customer journey from checkout to purchase completion.

---

## Event Flow Diagram

```
Customer Journey:
1. Newsletter Sign-up (Optional)
   └─> Profile Created/Updated in Klaviyo

2. Checkout Page
   └─> Fills in contact information
       └─> EVENT: "Started Checkout"

3. Selects Payment & Submits
   └─> Order created (pending payment)
       └─> EVENT: "Started Order"

4. Payment Processing
   ├─> Success
   │   └─> EVENT: "Placed Order" + "Ordered Product" (per item)
   │
   └─> Failed/Declined
       └─> EVENT: "Order Failed"
```

---

## Events Reference

### 1. Started Checkout

**When Triggered:**
- Customer completes all required fields on the checkout form
- Fires once when form validation passes (all fields filled correctly)

**Trigger Location:**
- `apps/web/src/components/checkout/payment-methods.tsx`
- Monitors `isCustomerFormValid` state

**Event Properties:**
```javascript
{
  $value: 5000,                    // Total order amount
  item_name: "MetaTrader 5 - $50,000",
  currency: "USD",
  discount_code: "SAVE20",         // Optional, if coupon applied
  items: [
    {
      product_id: "123",
      sku: "123-50000",
      name: "MetaTrader 5 - $50,000",
      quantity: 1,
      price: 5000
    }
  ]
}
```

**Unique ID Format:**
```
checkout_{email}_{itemName}_{total}
```

**Use Cases:**
- Cart abandonment flows
- Checkout completion reminders
- Form abandonment tracking
- Conversion funnel analysis

---

### 2. Started Order

**When Triggered:**
- Order record is created in the database (pending payment)
- Customer proceeds to payment gateway

**Trigger Locations:**
- `apps/web/src/app/api/create-purchase/route.ts`
- `apps/web/src/app/api/inapp-create-purchase/route.ts`
- `apps/web/src/app/api/orders/create-pending/route.ts`
- `apps/web/src/app/api/bridgerpay/checkout/route.ts`
- `apps/web/src/app/api/paytiko/checkout/route.ts`

**Event Properties:**
```javascript
{
  $value: 5000,                    // Total order amount
  order_id: "123456",              // Internal order number
  currency: "USD",
  discount_code: "SAVE20",         // Optional, if coupon applied
  items: [
    {
      product_id: "123",
      sku: "123-50000",
      name: "MetaTrader 5 - $50,000",
      quantity: 1,
      price: 5000
    }
  ]
}
```

**Unique ID Format:**
```
started_{orderId}
```

**Use Cases:**
- Track orders initiated but not completed
- Payment gateway abandonment
- Incomplete purchase follow-ups
- Measure drop-off between order creation and payment

---

### 3. Placed Order

**When Triggered:**
- Payment successfully processed and confirmed
- Order status updated to "completed"

**Trigger Locations (Payment Webhooks):**
- `apps/web/src/app/api/webhooks/bridgerpay/route.ts` (line ~450)
- `apps/web/src/app/api/webhooks/confirmo/route.ts` (line ~149)
- `apps/web/src/app/api/webhooks/paytiko/route.ts` (line ~193)

**Event Properties:**
```javascript
{
  $value: 5000,                    // Total order amount
  order_id: "123456",              // Internal order number
  currency: "USD",
  discount_code: "SAVE20",         // Optional, if coupon applied
  items: [
    {
      product_id: "123",
      sku: "123-50000",
      name: "MetaTrader 5 - $50,000",
      quantity: 1,
      price: 5000
    }
  ]
}
```

**Unique ID Format:**
```
placed_{orderId}
```

**Important:** This event also triggers individual "Ordered Product" events for each line item.

**Use Cases:**
- Order confirmation emails
- Thank you flows
- Post-purchase sequences
- Revenue tracking
- Customer segmentation

---

### 4. Ordered Product

**When Triggered:**
- Automatically triggered with each "Placed Order" event
- One event per line item in the order

**Trigger Locations:**
- Same as "Placed Order" (part of `trackPlacedOrder()` function)

**Event Properties:**
```javascript
{
  $value: 5000,                    // Line item total (price × quantity)
  order_id: "123456",              // Internal order number
  name: "MetaTrader 5 - $50,000",
  sku: "123-50000",
  product_id: "123",
  quantity: 1,
  price: 5000
}
```

**Unique ID Format:**
```
placed_{orderId}_{sku}
```

**Use Cases:**
- Product-specific follow-up sequences
- Cross-sell/upsell based on purchased products
- Product performance analytics
- Segmentation by product type

---

### 5. Order Failed

**When Triggered:**
- Payment declined or failed
- Order status updated to "failed"

**Trigger Locations (Payment Webhooks):**
- `apps/web/src/app/api/webhooks/bridgerpay/route.ts` (line ~507)
- `apps/web/src/app/api/webhooks/confirmo/route.ts` (line ~197)
- `apps/web/src/app/api/webhooks/paytiko/route.ts` (line ~248)

**Event Properties:**
```javascript
{
  $value: 5000,                    // Total order amount
  order_id: "123456",              // Internal order number
  currency: "USD",
  discount_code: "SAVE20",         // Optional, if coupon applied
  reason: "Insufficient funds",    // Decline reason from payment gateway
  items: [
    {
      product_id: "123",
      sku: "123-50000",
      name: "MetaTrader 5 - $50,000",
      quantity: 1,
      price: 5000
    }
  ]
}
```

**Unique ID Format:**
```
failed_{orderId}
```

**Use Cases:**
- Payment recovery flows
- Alternative payment method suggestions
- Customer support outreach
- Fraud/risk analysis

---

## Profile Management Events

### Profile Created/Updated

**When Triggered:**
- Newsletter subscription
- Contact form submission

**Trigger Locations:**
- `apps/web/src/app/api/newsletter-subscribe/route.ts`

**Profile Properties:**
```javascript
{
  email: "customer@example.com",
  // For newsletter only: email is the only field
  
  // For contact form (if implemented in future):
  first_name: "John",
  last_name: "Doe",
  phone: "+1234567890"
}
```

**List Subscriptions:**
- Newsletter subscribers are automatically added to the list specified in `KLAVIYO_NEWSLETTER_LIST_ID`

---

## Environment Variables

Required environment variables for Klaviyo integration:

```bash
# Public key for onsite tracking (client-side)
NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY=your_public_key

# Private API key for server-side events (keep secret)
KLAVIYO_API_KEY=pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Newsletter list ID for auto-subscription
KLAVIYO_NEWSLETTER_LIST_ID=WxYz12

# Optional: Enable test mode in development
KLAVIYO_ENABLE_TEST=true
```

---

## Klaviyo Flow Examples

### Example 1: Cart Abandonment Flow

**Trigger:**
```
Person has "Started Checkout" at least once in the last 24 hours
AND
Person has NOT "Placed Order" in the last 24 hours
```

**Actions:**
1. Wait 1 hour
2. Send email: "Complete your order - get 10% off!"
3. Wait 24 hours
4. Send email: "Your cart is waiting"

---

### Example 2: Payment Failure Recovery

**Trigger:**
```
Person has "Order Failed" at least once
```

**Actions:**
1. Wait 15 minutes
2. Send email: "We noticed an issue with your payment"
3. Suggest alternative payment methods
4. Offer 5% discount for retry

---

### Example 3: Post-Purchase Sequence

**Trigger:**
```
Person has "Placed Order" at least once
```

**Actions:**
1. Immediate: Order confirmation email
2. Wait 1 day: "How to get started" guide
3. Wait 7 days: Check-in email
4. Wait 30 days: Feedback request

---

### Example 4: Checkout Completion Flow

**Trigger:**
```
Person has "Started Checkout" zero times since starting this flow
```

**Wait:** Wait until "Started Checkout" occurs

**Then:**
```
Person has "Placed Order" zero times since starting this flow
```

**Actions:**
1. Wait 1 hour
2. Send reminder: "Complete your purchase"
3. Include direct checkout link

---

## Event Deduplication

All events use unique IDs to prevent duplicate tracking:

- **Started Checkout:** Hash of email + item + total (prevents multiple fires during same session)
- **Started Order:** Order ID (prevents duplicate order creation events)
- **Placed Order:** Order ID (prevents duplicate payment confirmations)
- **Order Failed:** Order ID (prevents duplicate failure notifications)

Klaviyo automatically deduplicates events with the same `unique_id`.

---

## Testing Events

### Test in Development

1. Set environment variable:
   ```bash
   KLAVIYO_ENABLE_TEST=true
   ```

2. Events will fire even in development mode

### Verify Events in Klaviyo

1. Go to Klaviyo Dashboard
2. Navigate to **Analytics** → **Metrics**
3. Click on the specific event (e.g., "Placed Order")
4. View recent events and properties

### Check Profile Timeline

1. Go to **Audience** → **Profiles**
2. Search for test email
3. View timeline to see all events for that profile

---

## Error Handling

All Klaviyo tracking includes comprehensive error handling:

- **Non-blocking:** Errors never interrupt the primary operation (order creation, payment processing, etc.)
- **Logged:** All errors are logged to console with `[Klaviyo]` prefix
- **Graceful degradation:** If API is down, operations continue normally
- **Retry logic:** Not implemented (to avoid delays); relies on webhook retries for order events

---

## API Rate Limits

Klaviyo API limits (as of 2024):

- **Public API:** 10,000 requests per day
- **Burst limit:** 350 requests per minute
- **Profile API:** 700 profiles per batch

Current implementation stays well within limits:
- Events: ~3-5 per successful order
- Profiles: 1 per newsletter signup

---

## Monitoring & Debugging

### Enable Debug Logging

Check server logs for Klaviyo events:

```bash
# Look for [Klaviyo] prefix in logs
grep "\[Klaviyo\]" logs/server.log

# Common log messages:
# [Klaviyo] Tracking disabled, skipping request
# [Klaviyo] Sending request: /events/
# [Klaviyo] Request successful
# [Klaviyo] Error tracking event: ...
```

### Common Issues

**Events not appearing in Klaviyo:**
1. Check `KLAVIYO_API_KEY` is set correctly
2. Verify API key has proper permissions (Read/Write Events)
3. Check if tracking is enabled (`KLAVIYO_ENABLED` or production mode)
4. Look for error logs with `[Klaviyo]` prefix

**Duplicate events:**
1. Check unique_id generation logic
2. Verify webhook isn't being called multiple times
3. Review Klaviyo deduplication settings

---

## Migration from WooCommerce

### Metric Name Mapping

| WooCommerce Event | Next.js Event | Status |
|------------------|---------------|--------|
| Started Checkout | Started Checkout | ✅ Implemented |
| Placed Order | Placed Order | ✅ Implemented |
| Ordered Product | Ordered Product | ✅ Implemented |
| - | Started Order | ✅ New (better tracking) |
| - | Order Failed | ✅ New (better recovery) |

### Existing Flows Compatibility

**Good news:** The "Placed Order" metric name is identical to WooCommerce, so your existing flows will continue to work without modification!

**Flow filters that work:**
- ✅ "Person has Placed Order zero times"
- ✅ "Person has Placed Order at least once"
- ✅ "What someone has done > Placed Order"

**New capabilities:**
- Track checkout abandonment (Started Checkout)
- Track pending orders (Started Order)
- Recovery flows for payment failures (Order Failed)

---

## Support & Maintenance

**Implementation Location:**
- Core library: `apps/web/src/lib/klaviyo.ts`
- Order tracking: `apps/web/src/app/api/*/route.ts` (various endpoints)
- Webhook tracking: `apps/web/src/app/api/webhooks/*/route.ts`
- Checkout tracking: `apps/web/src/components/checkout/payment-methods.tsx`

**Key Functions:**
```typescript
// Core tracking functions
trackStartedCheckout(args)  // Checkout form completion
trackStartedOrder(args)     // Order creation
trackPlacedOrder(args)      // Payment success
trackOrderFailed(args)      // Payment failure

// Profile management
upsertProfile(email, attrs)           // Create/update profile
subscribeToList(listId, email)        // Add to list
subscribeToNewsletter(email)          // Add to newsletter list
```

---

## Version History

- **v1.0** (Current) - Full Next.js implementation
  - Started Checkout event
  - Started Order event
  - Placed Order event
  - Ordered Product event
  - Order Failed event
  - Profile management
  - Newsletter subscriptions

---

## Additional Resources

- [Klaviyo API Documentation](https://developers.klaviyo.com/en/reference/api-overview)
- [Klaviyo Metrics Reference](https://help.klaviyo.com/hc/en-us/articles/115005082927)
- [Flow Best Practices](https://help.klaviyo.com/hc/en-us/articles/115005249588)
- Internal: `apps/web/src/lib/klaviyo.ts` - Source code documentation





