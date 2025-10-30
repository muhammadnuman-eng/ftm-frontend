# Checkout Tracking Implementation

## Overview
Comprehensive PostHog event tracking has been implemented across the entire checkout flow to identify where users drop off and what friction points exist.

## PostHog Configuration

### Session Recording & Heatmaps
**File:** `apps/web/src/components/posthog-provider.tsx`

Enabled features:
- ✅ Session recording with cross-origin iframe support
- ✅ Console log capture in recordings
- ✅ Performance metrics capture
- ✅ Autocapture for clicks, changes, and form submissions
- ✅ Heatmap data collection via data attributes
- ✅ Page view and page leave tracking

### Configuration Options
```typescript
session_recording: {
    recordCrossOriginIframes: true,
    maskAllInputs: false, // Form interactions visible (sensitive data auto-masked)
    maskTextSelector: '[data-ph-mask]',
}
autocapture: {
    dom_event_allowlist: ['click', 'change', 'submit'],
    capture_copied_text: true,
}
enable_recording_console_log: true
capture_performance: true
```

## Client-Side Event Tracking

### 1. Checkout Page View & Abandonment
**File:** `apps/web/src/components/checkout/complete-checkout.tsx`

**Events:**
- `checkout_page_viewed` - Fired on initial page load
  - Properties: programId, programName, programCategory, accountSize, prices, platformId, coupon details, isInApp
  
- `checkout_abandoned` - Fired on beforeunload
  - Properties: programId, programName, accountSize, finalPrice, hadCoupon, hadAddOns, timeOnPage

- `checkout_coupon_changed` - Fired when coupon is applied/removed
  - Properties: programId, originalPrice, newPrice, couponCode, discountAmount, discountType

- `checkout_addon_changed` - Fired when add-ons are selected/deselected
  - Properties: programId, accountSize, addOnsCount, addOns array, totalAddOnPercentage

### 2. Form Field Tracking
**File:** `apps/web/src/components/checkout/checkout-form.tsx`

**Events:**
- `checkout_field_focused` - Fired when user clicks into a field
  - Properties: fieldName

- `checkout_field_completed` - Fired when user fills a field
  - Properties: fieldName, hasValue

- `checkout_validation_error` - Fired when validation fails
  - Properties: errors object, errorFields array, errorCount

**Tracked Fields:**
- firstName
- lastName
- email
- phone (via PhoneInput)
- address
- city
- state
- postalCode
- country

**Heatmap Attributes:**
All form inputs have `data-ph-capture-attribute-field-name` for precise heatmap tracking.

### 3. Payment Gateway Tracking
**File:** `apps/web/src/components/checkout/payment-methods.tsx`

**Events:**
- `checkout_payment_gateway_selected` - Fired when user selects a payment method
  - Properties: gateway (confirmo/paytiko/bridger), gatewayName, amount, programId, accountSize

- `checkout_payment_init_started` - Fired when payment initialization begins
  - Properties: gateway, amount, programId, accountSize

- `checkout_payment_ready` - Fired when payment gateway loads successfully
  - Properties: gateway, amount, programId, accountSize, orderId, purchaseId

- `checkout_payment_init_failed` - Fired when payment initialization fails
  - Properties: gateway, amount, programId, accountSize, error, errorType

**Tracked Gateways:**
- Paytiko (credit/debit cards)
- BridgerPay (cards & crypto)
- Confirmo (cryptocurrency)

**Heatmap Attributes:**
Payment gateway buttons have `data-ph-capture-attribute-gateway` for click tracking.

### 4. Coupon Tracking
**File:** `apps/web/src/components/checkout/coupon-input.tsx`

**Events:**
- `checkout_coupon_applied_success` - Fired when coupon is successfully applied
  - Properties: couponCode, programId, accountSize, originalPrice, finalPrice, discountAmount, discountType, discountValue

- `checkout_coupon_applied_failed` - Fired when coupon validation or application fails
  - Properties: couponCode, programId, accountSize, originalPrice, error, validationFailed/applyFailed

**Heatmap Attributes:**
- Coupon input: `data-ph-capture-attribute-field-name="couponCode"`
- Apply button: `data-ph-capture-attribute-button="applyCoupon"`
- Remove button: `data-ph-capture-attribute-button="removeCoupon"`

## Server-Side Event Tracking

### Pending Order Creation
**File:** `apps/web/src/app/api/orders/create-pending/route.ts`

**Existing Events (5 total):**
1. `pending_order_request_started` - API call initiated
2. `pending_order_validation_failed` - Missing required fields
3. `pending_order_mapping_found` - Product mapping located
4. `pending_order_created_success` - Order created in database
5. `pending_order_error` - Error during creation

### Webhook Handlers
**Files:**
- `apps/web/src/app/api/webhooks/bridgerpay/route.ts`
- `apps/web/src/app/api/webhooks/paytiko/route.ts`
- `apps/web/src/app/api/webhooks/confirmo/route.ts`

**Note:** Webhook handlers currently handle order completion logic (status transitions to "completed") but do NOT emit PostHog events. This is a gap identified for future enhancement.

**Recommendation:** Add PostHog tracking to webhook handlers for:
- `order_payment_completed` - When payment is confirmed
- `order_payment_failed` - When payment fails
- `order_refunded` - When order is refunded

## Event Funnel Analysis

### Checkout Funnel
Users can be tracked through this funnel in PostHog:

1. `checkout_page_viewed`
2. `checkout_field_focused` (first field interaction)
3. `checkout_field_completed` (multiple times)
4. `checkout_validation_error` (optional - indicates friction)
5. `checkout_coupon_applied_success/failed` (optional)
6. `checkout_addon_changed` (optional)
7. `checkout_payment_gateway_selected`
8. `checkout_payment_init_started`
9. `checkout_payment_ready` OR `checkout_payment_init_failed`
10. [Server-side] `pending_order_created_success`
11. [Server-side - MISSING] Order completion from webhook

### Abandonment Points
Track `checkout_abandoned` event properties to identify:
- Users who had coupons but didn't complete
- Users who selected add-ons but didn't complete
- Average time on page before abandonment

## PostHog Analysis Queries

### Drop-off Analysis
```sql
-- Find most common field where users stop filling the form
SELECT 
  properties.fieldName,
  COUNT(*) as focus_count
FROM checkout_field_focused
WHERE NOT EXISTS (
  SELECT 1 FROM checkout_payment_gateway_selected
  WHERE distinct_id = checkout_field_focused.distinct_id
)
GROUP BY properties.fieldName
ORDER BY focus_count DESC
```

### Payment Gateway Success Rate
```sql
-- Compare initialization vs success rates per gateway
SELECT
  properties.gateway,
  COUNT(*) FILTER (WHERE event = 'checkout_payment_init_started') as starts,
  COUNT(*) FILTER (WHERE event = 'checkout_payment_ready') as successes,
  COUNT(*) FILTER (WHERE event = 'checkout_payment_init_failed') as failures
FROM events
WHERE event IN ('checkout_payment_init_started', 'checkout_payment_ready', 'checkout_payment_init_failed')
GROUP BY properties.gateway
```

### Validation Error Patterns
```sql
-- Most common validation errors
SELECT
  properties.errorFields,
  COUNT(*) as error_count
FROM checkout_validation_error
GROUP BY properties.errorFields
ORDER BY error_count DESC
```

## Heatmap Usage

With session replays and heatmaps enabled, you can:

1. **Click Heatmaps:** See where users click most frequently
   - Payment gateway selection
   - Coupon apply/remove buttons
   - Form fields

2. **Scroll Maps:** Identify if users see all content
   - Do they scroll to payment section?
   - Do they see add-on options?

3. **Session Replays:** Watch actual user sessions
   - Filter by users who abandoned checkout
   - Filter by validation errors
   - Filter by payment failures

## Testing

To verify tracking is working:

1. Open PostHog dashboard
2. Navigate to checkout page
3. Complete various actions (fill forms, apply coupons, select payment)
4. Check PostHog Live Events to see events firing in real-time
5. Session replay should capture the entire session

## Next Steps

### Recommended Enhancements
1. **Add webhook completion tracking:**
   - Track `order_payment_completed` in webhook handlers
   - Track `order_payment_failed` for failed payments
   
2. **Add user identification:**
   - Call `posthog.identify(email)` when email is entered
   - Link checkout session to user profile

3. **Create PostHog dashboards:**
   - Checkout funnel visualization
   - Abandonment reasons breakdown
   - Payment gateway performance comparison

4. **Set up alerts:**
   - Alert when payment failure rate exceeds threshold
   - Alert when validation errors spike
   - Alert when checkout abandonment increases

## Privacy & Compliance

- Sensitive data is auto-masked by PostHog
- Credit card fields should use `data-ph-mask` attribute if exposed
- Email addresses are captured but can be configured to mask
- Session replays respect user privacy settings



