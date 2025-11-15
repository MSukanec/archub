# Bank Transfer Payment System

## Overview

The bank transfer payment system allows users to pay for courses through bank transfer by uploading proof of payment (receipts). This document describes the implementation, configuration, and troubleshooting.

## Features

- ✅ Bank transfer payment method in checkout
- ✅ Receipt upload functionality (PDF, JPG, PNG - max 10MB)
- ✅ Automatic WhatsApp notifications to admin (optional, requires Twilio)
- ✅ Payment status tracking (pending, approved, rejected)
- ✅ Secure file storage in Supabase Storage
- ✅ Clean checkout UX with switch controls for optional features

## User Flow

1. **Checkout Page**: User selects "Transferencia Bancaria" as payment method
2. **Bank Info Display**: User clicks "VER DATOS BANCARIOS" to view bank account details
3. **Receipt Upload**: User uploads proof of payment (PDF/JPG/PNG)
4. **Admin Notification**: Admin receives WhatsApp notification with receipt link (if configured)
5. **Payment Review**: Admin reviews and approves/rejects the payment
6. **Enrollment**: Upon approval, user is enrolled in the course

## Technical Implementation

### Backend Endpoints

All endpoints located in `server/routes/bank-transfer.ts`:

#### 1. POST `/api/bank-transfer/create`
Creates a new bank transfer payment record.

**Request Body:**
```json
{
  "course_price_id": "uuid",
  "coupon_code": "string (optional)",
  "amount": "number",
  "currency": "string"
}
```

**Response:**
```json
{
  "success": true,
  "btp_id": "uuid"
}
```

#### 2. POST `/api/bank-transfer/upload`
Uploads receipt file and updates payment record.

**Request Body:**
```json
{
  "btp_id": "uuid",
  "file_name": "string",
  "file_data": "base64 string"
}
```

**Response:**
```json
{
  "success": true,
  "receipt_url": "string"
}
```

#### 3. GET `/api/bank-transfer/:btp_id`
Retrieves payment status.

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "course_price_id": "uuid",
  "status": "pending|approved|rejected",
  "amount": "number",
  "currency": "string",
  "receipt_url": "string",
  "created_at": "timestamp"
}
```

### Critical User ID Mapping

**IMPORTANT**: Supabase Auth user IDs (`auth.users.id`) are different from public user IDs (`public.users.id`).

All bank-transfer endpoints follow this pattern:

```typescript
// 1. Get authenticated user from JWT
const { data: { user } } = await authenticatedSupabase.auth.getUser();

// 2. Fetch public.users profile using auth_id
const { data: profile } = await adminClient
  .from('users')
  .select('id, full_name, email')
  .eq('auth_id', user.id)  // Link: auth.users.id -> users.auth_id
  .maybeSingle();

// 3. Use profile.id for database operations
await adminClient.from('bank_transfer_payments').insert({
  user_id: profile.id,  // ✅ Correct FK to public.users.id
  ...
});
```

**Why this is critical:**
- `bank_transfer_payments.user_id` is a foreign key to `users.id` (not `auth.users.id`)
- RLS policies on `bank_transfer_payments` reference `users.id`
- Using `auth.users.id` directly causes FK constraint violations and RLS policy failures

### Database Schema

Table: `bank_transfer_payments`

```sql
CREATE TABLE bank_transfer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  course_price_id UUID NOT NULL REFERENCES course_prices(id),
  coupon_code VARCHAR,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  receipt_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### File Storage

Receipts are stored in Supabase Storage:
- **Bucket**: `bank-transfer-receipts`
- **Path**: `{user_id}/{timestamp}_{filename}`
- **RLS**: Users can only upload/view their own receipts
- **Public Access**: Receipts are publicly accessible via signed URLs

## WhatsApp Notifications (Optional)

### Setup Instructions

1. **Create Twilio Account**
   - Sign up at https://www.twilio.com
   - Navigate to Console → Messaging → Try WhatsApp
   - Get your sandbox WhatsApp number

2. **Get Credentials**
   - Account SID: Found in Twilio Console Dashboard
   - Auth Token: Found in Twilio Console Dashboard
   - WhatsApp Number: Your Twilio WhatsApp-enabled number (format: `whatsapp:+14155238886`)

3. **Configure Environment Variables**

Add these to your `.env` file or Replit Secrets:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
ADMIN_WHATSAPP_NUMBER=whatsapp:+5491132273000
```

4. **Verify Configuration**
   - Upload a test receipt in checkout
   - Check server logs for WhatsApp status
   - If successful, admin will receive notification

### Notification Message Format

```
🔔 Nuevo comprobante de transferencia

👤 Usuario: [User Name or Email]
💰 Monto: [Amount] [Currency]
📄 Comprobante: [Receipt URL]

Por favor revisar y aprobar el pago.
```

### Fail-Safe Behavior

If Twilio is not configured:
- ✅ Receipt uploads continue to work normally
- ⚠️ WhatsApp notifications are silently skipped
- 📝 Server logs: "WhatsApp notification skipped: Twilio not configured"

## Frontend Implementation

### Location
`src/pages/checkout/CheckoutPage.tsx`

### Key Components

1. **Payment Method Selection**
   - Radio buttons for payment methods
   - Bank transfer option triggers bank info display

2. **Bank Info Display**
   - "VER DATOS BANCARIOS" button expands bank details
   - Shows account holder, bank name, account number, etc.
   - Copy button copies all bank info to clipboard

3. **Receipt Upload**
   - File input for PDF/JPG/PNG (max 10MB)
   - Base64 encoding for upload
   - Progress indicators and error handling

4. **Invoice Switch**
   - "Necesito factura" switch for optional billing info
   - Conditional CUIT/Tax ID validation
   - Billing data only submitted when switch is ON

## Troubleshooting

### Error 500 on Create/Upload/Status

**Symptom**: `POST /api/bank-transfer/create` returns 500 error

**Cause**: User ID mapping issue (auth.users.id vs public.users.id)

**Solution**: Verify endpoints fetch profile via `auth_id`:
```typescript
const { data: profile } = await adminClient
  .from('users')
  .select('id')
  .eq('auth_id', user.id)
  .maybeSingle();
```

### Receipt Upload Fails

**Possible Causes**:
1. File too large (>10MB)
2. Invalid file type (not PDF/JPG/PNG)
3. Supabase Storage bucket not configured
4. RLS policies blocking upload

**Check**:
- File size and type on frontend
- Supabase Storage bucket exists: `bank-transfer-receipts`
- RLS policies allow user to upload

### WhatsApp Not Sending

**Check**:
1. All 4 Twilio env vars are set
2. WhatsApp number format includes `whatsapp:` prefix
3. Twilio sandbox is connected (for testing)
4. Check server logs for Twilio API errors

**Expected Log (Success)**:
```
WhatsApp notification sent successfully
```

**Expected Log (Not Configured)**:
```
WhatsApp notification skipped: Twilio not configured
```

### GET Endpoint Returns 404

**Symptom**: User can create payment but cannot retrieve status

**Cause**: Endpoint filtering by wrong user ID

**Solution**: Ensure GET endpoint uses `profile.id`:
```typescript
.eq('user_id', profile.id)  // Not user.id!
```

## Admin Review Panel (Future)

Currently in development:
- Admin panel to view pending transfers
- Approve/reject functionality
- Automatic enrollment on approval
- Email notifications to users

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own payment records
3. **File Validation**: File type and size validated on frontend and backend
4. **RLS Policies**: Database-level security prevents unauthorized access
5. **Admin Client**: Used carefully with manual authorization checks

## Testing Checklist

- [ ] Create bank transfer payment successfully
- [ ] Upload receipt (PDF, JPG, PNG)
- [ ] View payment status
- [ ] Copy bank info to clipboard
- [ ] WhatsApp notification received (if configured)
- [ ] Invoice switch toggles CUIT validation
- [ ] File size validation (>10MB rejected)
- [ ] Invalid file type rejected

## Recent Changes (October 30, 2025)

### Fixed Issues:
1. ✅ Error 500 on `/api/bank-transfer/create` due to user ID mismatch
2. ✅ Error 500 on `/api/bank-transfer/upload` (same issue)
3. ✅ Error 404 on `/api/bank-transfer/:btp_id` (same issue)
4. ✅ Removed manual WhatsApp instructions from checkout UI

### Implemented Features:
1. ✅ Automatic WhatsApp notifications via Twilio
2. ✅ Fail-safe WhatsApp integration (optional configuration)
3. ✅ Correct user ID mapping in all endpoints
4. ✅ Clean checkout UX without hardcoded WhatsApp numbers

## Support

For issues or questions:
1. Check server logs for error details
2. Verify environment variables are set correctly
3. Test endpoints individually using API client
4. Review RLS policies in Supabase dashboard
