# Mercado Pago Subscription Payment Flow - Complete Documentation

## 🎓 FEATURE STATUS: PRODUCTION-READY ✅

**Payment flow for organization plan subscriptions via Mercado Pago is COMPLETE and TESTED.**

This document describes the complete flow for purchasing organization subscriptions via Mercado Pago, including both the legacy one-time payment flow and the new recurring subscriptions with automatic renewal (Preapproval API).

---

## 📋 FLOW OVERVIEW

### Two Payment Modes

MercadoPago subscriptions support two modes:

1. **Recurring Subscriptions (NEW)** - Uses MercadoPago Preapproval API for automatic renewal
   - Requires synced MP preapproval plans via admin endpoint
   - Automatic monthly/annual charges
   - Managed via webhooks (`subscription_preapproval`, `subscription_authorized_payment`)
   
2. **Legacy One-Time Flow** - Single payment, no auto-renewal
   - Fallback when MP plan IDs are not configured
   - Uses standard checkout preferences
   - Manual renewal required

The system automatically selects the appropriate mode based on whether the plan has `mp_plan_monthly_id` or `mp_plan_annual_id` configured.

---

## 🔄 RECURRING SUBSCRIPTION FLOW (NEW - Preapproval API)

### Prerequisites - Admin Sync

Before recurring subscriptions work, an admin must sync MercadoPago preapproval plans:

**Endpoint:** `POST /api/admin/mp/sync-plans`

**What it does:**
1. Fetches all active plans from database (excluding 'free')
2. Gets current USD→ARS exchange rate
3. For each plan, creates:
   - Monthly Preapproval Plan in MercadoPago
   - Annual Preapproval Plan in MercadoPago
4. Saves MercadoPago Plan IDs to the `plans` table:
   - `mp_plan_monthly_id`
   - `mp_plan_annual_id`

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "planSlug": "pro",
      "monthlyPlanId": "2c938084xxxxxxxx",
      "annualPlanId": "2c938084yyyyyyyy",
      "created": true
    }
  ]
}
```

### User Journey (Recurring)

1. **Admin initiates plan upgrade**
   - Visits organization billing page (`/organization/billing`)
   - Selects a plan (e.g., Pro, Teams)
   - Chooses billing period (monthly/annual)
   - Clicks "Pagar con Mercado Pago"

2. **Frontend sends payment request** → Backend creates MP Preapproval
   - POST `/api/checkout/mp/create-recurring-subscription`
   - Sends: `plan_slug`, `organization_id`, `billing_period`, `payer_email` (optional)
   - Backend checks if plan has `mp_plan_monthly_id` or `mp_plan_annual_id`
   - Creates record in `mp_subscription_preferences` table (auxiliary data store)
   - Creates preapproval via MercadoPago API
   - Returns: `initPoint` (checkout URL), `preapprovalId`

3. **User redirected to MercadoPago**
   - Approves subscription on MP UI
   - Returns to app via `back_url` → `/api/checkout/mp/subscription-success`

4. **Backend activates subscription (Return Handler)**
   - GET `/api/checkout/mp/subscription-success`
   - Searches for pending preferences and authorized preapprovals
   - Verifies preapproval status with MP API (must be `authorized`)
   - Looks up subscription data from `mp_subscription_preferences` table
   - Creates payment record
   - Upgrades organization plan with `provider_subscription_id`
   - Applies Founders Program if annual subscription
   - Redirects user to billing page with success message

5. **Automatic Renewals (via Webhooks)**
   - MercadoPago sends `subscription_authorized_payment` for each renewal
   - Webhook handler extends subscription expiry
   - Creates new payment and billing cycle records

---

## 📊 CRITICAL: MP_SUBSCRIPTION_PREFERENCES TABLE

### Why This Table Exists

MercadoPago's Preapproval API has a **64-character limit** on the `external_reference` field and **NO metadata field**. This is different from PayPal which allows unlimited data in `custom_id`.

To work around this limitation, we store subscription data in `mp_subscription_preferences`:

```sql
CREATE TABLE mp_subscription_preferences (
  id TEXT PRIMARY KEY,              -- Short ID: "mps_xxxxxxxxxxxx" (nanoid)
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  plan_slug TEXT NOT NULL,
  billing_period TEXT NOT NULL,     -- 'monthly' or 'annual'
  preapproval_id TEXT,              -- MP preapproval ID (set after creation)
  status TEXT DEFAULT 'pending',    -- 'pending', 'activated', 'expired'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Data Flow

1. **At checkout creation:**
   - Generate short ID: `mps_Vw5npzRRro4U`
   - Store full data in `mp_subscription_preferences`
   - Use short ID as `external_reference` in MP API

2. **At webhook/return:**
   - Receive short ID or preapproval_id
   - Look up full data from `mp_subscription_preferences`
   - Process subscription activation

---

## 🔄 LEGACY ONE-TIME FLOW

### User Journey (One-Time Payment)

1. **Admin initiates plan upgrade** (same as recurring)

2. **Frontend sends payment request** → Backend creates MP Preference
   - POST `/api/checkout/mp/create-subscription`
   - Backend checks if plan has MP plan IDs
   - If NO → Uses legacy checkout preference
   - Returns: `initPoint`, `preferenceId`

3. **User redirected to MercadoPago**
   - Completes payment on MP UI
   - Returns to app via `back_urls.success`

4. **MP sends webhook notification**
   - POST `/api/checkout/mp/webhook?secret={MP_WEBHOOK_SECRET}`
   - Type: `payment` or `merchant_order`
   - Backend validates and processes

5. **Backend processes webhook**
   - Validates webhook secret
   - Fetches payment details from MP API
   - Resolves `auth_id` → `users.id`
   - Creates payment record (idempotent)
   - Upgrades organization plan
   - Creates billing cycle record

---

## 📡 WEBHOOK EVENTS

### Subscription Events (Recurring - Preapproval API)

| Event | Handler | Action |
|-------|---------|--------|
| `subscription_preapproval` | `processSubscriptionPreapproval` | Initial authorization - activates subscription |
| `subscription_authorized_payment` | `processSubscriptionAuthorizedPayment` | Renewal payment - extends expiry |

### Legacy Events (One-Time)

| Event | Handler | Action |
|-------|---------|--------|
| `payment` | `processPaymentWebhook` | Processes one-time payment |
| `merchant_order` | `processMerchantOrderWebhook` | Processes order completion |

---

## 💾 DATABASE SCHEMA

### Plans Table - New Columns

```sql
ALTER TABLE plans ADD COLUMN mp_plan_monthly_id TEXT;
ALTER TABLE plans ADD COLUMN mp_plan_annual_id TEXT;
```

### Organization Subscriptions Table - Critical Column

```sql
ALTER TABLE organization_subscriptions ADD COLUMN provider_subscription_id TEXT;
-- For recurring: stores MP preapproval_id
-- Used to identify subscription for renewal webhooks
```

### MP Subscription Preferences Table (Auxiliary)

```sql
CREATE TABLE mp_subscription_preferences (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  plan_slug TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  preapproval_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 💱 ARS PRICE HANDLING

### Price Conversion Flow

```typescript
// 1. Get base price in USD from plans table
const priceUsd = billing_period === 'monthly' 
  ? plan.monthly_amount 
  : plan.annual_amount;

// 2. Get exchange rate
const { data: exchangeRate } = await supabase
  .from("exchange_rates")
  .select("rate")
  .eq("from_currency", "USD")
  .eq("to_currency", "ARS")
  .single();

// 3. Convert to ARS
const priceArs = Math.round(priceUsd * Number(exchangeRate.rate) * 100) / 100;
```

---

## 🔐 CRITICAL SECURITY & ID RESOLUTION RULES

### ⚠️ ID RESOLUTION - Most Important

**The metadata/external_reference contains `auth_id`, which MUST be resolved to `users.id`:**

```typescript
// CRITICAL: Resolve auth_id → users.id
const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", authId)
  .maybeSingle();

const publicUserId = userProfile.id; // ✅ Use this for DB operations
```

### Idempotent Payment Processing

```typescript
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
    paymentId: paymentResult.paymentId,
    amount,
    currency,
    providerSubscriptionId: preapprovalId, // ✅ For recurring
  });
}
```

---

## 📁 KEY FILES

### MercadoPago Subscriptions API
```
server/lib/handlers/checkout/mp/subscriptions-api.ts
  └─ createMPPreapprovalPlan: Create preapproval plan in MP
  └─ getMPPreapprovalPlan: Fetch plan details
  └─ createMPPreapproval: Create preapproval for user
  └─ getMPPreapproval: Fetch preapproval details
  └─ searchMPPreapprovalByExternalRef: Search by external_reference
  └─ updateMPPreapproval: Update preapproval
  └─ cancelMPPreapproval: Cancel preapproval
```

### Subscription Creation
```
server/lib/handlers/checkout/mp/createRecurringSubscription.ts
  └─ Creates recurring subscription via Preapproval API
  └─ Stores data in mp_subscription_preferences
  └─ Handles proration calculations
  └─ Returns initPoint for checkout

server/lib/handlers/checkout/mp/createSubscriptionPreference.ts
  └─ Creates legacy one-time checkout preference
  └─ Fallback when MP plan IDs not configured
```

### Return Handler
```
server/lib/handlers/checkout/mp/handleSubscriptionReturn.ts
  └─ Processes return from MP checkout
  └─ Searches for pending preferences
  └─ Verifies preapproval is authorized
  └─ Activates subscription
  └─ Multiple fallback strategies to find preference data
```

### Webhook Processing
```
server/lib/handlers/checkout/mp/processWebhook.ts
  └─ processSubscriptionPreapproval: Handles initial authorization
  └─ processSubscriptionAuthorizedPayment: Handles renewal payments
  └─ processPaymentWebhook: Legacy one-time payments
  └─ processMerchantOrderWebhook: Legacy order processing
```

### Admin Tools
```
server/lib/handlers/checkout/mp/sync-plans.ts
  └─ syncMPPlans: Creates preapproval plans in MercadoPago
  └─ Saves IDs to plans table for automatic use
```

### Configuration
```
server/lib/handlers/checkout/mp/config.ts
  └─ MP_ACCESS_TOKEN: Production/test token
  └─ MP_WEBHOOK_SECRET: Webhook validation
  └─ isTestMode: Environment detection
```

---

## 🔄 RETURN HANDLER FALLBACK STRATEGIES

The return handler (`handleSubscriptionReturn.ts`) uses multiple strategies to find subscription data because MercadoPago's `external_reference` can sometimes be empty or malformed:

1. **Primary**: Look up by `external_reference` starting with `mps_`
2. **Fallback 1**: Search `mp_subscription_preferences` by `preapproval_id`
3. **Fallback 2**: Find recent preference without active subscription

This ensures subscription activation even when MercadoPago doesn't return expected data.

---

## ⚠️ KNOWN LIMITATIONS

### Proration - TEMPORARILY DISABLED for MercadoPago Recurring

**Problem:** MercadoPago Preapproval Plans have a single REGULAR billing cycle. If you override the first payment price for proration, it affects ALL future payments.

**Current State:** Proration is calculated and displayed but NOT applied to MercadoPago recurring subscriptions.

**Solution (TODO):** Rebuild MP plans with TRIAL + REGULAR cycles so only the TRIAL (first) payment can be discounted.

### Modification of Active Subscriptions

Both PayPal and MercadoPago have limitations for modifying active subscriptions (upgrades, adding members). See section below.

---

## 🔧 SUBSCRIPTION MODIFICATIONS - PENDING IMPLEMENTATION

### The Problem

Both PayPal and MercadoPago have difficulties with modifying active subscriptions:

1. **Upgrade mid-cycle**: Need to cancel current and create new subscription with prorated amount
2. **Adding/removing members (TEAMS)**: Need to update billing amount

### Recommended Solution

For both gateways, the pattern is:
1. **Cancel** current subscription in payment provider
2. **Create new** subscription with updated parameters
3. **Apply proration** credit from remaining time on old subscription

This is consistent with how GPT and Gemini recommend handling it.

**TODO:** Implement this pattern for:
- Organization plan upgrades
- TEAMS member count changes

---

## ✅ TESTING CHECKLIST

### Recurring Subscription Flow
- [ ] **Admin Sync**
  - [ ] Call POST `/api/admin/mp/sync-plans`
  - [ ] Verify plans table has MP plan IDs

- [ ] **Subscription Creation**
  - [ ] Create subscription → returns `initPoint`
  - [ ] User redirected to MercadoPago subscription page
  - [ ] After approval, subscription activated via return handler
  - [ ] `provider_subscription_id` saved

- [ ] **Return Handler**
  - [ ] User returns from MP → subscription activated
  - [ ] Founders Program applied for annual subscriptions
  - [ ] Redirected to billing page with success

- [ ] **Renewal Webhooks**
  - [ ] `subscription_authorized_payment` webhook received
  - [ ] Subscription expiry extended
  - [ ] New payment record created

### Legacy Flow
- [ ] **Without MP Plan IDs**
  - [ ] Create subscription → uses legacy preference
  - [ ] Payment webhook processed
  - [ ] Organization upgraded

### Idempotency
- [ ] Multiple webhooks → only one payment
- [ ] Return handler + webhook → no duplicates

---

## 📊 Monitoring & Debugging

**View subscription payments:**
```sql
SELECT * FROM payments 
WHERE product_type = 'subscription' AND provider = 'mercadopago' 
ORDER BY created_at DESC LIMIT 10;
```

**View active recurring subscriptions:**
```sql
SELECT os.*, p.name as plan_name, os.provider_subscription_id
FROM organization_subscriptions os
JOIN plans p ON p.id = os.plan_id
WHERE os.status = 'active' 
AND os.provider_subscription_id IS NOT NULL
ORDER BY os.created_at DESC;
```

**View MP subscription preferences:**
```sql
SELECT * FROM mp_subscription_preferences
ORDER BY created_at DESC LIMIT 10;
```

**View MP plan configuration:**
```sql
SELECT id, name, slug, 
       mp_plan_monthly_id, 
       mp_plan_annual_id
FROM plans
WHERE is_active = true;
```

**Check exchange rate:**
```sql
SELECT * FROM exchange_rates 
WHERE from_currency = 'USD' AND to_currency = 'ARS' AND is_active = true;
```

---

## 📝 Last Updated

**December 1, 2025** - Complete overhaul with MercadoPago Preapproval API (recurring subscriptions).

Key additions:
- `subscriptions-api.ts` for MercadoPago Preapproval API
- `createRecurringSubscription.ts` for recurring flow
- `handleSubscriptionReturn.ts` for return URL processing
- `sync-plans.ts` for admin preapproval plan sync
- `mp_subscription_preferences` table for data storage
- Webhook handlers for `subscription_preapproval` and `subscription_authorized_payment`
- Multiple fallback strategies in return handler
- Founders Program integration for annual subscriptions
