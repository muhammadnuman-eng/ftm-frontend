# Paytiko Payment Gateway Setup

This document outlines how to set up and configure the Paytiko payment gateway integration.

## Overview

Paytiko is a payment gateway that provides card payment processing with support for multiple currencies and advanced fraud protection.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Paytiko Configuration
PAYTIKO_MERCHANT_SECRET=your_merchant_secret_here
PAYTIKO_MERCHANT_ID=your_merchant_id_here (optional)
PAYTIKO_CORE_URL=https://core.paytiko.com (default)
PAYTIKO_ENV=PRODUCTION (or UAT for testing)

# Server URL (required for redirect URLs)
NEXT_PUBLIC_SERVER_URL=https://your-domain.com

# Optional debug settings
PAYTIKO_DEBUG=0 (set to 1 for debug logging)
PAYTIKO_LOWERCASE_EMAIL_FOR_SIGNATURE=0 (set to 1 if required by Paytiko)
PAYTIKO_SIGNATURE_ENCODING=hex (or base64 if required)
```

## Getting Started

### 1. Obtain Paytiko Credentials

1. Contact Paytiko sales to set up a merchant account
2. Navigate to your merchant dashboard
3. Obtain the following credentials:
   - **Merchant Secret**: Used for API authentication and signature generation
   - **Merchant ID** (optional): Your unique merchant identifier

### 2. Configure Environment Variables

Add the credentials from step 1 to your `.env` file as shown above.

### 3. Enable Paytiko in Commerce Config

1. Log in to your PayloadCMS admin panel
2. Navigate to **Globals** → **Commerce Config**
3. Go to the **Payment Methods** tab
4. Enable the **"Enable Paytiko payment method"** checkbox
5. Optionally, set **"Default Payment Method"** to **"Paytiko"** if you want it as the default
6. Save the configuration

### 4. Configure Webhook URL ⚠️ CRITICAL

**Important:** Paytiko needs to be configured with your webhook URL for server-side order updates.

#### In Your Paytiko Merchant Dashboard:

1. **Webhook URL** (for server-side order updates):
   ```
   https://yourdomain.com/api/webhooks/paytiko
   ```
   
   Replace `yourdomain.com` with your actual domain. Make sure this URL is accessible from the internet and not blocked by firewalls.

#### How Redirects Work

Paytiko uses JavaScript events to communicate payment status instead of server-side redirects. The integration handles these automatically:

1. **Event-Based Communication**: When a payment completes, Paytiko sends a `paytiko.status-raise` event via `window.postMessage`
2. **Automatic Handling**: The PaytikoCashier component listens for these events and redirects users accordingly:
   - Success → `/checkout/order-received?gateway=paytiko&status=success&order_id={order_id}&amount={amount}`
   - Failed → Shows error message in the modal
   - Cancelled → Closes the modal

3. **Required Configuration**: Ensure `useEventBasedRedirects: true` is set in the checkout request (this is handled automatically by the integration)

**Note**: Unlike some payment gateways, Paytiko doesn't require redirect URLs to be configured in their dashboard as they use JavaScript events for status communication.

## Testing

### Test Card Numbers

Contact Paytiko support for test card numbers and credentials for the UAT environment.

### Webhook Testing

1. Create a test purchase
2. Monitor your server logs for webhook notifications
3. Verify that order status updates correctly in the admin panel

## Troubleshooting

### Empty Page or Instant Failure After Payment

If you see an empty page or instant failure when opening the payment modal:

1. **Enable Debug Mode**: Set `PAYTIKO_DEBUG=1` in your environment variables to see detailed logs

2. **Check Browser Console**: Open the browser developer console to see:
   - Raw message events from Paytiko
   - Any JavaScript errors
   - Status event details

3. **Common Causes of Instant Failure**:
   - Invalid merchant credentials
   - Incorrect signature generation
   - Missing or invalid customer data
   - Country code validation issues
   - Currency not supported by your Paytiko account

4. **Verify Configuration**:
   - Ensure `PAYTIKO_MERCHANT_SECRET` is correctly set
   - Check if `PAYTIKO_LOWERCASE_EMAIL_FOR_SIGNATURE` needs to be enabled
   - Verify `PAYTIKO_SIGNATURE_ENCODING` matches Paytiko's expectation (hex or base64)

5. **Check Server Logs**: Look for:
   - `[Paytiko] Checkout failed` messages
   - HTTP error codes from Paytiko API
   - Signature generation details (when debug mode is enabled)

### Payment Failures

1. Check the Paytiko merchant dashboard for transaction details
2. Review server logs for API errors
3. Verify that all required fields are being sent in the checkout request
4. Ensure the merchant secret is correct

### Signature Validation Issues

If webhook signatures fail validation:

1. Verify `PAYTIKO_MERCHANT_SECRET` is correct
2. Check if `PAYTIKO_LOWERCASE_EMAIL_FOR_SIGNATURE` needs to be enabled
3. Verify `PAYTIKO_SIGNATURE_ENCODING` matches Paytiko's configuration

## Security Considerations

1. **Keep Credentials Secure**: Never commit API keys or secrets to version control
2. **Use HTTPS**: Always use HTTPS in production for webhook URLs
3. **Verify Webhooks**: The integration verifies webhook signatures to prevent tampering
4. **Server-Side Price Calculation**: All prices are calculated server-side to prevent manipulation

## Support

For Paytiko-specific issues:
- Contact Paytiko support through your merchant dashboard
- Review Paytiko's API documentation

For integration issues:
- Check server logs for detailed error messages
- Enable debug mode for more verbose logging
- Review the webhook handler at `/api/webhooks/paytiko`
