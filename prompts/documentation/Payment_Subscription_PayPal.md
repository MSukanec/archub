# PayPal Subscription Payment Flow - Complete Documentation

## 🎓 FEATURE STATUS: PRODUCTION-READY ✅

**Payment flow for organization plan subscriptions via PayPal is COMPLETE and TESTED.**

This document describes the complete flow for purchasing organization subscriptions via PayPal. **DO NOT MODIFY** the files listed in the "Protected Files" section without careful consideration.

---

## 📋 FLOW OVERVIEW

### User Journey

1. **Admin initiates plan upgrade**
   - Visits organization billing page (`/organization/billing`)
   - Selects a plan (e.g., Teams)
   - Chooses billing period (monthly/annual)
   - Clicks "Upgrade with PayPal"

2. **Frontend sends payment request** → Backend creates PayPal order
   - POST `/api/checkout/paypal/create-subscription`
   - Sends: `plan_slug`, `organization_id`, `billing_period`
   - Receives: `orderId`, `approvalUrl`

3. **User redirected to PayPal**
   - Approves payment on PayPal UI
   - Returns to app with PayPal `token` (order ID)

4. **Backend captures payment**
   - GET `/api/checkout/paypal/capture-subscription?token={orderId}`
   - Captures funds from PayPal
   - Resolves `auth_id` → `users.id`
   - Creates payment record
   - Upgrades organization plan
   - Creates billing cycle record
   - Redirects user to billing page with success message

---

## 🔄 DETAILED REQUEST/RESPONSE FLOW

### Step 1: Create Subscription Order

**Endpoint:** `POST /api/checkout/paypal/create-subscription`

**Request Body:**
```json
{
  "plan_slug": "teams",
  "organization_id": "uuid...",
  "billing_period": "monthly"
}
```

**Response (Success):**
```json
{
  "success": true,
  "orderId": "7B123456789...",
  "approvalUrl": "https://www.paypal.com/checkoutnow?token=...",
  "order": { "id": "...", "links": [...] }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Plan not found or inactive" | "Not organization admin",
  "status": 403
}
```

### Step 2: Capture Subscription Order

**Endpoint:** `GET /api/checkout/paypal/capture-subscription`

**Query Parameters:**
- `token`: PayPal order ID (token from return URL)

**Happens silently server-side:**
1. Captures PayPal order
2. Parses `custom_id` (format: `auth_id|plan_id|org_id|billing_period`)
3. **CRITICAL**: Resolves `auth_id` → `users.id`
4. Logs payment event
5. Inserts payment record (idempotent)
6. Upgrades organization plan (only if payment newly inserted)
7. Creates billing cycle record
8. Returns HTML with spinner → redirects to `/organization/billing?payment=success`

---

## 💳 DATA FLOW - Database Changes

### Payment Created
```javascript
// payments table
{
  id: "uuid",                    // ✅ Our payment ID (UUID)
  provider: "paypal",
  provider_payment_id: "CAPTURE-ID-12345",
  user_id: "uuid",               // ✅ users.id (resolved from auth_id)
  organization_id: "uuid",
  product_id: "uuid",            // plan_id
  amount: 20.00,
  currency: "USD",
  status: "completed",
  product_type: "subscription",
  created_at: "2025-11-28T..."
}
```

### Organization Subscription Created
```javascript
// organization_subscriptions table
{
  id: "uuid",
  organization_id: "uuid",
  plan_id: "uuid",
  payment_id: "uuid",            // ✅ payments.id (UUID, not PayPal ID)
  status: "active",
  billing_period: "monthly",
  started_at: "2025-11-28T...",
  expires_at: "2025-12-28T...",  // +1 month or +1 year
  amount: 20.00,
  currency: "USD"
}
```

### Billing Cycle Created
```javascript
// organization_billing_cycles table
{
  id: "uuid",
  organization_id: "uuid",
  subscription_id: "uuid",
  plan_id: "uuid",
  seats: 3,                      // Actual billable members
  billed_seats: 1,               // First payment always 1 seat
  amount_per_seat: 20.00,
  base_amount: 20.00,
  total_amount: 20.00,
  billing_period: "monthly",
  period_start: "2025-11-28T...",
  period_end: "2025-12-28T...",
  paid: true,
  status: "paid",
  payment_provider: "paypal",
  payment_id: "uuid",
  currency_code: "USD"
}
```

### Organization Updated
```javascript
// organizations table
{
  id: "uuid",
  plan_id: "uuid"  // Updated to new plan
}
```

---

## 🔐 CRITICAL SECURITY & ID RESOLUTION RULES

### ⚠️ ID RESOLUTION - Most Important

**Frontend uses `auth_id` from Supabase Auth, but the database uses `users.id`.**

The `custom_id` in PayPal contains `auth_id`, which MUST be resolved to `users.id`:

```typescript
// custom_id format: auth_id|plan_id|organization_id|billing_period
const parts = customId.split("|");
const authId = parts[0];  // This is auth_id, NOT users.id

// CRITICAL: Resolve to users.id
const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", authId)
  .maybeSingle();

const publicUserId = userProfile.id;  // ✅ Use this for DB operations
```

### Security Principles

1. **Price from Database, Not Client**
   - Always fetch price from `plans.monthly_amount` or `plans.annual_amount`
   - Never trust price from frontend request

2. **User from Auth Session, Not Body**
   - Extract user from authenticated session via `supabase.auth.getUser()`
   - Verify user is admin of the organization

3. **Admin Verification**
   - Use `verifyAdminRoleForOrganization()` before creating payment
   - Only admins can upgrade organization plans

4. **Idempotent Payment Processing**
   - Use `insertPayment()` which returns `{ inserted, paymentId }`
   - Only upgrade organization if `inserted === true`
   - Prevents duplicate subscriptions from webhook retries

5. **Use payments.id for References**
   - `organization_subscriptions.payment_id` = UUID from payments table
   - `organization_billing_cycles.payment_id` = UUID from payments table
   - NOT the PayPal capture ID

---

## 📁 PROTECTED FILES - DO NOT MODIFY

These files implement the PayPal subscription flow and are **FROZEN** to prevent regression:

```
server/lib/handlers/checkout/paypal/createSubscriptionOrder.ts
  └─ Function: createSubscriptionOrder
  └─ Responsibility: Create PayPal order, verify admin, encode custom_id
  └─ Status: LOCKED FOR PAYPAL SUBSCRIPTIONS

server/lib/handlers/checkout/paypal/captureSubscriptionOrder.ts
  └─ Function: captureSubscriptionOrder
  └─ Responsibility: Capture order, resolve auth_id→users.id, upgrade org
  └─ Status: LOCKED FOR PAYPAL SUBSCRIPTIONS

server/lib/handlers/checkout/paypal/processWebhook.ts
  └─ Section: product_type === "subscription"
  └─ Responsibility: Handle webhook, resolve IDs, idempotent upgrade
  └─ Status: LOCKED FOR PAYPAL SUBSCRIPTIONS

server/lib/handlers/checkout/shared/subscriptions.ts
  └─ Function: upgradeOrganizationPlan
  └─ Responsibility: Cancel old sub, create new sub, billing cycle
  └─ Status: LOCKED FOR SUBSCRIPTIONS

server/lib/handlers/checkout/shared/payments.ts
  └─ Function: insertPayment
  └─ Responsibility: Idempotent payment insert, returns paymentId
  └─ Status: LOCKED FOR PAYMENTS

server/lib/handlers/checkout/shared/permissions.ts
  └─ Function: verifyAdminRoleForOrganization
  └─ Responsibility: Check user is org admin
  └─ Status: LOCKED FOR PERMISSIONS

server/routes/payments.ts
  └─ Endpoints: 
    └─ POST /api/checkout/paypal/create-subscription
    └─ GET /api/checkout/paypal/capture-subscription
  └─ Status: LOCKED FOR PAYPAL SUBSCRIPTION ROUTES
```

---

## ✅ TESTING CHECKLIST

Use this to validate the flow works:

- [ ] **Normal Subscription Flow**
  - [ ] Admin selects plan
  - [ ] Clicks "Upgrade with PayPal"
  - [ ] Redirected to PayPal
  - [ ] Approves payment
  - [ ] Redirected back with spinner animation
  - [ ] Organization plan updated
  - [ ] Billing cycle created

- [ ] **Idempotency**
  - [ ] Multiple webhooks for same payment → only one subscription
  - [ ] Capture + webhook → no duplicates

- [ ] **Security**
  - [ ] Non-admin cannot create subscription
  - [ ] Price comes from database, not request

- [ ] **Error Cases**
  - [ ] Invalid plan → error message
  - [ ] Not org admin → 403 error
  - [ ] PayPal capture fails → error page

---

## 📊 Monitoring & Debugging

**View subscription payments:**
```sql
SELECT * FROM payments 
WHERE product_type = 'subscription' AND provider = 'paypal' 
ORDER BY created_at DESC LIMIT 10;
```

**View organization subscriptions:**
```sql
SELECT os.*, p.name as plan_name 
FROM organization_subscriptions os
JOIN plans p ON p.id = os.plan_id
WHERE os.organization_id = 'org-uuid'
ORDER BY os.created_at DESC;
```

**View billing cycles:**
```sql
SELECT * FROM organization_billing_cycles 
WHERE organization_id = 'org-uuid' 
ORDER BY created_at DESC LIMIT 10;
```

**Verify organization plan:**
```sql
SELECT o.id, o.name, p.name as plan_name, p.slug as plan_slug
FROM organizations o
LEFT JOIN plans p ON p.id = o.plan_id
WHERE o.id = 'org-uuid';
```

---

## 🚀 FIRST PAYMENT vs RENEWAL

### First Payment (Teams Plan)
- **Billed seats**: Always 1 (just the admin)
- **Actual seats**: Snapshot of all billable members
- **Total amount**: 1 × plan_price

### Renewal (Future)
- **Billed seats**: Actual billable members count
- **Total amount**: seats × plan_price
- Uses billing cycle snapshot for accurate billing

---

## 📝 Last Updated

**November 28, 2025** - PayPal subscription flow with proper ID resolution, idempotency, and UUID payment IDs COMPLETE and TESTED.

Key fixes implemented:
- `auth_id` → `users.id` resolution in captureSubscriptionOrder
- `userId` passed to `insertPayment` for subscriptions
- `paymentResult.paymentId` (UUID) used in `upgradeOrganizationPlan`
- Idempotent processing prevents duplicate subscriptions
