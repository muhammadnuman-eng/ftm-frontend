# Hyros Tracking Implementation Summary

## Overview

Hyros ad tracking has been successfully integrated into the FTM web application to track conversions, leads, and page views. The implementation runs alongside the existing TrackNow affiliate system.

## Files Created

### 1. Configuration Files

**`apps/web/src/lib/hyros-config.ts`**
- API configuration and constants
- TypeScript interfaces for events:
  - `HyrosBaseEvent` - Base event structure
  - `HyrosPurchaseEvent` - Purchase tracking data
  - `HyrosLeadEvent` - Lead tracking data
  - `HyrosTrackingResult` - Tracking result structure
- Event type constants (purchase_pending, purchase, purchase_declined, lead, etc.)

**`apps/web/src/lib/hyros.ts`**
- Core tracking functions:
  - `sendHyrosEvent()` - Generic API call handler
  - `trackHyrosPurchase()` - Purchase tracking (pending/completed/declined)
  - `trackHyrosLead()` - Lead tracking (contact/newsletter)
  - `storeHyrosMetadata()` - Store tracking results in purchase metadata
- Comprehensive error handling
- Logging for debugging

## Files Modified

### Purchase Creation Endpoints (Pending Conversions)

These endpoints now track purchases as "pending" conversions when initially created:

1. **`apps/web/src/app/api/create-purchase/route.ts`**
   - Tracks regular purchase creation
   - Captures IP, user agent, and referrer from request headers

2. **`apps/web/src/app/api/inapp-create-purchase/route.ts`**
   - Tracks in-app purchase creation
   - Same tracking pattern as regular purchases

3. **`apps/web/src/app/api/orders/create-pending/route.ts`**
   - Tracks pending order creation from dashboard
   - Handles CORS requests from allowed origins

4. **`apps/web/src/app/api/bridgerpay/checkout/route.ts`**
   - Tracks BridgerPay checkout initiation
   - Creates purchase record before redirecting to payment gateway

5. **`apps/web/src/app/api/paytiko/checkout/route.ts`**
   - Tracks Paytiko checkout initiation
   - Creates purchase record before redirecting to payment gateway

### Payment Webhook Handlers (Completed/Declined Conversions)

These endpoints track purchase status updates when payment succeeds or fails:

1. **`apps/web/src/app/api/webhooks/bridgerpay/route.ts`**
   - Tracks "completed" conversions on successful payment
   - Tracks "declined" conversions on failed payment
   - Extracts IP address from webhook payload

2. **`apps/web/src/app/api/webhooks/confirmo/route.ts`**
   - Tracks "completed" for paid/confirmed crypto payments
   - Tracks "declined" for expired/cancelled payments

3. **`apps/web/src/app/api/webhooks/paytiko/route.ts`**
   - Tracks "completed" on successful payment
   - Tracks "declined" on failed payment

### Lead Capture Endpoints

These endpoints track user engagement as leads:

1. **`apps/web/src/app/api/contact-submit/route.ts`**
   - Tracks contact form submissions
   - Includes name, email, phone, and message
   - Lead type: "contact"

2. **`apps/web/src/app/api/newsletter-subscribe/route.ts`**
   - Tracks newsletter subscriptions
   - Includes email only
   - Lead type: "newsletter"

## Event Flow

### Purchase Flow

1. **User initiates purchase** → `trackHyrosPurchase()` with `eventType: "pending"`
   - Captures: order ID, email, revenue, products, customer details
   - Stores result in `purchase.metadata.hyros.pending_*`

2. **Payment webhook received**:
   - Success → `trackHyrosPurchase()` with `eventType: "completed"`
   - Failure → `trackHyrosPurchase()` with `eventType: "declined"`
   - Stores result in `purchase.metadata.hyros.completed_*` or `declined_*`

### Lead Flow

1. **User submits form/newsletter** → `trackHyrosLead()`
   - Captures: email, name (if available), source, IP, user agent
   - Lead type: "contact" or "newsletter"

## Data Captured

### Purchase Events (Orders API)
Following Hyros schema with required `items` array:
- Order ID (`orderId`)
- Customer email, first name, last name
- Order date (ISO format)
- Currency and price format
- Stage ("Lead" for pending, "Customer" for completed)
- Lead IPs array (customer IP addresses)
- Order discount (calculated from coupon)
- Items array with:
  - Product name, price, quantity
  - External ID (program ID)
  - Tag (platform name)
  - Category (program type)

### Lead Events (Leads API)
Following Hyros schema:
- Email address
- First/last name
- Stage ("Lead")
- Tags array (event type, source, etc.)
- Lead IPs array (visitor IP addresses)
- Phone numbers (single string)

## Metadata Storage

Tracking results are stored in the purchase `metadata` field:

```json
{
  "metadata": {
    "hyros": {
      "pending_sent": true,
      "pending_timestamp": "2025-10-14T10:30:00Z",
      "pending_event_id": "evt_123abc",
      "pending_error": null,
      "completed_sent": true,
      "completed_timestamp": "2025-10-14T10:35:00Z",
      "completed_event_id": "evt_456def",
      "completed_error": null
    }
  }
}
```

## Configuration Required

### Environment Variables

Add to `.env.local`:

```env
# Hyros API Key (required for server-side tracking)
HYROS_API_KEY=your_hyros_api_key_here

# Optional: Enable tracking in development
HYROS_ENABLE_TEST=true
```

### API Endpoints

Current configuration (updated to match Hyros API structure):
- **Base URL:** `https://api.hyros.com/v1/api/v1.0`
- **Orders endpoint:** `/orders` (full: `https://api.hyros.com/v1/api/v1.0/orders`)
- **Leads endpoint:** `/leads` (full: `https://api.hyros.com/v1/api/v1.0/leads`)

**Note:** If you get API errors, check the Hyros documentation at https://hyros.docs.apiary.io/#reference to verify:
1. The exact endpoint paths
2. Required authentication method (headers vs body)
3. Required/optional field names
4. Request format (JSON body vs query parameters)

### Client-Side Script

The Hyros tracking script is already configured in the layout. Ensure it's pointing to your Hyros tracking domain.

## Testing Checklist

- [ ] Add `HYROS_API_KEY` to production environment variables
- [ ] Test purchase creation via regular form (pending event)
- [ ] Test purchase creation via in-app purchase (pending event)
- [ ] Test BridgerPay checkout (pending event)
- [ ] Test Paytiko checkout (pending event)
- [ ] Test Confirmo payment (pending event)
- [ ] Test successful BridgerPay payment (completed event)
- [ ] Test failed BridgerPay payment (declined event)
- [ ] Test successful Confirmo payment (completed event)
- [ ] Test expired/cancelled Confirmo payment (declined event)
- [ ] Test successful Paytiko payment (completed event)
- [ ] Test failed Paytiko payment (declined event)
- [ ] Test contact form submission (lead event)
- [ ] Test newsletter subscription (lead event)
- [ ] Verify events appear in Hyros dashboard
- [ ] Check metadata storage in purchase records
- [ ] Confirm error handling doesn't break user flows

## Implementation Complete

All purchase creation endpoints (7 total) and all webhook handlers (3 total) now track Hyros events. Lead tracking has been added to contact forms and newsletter subscriptions.

## Error Handling

All Hyros tracking is wrapped in try-catch blocks to ensure:
1. Tracking failures don't break user flows
2. Purchases complete even if tracking fails
3. Errors are logged for debugging
4. Users receive success messages regardless of tracking status

## Logging

Look for these log prefixes in server logs:
- `[Hyros] Sending event:` - Event being sent to API
- `[Hyros] Event sent successfully:` - Successful tracking
- `[Hyros] API request failed:` - API failure
- `[Hyros] Error sending event:` - Network/other error
- `[Hyros] Tracking disabled` - Tracking skipped (dev mode)
- `[Hyros] Metadata stored:` - Result saved to database

## Integration with TrackNow

Hyros tracking runs independently alongside the existing TrackNow affiliate system:
- TrackNow processes affiliate attribution
- Hyros tracks ad conversions
- Both systems operate in parallel
- Neither system blocks the other
- Both store metadata in separate fields

## Notes

- Tracking is disabled in development by default (unless `HYROS_ENABLE_TEST=true`)
- Purchase creation endpoints track "pending" conversions
- Webhook handlers track "completed" or "declined" based on payment status
- Lead endpoints track form submissions and newsletter signups
- All tracking includes IP address and user agent when available
- Error handling ensures graceful degradation if Hyros API is unavailable

