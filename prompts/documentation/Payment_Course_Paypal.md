# PayPal Course Payment Flow - Complete Documentation

## 🎓 FEATURE STATUS: PRODUCTION-READY ✅

**Payment flow for course enrollment via PayPal is COMPLETE and TESTED with coupon support.**

This document describes the complete flow for purchasing courses via PayPal, including optional coupon redemption. **DO NOT MODIFY** the files listed in the "Protected Files" section without careful consideration.

---

## 📋 FLOW OVERVIEW

### User Journey

1. **User initiates course purchase**
   - Visits course page (`src/pages/learning/courses/CourseView.tsx`)
   - Optionally enters a coupon code
   - Clicks "Comprar con PayPal"

2. **Frontend sends payment request** → Backend creates PayPal order
   - POST `/api/checkout/paypal/create-course`
   - Sends: `course_slug`, optional `code` (coupon)
   - Receives: `order_id`, `approval_url` OR `freeEnrollment` flag

3. **User redirected to PayPal** (if not free enrollment)
   - Approves payment on PayPal UI
   - Returns to app with PayPal `token` (order ID)

4. **Backend captures payment**
   - GET `/api/checkout/paypal/capture-and-redirect?token={orderId}&course_slug={slug}`
   - Captures funds from PayPal
   - Creates payment record
   - Creates course enrollment (12 months)
   - Redeems coupon if applicable
   - Redirects user to success page with spinner animation

---

## 🔄 DETAILED REQUEST/RESPONSE FLOW

### Step 1: Create Course Order

**Endpoint:** `POST /api/checkout/paypal/create-course`

**Request Body:**
```json
{
  "course_slug": "python-advanced",
  "code": "SUMMER50"  // Optional coupon code
}
```

**Response (Success with Payment):**
```json
{
  "ok": true,
  "order_id": "7B123456789...",
  "approval_url": "https://www.paypal.com/checkoutnow?token=...",
  "order": { /* PayPal order object */ }
}
```

**Response (Success with Free Enrollment via Coupon):**
```json
{
  "ok": true,
  "freeEnrollment": true,
  "couponCode": "SUMMER50",
  "couponId": "uuid..."
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Course not found" | "Coupon invalid" | "Coupon grants free access but limit reached"
}
```

### Step 2: Capture Course Order

**Endpoint:** `GET /api/checkout/paypal/capture-and-redirect`

**Query Parameters:**
- `token`: PayPal order ID (token from return URL)
- `course_slug`: Course slug for validation

**Happens silently server-side:**
1. Fetches PayPal order details
2. Captures payment (ensures funds are secured)
3. Inserts payment record into `payments` table
4. Logs payment event to `payment_events` table
5. Creates course enrollment (12 months expiry)
6. Redeems coupon to `coupon_redemptions` table (if applicable)
7. Returns HTML with animated spinner → redirects to `/learning/courses/{slug}`

---

## 💳 DATA FLOW - Database Changes

### Payment Created
```javascript
// payments table
{
  id: "uuid",
  provider: "paypal",
  provider_payment_id: "PAYPAL-CAPTURE-ID",
  user_id: "uuid", // From users.id (resolved from auth_id)
  course_id: "uuid",
  amount: 49.99,
  currency: "USD",
  status: "completed",
  product_type: "course",
  created_at: "2025-11-28T...",
  metadata: { /* PayPal data */ }
}
```

### Payment Event Logged
```javascript
// payment_events table
{
  id: "uuid",
  provider: "paypal",
  provider_event_id: "paypal-capture-id",
  provider_event_type: "CHECKOUT.ORDER.COMPLETED",
  provider_payment_id: "PAYPAL-CAPTURE-ID",
  order_id: "PAYPAL-ORDER-ID",
  custom_id: "user_id|course_id|coupon_id", // Encoded
  amount: 49.99,
  currency: "USD",
  status: "RECEIVED",
  created_at: "2025-11-28T..."
}
```

### Course Enrollment Created
```javascript
// course_enrollments table
{
  id: "uuid",
  user_id: "uuid",
  course_id: "uuid",
  status: "active",
  started_at: "2025-11-28T...",
  expires_at: "2026-11-28T...", // 12 months
  created_at: "2025-11-28T..."
}
```

### Coupon Redemption (if applicable)
```javascript
// coupon_redemptions table
{
  id: "uuid",
  coupon_id: "uuid",
  user_id: "uuid",
  course_id: "uuid",
  order_id: "payment-id", // Links to payments.id
  amount_saved: 10.00,
  currency: "USD",
  created_at: "2025-11-28T..."
}
```

---

## 🔐 CRITICAL SECURITY & ID RESOLUTION RULES

### ⚠️ ID RESOLUTION - Most Important

**Frontend uses `auth_id` from Supabase Auth, but the database uses `users.id`.**

```typescript
// CORRECT - Backend pattern
const { data: { user } } = await supabase.auth.getUser();  // user.id is auth_id
const { data: userRecord } = await supabase
  .from('users')
  .select('id')
  .eq('auth_id', user.id)  // ✅ Look up by auth_id
  .single();
const userId = userRecord.id;  // ✅ Use users.id for DB operations
```

```typescript
// CORRECT - Frontend pattern for checking enrollment
import { useCurrentUser } from '@/hooks/use-current-user';
const { data: userData } = useCurrentUser();
const { data: enrolled } = useCourseEnrollment(courseId, userData?.id);  // ✅ userData.id is users.id
```

### Security Principles

1. **Price from Database, Not Client**
   - Always fetch price from `courses.price` in database
   - Never trust price from frontend request
   - Validate course exists before processing

2. **User from Auth Session, Not Body**
   - Extract user from authenticated session
   - Resolve `auth_id` → `users.id` mapping server-side
   - Never accept `user_id` from request body

3. **Coupon Validation Server-Side**
   - Use RPC `validate_coupon(code, course_id, price, currency)`
   - Validates: code exists, not expired, limit not exceeded, applies to course
   - Never trust coupon discount from frontend

4. **Service Role for Coupon Redemption**
   - Use service role key (backend only) for inserting coupon_redemptions
   - Direct insert (not RPC) because `auth.uid()` is NULL on service role
   - Prevents auth token issues

---

## 📁 PROTECTED FILES - DO NOT MODIFY

These files implement the PayPal course payment flow and are **FROZEN** to prevent regression:

```
server/controllers/payments/paypal.controller.ts
  └─ Functions: createCourse, captureCourse, captureAndRedirect
  └─ Status: LOCKED FOR PAYPAL COURSES

server/lib/handlers/checkout/paypal/createCourseOrder.ts
  └─ Function: createCourseOrder
  └─ Responsibility: Create PayPal order, validate coupon, encode custom_id
  └─ Status: LOCKED FOR PAYPAL COURSES

server/lib/handlers/checkout/paypal/captureCourseOrder.ts
  └─ Function: captureCourseOrder
  └─ Responsibility: Capture PayPal order
  └─ Status: LOCKED FOR PAYPAL COURSES

server/lib/handlers/checkout/shared/coupons.ts
  └─ Functions: validateAndApplyCoupon, markCouponAsUsed
  └─ Responsibility: Coupon validation & redemption tracking
  └─ Status: LOCKED FOR COUPON SYSTEM

server/lib/handlers/checkout/shared/payments.ts
  └─ Function: insertPayment
  └─ Responsibility: Insert payment record (product_type='course')
  └─ Status: LOCKED FOR COURSE PAYMENTS

server/lib/handlers/checkout/shared/enrollments.ts
  └─ Function: upsertEnrollment
  └─ Responsibility: Create/update course enrollment with 12-month expiry
  └─ Status: LOCKED FOR COURSE ENROLLMENTS

server/lib/handlers/checkout/shared/events.ts
  └─ Function: logPaymentEvent
  └─ Responsibility: Log payment events for audit trail
  └─ Status: LOCKED FOR PAYMENT EVENTS

server/routes/payments.ts
  └─ Endpoints: 
    └─ POST /api/checkout/paypal/create-course
    └─ POST /api/checkout/paypal/capture-course  
    └─ GET /api/checkout/paypal/capture-and-redirect
  └─ Status: LOCKED FOR PAYPAL ROUTES

src/features/learning/hooks/use-course-enrollment.ts
  └─ Hook: useCourseEnrollment
  └─ Responsibility: Check if user enrolled in course (uses users.id, not auth_id)
  └─ Status: LOCKED FOR ENROLLMENT CHECKS

src/pages/learning/courses/CourseView.tsx
  └─ UI: Course purchase flow (PayPal button, coupon input)
  └─ Status: LOCKED FOR COURSE PURCHASE UI
```

**FUTURE WORK - Separate Systems (DO NOT MODIFY ABOVE FILES):**
- Mercado Pago for course payments → new handlers in `checkout/mp/`
- PayPal subscriptions → new handlers in `checkout/paypal/` (subscription-specific)
- Never reuse course payment handlers for other purposes

---

## ✅ TESTING CHECKLIST

Use this to validate the flow works:

- [ ] **Normal Payment Flow**
  - [ ] User selects course
  - [ ] Clicks "Comprar con PayPal"
  - [ ] Redirected to PayPal
  - [ ] Approves payment
  - [ ] Redirected back with spinner animation
  - [ ] Course accessible in dashboard

- [ ] **Coupon Flow**
  - [ ] User enters valid coupon code
  - [ ] Discount applied on PayPal order
  - [ ] Payment processed with discounted amount
  - [ ] Coupon recorded in `coupon_redemptions`

- [ ] **Free Coupon Flow**
  - [ ] User enters coupon granting 100% discount
  - [ ] Instant enrollment without PayPal redirect
  - [ ] Coupon recorded in `coupon_redemptions`

- [ ] **Error Cases**
  - [ ] Invalid coupon → error message
  - [ ] Coupon limit exceeded → error message
  - [ ] Coupon expired → error message
  - [ ] Invalid course → error message

---

## 📊 Monitoring & Debugging

**View payment status:**
```sql
SELECT * FROM payments WHERE product_type = 'course' ORDER BY created_at DESC LIMIT 10;
```

**View coupon redemptions:**
```sql
SELECT * FROM coupon_redemptions WHERE course_id = 'course-uuid' ORDER BY created_at DESC;
```

**View payment events:**
```sql
SELECT * FROM payment_events WHERE provider = 'paypal' ORDER BY created_at DESC LIMIT 10;
```

**Verify enrollment:**
```sql
SELECT * FROM course_enrollments WHERE user_id = 'user-uuid' AND course_id = 'course-uuid';
```

---

## 🚀 NEXT PHASES (Different Systems)

When implementing these, **DO NOT MODIFY** any files in the "Protected Files" section above:

1. **Mercado Pago Courses** → Create new handlers in `server/lib/handlers/checkout/mp/`
2. **PayPal Subscriptions** → Create new handlers in `server/lib/handlers/checkout/paypal/` (subscription-specific)
3. **Other payment providers** → Keep separate from course payment handlers

Each payment method should have its own isolated handlers. The `shared/` folder is for truly shared utilities that work across all methods.

---

## 📝 Last Updated

**November 28, 2025** - PayPal course payment flow with coupon support COMPLETE and TESTED.
