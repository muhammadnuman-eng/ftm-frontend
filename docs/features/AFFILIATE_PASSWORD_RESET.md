# Affiliate Password Reset Setup

This document describes how the affiliate password reset functionality works and how to deploy it.

## Overview

The affiliate password reset system allows affiliates to reset their WordPress passwords through the Next.js application using a code-based system. It uses the [Password Reset with Code for WordPress REST API](https://wordpress.org/plugins/bdvs-password-reset/) plugin.

### Key Components

1. **WordPress Plugin** - bdvs-password-reset handles code generation and validation
2. **Next.js Server Actions** - Communicate with WordPress plugin API
3. **Modal UI** - Two-step process for requesting and using reset codes

## Architecture

### Flow

1. User clicks "Forgot password?" on login page
2. Modal opens asking for email address
3. User enters email → Next.js calls `/wp-json/bdpwr/v1/reset-password`
4. WordPress sends reset code via email (8-character code, valid 15 minutes)
5. Modal shows second step: code + new password fields
6. User enters code and new password → Next.js calls `/wp-json/bdpwr/v1/set-password`
7. Password is reset, modal closes, success message shown

### Security Features

- 8-character codes (letters, numbers, special chars)
- 15-minute expiration
- Maximum 3 attempts per code
- No user enumeration (always returns success)
- Codes are cryptographically secure

## WordPress Installation

### 1. Install the Plugin

Install the **Password Reset with Code for WordPress REST API** plugin:

**Via WordPress Admin:**
1. Go to Plugins → Add New
2. Search for "Password Reset with Code"
3. Install and activate "Password Reset with Code for WordPress REST API" by dominic_ks

**Via WP-CLI:**
```bash
wp plugin install bdvs-password-reset --activate
```

**Manual Installation:**
```bash
cd wp-content/plugins/
wget https://downloads.wordpress.org/plugin/bdvs-password-reset.latest-stable.zip
unzip bdvs-password-reset.latest-stable.zip
rm bdvs-password-reset.latest-stable.zip
wp plugin activate bdvs-password-reset
```

### 2. Verify Installation

Test that the endpoints are accessible:

**Request Reset Code:**
```bash
curl -X POST https://your-wordpress.com/wp-json/bdpwr/v1/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

Expected response:
```json
{
  "data": {
    "status": 200
  },
  "message": "A password reset email has been sent to your email address."
}
```

**Reset Password with Code:**
```bash
curl -X POST https://your-wordpress.com/wp-json/bdpwr/v1/set-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "code": "12345678", "password": "NewPassword123!"}'
```

Expected response:
```json
{
  "data": {
    "status": 200
  },
  "message": "Password reset successfully."
}
```

## Email Configuration

The plugin uses WordPress's native `wp_mail()` function. Make sure your WordPress site can send emails:

### Option 1: SMTP Plugin (Recommended)

Install a plugin like "WP Mail SMTP" or "Easy WP SMTP" to configure reliable email delivery.

### Option 2: System Mail

Ensure your server's mail configuration is working:

```bash
# Test from server
echo "Test email" | mail -s "Test Subject" your@email.com
```

### Customize Email Template (Optional)

You can customize the reset email using WordPress filters in your theme's `functions.php`:

```php
// Change email subject
add_filter('bdpwr_code_email_subject', function($subject) {
    return 'Your Affiliate Password Reset Code';
}, 10, 1);

// Customize email content
add_filter('bdpwr_code_email_text', function($text, $email, $code, $expiry) {
    $custom_text = "Hello,\n\n";
    $custom_text .= "Your password reset code is: {$code}\n\n";
    $custom_text .= "This code will expire at {$expiry}.\n\n";
    $custom_text .= "If you didn't request this, please ignore this email.";
    return $custom_text;
}, 10, 4);

// Change code expiration time (in seconds, default 900 = 15 minutes)
add_filter('bdpwr_code_expiration_seconds', function($seconds) {
    return 1800; // 30 minutes
}, 10, 1);
```

## Troubleshooting

### "No route was found" Error

**Problem:** Endpoint returns 404

**Solutions:**
1. Verify the bdvs-password-reset plugin is installed and activated
2. Check WordPress permalink settings: Go to Settings → Permalinks → Save Changes
3. Verify REST API is working: Visit `https://your-site.com/wp-json/bdpwr/v1`

### Emails Not Sending

**Problem:** Users don't receive reset codes

**Solutions:**
1. Check WordPress email logs (if using SMTP plugin)
2. Check server spam folder
3. Verify `wp_mail()` is working: Install "Check Email" plugin to test
4. Configure SMTP plugin with valid credentials
5. Check server error logs for mail-related errors

### Invalid Reset Code

**Problem:** Code validation fails

**Solutions:**
1. Check code hasn't expired (default 15 minutes)
2. Ensure code hasn't been used already (one-time use)
3. Verify email address matches exactly
4. Check if maximum attempts (3) has been exceeded

### Code Not Working After Multiple Attempts

**Problem:** Code becomes invalid after failed attempts

**Solution:** Request a new code. The plugin limits attempts to 3 by default for security.

## Testing Checklist

- [ ] bdvs-password-reset plugin is installed and activated
- [ ] WordPress endpoints respond to requests (`/wp-json/bdpwr/v1/`)
- [ ] Reset code emails are sent successfully
- [ ] Email contains 8-character code
- [ ] Code expires after 15 minutes
- [ ] Password reset completes successfully with valid code
- [ ] Invalid/expired codes show proper error
- [ ] Success message shown after reset
- [ ] User can login with new password
- [ ] Modal shows both steps (request code → enter code)

## API Reference

### Request Password Reset Code

```http
POST /wp-json/bdpwr/v1/reset-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "data": {
    "status": 200
  },
  "message": "A password reset email has been sent to your email address."
}
```

**Error Response:**
```json
{
  "code": "bad_email",
  "message": "No user found with this email address.",
  "data": {
    "status": 500
  }
}
```

### Reset Password with Code

```http
POST /wp-json/bdpwr/v1/set-password
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "Abc123!@",
  "password": "NewPassword123!"
}
```

**Success Response:**
```json
{
  "data": {
    "status": 200
  },
  "message": "Password reset successfully."
}
```

**Error Response:**
```json
{
  "code": "bad_request",
  "message": "The reset code provided is not valid.",
  "data": {
    "status": 500
  }
}
```

### Validate Code (Optional)

```http
POST /wp-json/bdpwr/v1/validate-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "Abc123!@"
}
```

**Success Response:**
```json
{
  "data": {
    "status": 200
  },
  "message": "The code supplied is valid."
}
```

## Related Files

- `/apps/web/src/lib/affiliate-auth-actions.ts` - Server actions (`requestPasswordReset`, `resetPassword`)
- `/apps/web/src/app/[locale]/(app)/affiliate-area/login/page.tsx` - Login page with modal UI
- WordPress Plugin: [bdvs-password-reset](https://wordpress.org/plugins/bdvs-password-reset/)

## Plugin Information

- **Plugin Name:** Password Reset with Code for WordPress REST API
- **Author:** dominic_ks
- **WordPress.org:** https://wordpress.org/plugins/bdvs-password-reset/
- **Rating:** 5/5 stars (10 reviews)
- **Active Installations:** 1,000+
- **Last Updated:** 5 months ago

## Migration Notes

**Previous Implementation:** Earlier versions of this feature used a custom WordPress endpoint (`wordpress-custom-endpoint.php`). This has been replaced with the bdvs-password-reset plugin for better security, maintainability, and built-in features.

**Why the Change:**
- No custom PHP code to maintain
- Well-tested, actively maintained plugin
- Better security (cryptographically secure codes, rate limiting)
- Customizable via WordPress filters
- No need to worry about WordPress updates breaking custom code

