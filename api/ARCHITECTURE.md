# Vercel API Endpoints - Architecture Documentation

## ⚠️ CRITICAL RULES - NEVER BREAK THESE

### 1. Dynamic Route Conflicts
**RULE**: Never create conflicting dynamic route patterns in the same path.

❌ **WRONG** (causes conflicts):
```
api/projects/[id].ts
api/projects/[projectId]/clients/index.ts  // ⚠️ CONFLICT!
```

✅ **CORRECT**:
```
api/projects/[projectId]/index.ts
api/projects/[projectId]/clients/index.ts
api/projects/[projectId]/clients/[clientId].ts
```

**Why?** Vercel can't determine if `/api/projects/something` should go to `[id].ts` or to `[projectId]/clients/index.ts`.

### 2. Import Paths in Production
**RULE**: Always use `api/lib/` (NOT `api/_lib/`) for handler imports.

❌ **WRONG**:
```typescript
import { handler } from "../_lib/handlers/...";  // ⚠️ Doesn't exist in Vercel!
```

✅ **CORRECT**:
```typescript
import { handler } from "../lib/handlers/...";
```

### 3. Handler Pattern
**RULE**: ALL business logic MUST be in `api/lib/handlers/`. Endpoints are thin wrappers.

✅ **CORRECT Structure**:
```typescript
// api/projects/[projectId]/clients/index.ts
import { createClient } from "../../lib/handlers/projects/projectClients.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validate environment
  // 2. Extract & validate auth token
  // 3. Create Supabase context
  // 4. Extract & validate params
  // 5. Call handler
  // 6. Return response
}
```

### 4. Authentication Pattern
**RULE**: EVERY endpoint must validate auth the same way.

```typescript
const authHeader = req.headers.authorization || "";
const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

if (!token) {
  return res.status(401).json({ error: "No authorization token provided" });
}

const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${token}` } },
});
```

### 5. Parameter Extraction
**RULE**: Path params come from `req.query`, query params also from `req.query`.

```typescript
// For /api/projects/[projectId]/clients?organization_id=123
const projectId = req.query.projectId as string;  // Path param
const organizationId = req.query.organization_id as string;  // Query param
```

---

## 📁 Current Endpoint Structure

### Authentication & User
- `api/current-user.ts` - GET current user info
- `api/accept-invitation.ts` - POST accept org invitation
- `api/reject-invitation.ts` - POST reject org invitation
- `api/invite-member.ts` - POST invite member to org
- `api/user/profile.ts` - GET/PATCH user profile
- `api/pending-invitations/[userId].ts` - GET pending invitations

### Projects
- `api/projects.ts` - GET list, POST create
- `api/projects/[projectId]/index.ts` - PATCH update, DELETE delete
- `api/projects/[projectId]/clients/index.ts` - GET list, POST create client
- `api/projects/[projectId]/clients/[clientId].ts` - GET/PATCH/DELETE client
- `api/projects/[projectId]/clients/summary.ts` - GET financial summary

### Budgets & Items
- `api/budgets.ts` - GET/POST budgets
- `api/budgets/[id].ts` - GET/PATCH/DELETE budget
- `api/budget-items.ts` - GET/POST budget items
- `api/budget-items/[id].ts` - GET/PATCH/DELETE budget item
- `api/budget-items/move.ts` - POST move budget item

### Client Management
- `api/contacts.ts` - GET/POST contacts
- `api/client-roles.ts` - GET/POST client roles
- `api/client-roles/[id].ts` - GET/PATCH/DELETE client role
- `api/project-clients.ts` - GET/POST project clients (legacy, prefer nested routes)

### Payments & Checkout
- `api/mp/create-course-preference.ts` - POST Mercado Pago course checkout
- `api/mp/create-subscription-preference.ts` - POST Mercado Pago subscription
- `api/mp/webhook.ts` - POST Mercado Pago webhook
- `api/paypal/create-course-order.ts` - POST PayPal course order
- `api/paypal/create-subscription-order.ts` - POST PayPal subscription
- `api/paypal/capture-order.ts` - POST capture PayPal order
- `api/paypal/capture-subscription.ts` - POST capture PayPal subscription
- `api/paypal/webhook.ts` - POST PayPal webhook
- `api/bank-transfer/create.ts` - POST bank transfer payment
- `api/bank-transfer/upload.ts` - POST upload proof
- `api/subscriptions/[id]/cancel.ts` - POST cancel subscription

### Learning Module
- `api/learning/courses-full.ts` - GET all courses with full data
- `api/learning/dashboard.ts` - GET learning dashboard
- `api/learning/dashboard-fast.ts` - GET optimized dashboard
- `api/courses/[id]/progress.ts` - GET/POST course progress
- `api/lessons/[id]/notes.ts` - GET/POST/PATCH lesson notes
- `api/lessons/[id]/progress.ts` - POST lesson progress

### Admin
- `api/admin/auth-helper.ts` - Admin auth utilities
- `api/admin/dashboard.ts` - GET admin dashboard
- `api/admin/users.ts` - GET/POST admin users
- `api/admin/courses.ts` - GET/POST admin courses
- `api/admin/modules.ts` - GET/POST admin modules
- `api/admin/lessons.ts` - GET/POST admin lessons
- `api/admin/enrollments.ts` - GET admin enrollments
- `api/admin/coupons.ts` - GET/POST admin coupons

### Community
- `api/community/projects.ts` - GET public projects
- `api/community/organizations.ts` - GET public organizations
- `api/community/stats.ts` - GET community stats
- `api/community/active-users.ts` - GET active users

### AI
- `api/ai/chat.ts` - POST chat with AI
- `api/ai/history.ts` - GET chat history
- `api/ai/home_greeting.ts` - GET AI home greeting

### Organization
- `api/organization-members/[organizationId].ts` - GET org members

### Utilities
- `api/countries.ts` - GET countries list
- `api/index.ts` - Root endpoint

---

## 🔧 Handler Structure

All business logic lives in `api/lib/handlers/`:

```
api/lib/handlers/
├── admin/          - Admin operations
├── checkout/       - Payment processing
│   ├── mp/        - Mercado Pago
│   ├── paypal/    - PayPal
│   └── shared/    - Shared checkout logic
├── clients/        - Client role management
├── community/      - Community features
├── contacts/       - Contact management
├── learning/       - Learning module
├── organization/   - Organization management
└── projects/       - Project management
    ├── projects.ts
    ├── budgets.ts
    ├── budgetItems.ts
    ├── projectClients.ts
    └── shared.ts
```

---

## ✅ Pre-Deploy Checklist

Before creating ANY new endpoint, verify:

1. **No route conflicts** - Check existing structure first
2. **Correct imports** - Use `api/lib/` not `api/_lib/`
3. **Auth pattern** - Use standard Bearer token extraction
4. **Handler exists** - Business logic in `api/lib/handlers/`
5. **Error handling** - Consistent try/catch with proper status codes
6. **Parameter validation** - Check required params before calling handler
7. **TypeScript** - No LSP errors
8. **Naming convention** - Use `[paramName]` for dynamic routes

---

## 🚨 Common Mistakes to Avoid

1. ❌ Creating `api/something/[id].ts` when `api/something/[somethingId]/nested.ts` exists
2. ❌ Importing from `_lib` instead of `lib`
3. ❌ Putting business logic in endpoint files instead of handlers
4. ❌ Inconsistent auth validation
5. ❌ Not validating required parameters
6. ❌ Using different error response formats

---

## 📝 How to Add a New Endpoint

1. **Check existing structure** - Read this file first
2. **Check for conflicts** - Look for overlapping dynamic routes
3. **Create handler first** - Add logic to `api/lib/handlers/`
4. **Create endpoint** - Thin wrapper following the pattern above
5. **Test locally** - Verify in development
6. **Deploy** - Verify in Vercel
7. **Update this doc** - Add your endpoint to the list

---

**Last Updated**: November 14, 2025  
**Maintainer**: Documented for AI agent memory and human reference
