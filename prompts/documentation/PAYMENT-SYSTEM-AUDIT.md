# Payment System Architecture - Complete Audit

> Last updated: December 29, 2025

## Overview

Seencel uses a multi-gateway payment system supporting **MercadoPago (ARS)** and **PayPal (USD)**, plus **Bank Transfer** for courses. The system handles subscriptions, course purchases, upgrades, and seat-based billing.

---

## Payment Gateways

### MercadoPago (Primary for LATAM - ARS)

**Files**: 
- Controller: `server/controllers/payments/mp.controller.ts`
- Handlers: `server/lib/handlers/checkout/mp/`

**Product Types**: courses, subscriptions, subscription_upgrade, seat

**Endpoints**:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout/mp/create-course` | POST | Course purchase preference |
| `/api/checkout/mp/create-subscription` | POST | Legacy one-time subscription |
| `/api/checkout/mp/create-recurring` | POST | Recurring Preapproval subscription (NEW) |
| `/api/checkout/mp/create-upgrade-preference` | POST | Prorated upgrade |
| `/api/checkout/mp/create-seat` | POST | Seat payment for member invitation |
| `/api/checkout/mp/update-subscription` | POST | Update existing subscription in-place |
| `/api/checkout/mp/webhook` | POST | Webhook handler |
| `/api/checkout/mp/success-handler` | GET | Course success redirect |
| `/api/checkout/mp/subscription-success` | GET | Subscription success redirect |
| `/api/checkout/mp/upgrade-success` | GET | Upgrade success redirect |
| `/api/checkout/mp/seat-success` | GET | Seat payment success redirect |
| `/api/checkout/mp/seat-subscription-success` | GET | First seat subscription (gifted orgs) |

---

### PayPal (Primary for USD)

**Files**: 
- Controller: `server/controllers/payments/paypal.controller.ts`
- Handlers: `server/lib/handlers/checkout/paypal/`

**Product Types**: courses, subscriptions, subscription_upgrade, seat

**Endpoints**:
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

---

### Bank Transfer (Courses only)

**Files**: `server/controllers/payments/bankTransfer.controller.ts`

**Endpoints**:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checkout/bank-transfer/create` | POST | Create pending payment |
| `/api/checkout/bank-transfer/upload` | POST | Upload receipt for verification |

---

## Database Tables

### Core Payment Tables

#### `payments`
Unified payment records for all gateways.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `provider` | text | 'mercadopago', 'paypal', 'bank_transfer' |
| `provider_payment_id` | text | External payment ID |
| `user_id` | uuid | User who made payment |
| `course_id` | uuid | For course purchases |
| `organization_id` | uuid | For subscription/seat payments |
| `product_type` | text | 'course', 'subscription', 'subscription_upgrade', 'seat' |
| `product_id` | uuid | Plan ID or course ID |
| `amount` | numeric | Payment amount |
| `currency` | text | 'USD' or 'ARS' |
| `status` | text | 'pending', 'completed', 'failed', 'refunded' |
| `metadata` | jsonb | Additional data |

#### `payment_events`
Webhook/event log for debugging.

#### `bank_transfer_payments`
Bank transfer specific records with receipt URLs.

---

### Subscription Tables

#### `organization_subscriptions`
Active subscriptions per organization.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization |
| `plan_id` | uuid | Current plan |
| `payment_id` | uuid | Associated payment |
| `status` | text | 'active', 'expired', 'cancelled' |
| `billing_period` | text | 'monthly', 'annual' |
| `started_at` | timestamptz | Subscription start |
| `expires_at` | timestamptz | Subscription expiry |
| `provider_subscription_id` | text | MP preapproval ID (null for gifted) |
| `scheduled_downgrade_plan_id` | uuid | Plan to downgrade to on expiry |
| `payer_email` | text | Email for MP payments (seat billing) |
| `amount` | numeric | Subscription amount |
| `currency` | text | 'USD' or 'ARS' |

#### `organization_billing_cycles`
Historical billing cycle snapshots.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `organization_id` | uuid | Organization |
| `subscription_id` | uuid | Associated subscription |
| `plan_id` | uuid | Plan at time of billing |
| `seats` | integer | Actual billable members |
| `billed_seats` | integer | Seats charged for |
| `amount_per_seat` | numeric | Price per seat |
| `base_amount` | numeric | billed_seats × amount_per_seat |
| `proration_adjustment` | numeric | Credit from upgrades |
| `total_amount` | numeric | Final charged amount |
| `period_start` | timestamptz | Billing period start |
| `period_end` | timestamptz | Billing period end |
| `payment_provider` | text | 'mercadopago', 'paypal' |
| `status` | text | 'paid', 'pending', 'failed' |

---

### Preference/Session Tables

#### `mp_course_preferences`
MercadoPago course checkout sessions.

#### `mp_subscription_preferences`
MP subscription/upgrade/seat checkout sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key (format: `mpr_*`, `mpu_*`, `mps_*`) |
| `user_id` | uuid | User creating preference |
| `organization_id` | uuid | Target organization |
| `plan_slug` | text | Target plan |
| `billing_period` | text | 'monthly', 'annual' |
| `product_type` | text | 'subscription', 'subscription_upgrade', 'seat' |
| `invitee_email` | text | For seat payments |
| `role_id` | uuid | For seat payments |
| `subscription_id` | uuid | For seat payments |
| `amount_ars` | numeric | Amount in ARS |

**ID Prefixes**:
- `mp_*` - Course preference
- `mpr_*` - Recurring subscription preference
- `mpu_*` - Upgrade preference
- `mps_*` - Seat preference

---

### Coupon Tables

#### `coupons`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `code` | text | Coupon code (unique) |
| `type` | text | 'percentage', 'fixed' |
| `amount` | numeric | Discount amount |
| `currency` | text | For fixed coupons |
| `max_redemptions` | integer | Global limit |
| `per_user_limit` | integer | Per-user limit |
| `valid_from` | timestamptz | Start date |
| `valid_until` | timestamptz | End date |
| `applicable_plans` | text[] | Array of plan slugs |
| `min_order_amount` | numeric | Minimum order |

#### `coupon_redemptions`
Usage tracking per user.

---

## Shared Handlers

Location: `server/lib/handlers/checkout/shared/`

| File | Purpose |
|------|---------|
| `proration.ts` | Calculate upgrade credit from remaining subscription time |
| `seat-proration.ts` | Calculate prorated cost for adding new member |
| `subscriptions.ts` | `upgradeOrganizationPlan()`, `createGiftedSubscription()`, `executeScheduledPlanSwitch()` |
| `plan-limits.ts` | `applyPlanLimits()`, `getOrganizationLimitStatus()` - soft-lock via `is_over_limit` |
| `payments.ts` | `insertPayment()` - idempotent payment insertion |
| `enrollments.ts` | `upsertEnrollment()` - course enrollment with expiration |
| `coupons.ts` | `markCouponAsUsed()` - redemption tracking |
| `events.ts` | `logPaymentEvent()` - webhook/event logging |
| `auth.ts` | `createServiceSupabaseClient()` - service role client |
| `pricing.ts` | Exchange rate and price calculations |
| `helpers.ts` | `getCourseIdBySlug()`, `getPlanIdBySlug()` |

---

## Proration System

### Plan Upgrades (`proration.ts`)

```
1. Fetch current active subscription
2. Calculate: daysRemaining / totalDays = percentageRemaining
3. Credit = originalAmount × percentageRemaining
4. FinalPrice = targetPlanPrice - credit
```

**Returns**: `ProrationResult` with:
- `credit`: { daysRemaining, totalDays, percentageRemaining, creditAmount, creditCurrency }
- `finalPrice`: { usd, ars }
- `savings`: { usd, ars }

### Seat Addition (`seat-proration.ts`)

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

---

## Subscription Lifecycle

### New Subscription Flow

```
1. User selects plan + billing period
2. Frontend calls create-recurring (MP) or create-subscription (PayPal)
3. User completes payment on gateway
4. Webhook receives payment confirmation
5. upgradeOrganizationPlan():
   - Expire previous subscriptions
   - Create new organization_subscriptions record
   - Create organization_billing_cycles record
   - Update organizations.plan_id
   - Apply applyPlanLimits() - unlock over-limit resources
   - Apply Founders Program (annual only)
```

### Gifted Subscriptions (100% Discount Coupon)

Created via `createGiftedSubscription()` WITHOUT payment gateway.

**Key indicator**: `provider_subscription_id = null`

When adding seats later:
- System detects `provider_subscription_id === null`
- Creates NEW MP subscription instead of updating existing

### Plan Upgrade Flow

```
1. POST /api/checkout/calculate-proration → get credit
2. Create upgrade preference with finalPrice
3. User pays difference on gateway
4. Webhook confirms payment
5. upgradeOrganizationPlan() applies new plan
6. Clear any scheduled_downgrade_plan_id
```

### Scheduled Downgrade Flow

```
1. User calls POST /api/subscriptions/schedule-downgrade
2. scheduled_downgrade_plan_id set on subscription
3. Cron job (hourly) checks for expired subscriptions
4. On expiration, executeScheduledPlanSwitch():
   - If target is FREE: create free subscription, apply limits
   - If target is paid: fallback to FREE (paid downgrades not supported)
   - Suspend bonus course enrollments
```

---

## Seat-Based Billing (TEAMS Plan)

### Adding a Member

```
1. POST /api/checkout/calculate-seat-proration → get prorated cost
2. POST /api/checkout/mp/create-seat or paypal/create-seat
3. User pays prorated amount
4. On payment success, webhook:
   - Record payment in payments table
   - Create organization_invitations record
   - Send invitation email/notification
   - Update subscription for next billing
```

### Billable vs Non-Billable Members

| Member Type | is_billable | Counts for Billing |
|-------------|-------------|-------------------|
| Gifted org owner | false | No |
| Invited members | true | Yes |
| Admin-created (via seat payment) | true | Yes |

Seat count formula: `COUNT(organization_members WHERE is_billable = true AND is_active = true)`

---

## Cron Jobs

Location: `server/cron/`

| Job | Schedule | File | Purpose |
|-----|----------|------|---------|
| Subscription Expiry Notifier | Daily 9:00 AM UTC | `jobs/subscription-expiry-notifier.ts` | Email notifications for expiring subscriptions |
| Scheduled Downgrades Executor | Hourly | `jobs/execute-scheduled-downgrades.ts` | Process expired subscriptions with scheduled downgrades |

---

## Founders Program

**Trigger**: Annual subscription payment (`billingPeriod === 'annual'`)

**Benefits**:
1. `organizations.settings.is_founder = true`
2. `organizations.settings.founder_since = <timestamp>`
3. Lifetime enrollment in bonus course (from `app_settings.founder_bonus_course_id`)

**Implementation**: `applyFoundersProgram()` in `subscriptions.ts`

**On Downgrade to FREE**:
- `suspendBonusCourseEnrollments()` sets enrollment status to 'suspended'
- Data preserved, access blocked

**On Upgrade from FREE**:
- `reactivateBonusCourseEnrollments()` restores 'active' status

---

## Key API Endpoints Summary

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

### Admin

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/paypal/sync-plans` | POST | Sync plans to PayPal |
| `/api/admin/mp/sync-plans` | POST | Sync plans to MercadoPago |

---

## Critical Implementation Notes

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

### 6. Plan Hierarchy
```typescript
const PLAN_HIERARCHY = {
  free: 1,
  pro: 2,
  teams: 3,
  enterprise: 4
};
```
Downgrades must go to lower tier. Upgrades require new payment.

### 7. Webhook Secret Validation (MP)
```typescript
if (MP_WEBHOOK_SECRET) {
  const q = String(req.query?.secret ?? "");
  if (!q || q !== MP_WEBHOOK_SECRET) {
    // Reject or log
  }
}
```

---

## File Structure

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
│       └── ...
├── routes/
│   ├── payments.ts               # Payment route registration
│   └── subscriptions.ts          # Subscription route registration
└── cron/
    ├── index.ts                  # Cron initialization
    └── jobs/
        ├── subscription-expiry-notifier.ts
        └── execute-scheduled-downgrades.ts
```
