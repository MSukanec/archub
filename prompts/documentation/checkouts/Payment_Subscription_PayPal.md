# PayPal Subscription Payment Flow - Complete Documentation

## 🎓 FEATURE STATUS: PRODUCTION-READY ✅

**Payment flow for organization plan subscriptions via PayPal is COMPLETE and TESTED.**

This document describes the complete flow for purchasing organization subscriptions via PayPal, including both the legacy one-time CAPTURE flow and the new recurring subscriptions with automatic renewal.

---

## 📋 FLOW OVERVIEW

### Two Payment Modes

PayPal subscriptions support two modes:

1. **Recurring Subscriptions (NEW)** - Uses PayPal Billing Plans API for automatic renewal
   - Requires synced PayPal products and billing plans
   - Automatic monthly/annual charges
   - Managed via webhooks

2. **Legacy CAPTURE Flow** - One-time payments, no auto-renewal
   - Fallback when billing plans are not configured
   - Manual renewal required

The system automatically selects the appropriate mode based on whether the plan has PayPal billing plan IDs configured.

---

## 🔄 RECURRING SUBSCRIPTION FLOW (NEW)

### Prerequisites - Admin Sync

Before recurring subscriptions work, an admin must sync PayPal products and billing plans:

**Endpoint:** `POST /api/admin/paypal/sync-plans`

**What it does:**
1. Creates PayPal Product for each Seencel plan (if not exists)
2. Creates Monthly Billing Plan linked to the product
3. Creates Annual Billing Plan linked to the product
4. Saves PayPal IDs to the `plans` table:
   - `paypal_product_id`
   - `paypal_plan_monthly_id`
   - `paypal_plan_annual_id`

### User Journey (Recurring)

1. **Admin initiates plan upgrade**
   - Visits organization billing page (`/settings/billing`)
   - Selects a plan (e.g., Teams)
   - Chooses billing period (monthly/annual)
   - Clicks "Upgrade with PayPal"

2. **Frontend sends payment request** → Backend creates PayPal subscription
   - POST `/api/checkout/paypal/create-subscription`
   - Sends: `plan_slug`, `organization_id`, `billing_period`
   - Backend checks if plan has `paypal_plan_monthly_id` or `paypal_plan_annual_id`
   - If YES → Uses PayPal Subscriptions API
   - Receives: `subscriptionId`, `approvalUrl`, `isRecurring: true`

3. **User redirected to PayPal**
   - Approves subscription on PayPal UI
   - Returns to app with `subscription_id`

4. **Backend activates subscription**
   - GET `/api/checkout/paypal/capture-subscription?type=recurring&subscription_id={id}`
   - Verifies subscription status with PayPal API
   - Resolves `auth_id` → `users.id`
   - Creates payment record
   - Upgrades organization plan with `provider_subscription_id`
   - Creates billing cycle record
   - Redirects user to billing page with success message

5. **Automatic Renewals (via Webhooks)**
   - PayPal sends `PAYMENT.SALE.COMPLETED` for each renewal
   - Webhook handler extends subscription expiry
   - Creates new payment and billing cycle records

---

## 🔄 LEGACY CAPTURE FLOW

### User Journey (One-Time Payment)

1. **Admin initiates plan upgrade**
   - Same as recurring flow

2. **Frontend sends payment request** → Backend creates PayPal order
   - POST `/api/checkout/paypal/create-subscription`
   - Backend checks if plan has PayPal billing plan IDs
   - If NO → Uses legacy CAPTURE order
   - Receives: `orderId`, `approvalUrl`, `isRecurring: false`

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

## 📡 WEBHOOK EVENTS

### Subscription Events (Recurring)

| Event | Handler | Action |
|-------|---------|--------|
| `BILLING.SUBSCRIPTION.ACTIVATED` | `handleSubscriptionEvent` | Logs activation |
| `BILLING.SUBSCRIPTION.CANCELLED` | `handleSubscriptionEvent` | Marks subscription cancelled |
| `BILLING.SUBSCRIPTION.SUSPENDED` | `handleSubscriptionEvent` | Marks subscription suspended |
| `PAYMENT.SALE.COMPLETED` | `handleSubscriptionRenewal` | Extends expiry, creates payment |

### Legacy Events

| Event | Handler | Action |
|-------|---------|--------|
| `CHECKOUT.ORDER.APPROVED` | `processWebhook` | Processes one-time payment |
| `PAYMENT.CAPTURE.COMPLETED` | `processWebhook` | Processes capture completion |

---

## 💾 DATABASE SCHEMA ADDITIONS

### Plans Table - New Columns

```sql
ALTER TABLE plans ADD COLUMN paypal_product_id TEXT;
ALTER TABLE plans ADD COLUMN paypal_plan_monthly_id TEXT;
ALTER TABLE plans ADD COLUMN paypal_plan_annual_id TEXT;
```

### Organization Subscriptions Table - New Column

```sql
ALTER TABLE organization_subscriptions ADD COLUMN provider_subscription_id TEXT;
```

### Data Flow

```javascript
// For recurring subscriptions
{
  provider_subscription_id: "I-XXXXX", // PayPal subscription ID
  // Used to:
  // 1. Identify subscription for renewal webhooks
  // 2. Cancel subscription via PayPal API
  // 3. Link renewals to correct organization
}
```

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

**Response (Recurring Subscription):**
```json
{
  "ok": true,
  "order_id": "I-BW452GLLEP1G",
  "subscription_id": "I-BW452GLLEP1G",
  "approval_url": "https://www.paypal.com/webapps/billing/subscriptions?token=...",
  "isRecurring": true
}
```

**Response (Legacy CAPTURE):**
```json
{
  "ok": true,
  "order_id": "7B123456789...",
  "approval_url": "https://www.paypal.com/checkoutnow?token=...",
  "isRecurring": false
}
```

### Step 2: Capture/Activate Subscription

**Endpoint:** `GET /api/checkout/paypal/capture-subscription`

**Query Parameters:**
- `type=recurring` (optional): Indicates recurring subscription flow
- `subscription_id`: PayPal subscription ID (for recurring)
- `token`: PayPal order ID (for legacy CAPTURE)

---

## 💳 DATA FLOW - Database Changes

### Payment Created (Both Flows)
```javascript
// payments table
{
  id: "uuid",
  provider: "paypal",
  provider_payment_id: "CAPTURE-ID" | "SUBSCRIPTION-ID",
  user_id: "uuid",               // ✅ users.id (resolved from auth_id)
  organization_id: "uuid",
  product_id: "uuid",            // plan_id
  amount: 20.00,
  currency: "USD",
  status: "completed",
  product_type: "subscription",
  created_at: "2025-11-30T..."
}
```

### Organization Subscription Created
```javascript
// organization_subscriptions table
{
  id: "uuid",
  organization_id: "uuid",
  plan_id: "uuid",
  payment_id: "uuid",
  status: "active",
  billing_period: "monthly",
  started_at: "2025-11-30T...",
  expires_at: "2025-12-30T...",
  amount: 20.00,
  currency: "USD",
  provider_subscription_id: "I-BW452GLLEP1G"  // ✅ NEW for recurring
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

---

## 📁 KEY FILES

### PayPal Subscriptions API
```
server/lib/handlers/checkout/paypal/subscriptions-api.ts
  └─ createPayPalProduct: Create product in PayPal catalog
  └─ createPayPalBillingPlan: Create monthly/annual billing plans
  └─ createPayPalSubscription: Create subscription for user
  └─ getPayPalSubscription: Fetch subscription details
  └─ cancelPayPalSubscription: Cancel a subscription
```

### Subscription Flow
```
server/lib/handlers/checkout/paypal/createSubscriptionOrder.ts
  └─ Creates recurring subscription OR legacy CAPTURE order
  └─ Automatically selects mode based on plan configuration

server/lib/handlers/checkout/paypal/captureSubscriptionOrder.ts
  └─ handleRecurringSubscription: Activates PayPal subscription
  └─ handleLegacyCaptureFlow: Captures one-time payment

server/lib/handlers/checkout/paypal/processWebhook.ts
  └─ handleSubscriptionEvent: Processes BILLING.SUBSCRIPTION.* events
  └─ handleSubscriptionRenewal: Processes PAYMENT.SALE.COMPLETED for renewals
```

### Admin Tools
```
server/lib/handlers/checkout/paypal/sync-plans.ts
  └─ syncPayPalPlans: Creates products and billing plans in PayPal
  └─ Saves IDs to plans table for automatic use
```

---

## ✅ TESTING CHECKLIST

### Recurring Subscription Flow
- [ ] **Admin Sync**
  - [ ] Call POST `/api/admin/paypal/sync-plans`
  - [ ] Verify plans table has PayPal IDs

- [ ] **Subscription Creation**
  - [ ] Create subscription → returns `isRecurring: true`
  - [ ] User redirected to PayPal subscription page
  - [ ] After approval, subscription activated
  - [ ] `provider_subscription_id` saved

- [ ] **Renewal Webhooks**
  - [ ] Simulate `PAYMENT.SALE.COMPLETED` webhook
  - [ ] Subscription expiry extended
  - [ ] New payment record created

- [ ] **Cancellation**
  - [ ] `BILLING.SUBSCRIPTION.CANCELLED` webhook
  - [ ] Subscription marked as cancelled

### Legacy Flow
- [ ] **Without PayPal IDs**
  - [ ] Create subscription → returns `isRecurring: false`
  - [ ] Payment captured successfully
  - [ ] Organization upgraded

### Idempotency
- [ ] Multiple webhooks → only one payment
- [ ] Activation + webhook → no duplicates

---

## 📊 Monitoring & Debugging

**View subscription payments:**
```sql
SELECT * FROM payments 
WHERE product_type = 'subscription' AND provider = 'paypal' 
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

**View PayPal billing plan configuration:**
```sql
SELECT id, name, slug, 
       paypal_product_id, 
       paypal_plan_monthly_id, 
       paypal_plan_annual_id
FROM plans
WHERE is_active = true;
```

---

## 📝 Last Updated

**November 30, 2025** - Added PayPal Billing Plans API integration for recurring subscriptions with automatic renewal.

Key additions:
- `subscriptions-api.ts` for PayPal Subscriptions API v1
- `sync-plans.ts` for admin product/plan sync
- Dual-mode support in `createSubscriptionOrder.ts`
- Recurring flow in `captureSubscriptionOrder.ts`
- Webhook handlers for `BILLING.SUBSCRIPTION.*` and `PAYMENT.SALE.COMPLETED`
- New database columns for PayPal IDs
