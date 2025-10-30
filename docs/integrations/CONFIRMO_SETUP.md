# Confirmo Payment Gateway Setup

This document outlines how to set up and configure the Confirmo cryptocurrency payment gateway integration.

## Overview

The Confirmo integration provides cryptocurrency payment options alongside Stripe, allowing customers to pay with Bitcoin, Ethereum, USDT, and other supported cryptocurrencies.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Confirmo API Configuration
CONFIRMO_API_KEY=your_confirmo_api_key_here
CONFIRMO_CALLBACK_PASSWORD=your_callback_password_here

# Required for webhook URLs
NEXT_PUBLIC_SERVER_URL=https://your-domain.com
```

### Getting Your Confirmo Credentials

1. **Sign up for Confirmo**: Visit [https://confirmo.net](https://confirmo.net) and create a merchant account
2. **Generate API Key**: 
   - Log into your Confirmo dashboard
   - Navigate to Settings → API Keys
   - Create a new API key with read/write permissions
   - Copy the API key to your environment variables
3. **Set Callback Password**:
   - In the API Keys section, set up a callback password
   - This is used for webhook signature validation
   - Use a strong, random password

### Webhook Configuration

The webhook URL is automatically set when creating each invoice via the `notifyUrl` parameter. No global webhook configuration is needed in the Confirmo dashboard.

**Webhook URL Format:**
```
https://your-domain.com/api/webhooks/confirmo
```

**Webhook Security:**
- Webhooks include a `bp-signature` header for verification
- The signature is validated using your callback password
- For added security, the system verifies payment status via API call after receiving webhook

### Webhook Events

The integration handles these webhook events:
- `prepared` - Invoice created, awaiting payment method selection
- `active` - Payment created and waiting for crypto transfer
- `confirming` - Payment received on blockchain (awaiting confirmations)
- `paid` - Payment confirmed and credited to merchant
- `expired` - Payment expired (timeout reached)
- `error` - Payment confirmation failed

## Supported Features

### Payment Flow
1. Customer selects cryptocurrency payment method
2. System creates Confirmo invoice with proper structure:
   - `invoice`: { amount, currency }
   - `settlement`: { currency }
   - `reference`: encoded customer data for webhook processing
3. Customer is shown payment address and QR code
4. Customer sends crypto to the provided address
5. Webhook updates payment status in real-time
6. Purchase record is created in PayloadCMS

### Supported Cryptocurrencies
- Bitcoin (BTC)
- Ethereum (ETH)
- Tether (USDT)
- And many more supported by Confirmo

### Security Features
- Webhook signature validation using HMAC-SHA256 with `bp-signature` header
- Secure API key authentication
- Payment timeout handling
- Real-time status updates
- Additional API verification for final payment status (recommended by Confirmo)

## Integration Architecture

### Key Files
- `src/lib/confirmo.ts` - Confirmo API client and utilities
- `src/app/api/create-confirmo-payment/route.ts` - Payment creation endpoint
- `src/app/api/webhooks/confirmo/route.ts` - Webhook handler
- `src/components/checkout/confirmo-payment.tsx` - Payment UI component
- `src/components/checkout/payment-methods.tsx` - Payment method selection

### Database Integration
- Purchase records are created in the `purchases` collection
- Payment method is set to `crypto`
- Transaction ID stores the Confirmo payment ID
- Metadata includes crypto-specific information (currency, amount, exchange rate)

## Testing

### Development Testing
1. Use Confirmo's test environment if available
2. Test with small amounts on testnets
3. Verify webhook handling with test events

### Production Checklist
- [ ] Valid SSL certificate on your domain
- [ ] Webhook URL is accessible and returns 200 OK
- [ ] API keys are from live Confirmo account
- [ ] Callback password is properly configured
- [ ] Payment timeouts are reasonable (default: 30 minutes)

## Error Handling

The integration includes comprehensive error handling for:
- Network failures
- Invalid API responses
- Webhook signature validation failures
- Payment timeouts
- Blockchain confirmation delays

## Support

For Confirmo-specific issues:
- Check Confirmo documentation: [https://docs.confirmo.net](https://docs.confirmo.net)
- Contact Confirmo support: support@confirmo.net

For integration issues:
- Check webhook logs in your application
- Verify environment variables are correctly set
- Test API connectivity manually

## Security Best Practices

1. **API Key Security**
   - Store API keys in environment variables, never in code
   - Use different keys for development and production
   - Rotate API keys regularly

2. **Webhook Security**
   - Always validate webhook signatures
   - Use HTTPS for webhook URLs
   - Implement idempotency for webhook processing

3. **Payment Validation**
   - Always verify payment amounts match expected values
   - Check payment status before fulfilling orders
   - Implement proper timeout handling

## Monitoring

Monitor these metrics:
- Payment success/failure rates
- Webhook processing times
- Blockchain confirmation times
- Customer support tickets related to crypto payments

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL configuration in Confirmo dashboard
   - Verify SSL certificate is valid
   - Check firewall settings

2. **Signature validation failing**
   - Verify callback password is correct
   - Check webhook payload format
   - Ensure consistent encoding (UTF-8)

3. **Payment not confirming**
   - Check blockchain network status
   - Verify sufficient network fees were paid
   - Monitor transaction on blockchain explorer

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will provide detailed logs for:
- API requests/responses
- Webhook processing
- Payment status changes
