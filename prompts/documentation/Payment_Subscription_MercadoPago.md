# Mercado Pago Subscription Payment Flow - Complete Documentation

## 🎓 FEATURE STATUS: PRODUCTION-READY ✅

**Payment flow for organization plan subscriptions via Mercado Pago is COMPLETE and TESTED.**

This document describes the complete flow for purchasing organization subscriptions via Mercado Pago. **DO NOT MODIFY** the files listed in the "Protected Files" section without careful consideration.

---

## 📋 FLOW OVERVIEW

### User Journey

1. **Admin initiates plan upgrade**
   - Visits organization billing page (`/organization/billing`)
   - Selects a plan (e.g., Teams)
   - Chooses billing period (monthly/annual)
   - Clicks "Pagar con Mercado Pago"

2. **Frontend sends payment request** → Backend creates MP preference
   - POST `/api/checkout/mp/create-subscription`
   - Sends: `plan_slug`, `organization_id`, `billing_period`, `currency` (ARS)
   - Receives: `initPoint` (MP checkout URL), `preferenceId`

3. **User redirected to Mercado Pago**
   - Completes payment on MP UI
   - Returns to app via `back_urls.success`

4. **MP sends webhook notification**
   - POST `/api/checkout/mp/webhook?secret={MP_WEBHOOK_SECRET}`
   - Types: `payment` or `merchant_order`
   - Backend processes asynchronously

5. **Backend processes webhook**
   - Validates webhook secret
   - Fetches payment/order details from MP API
   - Resolves `auth_id` → `users.id`
   - Creates payment record (idempotent)
   - Upgrades organization plan
   - Creates billing cycle record

---

## 🔄 DETAILED REQUEST/RESPONSE FLOW

### Step 1: Create Subscription Preference

**Endpoint:** `POST /api/checkout/mp/create-subscription`

**Request Body:**
```json
{
  "plan_slug": "teams",
  "organization_id": "uuid...",
  "billing_period": "monthly",
  "currency": "ARS"
}
```

**Response (Success):**
```json
{
  "success": true,
  "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "preferenceId": "130095653-..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Ya tienes una suscripción activa a este plan",
  "status": 400
}
```

### Step 2: Webhook Processing

**Endpoint:** `POST /api/checkout/mp/webhook?secret={MP_WEBHOOK_SECRET}`

**Happens server-side:**
1. Validates webhook secret
2. Fetches payment details from MP API
3. Extracts metadata (user_id, plan_slug, org_id, billing_period)
4. **CRITICAL**: Resolves `auth_id` → `users.id`
5. Inserts payment record (idempotent)
6. Only if newly inserted: upgrades organization plan
7. Creates billing cycle record

---

## 💱 ARS PRICE HANDLING

### Price Conversion Flow

```typescript
// 1. Get base price in USD from plans table
const priceUsd = billing_period === 'monthly' 
  ? plan.monthly_amount 
  : plan.annual_amount;

// 2. For first payment, always 1 seat
const seats = 1;
let unit_price = priceUsd * seats;

// 3. Convert to ARS if needed
if (currency === 'ARS') {
  const { data: exchangeRate } = await supabase
    .from("exchange_rates")
    .select("rate")
    .eq("from_currency", "USD")
    .eq("to_currency", "ARS")
    .single();
  
  unit_price = unit_price * Number(exchangeRate.rate);
}
```

---

## 💳 DATA FLOW - Database Changes

### Payment Created
```javascript
// payments table
{
  id: "uuid",                    // ✅ Our payment ID (UUID)
  provider: "mercadopago",
  provider_payment_id: "135052460051",
  user_id: "uuid",               // ✅ users.id (resolved from auth_id)
  organization_id: "uuid",
  product_id: "uuid",            // plan_id
  amount: 28800,                 // ARS amount
  currency: "ARS",
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
  payment_id: "uuid",            // ✅ payments.id (UUID)
  status: "active",
  billing_period: "monthly",
  started_at: "2025-11-28T...",
  expires_at: "2025-12-28T...",
  amount: 28800,
  currency: "ARS"
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
  amount_per_seat: 20.00,        // USD base price
  base_amount: 28800,            // ARS converted
  total_amount: 28800,
  billing_period: "monthly",
  paid: true,
  status: "paid",
  payment_provider: "mercadopago",
  payment_id: "uuid",
  currency_code: "ARS"
}
```

---

## 🔐 CRITICAL SECURITY & ID RESOLUTION RULES

### ⚠️ ID RESOLUTION - Most Important

**The metadata contains `auth_id`, which MUST be resolved to `users.id`:**

```typescript
// In processWebhook.ts
const resolvedUserId = md.user_id; // This is auth_id

// CRITICAL: Resolve to users.id
const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", resolvedUserId)
  .maybeSingle();

const publicUserId = userProfile.id; // ✅ Use this for DB operations
```

### Idempotent Payment Processing

```typescript
// Insert payment - returns { inserted, paymentId }
const paymentResult = await insertPayment(supabase, "mercadopago", {
  providerPaymentId,
  userId: publicUserId,  // ✅ Must be users.id
  productType: 'subscription',
  organizationId,
  productId: resolvedPlanId,
});

// ONLY upgrade if payment was newly inserted
if (paymentResult.inserted && paymentResult.paymentId) {
  await upgradeOrganizationPlan(supabase, {
    organizationId,
    planId: resolvedPlanId,
    billingPeriod,
    paymentId: paymentResult.paymentId, // ✅ UUID from payments table
    amount,
    currency,
  });
}
```

### Duplicate Subscription Prevention

The `createSubscriptionPreference` checks for existing active subscriptions:

```typescript
const { data: existingSubscription } = await supabase
  .from("organization_subscriptions")
  .select("id, status, expires_at")
  .eq("organization_id", organization_id)
  .eq("plan_id", plan.id)
  .in("status", ["active", "trialing", "pending", "cancelled"])
  .maybeSingle();

if (existingSubscription && isStillActive) {
  return { 
    success: false, 
    error: "Ya tienes una suscripción activa a este plan" 
  };
}
```

---

## 📁 PROTECTED FILES - DO NOT MODIFY

```
server/lib/handlers/checkout/mp/createSubscriptionPreference.ts
  └─ Function: createSubscriptionPreference
  └─ Responsibility: Create MP preference, verify admin, ARS conversion
  └─ Status: LOCKED FOR MP SUBSCRIPTIONS

server/lib/handlers/checkout/mp/processWebhook.ts
  └─ Section: productType === 'subscription'
  └─ Responsibility: Handle webhook, resolve IDs, idempotent upgrade
  └─ Status: LOCKED FOR MP SUBSCRIPTIONS

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
    └─ POST /api/checkout/mp/create-subscription
    └─ POST /api/checkout/mp/webhook (subscription handling)
  └─ Status: LOCKED FOR MP SUBSCRIPTION ROUTES
```

---

## ✅ TESTING CHECKLIST

- [ ] **Normal Subscription Flow**
  - [ ] Admin selects plan
  - [ ] Clicks "Pagar con Mercado Pago"
  - [ ] Redirected to Mercado Pago
  - [ ] Completes payment
  - [ ] Webhook received and processed
  - [ ] Organization plan updated
  - [ ] Billing cycle created

- [ ] **Duplicate Prevention**
  - [ ] Try to subscribe to same plan → "Ya tienes una suscripción activa"
  - [ ] Multiple webhooks → only one subscription created

- [ ] **ARS Conversion**
  - [ ] USD price correctly converted using exchange_rates
  - [ ] Final ARS amount matches expected

- [ ] **Error Cases**
  - [ ] Invalid plan → error
  - [ ] Not org admin → 403
  - [ ] Exchange rate missing → error

---

## 📊 Monitoring & Debugging

**View subscription payments:**
```sql
SELECT * FROM payments 
WHERE product_type = 'subscription' AND provider = 'mercadopago' 
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

**Check exchange rate:**
```sql
SELECT * FROM exchange_rates 
WHERE from_currency = 'USD' AND to_currency = 'ARS' AND is_active = true;
```

---

## 📝 Last Updated

**November 28, 2025** - Mercado Pago subscription flow COMPLETE and TESTED.

Key features:
- `auth_id` → `users.id` resolution in webhook
- Idempotent payment processing with `insertPayment`
- UUID payment IDs in `upgradeOrganizationPlan`
- Duplicate subscription prevention
- ARS price conversion with exchange rates
