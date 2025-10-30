# BridgerPay Integration Setup

This document provides instructions for setting up and configuring the BridgerPay payment gateway integration.

## Overview

BridgerPay is a payment gateway that supports multiple payment methods including credit cards, debit cards, and alternative payment methods. The integration uses BridgerPay's Checkout Widget for a seamless payment experience.

## Features

- ✅ **Automatic Authentication**: Token-based authentication with automatic refresh (2-hour token validity)
- ✅ **Checkout Widget**: Embedded checkout widget for seamless payment experience
- ✅ **Multiple Payment Methods**: Support for credit/debit cards and APMs
- ✅ **Webhook Support**: Real-time payment status updates via webhooks
- ✅ **Token Caching**: Efficient token reuse to avoid rate limits
- ✅ **Error Handling**: Robust error handling with automatic retry logic

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# BridgerPay Configuration
BRIDGERPAY_API_KEY=your_api_key_here
BRIDGERPAY_CASHIER_KEY=your_cashier_key_here
BRIDGERPAY_USERNAME=your_username_here
BRIDGERPAY_PASSWORD=your_password_here
BRIDGERPAY_ENV=production # or "sandbox" for testing
BRIDGERPAY_API_URL=https://api.bridgerpay.com # optional, defaults to production URL
BRIDGERPAY_WEBHOOK_SECRET=your_webhook_secret_here # optional, for webhook signature verification

# Optional: Enable debug logging
BRIDGERPAY_DEBUG=1 # Set to "1" to enable debug logs
NEXT_PUBLIC_BRIDGERPAY_DEBUG=1 # Set to "1" to enable client-side debug logs
```

## Setup Instructions

### 1. Obtain BridgerPay Credentials

1. Sign up for a BridgerPay account at [https://bridgerpay.com](https://bridgerpay.com)
2. Navigate to your merchant dashboard
3. Obtain the following credentials:
   - **API Key**: Used for API authentication
   - **Cashier Key**: Used for checkout session creation
   - **Username & Password**: Used for authentication token generation
   - **Webhook Secret** (optional): Used for webhook signature verification

### 2. Configure Environment Variables

Add the credentials from step 1 to your `.env` file as shown above.

### 3. Enable BridgerPay in Commerce Config

1. Log in to your PayloadCMS admin panel
2. Navigate to **Globals** → **Commerce Config**
3. Go to the **Payment Methods** tab
4. Enable the **"Enable Bridger payment method"** checkbox
5. Optionally, set **"Default Payment Method"** to **"Bridger"** if you want it as the default
6. Save the configuration

### 4. Configure Webhook URL & Redirect URLs ⚠️ CRITICAL

**This is the most important step!** BridgerPay requires you to configure redirect URLs in your merchant dashboard for the checkout widget to work properly.

#### In Your BridgerPay Merchant Dashboard:

1. **Webhook URL** (for server-side order updates):
   ```
   https://yourdomain.com/api/webhooks/bridgerpay
   ```

2. **Success Redirect URL** (⚠️ REQUIRED for redirects to work):
   ```
   https://yourdomain.com/checkout/order-received?gateway=bridger&status=success&order_id={order_id}&amount={amount}
   ```

3. **Failure Redirect URL**:
   ```
   https://yourdomain.com/checkout?status=failed&order_id={order_id}
   ```

4. **Cancel/Close Redirect URL**:
   ```
   https://yourdomain.com/checkout?status=cancelled
   ```

**Important Notes**: 
- ✅ Replace `yourdomain.com` with your actual domain
- ✅ Use `{order_id}` and `{amount}` as placeholders - BridgerPay will replace them with actual values
- ✅ Make sure the webhook URL is accessible from the internet and not blocked by firewalls
- ⚠️ **Without configuring these redirect URLs, the checkout widget will NOT redirect users after payment**
- 📝 The redirect URLs must be configured in your BridgerPay cashier settings, not just the general merchant settings

### 5. Test the Integration

1. Visit your checkout page
2. Select BridgerPay as the payment method
3. Complete a test transaction using test card details (provided by BridgerPay)
4. Verify that the order status updates correctly in your admin panel

## API Endpoints

### Checkout Session Creation

**Endpoint**: `POST /api/bridgerpay/checkout`

Creates a new checkout session and returns the cashier token for the widget.

**Request Body**:
```json
{
  "amount": 100,
  "currency": "usd",
  "programId": "1",
  "accountSize": "10k",
  "purchasePrice": 100,
  "totalPrice": 100,
  "customerData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "US"
  }
}
```

**Response**:
```json
{
  "success": true,
  "cashierToken": "token_here",
  "cashierKey": "cashier_key_here",
  "orderId": "ORDER-12345",
  "purchase": {
    "id": "123",
    "status": "pending",
    "orderNumber": "ORDER-12345"
  }
}
```

### Webhook Handler

**Endpoint**: `POST /api/webhooks/bridgerpay`

Receives webhook notifications from BridgerPay about transaction status updates.

**Processed Webhook Types:**
- ✅ `approved` - Payment was successful
- ✅ `declined` - Payment was declined
- ⏭️ `cashier.session.close` - Ignored (session closed, not a payment result)

**Webhook Payload Example** (approved payment):
```json
{
  "webhook": { "type": "approved" },
  "data": {
    "order_id": "100061",
    "psp_name": "zen",
    "charge": {
      "type": "approved",
      "id": "30c10041-9cd6-49b2-88bb-5e4ac55fb637",
      "psp_order_id": "b249a2c7-0359-407f-9671-56fb1387f1df",
      "attributes": {
        "status": "approved",
        "amount": 24,
        "currency": "USD",
        "payment_method": "credit_card",
        "card_brand": "MASTERCARD",
        "card_number": "4408",
        "source": {
          "email": "customer@example.com",
          "ip_address": "192.168.1.1"
        }
      }
    }
  }
}
```

**Purchase Record Updates:**

When webhook is processed, the purchase record is updated with:
- ✅ Status: `completed` (approved) or `failed` (declined)
- ✅ Transaction ID from BridgerPay
- ✅ Payment method (credit_card, etc.)
- ✅ Card details (brand, last 4 digits, masked number)
- ✅ Customer verification (email, IP address)
- ✅ PSP information (processor name, MID alias)
- ✅ Detailed notes with payment information

## Integration Architecture

### Components

1. **`/lib/bridgerpay.ts`**: Core library with authentication, session creation, and helper functions
2. **`/api/bridgerpay/checkout/route.ts`**: API endpoint for creating checkout sessions
3. **`/components/checkout/bridgerpay-cashier.tsx`**: Client component that renders the checkout widget
4. **`/components/checkout/payment-methods.tsx`**: Main payment methods component (updated to include BridgerPay)
5. **`/api/webhooks/bridgerpay/route.ts`**: Webhook handler for payment status updates

### Authentication Flow

1. When a checkout session is requested, the system checks for a cached authentication token
2. If no valid token exists, it authenticates with BridgerPay using username/password
3. The received token is cached for 2 hours (with 1-minute safety margin)
4. Subsequent requests reuse the cached token
5. If a token expires during a request (401 error), the system automatically refreshes it

### Checkout Flow

1. User selects BridgerPay as payment method
2. System creates a purchase record in the database
3. System calls BridgerPay API to create a checkout session
4. BridgerPay returns a cashier token
5. Checkout widget is rendered using the cashier token
6. User completes payment in the widget
7. BridgerPay sends webhook notification to update payment status
8. System updates purchase status based on webhook data

## Checkout Widget Customization

The checkout widget can be customized via the session creation request. Available options:

- **theme**: `"dark" | "light" | "bright" | "transparent"` (default: `"bright"`)
- **language**: ISO 639-1 language code (default: `"en"`)
- **currency_lock**: Prevent currency changes by customer (default: `true`)
- **amount_lock**: Prevent amount changes by customer (default: `true`)
- **hide_languages_dropdown**: Hide language selector (default: `false`)
- **hide_header**: Hide welcome message (default: `false`)

To customize, modify the `sessionRequest` object in `/api/bridgerpay/checkout/route.ts`.

## Webhook Signature Verification

For security, webhook signature verification should be implemented. Update the webhook handler in `/api/webhooks/bridgerpay/route.ts` based on BridgerPay's documentation.

Example implementation (update based on actual BridgerPay specs):

```typescript
import { verifyBridgerPayWebhook } from "@/lib/bridgerpay";

const signature = request.headers.get("x-bridgerpay-signature") || "";
const webhookSecret = process.env.BRIDGERPAY_WEBHOOK_SECRET || "";

if (!verifyBridgerPayWebhook(rawBody, signature, webhookSecret)) {
    return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
    );
}
```

## Troubleshooting

### Issue: "Missing BridgerPay configuration"

**Solution**: Ensure all required environment variables are set correctly in your `.env` file.

### Issue: "Authentication failed"

**Solution**: 
- Verify your username and password are correct
- Check if your BridgerPay account is active
- Ensure you're using the correct environment (sandbox vs production)

### Issue: "Session creation failed"

**Solution**:
- Enable debug logging by setting `BRIDGERPAY_DEBUG=1`
- Check the server logs for detailed error messages
- Verify the customer data includes all required fields
- Ensure the country code is a valid ISO 3166-1 alpha-2 code

### Issue: "Checkout widget not loading"

**Solution**:
- Check browser console for errors
- Verify the cashier token is valid
- Ensure the checkout script is not blocked by ad blockers or content security policies
- Check if `https://checkout.bridgerpay.com` is accessible

### Issue: "Webhook not received"

**Solution**:
- Verify the webhook URL is configured correctly in BridgerPay dashboard
- Ensure the URL is accessible from the internet (test with curl or Postman)
- Check firewall rules and security groups
- Enable webhook logging in BridgerPay dashboard

## Testing

### Test Cards

Use the following test card details provided by BridgerPay for testing:

(Contact BridgerPay support for test card numbers)

### Debug Mode

Enable debug mode to see detailed logs:

```bash
# Server-side logs
BRIDGERPAY_DEBUG=1

# Client-side logs
NEXT_PUBLIC_BRIDGERPAY_DEBUG=1
```

Debug logs include:
- Authentication requests and responses
- Session creation requests
- Checkout widget initialization
- Webhook payloads

## Security Best Practices

1. **Never commit credentials**: Keep your `.env` file out of version control
2. **Use environment-specific credentials**: Use sandbox credentials for development/staging
3. **Enable webhook signature verification**: Verify all webhook requests are from BridgerPay
4. **Use HTTPS**: Always use HTTPS in production for webhook URLs
5. **Rotate credentials regularly**: Change API keys and passwords periodically
6. **Monitor for suspicious activity**: Set up alerts for failed authentication attempts

## Support

For issues related to:
- **BridgerPay API**: Contact BridgerPay support at support@bridgerpay.com
- **Integration issues**: Check the troubleshooting section or review server logs
- **Feature requests**: Submit an issue in your project repository

## Resources

- [BridgerPay Documentation](https://docs.bridgerpay.com)
- [BridgerPay API Reference](https://api.bridgerpay.com/docs)
- [BridgerPay Support](https://bridgerpay.com/support)

