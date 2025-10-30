# Affiliate Dashboard Setup

## Overview

A complete AffiliateWP dashboard has been implemented at `/{locale}/affiliate-area` with authentication against WordPress/AffiliateWP and all dashboard features. The dashboard is fully integrated with the main app layout, using the same header, footer, and styling system.

## What Was Implemented

### 1. Authentication System
- **JWT-based session management** using HTTP-only cookies
- **Login page** at `/affiliate-area/login`
- **Protected routes** with automatic redirect to login if not authenticated
- **Logout functionality** in the dashboard header

### 2. Dashboard Pages
All dashboard pages are accessible at `/{locale}/affiliate-area/*`:

- **Dashboard** (`/{locale}/affiliate-area`) - Overview with stats cards and recent referrals
- **Affiliate URLs** (`/{locale}/affiliate-area/urls`) - URL generator with campaign tracking
- **Statistics** (`/{locale}/affiliate-area/statistics`) - Detailed stats and campaigns table
- **Graphs** (`/{locale}/affiliate-area/graphs`) - Earnings visualization over time
- **Referrals** (`/{locale}/affiliate-area/referrals`) - Complete referrals list with filtering
- **Payouts** (`/{locale}/affiliate-area/payouts`) - Payout history
- **Visits** (`/{locale}/affiliate-area/visits`) - Visit tracking with conversion status
- **Coupons** (`/{locale}/affiliate-area/coupons`) - Available affiliate coupons
- **Creatives** (`/{locale}/affiliate-area/creatives`) - Marketing materials (when available)

### 3. Server Actions
All data fetching uses Next.js server actions (no API routes):

- `loginAffiliate()` - Authentication
- `logoutAffiliate()` - Logout
- `getAffiliateProfile()` - Profile data
- `getStatistics()` - Computed statistics
- `getReferrals()` - Referrals list with filters
- `getVisits()` - Visit tracking data
- `getPayouts()` - Payout history
- `getCoupons()` - Available coupons
- `getCampaigns()` - Campaign performance data
- `getGraphData()` - Earnings over time
- `getAffiliateCreatives()` - Marketing creatives

### 4. UI Components
Reusable components in `/src/components/affiliate/`:

- `affiliate-sidebar.tsx` - Navigation sidebar with user info and logout
- `stat-card.tsx` - Statistics display cards
- `data-table.tsx` - Generic data table component

### 5. Integration with Main App
- The affiliate area uses the main app's layout (Header + Footer)
- Fully supports i18n with locale-based routing
- Uses the same dark/light theme system as the rest of the app
- Sidebar navigation adapts to the current locale

## Required Environment Variables

Add to your `.env` or `.env.local` file:

```bash
# Affiliate Dashboard JWT Secret
AFFILIATE_JWT_SECRET=your-random-secret-key-here-change-this-in-production

# These should already be configured for AffiliateWP integration:
AFFILIATEWP_API_URL=https://your-wordpress-site.com
AFFILIATEWP_API_PUBLIC_KEY=your-public-key
AFFILIATEWP_API_TOKEN=your-token
```

**Important**: Generate a strong random secret for `AFFILIATE_JWT_SECRET`. You can use:
```bash
openssl rand -base64 32
```

## How to Use

### For Affiliates
1. Navigate to `/{locale}/affiliate-area` (e.g., `/en/affiliate-area`)
2. Log in with WordPress credentials
3. Access all dashboard features

### Authentication Flow
1. User enters WordPress username and password
2. System validates against WordPress REST API
3. Looks up affiliate record in AffiliateWP
4. Creates JWT session if affiliate is active
5. Stores session in HTTP-only cookie
6. Redirects to affiliate dashboard with locale preserved

### Testing
To test the dashboard:
1. Create a WordPress user in your AffiliateWP installation
2. Set up the user as an active affiliate
3. Use those credentials to log into `/en/affiliate-area`

## Features

### Dashboard Overview
- Key metrics: Referrals, Visits, Conversion Rate, Unpaid Earnings
- All-time statistics
- Recent referral activity table

### Affiliate URLs
- Base referral URL display with copy button
- Campaign URL generator
- Automatic username-based URLs

### Statistics
- Comprehensive affiliate statistics
- Campaign performance breakdown
- Conversion tracking

### Graphs
- Visual earnings representation
- Color-coded by status (Unpaid, Pending, Rejected, Paid)
- Monthly breakdown

### Referrals
- Complete referral history
- Status indicators (Unpaid, Paid, Pending, Rejected)
- Reference numbers and descriptions

### Visits
- Visit tracking with referrer information
- Conversion status
- Direct traffic vs referred traffic

### Coupons
- Auto-generated coupons based on affiliate username
- Standard discounts: 65%, 55%, 35%

### Creatives
- Marketing materials from AffiliateWP
- Ready for banners, ads, and promotional content

## File Structure

```
apps/web/src/
├── lib/
│   ├── affiliate-auth.ts           # JWT session management
│   ├── affiliate-auth-actions.ts   # Login/logout actions
│   ├── affiliate-actions.ts        # Data fetching actions
│   ├── affiliatewp.ts             # Extended AffiliateWP API functions
│   └── affiliatewp-config.ts      # Type definitions
├── components/affiliate/
│   ├── affiliate-sidebar.tsx      # Navigation sidebar with user info
│   ├── stat-card.tsx             # Statistics card
│   └── data-table.tsx            # Data table component
└── app/[locale]/(app)/affiliate-area/
    ├── login/
    │   └── page.tsx               # Login page
    ├── layout.tsx                 # Protected layout with sidebar
    ├── page.tsx                   # Dashboard overview
    ├── urls/page.tsx              # URL generator
    ├── statistics/page.tsx        # Statistics
    ├── graphs/page.tsx            # Earnings graphs
    ├── referrals/page.tsx         # Referrals list
    ├── payouts/page.tsx           # Payouts history
    ├── visits/page.tsx            # Visits tracking
    ├── coupons/page.tsx           # Coupons list
    └── creatives/page.tsx         # Marketing creatives
```

## Styling

The dashboard uses the main app's theme system with:
- Light mode: White backgrounds with gray borders
- Dark mode: Dark gray backgrounds (`gray-800`) with darker borders
- Responsive design using Tailwind's responsive utilities
- Accent: Blue-to-cyan gradient for buttons and highlights
- Status colors: Green (paid), Blue (unpaid), Yellow (pending), Red (rejected)
- Shadows and smooth transitions for better UX

All styling is done with Tailwind CSS classes that support both light and dark modes.

## Next Steps

1. Add the `AFFILIATE_JWT_SECRET` to your environment variables
2. Ensure AffiliateWP credentials are configured
3. Test the login with a WordPress affiliate user
4. Verify all dashboard pages load correctly
5. Check that referral tracking works end-to-end

## Notes

- Sessions last 7 days
- All API calls to AffiliateWP use the configured credentials
- Session validation happens on every protected page load
- Automatic redirect to login if session expires

