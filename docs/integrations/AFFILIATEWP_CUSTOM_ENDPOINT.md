# AffiliateWP Custom Endpoints

This custom WordPress plugin provides additional AffiliateWP REST API endpoints:
- **Commission rate information** with support for groups and multi-tier commissions
- **Statistics with date filtering** for better dashboard performance
- **Referral creation** (AffiliateWP API v1 only provides read-only endpoints)

## Installation

You have three options to install the custom endpoints:

### Option 1: As a Must-Use Plugin (Recommended)

1. Copy `wordpress-custom-endpoint.php` to your WordPress site
2. Place it in: `wp-content/mu-plugins/affiliatewp-custom-rate-endpoint.php`
3. The endpoint will be automatically loaded

### Option 2: As a Custom Plugin

1. Create a new folder: `wp-content/plugins/affiliatewp-custom-rate/`
2. Copy `wordpress-custom-endpoint.php` to that folder
3. Rename it to `affiliatewp-custom-rate.php`
4. Add these lines at the top of the file (after the opening `<?php` tag):

```php
/**
 * Plugin Name: AffiliateWP Custom Rate Endpoint
 * Description: Custom REST API endpoint for AffiliateWP commission rates
 * Version: 1.0.0
 * Author: Your Name
 */
```

5. Activate the plugin in WordPress Admin → Plugins

### Option 3: In Theme Functions

1. Copy the contents of `wordpress-custom-endpoint.php` (except the opening `<?php` tag)
2. Paste it at the end of your theme's `functions.php` file

## What It Does

The plugin provides these REST API routes:

### 1. Get Affiliate Rate Info

**Endpoint:** `GET /wp-json/affwp/v1/affiliates/{affiliate_id}/rate`

**Response:**
```json
{
  "affiliate_id": 14,
  "effective_rate": "0.15",
  "effective_rate_type": "percentage",
  "rate_source": "group",
  "custom": {
    "rate": "",
    "rate_type": ""
  },
  "group": {
    "id": 2,
    "name": "Premium Affiliates",
    "rate": "0.15",
    "rate_type": "percentage"
  },
  "global": {
    "rate": "0.10",
    "rate_type": "percentage"
  }
}
```

### 2. Get Global Rate Settings

**Endpoint:** `GET /wp-json/affwp/v1/settings/rates`

**Response:**
```json
{
  "referral_rate": "0.10",
  "referral_rate_type": "percentage",
  "flat_rate_basis": "per_order"
}
```

### 3. Get Affiliate Statistics (with date filtering)

**Endpoint:** `GET /wp-json/affwp/v1/affiliates/{affiliate_id}/statistics?days={days}`

**Query Parameters:**
- `days` (optional): Filter statistics to last N days

**Response:**
```json
{
  "affiliate_id": 14,
  "date_range": "30 days",
  "paid_referrals": 5,
  "unpaid_referrals": 3,
  "pending_referrals": 2,
  "rejected_referrals": 0,
  "total_referrals": 8,
  "visits": 150,
  "conversion_rate": 5.33,
  "paid_earnings": 250.00,
  "unpaid_earnings": 120.00,
  "commission_rate": 15.0,
  "rate_type": "percentage",
  "lifetime_customers": 8
}
```

### 4. Create Referral

**Endpoint:** `POST /wp-json/affwp/v1/referrals`

**Note:** This endpoint is required because the AffiliateWP REST API v1 only provides read-only (GET) endpoints. This allows programmatic referral creation from external systems.

**Request Body:**
```json
{
  "affiliate_id": 14,
  "amount": 299.00,
  "description": "Order #12345 - Product Purchase",
  "reference": "12345",
  "status": "unpaid",
  "context": "custom-integration",
  "campaign": "summer-promo",
  "custom": ""
}
```

**Required Fields:**
- `affiliate_id` (integer): The affiliate ID
- `amount` (number): The **order total** (full purchase price). The commission will be calculated automatically based on the affiliate's rate.

**Optional Fields:**
- `description` (string): Description of the referral
- `reference` (string): External reference (e.g., order number)
- `status` (string): One of: `pending`, `unpaid`, `paid`, `rejected` (default: `unpaid`)
- `context` (string): Integration context identifier
- `campaign` (string): Campaign identifier
- `custom` (string): Custom data

**Response:**
```json
{
  "referral_id": 456,
  "affiliate_id": 14,
  "amount": "44.85",
  "status": "unpaid",
  "description": "Order #12345 - Product Purchase",
  "reference": "12345",
  "context": "custom-integration",
  "campaign": "summer-promo",
  "date": "2025-10-19 10:30:00",
  "id": 456
}
```

**Note:** The `amount` in the response is the **calculated commission** (e.g., if order total was $299 and affiliate rate is 15%, commission = $44.85).

## How It Works

### Commission Rate Determination

The rate endpoint determines the effective commission rate in this priority order:

1. **Custom Rate**: If the affiliate has a custom rate set
2. **Group Rate**: If the affiliate belongs to a group with a rate (requires Groups addon)
3. **Global Rate**: The default rate from AffiliateWP settings

This ensures accurate commission rates are always returned, even when the main AffiliateWP API returns empty rate fields.

### Referral Creation & Commission Calculation

The POST `/referrals` endpoint:
1. **Receives the full order total** in the `amount` parameter
2. **Validates** that the affiliate exists and is active
3. **Retrieves the affiliate's commission rate** (could be custom, group, or global rate)
4. **Calculates the commission amount:**
   - **Percentage rate:** `commission = order_total × rate` (e.g., $299 × 0.15 = $44.85)
   - **Flat rate:** `commission = rate` (regardless of order total)
5. **Creates the referral** using AffiliateWP's internal `affwp_add_referral()` function with the calculated commission
6. **Returns the created referral** in the same format as the AffiliateWP REST API

This ensures the correct commission is always calculated based on the affiliate's tier/rate settings.

## Authentication

The endpoint requires authentication via:
- WordPress cookies (for logged-in users)
- Basic Authentication with Application Passwords
- Same authentication as other AffiliateWP REST API endpoints

## Testing

Test the endpoints using curl:

### Get Affiliate Rate
```bash
curl -u "PUBLIC_KEY:TOKEN" \
  "http://your-site.com/wp-json/affwp/v1/affiliates/14/rate"
```

### Get Statistics
```bash
curl -u "PUBLIC_KEY:TOKEN" \
  "http://your-site.com/wp-json/affwp/v1/affiliates/14/statistics?days=30"
```

### Create Referral
```bash
curl -u "PUBLIC_KEY:TOKEN" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "affiliate_id": 14,
    "amount": 299.00,
    "description": "Order #12345 - $5K Account",
    "reference": "12345",
    "status": "unpaid",
    "context": "ftm-nextjs"
  }' \
  "http://your-site.com/wp-json/affwp/v1/referrals"
```

**Example:** If affiliate #14 has a 15% commission rate, the referral will be created with amount $44.85 (299 × 0.15).

## Compatibility

- **Requires**: AffiliateWP 2.0+
- **Optional**: AffiliateWP Groups addon
- **Optional**: AffiliateWP Multi-tier Commissions addon
- **WordPress**: 5.0+

## Troubleshooting

### "Cannot redeclare function" error

This should be fixed in the current version. If you still see this error, ensure you're using the updated file with the `affwp_custom_*` function prefixes.

### 404 Not Found

Make sure you've:
1. Saved permalinks in WordPress Admin → Settings → Permalinks
2. Activated the code (either as plugin or in functions.php)
3. AffiliateWP plugin is active

### 401 Unauthorized

Check your authentication credentials. The endpoint uses the same authentication as the main AffiliateWP REST API.

