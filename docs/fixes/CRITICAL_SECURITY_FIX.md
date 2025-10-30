# CRITICAL SECURITY FIX - Price Manipulation Vulnerability

## Issue
Client-side calculated prices were being sent to checkout endpoints, allowing potential price manipulation attacks.

## Affected Endpoints
1. `/api/bridgerpay/checkout` - ✅ NEEDS FIX
2. `/api/paytiko/checkout` - ✅ NEEDS FIX  
3. `/api/create-purchase` - ✅ NEEDS FIX
4. `/api/update-purchase` - ✅ FIXED

## Vulnerability Example
```json
{
  "programId": "24",
  "accountSize": "$200K",
  "purchasePrice": 1.5,  // ❌ MANIPULATED - should be 1747.5
  "totalPrice": 1.5,     // ❌ MANIPULATED
  "couponCode": "OCT-2"
}
```

## Required Changes
All checkout endpoints must:
1. Calculate tier price from program + accountSize
2. Apply coupon discount server-side
3. Calculate add-on values server-side
4. Compute final totalPrice server-side
5. NEVER trust client-sent prices

## Frontend Changes Needed
Remove these fields from API calls:
- `amount`
- `purchasePrice`
- `totalPrice`
- `addOnValue`

Keep only:
- `programId`
- `accountSize`
- `tierId`
- `selectedAddOns[]`
- `couponCode`
- `customerData`

