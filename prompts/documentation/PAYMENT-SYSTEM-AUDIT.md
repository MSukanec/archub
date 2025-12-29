# Payment System Architecture - Complete Audit

> Last updated: December 29, 2025  
> Consolidated from: PAYMENT-SUBSCRIPTION-FLOW-AUDIT.md, SUBSCRIPTIONS_BILLING_SYSTEM.md, WEBHOOK-PAYMENT-FLOW.md

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Payment Gateways](#2-payment-gateways)
3. [Database Schema](#3-database-schema)
4. [Plan Hierarchy](#4-plan-hierarchy)
5. [Proration System](#5-proration-system)
6. [Subscription Lifecycle](#6-subscription-lifecycle)
7. [Seat-Based Billing](#7-seat-based-billing)
8. [Coupon System](#8-coupon-system)
9. [Webhook Processing](#9-webhook-processing)
10. [Orchestrator Functions](#10-orchestrator-functions)
11. [Error Handling](#11-error-handling)
12. [Cron Jobs](#12-cron-jobs)
13. [Founders Program](#13-founders-program)
14. [Soft-Lock System](#14-soft-lock-system)
15. [Frontend Components](#15-frontend-components)
16. [File Structure](#16-file-structure)
17. [Critical Implementation Notes](#17-critical-implementation-notes)
18. [Known Issues & Risks](#18-known-issues--risks)
19. [Testing Checklist](#19-testing-checklist)
20. [Monitoring Queries](#20-monitoring-queries)

---

## 1. System Overview

### Architecture Principles

1. **plan_id is Source of Truth**: Limits and features read from `organizations.plan_id` → `plans.features`
2. **Subscriptions are Historical**: `organization_subscriptions` records payment history
3. **Soft-Lock over Hard-Delete**: Resources not deleted, marked with `is_over_limit`
4. **Idempotency**: Duplicate payments don't create duplicate subscriptions
5. **Gateway Separation**: MP and PayPal have independent handlers

### Payment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER IN SEENCEL                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   FREE      │    │    PRO      │    │   TEAMS     │    │ ENTERPRISE  │   │
│  │ (Free)      │───▶│  ($9/mo)    │───▶│ ($X/seat)   │───▶│ (Contact)   │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│        │                   │                  │                              │
│        ▼                   ▼                  ▼                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │               PAYMENT GATEWAY SELECTION                               │  │
│  │  ┌───────────────┐              ┌───────────────────┐                 │  │
│  │  │   PayPal      │              │   Mercado Pago    │                 │  │
│  │  │   (USD)       │              │   (ARS)           │                 │  │
│  │  └───────────────┘              └───────────────────┘                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                        │
│                    ▼                               ▼                        │
│         ┌─────────────────────┐       ┌─────────────────────┐              │
│         │   New Subscription  │       │   Upgrade with      │              │
│         │   (Recurring)       │       │   Proration         │              │
│         └─────────────────────┘       └─────────────────────┘              │
│                    │                               │                        │
│                    └───────────────┬───────────────┘                        │
│                                    ▼                                        │
│         ┌───────────────────────────────────────────────────────────────┐  │
│         │                 SUBSCRIPTION ACTIVATION                        │  │
│         │  1. Create payment record                                      │  │
│         │  2. Create organization_subscription                           │  │
│         │  3. Update organizations.plan_id                               │  │
│         │  4. Create organization_billing_cycles                         │  │
│         │  5. Apply Founders Program (if annual)                         │  │
│         │  6. Reactivate bonus course enrollments                        │  │
│         └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Payment Gateways

### MercadoPago (Primary for LATAM - ARS)

**Files**: 
- Controller: `server/controllers/payments/mp.controller.ts`
- Handlers: `server/lib/handlers/checkout/mp/`

**Product Types**: courses, subscriptions, subscription_upgrade, seat

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout/mp/create-course` | POST | Course purchase preference |
| `/api/checkout/mp/create-subscription` | POST | Legacy one-time subscription |
| `/api/checkout/mp/create-recurring` | POST | Recurring Preapproval subscription |
| `/api/checkout/mp/create-upgrade-preference` | POST | Prorated upgrade |
| `/api/checkout/mp/create-seat` | POST | Seat payment for member invitation |
| `/api/checkout/mp/update-subscription` | POST | Update existing subscription in-place |
| `/api/checkout/mp/webhook` | POST | Webhook handler |
| `/api/checkout/mp/success-handler` | GET | Course success redirect |
| `/api/checkout/mp/subscription-success` | GET | Subscription success redirect |
| `/api/checkout/mp/upgrade-success` | GET | Upgrade success redirect |
| `/api/checkout/mp/seat-success` | GET | Seat payment success redirect |
| `/api/checkout/mp/seat-subscription-success` | GET | First seat subscription (gifted orgs) |

### PayPal (Primary for USD)

**Files**: 
- Controller: `server/controllers/payments/paypal.controller.ts`
- Handlers: `server/lib/handlers/checkout/paypal/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout/paypal/create-course` | POST | Course order |
| `/api/checkout/paypal/create-subscription` | POST | Subscription order |
| `/api/checkout/paypal/capture-course` | POST | Capture course payment |
| `/api/checkout/paypal/capture-subscription` | GET | Capture subscription (returns HTML) |
| `/api/checkout/paypal/capture-and-redirect` | GET | Course capture with redirect |
| `/api/checkout/paypal/create-upgrade` | POST | Prorated upgrade order |
| `/api/checkout/paypal/upgrade-capture` | GET | Upgrade capture redirect |
| `/api/checkout/paypal/create-seat` | POST | Seat payment order |
| `/api/checkout/paypal/seat-capture` | GET | Seat payment capture redirect |
| `/api/checkout/paypal/webhook` | POST | Webhook handler |

### Bank Transfer (Courses only)

**Files**: `server/controllers/payments/bankTransfer.controller.ts`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout/bank-transfer/create` | POST | Create pending payment |
| `/api/checkout/bank-transfer/upload` | POST | Upload receipt for verification |

### Gateway Differences

| Aspect | MercadoPago | PayPal |
|--------|-------------|--------|
| Metadata | external_reference + mp_*_preferences | custom_id + invoice_id (pipe-delimited) |
| Recurring subscriptions | Via webhook with preapproval | Via `handleSubscriptionRenewal()` |
| Upgrade/Capture | Separate (handleUpgradeReturn) | Direct in webhook |
| Event types | `payment`, `merchant_order`, `subscription_preapproval` | `CHECKOUT.ORDER.*`, `BILLING.SUBSCRIPTION.*`, `PAYMENT.SALE.*` |

---

## 3. Database Schema

### 3.1 Table `plans`

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Free', 'Pro', 'Teams', 'Enterprise'
  slug TEXT,                             -- 'free', 'pro', 'teams', 'enterprise'
  features JSONB,                        -- Limits in JSON (SINGLE SOURCE OF TRUTH)
  billing_type TEXT DEFAULT 'per_user',
  is_active BOOLEAN DEFAULT true,
  monthly_amount NUMERIC,                -- Monthly price in USD
  annual_amount NUMERIC,                 -- Annual price in USD
  
  -- PayPal IDs
  paypal_product_id TEXT,
  paypal_plan_monthly_id TEXT,
  paypal_plan_annual_id TEXT,
  
  -- MercadoPago IDs
  mp_plan_monthly_id TEXT,
  mp_plan_annual_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- FEATURES JSON STRUCTURE:
-- {
--   "max_projects": 25,        -- -1 = unlimited
--   "max_members": -1,         -- -1 = unlimited
--   "max_storage_mb": 5000,
--   "max_ai_tokens": 50000,
--   "custom_project_color": true,
--   ... other features
-- }
```

### 3.2 Table `organization_subscriptions`

```sql
CREATE TABLE organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT DEFAULT 'active',          -- 'active', 'trialing', 'cancelled', 'expired', 'pending'
  billing_period TEXT,                   -- 'monthly' or 'annual'
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  payment_gateway TEXT,                  -- 'paypal' or 'mercadopago'
  external_subscription_id TEXT,         -- External gateway ID (legacy)
  provider_subscription_id TEXT,         -- Gateway ID for automatic renewals
  scheduled_downgrade_plan_id UUID REFERENCES plans(id),
  coupon_id UUID REFERENCES coupons(id),
  coupon_code TEXT,
  payer_email TEXT,                      -- Email for MP payments (seat billing)
  amount NUMERIC,                        -- Subscription amount
  currency TEXT,                         -- 'USD' or 'ARS'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Table `organization_billing_cycles`

```sql
CREATE TABLE organization_billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID REFERENCES organization_subscriptions(id),
  plan_id UUID REFERENCES plans(id),
  billing_period TEXT NOT NULL,
  cycle_start TIMESTAMPTZ NOT NULL,
  cycle_end TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending',
  payment_id UUID REFERENCES payments(id),
  billable_members INTEGER DEFAULT 1,    -- Snapshot of members at the moment
  billed_seats INTEGER DEFAULT 1,        -- Seats charged
  seats INTEGER,                         -- Actual billable members
  amount_per_seat NUMERIC,               -- Price per seat
  base_amount NUMERIC,                   -- billed_seats × amount_per_seat
  proration_adjustment NUMERIC,          -- Credit from upgrades
  total_amount NUMERIC,                  -- Final charged amount
  period_start TIMESTAMPTZ,              -- Billing period start
  period_end TIMESTAMPTZ,                -- Billing period end
  payment_provider TEXT,                 -- 'mercadopago', 'paypal'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.4 Table `payments` (Universal)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  course_id UUID,                        -- For course purchases
  product_type TEXT NOT NULL,            -- 'subscription' | 'subscription_upgrade' | 'seat' | 'course'
  product_id TEXT NOT NULL,              -- Plan or course ID
  provider TEXT NOT NULL,                -- 'paypal' | 'mercadopago' | 'bank_transfer'
  provider_payment_id TEXT,              -- External payment ID (idempotency)
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',         -- 'pending', 'completed', 'failed', 'refunded'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index to prevent duplicates
CREATE UNIQUE INDEX idx_payments_gateway_unique 
  ON payments(provider, provider_payment_id) 
  WHERE provider_payment_id IS NOT NULL;
```

### 3.5 Table `organization_members`

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  is_billable BOOLEAN DEFAULT true,      -- ⚠️ TRUE = charged in TEAMS
  is_over_limit BOOLEAN DEFAULT false,   -- Soft-lock
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.6 Table `organization_invitations`

```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  user_id UUID REFERENCES users(id),     -- Filled if user already exists
  status TEXT DEFAULT 'pending',          -- 'pending', 'accepted', 'rejected', 'registered'
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.7 MP Preference Tables

```sql
-- MercadoPago course preferences
CREATE TABLE mp_course_preferences (
  id TEXT PRIMARY KEY,                   -- "mp_xxx"
  preference_id TEXT,
  user_id UUID NOT NULL,                 -- ⚠️ auth_id from Supabase, NOT users.id
  course_id UUID NOT NULL,
  amount_ars NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- MercadoPago subscription preferences
CREATE TABLE mp_subscription_preferences (
  id TEXT PRIMARY KEY,                   -- "mps_xxx", "mpu_xxx", "mpr_xxx"
  preapproval_id TEXT,
  user_id UUID NOT NULL,                 -- ⚠️ auth_id from Supabase, NOT users.id
  organization_id UUID NOT NULL,
  plan_id UUID,
  plan_slug TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  amount_ars NUMERIC,
  is_upgrade BOOLEAN DEFAULT FALSE,
  previous_subscription_id UUID,
  proration_credit NUMERIC,
  product_type TEXT,                     -- 'subscription', 'subscription_upgrade', 'seat'
  invitee_email TEXT,                    -- For seat payments
  role_id UUID,                          -- For seat payments
  subscription_id UUID,                  -- For seat payments
  preference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**ID Prefixes**:
- `mp_*` - Course preference
- `mpr_*` - Recurring subscription preference
- `mpu_*` - Upgrade preference
- `mps_*` - Seat preference

### 3.8 Coupon Tables

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,                    -- 'percent' or 'fixed'
  amount NUMERIC NOT NULL,               -- Percentage or fixed amount
  applies_to TEXT DEFAULT 'courses',     -- 'courses', 'subscriptions', 'all'
  applies_to_all BOOLEAN DEFAULT true,   -- If applies to all products of the type
  max_redemptions INTEGER,               -- NULL = unlimited
  per_user_limit INTEGER,                -- Per-user limit
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  currency TEXT,                         -- NULL = any currency
  min_order_total NUMERIC,
  applicable_plans TEXT[],               -- Array of plan slugs
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coupon_plans (
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  PRIMARY KEY (coupon_id, plan_id)
);

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  subscription_id UUID REFERENCES organization_subscriptions(id),
  plan_id UUID REFERENCES plans(id),
  order_id UUID REFERENCES payments(id),
  amount_saved NUMERIC,
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.9 Auxiliary Tables

```sql
-- Payment event log
CREATE TABLE payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bank transfer specific records
CREATE TABLE bank_transfer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'ARS',
  status TEXT DEFAULT 'pending',
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled job logs
CREATE TABLE system_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  subscription_id UUID REFERENCES organization_subscriptions(id),
  job_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expiry notification logs
CREATE TABLE subscription_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id),
  notification_type TEXT NOT NULL,       -- '7_days_before', '3_days_before', '1_day_before', 'expired'
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Organization settings for founders
ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}';
-- settings = { "is_founder": true, "founder_since": "2025-11-30T12:00:00Z" }

-- Soft-lock fields
ALTER TABLE projects ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
ALTER TABLE organization_members ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
```

---

## 4. Plan Hierarchy

```typescript
const PLAN_HIERARCHY = {
  free: 1,
  pro: 2,
  teams: 3,
  enterprise: 4
} as const;
```

### Limits by Plan (from `features` JSON)

| Plan | max_projects | max_members | max_storage_mb | max_ai_tokens |
|------|--------------|-------------|----------------|---------------|
| Free | 4 | 1 | 500 | Basic |
| Pro | 50 | 1 | 50000 | 10000/mo |
| Teams | -1 (∞) | -1 (∞) | 500000 | -1 (∞) |
| Enterprise | -1 (∞) | -1 (∞) | Custom | Custom |

### Plan Change Rules

| Action | Condition | Behavior |
|--------|-----------|----------|
| **Upgrade** | `targetTier > currentTier` | Immediate payment, immediate activation |
| **Downgrade** | `targetTier < currentTier` | Scheduled for end of current cycle |
| **Cancellation** | User requests | Maintains access until `expires_at` |

---

## 5. Proration System

### Plan Upgrades (`proration.ts`)

**File**: `server/lib/handlers/checkout/shared/proration.ts`

```typescript
export async function calculateProration(supabase, params) {
  const { organizationId, targetPlanSlug, billingPeriod } = params;
  
  // 1. Get current subscription
  const currentSub = await getCurrentSubscription(supabase, organizationId);
  
  // 2. Calculate remaining days
  const daysRemaining = differenceInDays(
    new Date(currentSub.expires_at), 
    new Date()
  );
  const totalDays = currentSub.billing_period === 'monthly' ? 30 : 365;
  const percentageRemaining = daysRemaining / totalDays;
  
  // 3. Calculate credit
  const currentPlanPrice = getCurrentPlanPrice(currentSub);
  const creditAmount = currentPlanPrice * percentageRemaining;
  
  // 4. Final price
  const targetPlanPrice = getTargetPlanPrice(targetPlan, billingPeriod);
  const finalPrice = Math.max(0, targetPlanPrice - creditAmount);
  
  return {
    hasActiveSubscription: true,
    currentPlan: currentSub.plans.name,
    targetPlan: targetPlan.name,
    credit: { daysRemaining, creditAmount },
    finalPrice: { usd: finalPriceUSD, ars: finalPriceARS },
  };
}
```

**Returns**: `ProrationResult` with:
- `credit`: { daysRemaining, totalDays, percentageRemaining, creditAmount, creditCurrency }
- `finalPrice`: { usd, ars }
- `savings`: { usd, ars }

### Seat Addition (`seat-proration.ts`)

**File**: `server/lib/handlers/checkout/shared/seat-proration.ts`

```
1. Fetch organization's current plan and subscription
2. Validate plan allows seats (TEAMS only, not FREE/PRO)
3. Count billable members (is_billable = true)
4. Calculate: daysRemaining / totalDays = percentageRemaining
5. ProratedCost = seatPrice × percentageRemaining
```

**Returns**: `SeatProrationResult` with:
- `pricing`: { seatPriceUSD, seatPriceARS, proratedAmountUSD, proratedAmountARS }
- `nextBilling`: { date, totalSeats, totalAmountUSD, totalAmountARS }

### Gateway Limitations

| Gateway | Proration Supported | Notes |
|---------|---------------------|-------|
| **MercadoPago** | ✅ YES | Hybrid: single payment + deferred subscription |
| **PayPal** | ⚠️ Limited | Requires rebuilding plans with TRIAL + REGULAR |

---

## 6. Subscription Lifecycle

### 6.1 New Subscription Flow

```
User → UpgradeModal → Select Plan/Period/Gateway
    │
    ├── PayPal ──────────────────────────────────┐
    │   POST /api/checkout/paypal/create-subscription
    │   → Creates PayPal Subscription (if plan_id exists) or Order (legacy)
    │   → User approves in PayPal
    │   → GET /api/checkout/paypal/capture-subscription
    │   → Activates subscription
    │
    └── MercadoPago ─────────────────────────────┐
        POST /api/checkout/mp/create-recurring
        → Creates Preapproval in MP
        → User approves in MP
        → GET /api/checkout/mp/subscription-success
        → Activates subscription
```

### 6.2 Upgrade Flow (with Proration - MP Only)

```
User with active subscription → Wants upgrade
    │
    ├── POST /api/checkout/calculate-proration
    │   → Calculates remaining days and credit
    │
    └── POST /api/checkout/mp/create-upgrade-preference
        → Creates single payment Preference (difference)
        → Creates deferred Preapproval (start_date = current expires_at)
        → User pays in MP
        → GET /api/checkout/mp/upgrade-success
        → Cancels previous subscription
        → Activates new plan IMMEDIATELY
```

### 6.3 Downgrade Flow

```
User → Click "Downgrade to [Lower Plan]"
    │
    └── DowngradeModal
        │
        ├── GET /api/organizations/:id/usage-stats
        │   → Calculates projects and members that will be blocked
        │
        └── POST /api/subscriptions/schedule-downgrade
            → SET scheduled_downgrade_plan_id = [target_plan_id]
            → Message: "Maintains access until expiration date"
            
            ↓ (When expires_at < now())
            
        CRON JOB: execute-scheduled-downgrades.ts (hourly)
            → Executes executeScheduledPlanSwitch()
            → Creates new subscription with target plan
            → Updates organizations.plan_id
            → Calls applyPlanLimits() for soft-lock
            → Suspends bonus course enrollments (if downgrade to FREE)
```

### 6.4 Gifted Subscription (100% Discount Coupon)

Created via `createGiftedSubscription()` WITHOUT payment gateway.

**Key indicator**: `provider_subscription_id = null`

```
1. User applies coupon in checkout
2. Backend validates coupon (validate_subscription_coupon RPC)
3. If amount_after_discount = 0:
   a. Does NOT pass through gateway
   b. Creates organization_subscription directly
   c. provider_subscription_id = NULL
   d. Marks owner as is_billable = false
   e. Records coupon_redemption
4. Updates organizations.plan_id
5. Features activated immediately
```

### 6.5 First Paid Seat in Gifted Org

When an org created with 100% coupon wants to add first paid member:

```
1. Org has TEAMS plan via 100% coupon
2. provider_subscription_id = NULL (never paid)
3. Admin wants to add billable member
4. System detects: no recurring subscription
5. CREATE new subscription in MP (not update):
   a. Price = seat price of plan
   b. Save new provider_subscription_id
6. Charge prorated seat
7. Create invitation with is_billable = true
```

---

## 7. Seat-Based Billing

### Adding a Paid Member (TEAMS)

```
Admin in TEAMS → "Invite member"
    │
    ├── POST /api/checkout/calculate-seat-proration
    │   → Remaining days of cycle
    │   → Prorated price of new seat
    │
    ├── POST /api/checkout/mp/create-seat
    │   → Prorated single payment Preference
    │   → User pays
    │
    └── GET /api/checkout/mp/seat-success
        → Creates payment (product_type: 'seat')
        → Updates transaction_amount in recurring subscription
        → Creates invitation with is_billable = true
```

### Billable vs Non-Billable Members

| Member Type | is_billable | Counts for Billing |
|-------------|-------------|-------------------|
| Gifted org owner | false | No |
| Invited members | true (default) | Yes |
| Admin-created (via seat payment) | true | Yes |
| Non-billable collaborator | false | No |

**Seat count formula**: `COUNT(organization_members WHERE is_billable = true AND is_active = true)`

### Billing Fields in `organization_members`

- **`is_billable = true`**: Charged in TEAMS (default for new members)
- **`is_billable = false`**: NOT charged (org owner with 100% coupon, free invitees)

---

## 8. Coupon System

### Coupon Flows

1. **Partial Discount Coupon**: Reduces price, goes through gateway
2. **100% Coupon (Free)**: 
   - Does NOT go through MP/PayPal
   - Creates subscription directly with `provider_subscription_id = null`
   - Marks owner as `is_billable = false`

### Edge Case: First Paid Seat in 100% Coupon Org

When an org created with 100% coupon wants to add first paid member:
1. Detects there's no `provider_subscription_id`
2. CREATES new subscription in MP (instead of updating)
3. Syncs renewal date
4. Saves new `provider_subscription_id`

---

## 9. Webhook Processing

### Webhook Endpoints

| Gateway | Endpoint | Auth |
|---------|----------|------|
| **MercadoPago** | `POST /api/checkout/mp/webhook` | Query param `?secret=...` (temporarily disabled) |
| **PayPal** | `POST /api/checkout/paypal/webhook` | No explicit auth |

### MP Webhook Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WEBHOOK MERCADOPAGO: NEW SUBSCRIPTION                    │
└─────────────────────────────────────────────────────────────────────────────┘

  1. POST /api/checkout/mp/webhook
     │
     ▼
  2. processWebhook(req)                    [mp/processWebhook.ts:50]
     ├─► parseBody(req) → { type, data }
     ├─► Validate secret (TEMPORARILY SKIP)
     └─► type === "payment" ?
         │
         ▼
  3. getMPPayment(paymentId)                [mp/api.ts]
     └─► Fetch to MP API for payment details
         │
         ▼
  4. extractMetadata(pay)                   [mp/encoding.ts]
     └─► Extract external_reference, user_id, plan_slug, etc.
         │
         ▼
  5. Search preference in DB by prefix:
     ├─► "mpu_" → mp_subscription_preferences (upgrade)
     ├─► "mpr_" → mp_subscription_preferences (recurring)
     ├─► "mps_" → mp_subscription_preferences (seat)
     └─► "mp_"  → mp_course_preferences (course)
         │
         ▼
  6. Convert auth_id → public.users.id   [line 201-218]
     └─► SELECT id FROM users WHERE auth_id = ?
         │
         ▼
  7. logPaymentEvent()                      [shared/events.ts:17]
     └─► INSERT INTO payment_events (...)
         │
         ▼
  8. status === "approved" && productType === "subscription" ?
     │
     ▼
  9. insertPayment()                        [shared/payments.ts:17]
     └─► INSERT INTO payments (...)
     │   └─► If duplicate (23505), returns { inserted: false }
     │
     ▼
 10. subPaymentResult.inserted === true ?
     │
     ▼
 11. upgradeOrganizationPlan()              [shared/subscriptions.ts:472]
     ├─► (a) Cancel previous active subscriptions
     │       UPDATE organization_subscriptions SET status='expired'
     │       WHERE organization_id=? AND status='active'
     │
     ├─► (b) Calculate expires_at by billing_period
     │
     ├─► (c) INSERT INTO organization_subscriptions (...)
     │
     ├─► (d) Count billable members
     │
     ├─► (e) INSERT INTO organization_billing_cycles (...)
     │
     ├─► (f) UPDATE organizations SET plan_id=? WHERE id=?
     │
     ├─► (g) applyPlanLimits()              [shared/plan-limits.ts:71]
     │       └─► Unlock projects/members that were over limit
     │
     ├─► (h) reactivateBonusCourseEnrollments()
     │       └─► Reactivate suspended bonus course enrollments
     │
     └─► (i) IF billingPeriod === 'annual':
             applyFoundersProgram()         [shared/subscriptions.ts:388]
```

### PayPal Webhook Flow

```
POST /api/checkout/paypal/webhook
  │
  ├─► handleSubscriptionEvent()    [BILLING.SUBSCRIPTION.*]
  │   └─► UPDATE organization_subscriptions (cancelled/suspended)
  │
  ├─► handleSubscriptionRenewal()  [PAYMENT.SALE.COMPLETED]
  │   ├─► insertPayment()
  │   └─► UPDATE organization_subscriptions.expires_at
  │
  └─► handleOrderCapture()         [CHECKOUT.ORDER.*]
      └─► Similar to MP: insertPayment → upgradeOrganizationPlan
```

### Tables Modified by Webhooks (In Order)

| # | Table | Operation | Description |
|---|-------|-----------|-------------|
| 1 | `payment_events` | INSERT | Log of raw webhook event |
| 2 | `payments` | INSERT | Completed payment record |
| 3 | `organization_subscriptions` | UPDATE | Mark previous subscriptions as `expired` |
| 4 | `organization_subscriptions` | INSERT | Create new active subscription |
| 5 | `organization_billing_cycles` | INSERT | Billing cycle record |
| 6 | `organizations` | UPDATE | Update `plan_id` to new plan |
| 7 | `projects` | UPDATE (conditional) | Unlock projects if `is_over_limit` |
| 8 | `organization_members` | UPDATE (conditional) | Unlock members if `is_over_limit` |
| 9 | `course_enrollments` | UPDATE (conditional) | Reactivate bonus course enrollments |
| 10 | `organizations` | UPDATE (annual) | Mark `settings.is_founder = true` |
| 11 | `course_enrollments` | UPSERT (annual) | Founders bonus course enrollment |

---

## 10. Orchestrator Functions

### Main Orchestrator: `upgradeOrganizationPlan()`

**File**: `server/lib/handlers/checkout/shared/subscriptions.ts` (line 472)

```
upgradeOrganizationPlan()
│
├─ 1. UPDATE organization_subscriptions 
│      SET status='expired', cancelled_at=now()
│      WHERE org_id = X AND status = 'active'
│      └─ [NO TRANSACTION] - Error only logged
│
├─ 2. INSERT organization_subscriptions (new active)
│      └─ If error → THROW (aborts)
│
├─ 3. INSERT organization_billing_cycles
│      └─ [NO TRANSACTION] - Error only logged
│
├─ 4. UPDATE organizations SET plan_id = X
│      └─ If error → THROW (aborts)
│
├─ 5. applyPlanLimits() → Mark is_over_limit on projects/members
│      └─ [NO TRANSACTION] - Error only logged
│
├─ 6. reactivateBonusCourseEnrollments() (if applicable)
│      └─ [NO TRANSACTION] - Error only logged
│
└─ 7. applyFoundersProgram() (if annual)
        ├─ UPDATE organizations.settings (is_founder: true)
        └─ upsertEnrollment() → UPSERT course_enrollments
        └─ [NO TRANSACTION] - Error only logged
```

### Shared Handlers

| File | Purpose |
|------|---------|
| `shared/proration.ts` | Calculate upgrade credit from remaining subscription time |
| `shared/seat-proration.ts` | Calculate prorated cost for adding new member |
| `shared/subscriptions.ts` | `upgradeOrganizationPlan()`, `createGiftedSubscription()`, `executeScheduledPlanSwitch()` |
| `shared/plan-limits.ts` | `applyPlanLimits()`, `getOrganizationLimitStatus()` - soft-lock via `is_over_limit` |
| `shared/payments.ts` | `insertPayment()` - idempotent payment insertion |
| `shared/enrollments.ts` | `upsertEnrollment()` - course enrollment with expiration |
| `shared/coupons.ts` | `markCouponAsUsed()` - redemption tracking |
| `shared/events.ts` | `logPaymentEvent()` - webhook/event logging |
| `shared/auth.ts` | `createServiceSupabaseClient()` - service role client |
| `shared/pricing.ts` | Exchange rate and price calculations |
| `shared/helpers.ts` | `getCourseIdBySlug()`, `getPlanIdBySlug()` |

---

## 11. Error Handling

### Current Pattern: No Transactions, Isolated Errors

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ERROR HANDLING                        │
└─────────────────────────────────────────────────────────────────┘

  Each operation is INDEPENDENT:
  
  payment_events ─────► If fails: console.error, CONTINUES
                        Does NOT block flow
  
  payments ────────────► If duplicate (23505): { inserted: false }
                        Flow does NOT proceed with upgradeOrganizationPlan
                        ✅ Correct idempotency
  
  organization_subscriptions UPDATE ──► If fails: console.error
                                        CONTINUES with INSERT
  
  organization_subscriptions INSERT ──► If fails: throw error
                                        ⚠️ Breaks flow, payment already inserted
  
  organization_billing_cycles ────────► If fails: console.error
                                        CONTINUES
  
  organizations UPDATE ───────────────► If fails: throw error
                                        ⚠️ Breaks flow, subscription already created
  
  applyPlanLimits ────────────────────► If fails: console.error
                                        CONTINUES (logs error)
  
  reactivateBonusCourseEnrollments ───► If fails: Does NOT affect flow
  
  applyFoundersProgram ───────────────► Each sub-operation has try/catch
                                        console.error but CONTINUES
```

### Possible Inconsistent States

| Scenario | Resulting State |
|----------|-----------------|
| INSERT subscription fails | Payment exists, org without updated plan |
| UPDATE organizations fails | Subscription exists, org.plan_id outdated |
| applyFoundersProgram fails | Plan applied, but no is_founder or bonus course |

### Failure Points Identified

| # | Location | Problem | Consequence |
|---|----------|---------|-------------|
| 1 | Entire flow | **NO SQL TRANSACTION** | Partially applied state if fails midway |
| 2 | `upgradeOrganizationPlan` line 522 | If INSERT subscription fails → THROW | Payment recorded but no subscription |
| 3 | `upgradeOrganizationPlan` line 602 | If UPDATE organizations fails → THROW | Subscription created but org without plan |
| 4 | `applyPlanLimits()` | Error only logged | Projects/members may stay incorrectly blocked |
| 5 | `applyFoundersProgram()` | Error only logged (internal try/catch) | User pays annual but doesn't get benefits |
| 6 | `logPaymentEvent()` line 40 | Error only logged | No audit record |
| 7 | `organization_billing_cycles` INSERT | Error only logged | No billing history |

---

## 12. Cron Jobs

**Location**: `server/cron/`

| Job | Schedule | File | Purpose |
|-----|----------|------|---------|
| Subscription Expiry Notifier | Daily 9:00 AM UTC | `jobs/subscription-expiry-notifier.ts` | Email notifications for expiring subscriptions |
| Scheduled Downgrades Executor | Hourly | `jobs/execute-scheduled-downgrades.ts` | Process expired subscriptions with scheduled downgrades |

### Downgrade Execution

```typescript
// execute-scheduled-downgrades.ts
1. Find subscriptions WHERE status='active' AND expires_at < NOW() AND scheduled_downgrade_plan_id IS NOT NULL
2. For each:
   - If target is FREE: create free subscription, apply limits
   - If target is paid: fallback to FREE (paid downgrades not supported)
   - Suspend bonus course enrollments
```

---

## 13. Founders Program

**Trigger**: Annual subscription payment (`billingPeriod === 'annual'`)

**Benefits**:
1. `organizations.settings.is_founder = true`
2. `organizations.settings.founder_since = <timestamp>`
3. Lifetime enrollment in bonus course (from `app_settings.founder_bonus_course_id`)

**Implementation**: `applyFoundersProgram()` in `subscriptions.ts`

```typescript
await supabase
  .from('organizations')
  .update({
    settings: {
      ...existingSettings,
      is_founder: true,
      founder_since: new Date().toISOString(),
    }
  })
  .eq('id', organizationId);
```

**On Downgrade to FREE**:
- `suspendBonusCourseEnrollments()` sets enrollment status to 'suspended'
- Data preserved, access blocked

**On Upgrade from FREE**:
- `reactivateBonusCourseEnrollments()` restores 'active' status

---

## 14. Soft-Lock System

### Trigger Conditions

| Condition | Action |
|-----------|--------|
| `projects.count > plan.max_projects` | Oldest projects marked `is_over_limit = true` |
| `members.count > plan.max_members` | Oldest members marked `is_over_limit = true` |

### Function: `applyPlanLimits()`

**File**: `server/lib/handlers/checkout/shared/plan-limits.ts`

```typescript
1. Get plan features (max_projects, max_members)
2. If -1 (unlimited), unlock all resources
3. If limited:
   a. Count current resources
   b. If over limit, mark excess as is_over_limit = true (oldest first)
   c. If under limit, unlock all
```

### Unlock Flow

When user upgrades to plan with higher limits:
1. `applyPlanLimits()` called automatically
2. Resources with `is_over_limit = true` are unlocked
3. User regains access immediately

---

## 15. Frontend Components

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `UpgradeModal` | `src/features/pricing/` | Plan selection and checkout |
| `DowngradeModal` | `src/features/pricing/` | Downgrade confirmation with impact preview |
| `InvitationModal` | `src/features/organization/` | Member invitation |
| `PlanRestricted` | `src/components/shared/` | Access control based on plan |
| `CheckoutButton` | `src/features/pricing/` | Gateway selection (MP/PayPal) |

### Frontend Files Structure

```
src/
├── features/
│   ├── pricing/
│   │   ├── components/
│   │   │   ├── UpgradeModal.tsx
│   │   │   ├── DowngradeModal.tsx
│   │   │   ├── CheckoutButton.tsx
│   │   │   ├── PlanCard.tsx
│   │   │   └── ProrationDetails.tsx
│   │   └── hooks/
│   │       ├── useSubscription.ts
│   │       └── useProration.ts
│   └── organization/
│       └── components/
│           └── InvitationModal.tsx
└── components/
    └── shared/
        └── PlanRestricted.tsx
```

---

## 16. File Structure

### Backend Structure

```
server/
├── controllers/payments/
│   ├── mp.controller.ts          # MercadoPago controller
│   ├── paypal.controller.ts      # PayPal controller
│   └── bankTransfer.controller.ts # Bank transfer controller
├── lib/handlers/checkout/
│   ├── mp/                        # MP-specific handlers
│   │   ├── createCoursePreference.ts
│   │   ├── createRecurringSubscription.ts
│   │   ├── createUpgradePreference.ts
│   │   ├── createSeatPreference.ts
│   │   ├── processWebhook.ts
│   │   ├── handleSubscriptionReturn.ts
│   │   └── ...
│   ├── paypal/                    # PayPal-specific handlers
│   │   ├── createCourseOrder.ts
│   │   ├── createSubscriptionOrder.ts
│   │   ├── createUpgradeOrder.ts
│   │   ├── createSeatOrder.ts
│   │   ├── processWebhook.ts
│   │   └── ...
│   └── shared/                    # Shared handlers
│       ├── proration.ts
│       ├── seat-proration.ts
│       ├── subscriptions.ts
│       ├── plan-limits.ts
│       ├── payments.ts
│       ├── enrollments.ts
│       ├── coupons.ts
│       ├── events.ts
│       ├── auth.ts
│       ├── pricing.ts
│       └── helpers.ts
├── routes/
│   ├── payments.ts               # Payment route registration
│   └── subscriptions.ts          # Subscription route registration
└── cron/
    ├── index.ts                  # Cron initialization
    └── jobs/
        ├── subscription-expiry-notifier.ts
        └── execute-scheduled-downgrades.ts
```

---

## 17. Critical Implementation Notes

### 1. Idempotent Payments
`insertPayment()` checks for duplicate `provider_payment_id` to prevent double-processing webhooks.

### 2. User ID Resolution
Webhook handlers convert `auth_id` (from auth.users) to `public.users.id` before inserting payments:
```typescript
const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", resolvedUserId)
  .maybeSingle();
```

### 3. Gifted Org Detection
Check `provider_subscription_id === null` to detect gifted orgs and handle seat creation differently (create new subscription vs update existing).

### 4. Currency-Provider Mapping
- ARS → MercadoPago
- USD → PayPal

### 5. Exchange Rate
Fetched from `exchange_rates` table (USD→ARS):
```typescript
const { data: exchangeRate } = await supabase
  .from('exchange_rates')
  .select('rate')
  .eq('from_currency', 'USD')
  .eq('to_currency', 'ARS')
  .eq('is_active', true)
  .single();

const arsRate = exchangeRate ? parseFloat(exchangeRate.rate) : 1200; // fallback
```

### 6. Webhook Secret Validation (MP)
```typescript
if (MP_WEBHOOK_SECRET) {
  const q = String(req.query?.secret ?? "");
  if (!q || q !== MP_WEBHOOK_SECRET) {
    // Reject or log
  }
}
```

### 7. Database Triggers (enforce_*_user_id)

There are **8 triggers** validating `auth.uid()` on INSERT:

| Table | Trigger | Affects payment flow? |
|-------|---------|----------------------|
| `mp_subscription_preferences` | `trg_enforce_mp_subscription_preferences_user_id` | **YES** - Inserted when creating checkout preference |
| `support_messages` | `trg_enforce_support_messages_user_id` | No |
| `testimonials` | `trg_enforce_testimonials_user_id` | No |

**CRITICAL**: These triggers probably use `auth.uid()` which returns NULL when using `service_role`. If the trigger function does `RAISE EXCEPTION` when `auth.uid() IS NULL`, it would block the INSERT.

**Current Impact Analysis**:
- `mp_subscription_preferences` → Inserted when user starts checkout (from frontend, NOT service_role)
- Webhook READS from this table but does NOT insert

**Conclusion**: `enforce_*` triggers probably DON'T block webhook flow because webhook does NOT insert in those tables.

---

## 18. Known Issues & Risks

### Summary

| Aspect | Status |
|--------|--------|
| Orchestration | Central function `upgradeOrganizationPlan()` but WITHOUT transaction |
| Atomicity | **NO** - Individual operations without rollback |
| Error logging | Only console.error - NO ops_alerts table |
| Idempotency | YES - Duplicate check in `payments` |
| Triggers enforce | **Does NOT affect webhook** (doesn't insert in tables with triggers) |
| Most likely break point | THROW at lines 522/604 without rollback of previous steps |

### 🔴 No Logging/Alerts In:

| Point | Risk |
|-------|------|
| Silent failure of `applyPlanLimits` | Projects/members stay incorrectly blocked |
| Failure of `reactivateBonusCourseEnrollments` | Enrollments don't reactivate, no evidence |
| Inconsistent state subscription vs org.plan_id | No post-webhook consistency check |
| `applyFoundersProgram` partially successful | is_founder may be set but no enrollment |
| Webhook timeout (MP retries) | May cause duplicates if insertPayment fails silently |

### 🟡 Has console.error but NO alerts:

| Point | What it does |
|-------|-------------|
| `payment_events` INSERT fail | `console.error` - no alert |
| `organization_subscriptions` UPDATE fail | `console.error` - no alert |
| `organization_billing_cycles` INSERT fail | `console.error` - no alert |
| `applyFoundersProgram` any failure | `console.error` - no alert |

### ✅ Correctly handled:

| Point | What it does |
|-------|-------------|
| `insertPayment` duplicate (23505) | Returns `{ inserted: false }`, idempotent flow |
| `organization_subscriptions` INSERT fail | `throw error`, breaks flow (avoids partial state) |
| `organizations` UPDATE fail | `throw error`, breaks flow |

---

## 19. Testing Checklist

### Subscriptions
- [ ] New PayPal subscription (recurring)
- [ ] New MP subscription (recurring)
- [ ] Upgrade with proration MP
- [ ] Scheduled downgrade
- [ ] Subscription cancellation
- [ ] Reactivation after expiry

### Coupons
- [ ] Percentage coupon
- [ ] 100% coupon (free subscription)
- [ ] Expired coupon
- [ ] Limit reached coupon

### TEAMS
- [ ] Add seat (prorated payment)
- [ ] Invite billed member
- [ ] Invite non-billed member

### Webhooks
- [ ] PayPal renewal
- [ ] MP renewal
- [ ] Cancellation via webhook

### Cron Jobs
- [ ] Execute scheduled downgrade
- [ ] Notify upcoming expiry
- [ ] Suspend bonus course

---

## 20. Monitoring Queries

```sql
-- Active subscriptions by plan
SELECT p.name, COUNT(*) 
FROM organization_subscriptions os
JOIN plans p ON p.id = os.plan_id
WHERE os.status = 'active'
GROUP BY p.name;

-- Subscriptions about to expire
SELECT os.*, o.name as org_name, p.name as plan_name
FROM organization_subscriptions os
JOIN organizations o ON o.id = os.organization_id
JOIN plans p ON p.id = os.plan_id
WHERE os.status = 'active'
AND os.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Recent payments
SELECT * FROM payments 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Active coupons
SELECT * FROM coupons 
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > NOW());

-- Orgs with blocked resources
SELECT o.name, 
  (SELECT COUNT(*) FROM projects WHERE organization_id = o.id AND is_over_limit = true) as locked_projects,
  (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id AND is_over_limit = true) as locked_members
FROM organizations o
WHERE EXISTS (
  SELECT 1 FROM projects WHERE organization_id = o.id AND is_over_limit = true
  UNION
  SELECT 1 FROM organization_members WHERE organization_id = o.id AND is_over_limit = true
);

-- Gifted subscriptions (100% coupon)
SELECT os.*, o.name as org_name
FROM organization_subscriptions os
JOIN organizations o ON o.id = os.organization_id
WHERE os.provider_subscription_id IS NULL
AND os.status = 'active';
```

---

## Appendix: API Endpoints Summary

### Proration & Checkout

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout/calculate-proration` | POST | Calculate upgrade credit |
| `/api/checkout/calculate-seat-proration` | POST | Calculate seat cost |
| `/api/checkout/validate-subscription-coupon` | POST | Validate coupon for subscription |

### Subscription Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/subscriptions/current` | GET | Get organization's current subscription |
| `/api/subscriptions/schedule-downgrade` | POST | Schedule plan downgrade |
| `/api/subscriptions/cancel-scheduled-downgrade` | DELETE | Cancel scheduled downgrade |
| `/api/subscriptions/:id/cancel` | POST | Cancel subscription |
| `/api/subscriptions/limit-status` | GET | Get plan limit status |
| `/api/subscriptions/reapply-limits` | POST | Reapply plan limits |
| `/api/subscriptions/update-resource-limit` | POST | Update resource limit |
| `/api/subscriptions/swap-resources` | POST | Swap resources |

### Admin

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/paypal/sync-plans` | POST | Sync plans to PayPal |
| `/api/admin/mp/sync-plans` | POST | Sync plans to MercadoPago |

---

**Consolidated from**: 
- `PAYMENT-SUBSCRIPTION-FLOW-AUDIT.md` (Dec 17, 2025)
- `SUBSCRIPTIONS_BILLING_SYSTEM.md` (Dec 11, 2025)  
- `WEBHOOK-PAYMENT-FLOW.md` (Dec 17, 2025)

**Last Update**: December 29, 2025
