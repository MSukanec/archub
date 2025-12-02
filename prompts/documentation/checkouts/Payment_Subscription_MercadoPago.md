# Mercado Pago Subscription Payment Flow - Complete Documentation

## 🎓 FEATURE STATUS: PRODUCTION-READY ✅

**Payment flow for organization plan subscriptions via Mercado Pago is COMPLETE and TESTED.**

This document describes the complete flow for purchasing organization subscriptions via Mercado Pago, including:
- New recurring subscriptions (Preapproval API)
- **HYBRID UPGRADE FLOW** - One-time proration payment + deferred recurring subscription
- Legacy one-time payment flow (fallback)

---

## 📋 FLOW OVERVIEW

### Three Payment Modes

MercadoPago subscriptions support three modes:

1. **Recurring Subscriptions (NEW)** - Uses MercadoPago Preapproval API for automatic renewal
   - For NEW subscriptions (no existing plan)
   - Automatic monthly/annual charges
   - Managed via webhooks (`subscription_preapproval`, `subscription_authorized_payment`)
   
2. **HYBRID UPGRADE FLOW (NEW)** - For upgrading existing subscriptions
   - One-time payment (Preference API) for prorated difference
   - Then recurring subscription (Preapproval API) with `start_date` = current subscription expiry
   - Immediate plan activation after proration payment
   
3. **Legacy One-Time Flow** - Single payment, no auto-renewal
   - Fallback when MP plan IDs are not configured
   - Uses standard checkout preferences
   - Manual renewal required

---

## 🔄 NEW SUBSCRIPTION FLOW (Preapproval API)

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

### User Journey (New Subscription)

1. **User visits subscription checkout**
   - `/subscription/checkout?plan=pro&billing=annual`
   - Fills in name, email, country, phone
   - Clicks "Suscribirme" (with MercadoPago)

2. **Frontend calls backend**
   - POST `/api/checkout/mp/create-recurring`
   - Backend creates record in `mp_subscription_preferences` (prefix `mps_`)
   - Backend creates preapproval via MercadoPago API
   - Returns: `initPoint` (checkout URL)

3. **User redirected to MercadoPago**
   - Approves subscription on MP UI
   - Returns to app via `back_url` → `/api/checkout/mp/subscription-success`

4. **Backend activates subscription (Return Handler)**
   - GET `/api/checkout/mp/subscription-success`
   - Looks up data from `mp_subscription_preferences` table by `preapproval_id`
   - Verifies preapproval status is `authorized`
   - Creates payment record
   - Upgrades organization plan with `provider_subscription_id`
   - Applies Founders Program if annual subscription
   - Redirects to billing page with success message

5. **Automatic Renewals (via Webhooks)**
   - MercadoPago sends `subscription_authorized_payment` for each renewal
   - Webhook handler extends subscription expiry
   - Creates new payment and billing cycle records

### Key Files - New Subscription
```
server/lib/handlers/checkout/mp/createRecurringSubscription.ts
  └─ Creates recurring subscription via Preapproval API
  └─ Stores data in mp_subscription_preferences (prefix: mps_)
  └─ Returns initPoint for checkout

server/lib/handlers/checkout/mp/handleSubscriptionReturn.ts
  └─ Processes return from MP checkout for NEW subscriptions
  └─ Verifies preapproval is authorized
  └─ Activates subscription
```

---

## 🚀 HYBRID UPGRADE FLOW (Proration + Deferred Recurring)

### Overview

When a user UPGRADES from one plan to another (e.g., PRO → TEAMS), we use a HYBRID approach:

1. **One-time payment** for the prorated difference (Preference API)
2. **Deferred recurring subscription** (Preapproval API) that starts when the current period expires

This is similar to how course payments work but adds the recurring component.

### Why Hybrid?

MercadoPago Preapproval API has limitations:
- Cannot charge a custom first amount (for proration)
- The `start_date` can defer first charge, but it charges full price

The hybrid approach solves this:
- User pays prorated amount NOW via one-time payment
- Recurring subscription created with `start_date` = current subscription expiry
- Plan activates immediately after proration payment

### User Journey (Upgrade)

1. **User clicks "Mejorar a TEAMS" on billing page**
   - UpgradeModal opens showing proration calculation
   - Shows: Plan price, credit from current subscription, amount to pay

2. **User clicks "Continuar al Pago"**
   - Frontend calls POST `/api/checkout/calculate-proration`
   - Displays breakdown: "Precio Teams: $0.12 USD - Crédito: $0.10 USD = $0.02 USD"

3. **User proceeds to SubscriptionCheckout**
   - URL: `/subscription/checkout?plan=teams&billing=annual&upgrade=true`
   - Shows proration details from calculateProration API

4. **Frontend calls upgrade endpoint**
   - POST `/api/checkout/mp/create-upgrade-preference`
   - Backend calculates proration and creates:
     - Record in `mp_subscription_preferences` (prefix `mpu_`)
     - MercadoPago Preference for one-time proration payment
   - Returns: `initPoint` (checkout URL)

5. **User pays proration on MercadoPago**
   - Pays the prorated difference (e.g., $29 ARS)
   - Returns to app via `/api/checkout/mp/upgrade-success`

6. **Backend processes upgrade return**
   - GET `/api/checkout/mp/upgrade-success?preference_id=mpu_xxx&payment_id=xxx&status=approved`
   - Looks up data from `mp_subscription_preferences`
   - Inserts proration payment record (`product_type: 'subscription_upgrade'`)
   - Creates recurring preapproval with `start_date` = previous subscription expiry
   - Cancels previous subscription
   - Activates new plan immediately via `upgradeOrganizationPlan`
   - Applies Founders Program if annual
   - Redirects to billing with success

### Key Proration Calculation

```typescript
// server/lib/handlers/checkout/shared/proration.ts

export async function calculateProration(supabase, params) {
  // 1. Get current subscription
  const currentSub = await getCurrentSubscription(supabase, orgId);
  
  // 2. Calculate remaining days
  const daysRemaining = differenceInDays(new Date(currentSub.expires_at), new Date());
  const totalDays = currentSub.billing_period === 'monthly' ? 30 : 365;
  const percentageRemaining = daysRemaining / totalDays;
  
  // 3. Calculate credit
  const currentPlanPrice = getCurrentPlanPrice(currentSub);
  const creditAmount = currentPlanPrice * percentageRemaining;
  
  // 4. Calculate final price
  const targetPlanPrice = getTargetPlanPrice(targetPlan, billingPeriod);
  const finalPrice = Math.max(0, targetPlanPrice - creditAmount);
  
  return {
    hasActiveSubscription: true,
    currentPlan: currentSub.plans.name,
    targetPlan: targetPlan.name,
    credit: {
      daysRemaining,
      totalDays,
      percentageRemaining: percentageRemaining * 100,
      creditAmount,
      creditCurrency: 'ARS',
    },
    finalPrice: { usd: finalPriceUSD, ars: finalPriceARS },
  };
}
```

### Key Files - Upgrade Flow

```
server/lib/handlers/checkout/mp/createUpgradePreference.ts
  └─ Creates one-time preference for proration payment
  └─ Stores data in mp_subscription_preferences (prefix: mpu_)
  └─ Sets is_upgrade=true, previous_subscription_id, proration_credit
  └─ Returns initPoint for checkout

server/lib/handlers/checkout/mp/handleUpgradeReturn.ts
  └─ Processes return from MP checkout for UPGRADES
  └─ Inserts proration payment (product_type: 'subscription_upgrade')
  └─ Creates recurring preapproval with start_date = current sub expiry
  └─ Cancels previous subscription
  └─ Activates new plan immediately
  └─ Applies Founders Program

server/lib/handlers/checkout/shared/proration.ts
  └─ calculateProration: Calculates credit and final price
```

---

## 📊 MP_SUBSCRIPTION_PREFERENCES TABLE (UPDATED)

### Why This Table Exists

MercadoPago's Preapproval API has a **64-character limit** on the `external_reference` field and **NO metadata field**. This is different from PayPal which allows unlimited data in `custom_id`.

To work around this limitation, we store subscription data in `mp_subscription_preferences`:

### Schema (Complete - With Upgrade Columns)

```sql
CREATE TABLE mp_subscription_preferences (
  id TEXT PRIMARY KEY,                    -- Short ID: "mps_xxx" or "mpu_xxx"
  preapproval_id TEXT,                    -- MP preapproval ID (set after creation)
  user_id UUID NOT NULL,                  -- ⚠️ This is auth_id (Supabase Auth UUID)
  organization_id UUID NOT NULL,
  plan_id UUID,
  plan_slug TEXT NOT NULL,
  billing_period TEXT NOT NULL,           -- 'monthly' or 'annual'
  amount_ars NUMERIC,                     -- Amount in ARS
  
  -- UPGRADE-SPECIFIC COLUMNS
  is_upgrade BOOLEAN DEFAULT FALSE,       -- TRUE for upgrades
  previous_subscription_id UUID,          -- Reference to old subscription
  proration_credit NUMERIC,               -- Credit from old subscription
  product_type TEXT,                      -- 'subscription' or 'subscription_upgrade'
  preference_id TEXT,                     -- MP Preference ID (for one-time payments)
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### ID Prefixes

- **`mps_`** - New subscription (createRecurringSubscription)
- **`mpu_`** - Upgrade (createUpgradePreference)

### Data Flow

1. **At checkout creation:**
   - Generate short ID: `mps_Vw5npzRRro4U` or `mpu_GRl5r_mJ-tCN`
   - Store full data in `mp_subscription_preferences`
   - Use short ID as `external_reference` in MP API

2. **At webhook/return:**
   - Receive short ID or preapproval_id
   - Look up full data from `mp_subscription_preferences`
   - Process subscription activation

---

## 🔐 CRITICAL: USER_ID vs AUTH_ID

### ⚠️ MOST IMPORTANT RULE

The `user_id` stored in `mp_subscription_preferences` is the **Supabase Auth UUID** (`auth.users.id`), NOT the `public.users.id`.

**When inserting payments, you MUST convert auth_id → users.id:**

```typescript
// CRITICAL: Resolve auth_id → users.id
const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", authId)  // auth_id from mp_subscription_preferences
  .maybeSingle();

const publicUserId = userProfile.id; // ✅ Use this for DB operations
```

### Where This Happens

- `processWebhook.ts` - For all webhook events
- `handleUpgradeReturn.ts` - For upgrade return handler
- `handleSubscriptionReturn.ts` - For new subscription return handler

---

## 💾 PAYMENTS TABLE - PRODUCT_TYPE SUPPORT

### insertPayment Function (UPDATED)

The `insertPayment` function in `server/lib/handlers/checkout/shared/payments.ts` handles different product types:

```typescript
if (!data.productType || data.productType === 'course') {
  paymentData.user_id = data.userId;
  paymentData.course_id = data.courseId;
  paymentData.product_id = data.courseId;
}

if (data.productType === 'subscription') {
  paymentData.user_id = data.userId;
  paymentData.organization_id = data.organizationId;
  paymentData.product_id = data.productId;
}

if (data.productType === 'subscription_upgrade') {
  paymentData.user_id = data.userId;
  paymentData.organization_id = data.organizationId;
  paymentData.product_id = data.productId;  // Target plan ID
}
```

### Billing Page Query

The billing page must include `subscription_upgrade` payments:

```typescript
// src/pages/billing/tabs/BillingListTab.tsx

const { data: paymentsData } = await supabase
  .from('payments')
  .select('*')
  .eq('organization_id', currentOrganizationId)
  .in('product_type', ['subscription', 'subscription_upgrade'])  // ✅ Include both
  .order('created_at', { ascending: false });
```

---

## 📡 WEBHOOK EVENTS

### Subscription Events (Recurring - Preapproval API)

| Event | Handler | Action |
|-------|---------|--------|
| `subscription_preapproval` | `processSubscriptionPreapproval` | Initial authorization - activates subscription |
| `subscription_authorized_payment` | `processSubscriptionAuthorizedPayment` | Renewal payment - extends expiry |

### Payment Events (One-Time - Preference API)

| Event | Handler | Action |
|-------|---------|--------|
| `payment` | `processPaymentWebhook` | Processes upgrade proration payment |
| `merchant_order` | `processMerchantOrderWebhook` | Processes order completion |

### Webhook Processing for Upgrades

When a webhook has `external_reference` starting with `mpu_`:

```typescript
if (externalRef.startsWith("mpu_")) {
  // Look up upgrade preference data
  const { data: prefData } = await supabase
    .from("mp_subscription_preferences")
    .select("*")
    .eq("id", externalRef)
    .maybeSingle();
  
  // product_type will be 'subscription_upgrade'
  // This tells insertPayment to use the upgrade columns
}
```

---

## 🔄 RETURN HANDLER LOGIC

### handleUpgradeReturn.ts - Key Logic

```typescript
export async function handleUpgradeReturn(req: Request) {
  // 1. Extract preference_id from URL (may be array)
  const preferenceIdRaw = req.query.preference_id;
  let preferenceId = Array.isArray(preferenceIdRaw) 
    ? preferenceIdRaw.find(id => typeof id === 'string' && id.startsWith('mpu_'))
    : preferenceIdRaw;
  
  // 2. Look up preference data
  const { data: prefData } = await supabase
    .from("mp_subscription_preferences")
    .select("*")
    .eq("id", preferenceId)
    .maybeSingle();
  
  // 3. Convert auth_id → users.id
  const { data: userProfile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", prefData.user_id)
    .maybeSingle();
  const publicUserId = userProfile.id;
  
  // 4. Check if subscription already exists (idempotency)
  const { data: existingSub } = await supabase
    .from("organization_subscriptions")
    .select("id")
    .eq("organization_id", organization_id)
    .eq("plan_id", resolvedPlanId)
    .eq("status", "active")
    .maybeSingle();
  
  if (existingSub) {
    return { success: true, activated: true, message: "Ya activada" };
  }
  
  // 5. Insert proration payment (may already exist from webhook)
  const paymentResult = await insertPayment(supabase, "mercadopago", {
    providerPaymentId: paymentId,
    userId: publicUserId,
    productType: 'subscription_upgrade',
    organizationId,
    productId: resolvedPlanId,
  });
  
  // 6. Even if payment already exists, CONTINUE with activation
  if (!paymentResult.inserted) {
    // Get existing payment ID
    if (!paymentResult.paymentId) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("provider_payment_id", paymentId)
        .maybeSingle();
      paymentResult.paymentId = existing?.id;
    }
  }
  
  // 7. Get start_date from previous subscription expiry
  const { data: prevSub } = await supabase
    .from("organization_subscriptions")
    .select("expires_at")
    .eq("id", previous_subscription_id)
    .maybeSingle();
  
  // 8. Create recurring preapproval with deferred start_date
  const preapprovalResult = await createMPPreapproval({
    reason: `Suscripción ${plan.name} - Anual`,
    external_reference: `mps_upgrade_${preferenceId}`,
    payer_email: userEmail,
    auto_recurring: {
      frequency: 12,
      frequency_type: "months",
      transaction_amount: fullPriceARS,
      currency_id: "ARS",
      start_date: prevSub.expires_at,  // ✅ Deferred to current sub expiry
    },
    back_url: backUrls.success,
    status: "pending",
  });
  
  // 9. Cancel previous subscription
  await supabase
    .from("organization_subscriptions")
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq("id", previous_subscription_id);
  
  // 10. Activate new plan immediately
  await upgradeOrganizationPlan(supabase, {
    organizationId,
    planId: resolvedPlanId,
    billingPeriod,
    paymentId: paymentResult.paymentId,
    amount: fullPriceARS,
    currency: "ARS",
    userId: publicUserId,
    providerSubscriptionId: preapprovalResult.preapprovalId,
  });
  
  return { success: true, activated: true };
}
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

// 4. For proration, apply credit
const prorationArs = Math.max(1, Math.round(finalPriceArs)); // Minimum $1 ARS
```

---

## 📁 KEY FILES - COMPLETE LIST

### MercadoPago API Wrappers
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

### New Subscription Flow
```
server/lib/handlers/checkout/mp/createRecurringSubscription.ts
  └─ Creates recurring subscription via Preapproval API
  └─ Stores data in mp_subscription_preferences (prefix: mps_)
  └─ Returns initPoint for checkout

server/lib/handlers/checkout/mp/handleSubscriptionReturn.ts
  └─ Processes return from MP checkout for NEW subscriptions
  └─ Verifies preapproval is authorized
  └─ Activates subscription
```

### Upgrade Flow (HYBRID)
```
server/lib/handlers/checkout/mp/createUpgradePreference.ts
  └─ Calculates proration via calculateProration()
  └─ Creates one-time Preference for proration payment
  └─ Stores data in mp_subscription_preferences (prefix: mpu_)
  └─ Returns initPoint for checkout

server/lib/handlers/checkout/mp/handleUpgradeReturn.ts
  └─ Processes return from MP checkout for UPGRADES
  └─ Inserts proration payment (product_type: 'subscription_upgrade')
  └─ Creates recurring preapproval with deferred start_date
  └─ Cancels previous subscription
  └─ Activates new plan immediately
```

### Shared Utilities
```
server/lib/handlers/checkout/shared/proration.ts
  └─ calculateProration: Calculates credit and final price
  └─ Used by both PayPal and MercadoPago

server/lib/handlers/checkout/shared/payments.ts
  └─ insertPayment: Inserts payment with product_type handling
  └─ Handles course, subscription, subscription_upgrade

server/lib/handlers/checkout/shared/subscriptions.ts
  └─ upgradeOrganizationPlan: Activates plan and applies limits
```

### Webhook Processing
```
server/lib/handlers/checkout/mp/processWebhook.ts
  └─ processPaymentWebhook: Handles payment events
  └─ processMerchantOrderWebhook: Handles order events
  └─ processSubscriptionPreapproval: Handles preapproval authorization
  └─ processSubscriptionAuthorizedPayment: Handles renewal payments
  └─ Resolves auth_id → users.id for all events
```

### Admin Tools
```
server/lib/handlers/checkout/mp/sync-plans.ts
  └─ syncMPPlans: Creates preapproval plans in MercadoPago
  └─ Saves IDs to plans table for automatic use
```

### Frontend
```
src/pages/checkout/SubscriptionCheckout.tsx
  └─ Checkout page for subscriptions
  └─ Detects upgrade mode from URL params
  └─ Shows proration breakdown for upgrades

src/features/users/modals/UpgradeModal.tsx
  └─ Modal shown when clicking "Mejorar a TEAMS"
  └─ Calls calculateProration API
  └─ Shows credit and final price
```

---

## ✅ TESTING CHECKLIST

### New Subscription Flow
- [ ] User with NO subscription can subscribe to PRO
- [ ] Preapproval created with correct amount
- [ ] Return handler activates subscription
- [ ] Founders Program applied for annual
- [ ] Payment appears in billing table

### Upgrade Flow (HYBRID)
- [ ] PRO user sees "Mejorar a TEAMS" button
- [ ] UpgradeModal shows correct proration
- [ ] Proration payment preference created with `mpu_` prefix
- [ ] User pays proration on MercadoPago
- [ ] Return handler:
  - [ ] Inserts payment with `product_type: 'subscription_upgrade'`
  - [ ] Creates deferred recurring preapproval
  - [ ] Cancels old subscription
  - [ ] Activates new plan immediately
- [ ] Billing shows TEAMS plan
- [ ] Billing table shows BOTH payments (original + proration)
- [ ] Next renewal will be at old subscription expiry date

### Idempotency
- [ ] Multiple webhooks → only one payment
- [ ] Return handler + webhook → no duplicates
- [ ] Retry upgrade after failure works

---

## 📊 Monitoring & Debugging

**View all subscription payments (including upgrades):**
```sql
SELECT * FROM payments 
WHERE product_type IN ('subscription', 'subscription_upgrade') 
AND provider = 'mercadopago' 
ORDER BY created_at DESC LIMIT 20;
```

**View upgrade payments only:**
```sql
SELECT p.*, pl.name as plan_name
FROM payments p
LEFT JOIN plans pl ON pl.id = p.product_id
WHERE p.product_type = 'subscription_upgrade'
ORDER BY p.created_at DESC;
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
SELECT id, user_id, organization_id, plan_slug, billing_period,
       is_upgrade, previous_subscription_id, proration_credit,
       product_type, created_at
FROM mp_subscription_preferences
ORDER BY created_at DESC LIMIT 20;
```

**View upgrade preferences only:**
```sql
SELECT * FROM mp_subscription_preferences
WHERE is_upgrade = true
ORDER BY created_at DESC;
```

---

## ⚠️ KNOWN ISSUES & SOLUTIONS

### Issue: MercadoPago sends preference_id as array
**Symptom:** URL has `preference_id=mpu_xxx&preference_id=130095653-xxx`
**Solution:** Extract the `mpu_` prefixed ID:
```typescript
const found = preferenceIdRaw.find((id) => 
  typeof id === 'string' && id.startsWith('mpu_')
);
```

### Issue: Payment insert fails with null user_id
**Symptom:** `null value in column "user_id" of relation "payments"`
**Root Cause:** Not converting auth_id → users.id
**Solution:** Always resolve auth_id before inserting:
```typescript
const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", authId)
  .maybeSingle();
```

### Issue: insertPayment doesn't handle subscription_upgrade
**Symptom:** user_id, organization_id not set for upgrade payments
**Solution:** Added explicit case in insertPayment for `subscription_upgrade`

### Issue: Return handler exits without activating plan
**Symptom:** Shows success but plan not changed
**Root Cause:** Code returned early when payment already existed
**Solution:** Continue with activation even if payment exists (idempotent activation)

---

## 📝 Last Updated

**December 2, 2025** - Complete documentation of HYBRID UPGRADE FLOW.

Key additions:
- `createUpgradePreference.ts` for one-time proration payments
- `handleUpgradeReturn.ts` for upgrade processing
- `proration.ts` for credit calculations
- `mp_subscription_preferences` table with upgrade columns
- `insertPayment` support for `subscription_upgrade` product type
- Billing page query includes upgrade payments
- Deferred recurring subscription with `start_date`
- Multiple fallback strategies for finding payment IDs
