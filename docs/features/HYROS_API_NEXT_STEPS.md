# Hyros API - Next Steps & Testing

## ✅ Updates Made

1. **Updated base URL:**
   - Old: `https://api.hyros.com/v1`
   - New: `https://api.hyros.com/v1/api/v1.0`

2. **Updated endpoints:**
   - Orders/Purchases: Now using `/orders` (was `/track`)
   - Leads: Now using `/leads` (was `/track`)

3. **Improved error handling:**
   - Now handles non-JSON responses gracefully
   - Shows actual response text in logs

## 🔍 Current Request Format

We're currently sending:
```json
POST https://api.hyros.com/v1/api/v1.0/orders

Headers:
  Content-Type: application/json
  User-Agent: FundedTraderMarkets/1.0

Body:
{
  "api_key": "YOUR_API_KEY",
  "email": "customer@example.com",
  "order_id": "100680",
  "revenue": 399,
  "currency": "USD",
  "product_name": "2-Step Program",
  "product_id": "123",
  "first_name": "John",
  "last_name": "Doe",
  "order_status": "pending",
  "ip_address": "1.2.3.4",
  "user_agent": "Mozilla/5.0...",
  "custom_1": "MT5",
  "custom_2": "$100K",
  "custom_3": "north-america"
}
```

## ⚠️ Possible Adjustments Needed

Based on the Hyros API documentation at https://hyros.docs.apiary.io/#reference, you may need to adjust:

### 1. API Key Authentication
The API key might need to be in the **headers** instead of body:
```typescript
headers: {
  "Authorization": "Bearer YOUR_API_KEY",
  // or
  "X-API-Key": "YOUR_API_KEY",
}
```

### 2. Query Parameters
The `/leads` endpoint you showed uses query parameters:
```
POST /leads?ids="id1","id2"&emails="email1","email2"
```

If `/orders` works the same way, we may need to change from JSON body to query params.

### 3. Field Names
Hyros might expect different field names than we're sending. Check their docs for:
- Order amount field name (we use `revenue`)
- Email field name (we use `email`)
- Order ID field name (we use `order_id`)
- etc.

## 🧪 Testing Steps

1. **Test the current implementation:**
   - Create a test purchase
   - Check the logs for the response
   - The improved error handling will show you exactly what Hyros returns

2. **Check the logs for these patterns:**
   ```
   [Hyros] Sending event: { endpoint: '/orders', email: '...', hasApiKey: true }
   [Hyros] Non-JSON response received: { status: 404, ... }
   OR
   [Hyros] API request failed: { status: 400, data: {...} }
   OR
   [Hyros] Event sent successfully: { eventId: '...' }
   ```

3. **If you get a 400 error with JSON response:**
   - The endpoint is correct!
   - But the request format is wrong
   - Check the error message for required fields

4. **If you get a 404 error:**
   - The endpoint path is still wrong
   - Check Hyros docs for the exact path

5. **If you get a 401/403 error:**
   - API key format or location is wrong
   - May need to use headers instead of body

## 📚 What to Look for in Hyros Docs

When you check https://hyros.docs.apiary.io/#reference, look for:

### For Orders Endpoint:
1. **Full endpoint path** - Confirm it's exactly `/v1/api/v1.0/orders`
2. **HTTP method** - Confirm it's POST
3. **Authentication** - Headers or body?
4. **Required fields** - What must be included?
5. **Field names** - What are they called? (email, order_id, revenue, etc.)
6. **Example request** - Copy the exact JSON structure they show

### For Leads Endpoint:
Same questions as above for `/v1/api/v1.0/leads`

## 🔧 How to Update if Needed

If the API docs show a different format, let me know and I'll update:
- `apps/web/src/lib/hyros.ts` - The tracking functions
- `apps/web/src/lib/hyros-config.ts` - The configuration

## 📊 Expected Results

Once the format is correct, you should see:
```
[Hyros] Sending event: { endpoint: '/orders', email: '...', hasApiKey: true }
[Hyros] Event sent successfully: { eventId: 'evt_xxxxx', endpoint: '/orders' }
[Hyros] Metadata stored: { purchaseId: 32201, eventType: 'pending', success: true }
```

And in your Hyros dashboard, you should see the order/lead appear.

## 🆘 If Still Getting Errors

Share the full error log and I'll help you adjust the implementation to match Hyros' exact API format.

