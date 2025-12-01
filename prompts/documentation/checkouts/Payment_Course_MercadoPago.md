# Mercado Pago Course Payment Flow - Complete Documentation

## 🎓 FEATURE STATUS: PRODUCTION-READY ✅

**Payment flow for course enrollment via Mercado Pago is COMPLETE and TESTED with coupon support.**

This document describes the complete flow for purchasing courses via Mercado Pago, including optional coupon redemption. **DO NOT MODIFY** the files listed in the "Protected Files" section without careful consideration.

---

## 📋 FLOW OVERVIEW

### User Journey

1. **User initiates course purchase**
   - Visits course page (`src/pages/learning/courses/CourseView.tsx`)
   - Optionally enters a coupon code
   - Clicks "Pagar con Mercado Pago"

2. **Frontend sends payment request** → Backend creates MP preference
   - POST `/api/checkout/mp/create-course`
   - Sends: `course_slug`, `currency` (ARS), `months` (12), optional `code` (coupon)
   - Receives: `init_point` (MP checkout URL), `preferenceId`

3. **User redirected to Mercado Pago**
   - Completes payment on MP UI
   - Returns to app via `back_urls.success`

4. **MP sends webhook notification**
   - POST `/api/checkout/mp/webhook?secret={MP_WEBHOOK_SECRET}`
   - Types: `payment` (payment completed) or `merchant_order` (order status change)
   - Backend processes asynchronously

5. **Backend processes webhook**
   - Validates webhook secret
   - Fetches payment/order details from MP API
   - Creates payment record
   - Creates course enrollment (12 months)
   - Redeems coupon if applicable
   - Redirects user to success page

---

## 🔄 DETAILED REQUEST/RESPONSE FLOW

### Step 1: Create Course Preference

**Endpoint:** `POST /api/checkout/mp/create-course`

**Request Body:**
```json
{
  "course_slug": "master-archicad",
  "currency": "ARS",
  "months": 12,
  "code": "ESTUDIANTE25OFF"  // Optional coupon code
}
```

**Response (Success):**
```json
{
  "ok": true,
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
  "preferenceId": "130095653-..."
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Curso no encontrado o inactivo" | "Cupón inválido" | "Precio inválido"
}
```

### Step 2: Webhook Processing

**Endpoint:** `POST /api/checkout/mp/webhook?secret={MP_WEBHOOK_SECRET}`

**Webhook Types:**
- `payment`: Individual payment notification
- `merchant_order`: Order status notification (may contain multiple payments)

**Happens server-side:**
1. Validates webhook secret from query parameter
2. Fetches payment/order details from MP API
3. Extracts metadata (user_id, course_slug, coupon info)
4. Resolves `auth_id` → `users.id` mapping
5. Inserts payment record into `payments` table (idempotent)
6. Logs payment event to `payment_events` table
7. Creates course enrollment (12 months expiry)
8. Redeems coupon to `coupon_redemptions` table (if applicable)

---

## 🔑 CRITICAL: external_reference SOLUTION

### The Problem
Mercado Pago's `external_reference` field has strict limits:
- **Maximum 64 characters**
- **Only alphanumeric characters, hyphens, and underscores**

Previously we used base64-encoded JSON which exceeded these limits and caused 400 errors.

### The Solution

1. **Generate short ID**: `mp_${nanoid(12)}` → Example: `mp_x0iHHR6c9csL`
2. **Store full data in database**: `mp_course_preferences` table
3. **Use short ID as external_reference**: Sent to MP
4. **Webhook looks up data**: Uses short ID to retrieve full metadata

```typescript
// Creating preference
const shortId = `mp_${nanoid(12)}`;  // 15 chars total

// Save to database
await supabase.from("mp_course_preferences").insert({
  id: shortId,
  user_id: user_id,
  course_id: course.id,
  coupon_id: couponData?.coupon_id,
  coupon_code: couponCode,
  currency,
  access_months: 12,
});

// Use in preference
const prefBody = {
  external_reference: shortId,  // ✅ Short and valid
  metadata: { /* full data for redundancy */ }
};
```

### Webhook Data Resolution

```typescript
// In webhook handler
if (externalRef.startsWith("mp_")) {
  const { data: prefData } = await supabase
    .from("mp_course_preferences")
    .select("*, courses!inner(slug)")
    .eq("id", externalRef)
    .maybeSingle();
  
  // Use data from database
  fromDb = {
    user_id: prefData.user_id,
    course_slug: prefData.courses?.slug,
    coupon_code: prefData.coupon_code,
    coupon_id: prefData.coupon_id,
  };
}

// Fallback to metadata if DB lookup fails
const fromExt = fromDb || decodeFromMetadata(md);
```

---

## 💱 ARS PRICE HANDLING

### Critical Rules for Argentine Peso

Mercado Pago Argentina **DOES NOT accept decimal amounts**. All prices must be integers.

```typescript
// 1. Get base price in USD
let basePriceUsd = Number(course.price);

// 2. Apply coupon discount (if any)
if (couponData) {
  basePriceUsd = Number(couponData.final_price);
}

// 3. Convert to ARS
const rate = Number(exchangeRate.rate);
const rawArsPrice = basePriceUsd * rate;

// 4. CRITICAL: Round to integer
unit_price = Math.round(rawArsPrice);  // ✅ No decimals

console.log('Price flow:', {
  usd: basePriceUsd,
  rate: rate,
  raw_ars: rawArsPrice,
  final_ars: unit_price  // Must be integer!
});
```

---

## 💳 DATA FLOW - Database Changes

### MP Course Preference Created (Before Payment)
```javascript
// mp_course_preferences table
{
  id: "mp_x0iHHR6c9csL",  // Short ID for external_reference
  preference_id: "130095653-...",
  user_id: "uuid",  // auth_id from Supabase Auth
  course_id: "uuid",
  coupon_id: "uuid" | null,
  coupon_code: "ESTUDIANTE25OFF" | null,
  student_price_usd: "15.00",  // Price with discount
  original_price_usd: "20.00",
  currency: "ARS",
  access_months: 12,
  created_at: "2025-11-28T..."
}
```

### Payment Created (After Webhook)
```javascript
// payments table
{
  id: "uuid",
  provider: "mercadopago",
  provider_payment_id: "135052460051",
  user_id: "uuid",  // From users.id (resolved from auth_id)
  course_id: "uuid",
  amount: 101,
  currency: "ARS",
  status: "completed",
  product_type: "course",
  created_at: "2025-11-28T...",
  metadata: { coupon_code, coupon_id, ... }
}
```

### Payment Event Logged
```javascript
// payment_events table
{
  id: "uuid",
  provider: "mercadopago",
  provider_event_id: "135052460051",
  provider_event_type: "payment.webhook",
  provider_payment_id: "135052460051",
  order_id: "35931913735",
  custom_id: "mp_x0iHHR6c9csL",
  amount: 101,
  currency: "ARS",
  status: "PROCESSED",
  created_at: "2025-11-28T..."
}
```

### Course Enrollment Created
```javascript
// course_enrollments table
{
  id: "uuid",
  user_id: "uuid",  // users.id (not auth_id)
  course_id: "uuid",
  status: "active",
  started_at: "2025-11-28T...",
  expires_at: "2026-11-28T...",  // 12 months
  created_at: "2025-11-28T..."
}
```

### Coupon Redemption (if applicable)
```javascript
// coupon_redemptions table
{
  id: "uuid",
  coupon_id: "uuid",
  user_id: "uuid",  // users.id
  course_id: "uuid",
  order_id: "uuid",  // payments.id (UUID, NOT MP payment ID!)
  amount_saved: 0,  // TODO: Calculate actual savings
  currency: "ARS",
  created_at: "2025-11-28T..."
}
```

---

## 🔐 CRITICAL SECURITY & ID RESOLUTION RULES

### ⚠️ ID RESOLUTION - Most Important

**Frontend uses `auth_id` from Supabase Auth, but the database uses `users.id`.**

```typescript
// CRITICAL - Backend webhook pattern
const resolvedUserId = md.user_id;  // This is auth_id from metadata

// Resolve to public.users.id
const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", resolvedUserId)  // ✅ Look up by auth_id
  .maybeSingle();

const publicUserId = userProfile.id;  // ✅ Use users.id for DB operations
```

### Coupon Redemption - Use payments.id, NOT MP ID

```typescript
// ❌ WRONG - MP payment ID is a number, not UUID
const couponResult = await markCouponAsUsed(
  supabase, couponId, userId, courseId,
  providerPaymentId,  // "135052460051" - NOT A UUID!
  amountSaved, currency
);

// ✅ CORRECT - Use payments table UUID
const paymentResult = await insertPayment(...);
const couponResult = await markCouponAsUsed(
  supabase, couponId, userId, courseId,
  paymentResult.paymentId,  // UUID from our payments table
  amountSaved, currency
);
```

### Security Principles

1. **Price from Database, Not Client**
   - Always fetch price from `courses.price` in database
   - Apply exchange rate server-side
   - Never trust price from frontend request

2. **User from Auth Session, Not Body**
   - Extract user from authenticated session via `supabase.auth.getUser()`
   - Resolve `auth_id` → `users.id` mapping server-side
   - Never accept `user_id` from request body

3. **Coupon Validation Server-Side**
   - Use RPC `validate_coupon(code, course_id, price, currency)`
   - Validates: code exists, not expired, limit not exceeded, applies to course
   - Never trust coupon discount from frontend

4. **Webhook Secret Validation**
   - Always validate `?secret=` query parameter matches `MP_WEBHOOK_SECRET`
   - Reject webhooks with missing or invalid secrets

5. **Service Role for Coupon Redemption**
   - Use service role key for inserting `coupon_redemptions`
   - Direct insert (not RPC) because `auth.uid()` is NULL on service role

---

## 📁 PROTECTED FILES - DO NOT MODIFY

These files implement the Mercado Pago course payment flow and are **FROZEN** to prevent regression:

```
server/lib/handlers/checkout/mp/createCoursePreference.ts
  └─ Function: createCoursePreference
  └─ Responsibility: Create MP preference, validate coupon, generate short ID
  └─ Status: LOCKED FOR MP COURSES

server/lib/handlers/checkout/mp/processWebhook.ts
  └─ Function: processWebhook
  └─ Responsibility: Handle payment/merchant_order webhooks, create enrollment
  └─ Status: LOCKED FOR MP COURSES

server/lib/handlers/checkout/mp/api.ts
  └─ Functions: createMPPreference, getMPPayment, getMPMerchantOrder
  └─ Responsibility: Mercado Pago API communication
  └─ Status: LOCKED FOR MP API

server/lib/handlers/checkout/mp/config.ts
  └─ Functions: validateMPToken, logMPMode
  └─ Responsibility: MP configuration and token validation
  └─ Status: LOCKED FOR MP CONFIG

server/lib/handlers/checkout/mp/encoding.ts
  └─ Functions: encodeCustomData, decodeExternalReference, extractMetadata
  └─ Responsibility: Data encoding/decoding for MP
  └─ Status: LOCKED FOR MP ENCODING

server/lib/handlers/checkout/shared/coupons.ts
  └─ Functions: validateAndApplyCoupon, markCouponAsUsed
  └─ Responsibility: Coupon validation & redemption tracking
  └─ Status: LOCKED FOR COUPON SYSTEM

server/lib/handlers/checkout/shared/payments.ts
  └─ Function: insertPayment
  └─ Responsibility: Insert payment record (idempotent, returns paymentId)
  └─ Status: LOCKED FOR PAYMENTS

server/lib/handlers/checkout/shared/enrollments.ts
  └─ Function: upsertEnrollment
  └─ Responsibility: Create/update course enrollment with expiry
  └─ Status: LOCKED FOR ENROLLMENTS

server/lib/handlers/checkout/shared/events.ts
  └─ Function: logPaymentEvent
  └─ Responsibility: Log payment events for audit trail
  └─ Status: LOCKED FOR PAYMENT EVENTS

server/routes/payments.ts
  └─ Endpoints: 
    └─ POST /api/checkout/mp/create-course
    └─ POST /api/checkout/mp/webhook
    └─ GET /api/checkout/mp/success-handler
  └─ Status: LOCKED FOR MP ROUTES

src/features/learning/hooks/use-course-enrollment.ts
  └─ Hook: useCourseEnrollment
  └─ Responsibility: Check if user enrolled in course
  └─ Status: LOCKED FOR ENROLLMENT CHECKS

src/pages/learning/courses/CourseView.tsx
  └─ UI: Course purchase flow (MP button, coupon input)
  └─ Status: LOCKED FOR COURSE PURCHASE UI
```

---

## ⚙️ ENVIRONMENT VARIABLES

```bash
# Mercado Pago Mode
MP_MODE="production"  # "production" or "test"

# Access Tokens
MP_ACCESS_TOKEN="APP_USR-..."      # Production token
MP_ACCESS_TOKEN_TEST="TEST-..."    # Sandbox token (if MP_MODE="test")

# Webhook Security
MP_WEBHOOK_SECRET="your-webhook-secret"  # Validate incoming webhooks
```

---

## ✅ TESTING CHECKLIST

Use this to validate the flow works:

- [ ] **Normal Payment Flow**
  - [ ] User selects course
  - [ ] Clicks "Pagar con Mercado Pago"
  - [ ] Redirected to Mercado Pago checkout
  - [ ] Completes payment
  - [ ] Webhook received and processed
  - [ ] Course accessible in dashboard

- [ ] **Coupon Flow**
  - [ ] User enters valid coupon code
  - [ ] Discount applied (price reduced before MP)
  - [ ] Payment processed with discounted amount in ARS
  - [ ] Coupon recorded in `coupon_redemptions` with payments.id

- [ ] **Error Cases**
  - [ ] Invalid coupon → error message
  - [ ] Coupon limit exceeded → error message
  - [ ] Coupon expired → error message
  - [ ] Invalid course → error message

- [ ] **Webhook Idempotency**
  - [ ] Multiple webhooks for same payment → only one enrollment
  - [ ] Payment already exists → skipped gracefully

---

## 📊 Monitoring & Debugging

**View payment status:**
```sql
SELECT * FROM payments WHERE provider = 'mercadopago' ORDER BY created_at DESC LIMIT 10;
```

**View coupon redemptions:**
```sql
SELECT * FROM coupon_redemptions WHERE course_id = 'course-uuid' ORDER BY created_at DESC;
```

**View payment events:**
```sql
SELECT * FROM payment_events WHERE provider = 'mercadopago' ORDER BY created_at DESC LIMIT 10;
```

**View MP preferences (short IDs):**
```sql
SELECT * FROM mp_course_preferences ORDER BY created_at DESC LIMIT 10;
```

**Verify enrollment:**
```sql
SELECT * FROM course_enrollments WHERE user_id = 'user-uuid' AND course_id = 'course-uuid';
```

**Debug logs to look for:**
```
[MP create-course-preference] Modo: 💰 PRODUCCIÓN
[MP create-course-preference] ✅ Cupón válido - Descuento aplicado
[MP create-course-preference] ID corto generado: mp_xxxxx
[MP create-course-preference] ✅ Preferencia creada
[MP webhook] 🔍 Buscando datos en BD para: mp_xxxxx
[MP webhook] ✅ Resolved auth_id to user_id
[MP webhook] 📚 Processing COURSE payment
[payments] ✅ payment insertado (course)
[MP webhook] 🎟️ Redeeming coupon
[coupons] ✅ Coupon redemption inserted successfully
[enrollments] ✅ Enrollment created/updated
[MP webhook] ✅ Course enrollment processed successfully
```

---

## 🚀 ARCHITECTURE DECISIONS

### Why Short ID + Database Lookup?

1. **MP Limit**: `external_reference` max 64 chars, alphanumeric only
2. **Base64 Too Long**: JSON with coupon data exceeds limit
3. **Solution**: Generate short ID, store full data in DB
4. **Fallback**: Webhook also reads from `metadata` field

### Why Webhook Instead of Return URL?

1. **Reliability**: User might close browser before redirect
2. **Security**: Webhook validates with secret, return URL doesn't
3. **Async**: MP processes payments asynchronously
4. **Idempotency**: Multiple webhooks handled gracefully

### Why Round ARS to Integer?

1. **MP Argentina Requirement**: Decimal prices rejected
2. **Applied At**: After USD→ARS conversion, after coupon discount
3. **Method**: `Math.round()` to nearest integer

---

## 📝 Last Updated

**November 28, 2025** - Mercado Pago course payment flow with coupon support COMPLETE and TESTED.

Key fixes implemented:
- `external_reference` limit solved with short ID + database storage
- ARS rounding to integer for MP Argentina
- Coupon redemption using `payments.id` (UUID) instead of MP payment ID
- ID resolution from `auth_id` to `users.id` in webhook
