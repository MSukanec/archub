# ✅ Endpoint Creation Checklist

## MANDATORY - Use this checklist BEFORE creating ANY new endpoint

---

## Step 1: Planning (BEFORE writing code)

### 1.1 Read Documentation
- [ ] Read `api/ARCHITECTURE.md` completely
- [ ] Check existing endpoint structure in that file
- [ ] Understand dynamic route conflict rules

### 1.2 Check for Conflicts
- [ ] List all existing endpoints in the same path
- [ ] Verify NO dynamic route conflicts (e.g., `[id]` vs `[projectId]/something`)
- [ ] If conflict exists, refactor existing structure first

### 1.3 Plan Handler Location
- [ ] Determine which handler domain (projects, clients, admin, etc.)
- [ ] Verify handler directory exists in `api/lib/handlers/`
- [ ] Plan function name and interface

---

## Step 2: Implementation

### 2.1 Create Handler First
Location: `api/lib/handlers/{domain}/{feature}.ts`

- [ ] Create handler function with clear interface
- [ ] Add TypeScript types for params and return
- [ ] Implement business logic
- [ ] Use `ensureAuth` and `ensureOrganizationAccess` for security
- [ ] Return `{ success: true, data }` or `{ success: false, error }`
- [ ] Test handler independently if possible

### 2.2 Create Endpoint File
Location: `api/{path}/[param]/{nested}.ts`

Required pattern:
```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handlerFunction } from "../../lib/handlers/{domain}/{feature}.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Validate environment
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!url || !anonKey) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
    }

    // 2. Extract & validate auth token
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // 3. Create Supabase context
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const ctx = { supabase };

    // 4. Extract & validate params
    const { paramName } = req.query;
    
    if (!paramName || typeof paramName !== 'string') {
      return res.status(400).json({ error: "paramName is required" });
    }

    // 5. Route by HTTP method
    if (req.method === "GET") {
      const result = await handlerFunction(ctx, { paramName });
      
      if (result.success) {
        return res.status(200).json(result.data);
      } else {
        return res.status(500).json({ error: result.error });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err: any) {
    console.error("Error in /api/path:", err);
    return res.status(500).json({ error: "Internal error", details: err.message });
  }
}
```

Checklist:
- [ ] Import path uses `api/lib/` (NOT `api/_lib/`)
- [ ] Relative import path is correct (count `../` properly)
- [ ] Environment validation included
- [ ] Auth token extraction follows standard pattern
- [ ] Supabase client created with proper config
- [ ] All path params extracted from `req.query`
- [ ] All query params extracted from `req.query`
- [ ] Parameters validated before handler call
- [ ] HTTP method routing implemented
- [ ] Success returns appropriate status (200, 201)
- [ ] Error returns appropriate status (400, 401, 403, 500)
- [ ] Try/catch wraps everything
- [ ] Console.error logs errors with endpoint path

---

## Step 3: Validation

### 3.1 Local Testing
- [ ] Run `npm run dev` locally
- [ ] Test endpoint with Postman/curl
- [ ] Verify response format
- [ ] Verify error handling
- [ ] Check LSP for TypeScript errors

### 3.2 Code Review
- [ ] NO business logic in endpoint file
- [ ] Follows EXACT pattern from checklist
- [ ] Consistent with other endpoints
- [ ] No typos in import paths
- [ ] No hardcoded values

---

## Step 4: Documentation

### 4.1 Update Architecture Doc
- [ ] Add endpoint to list in `api/ARCHITECTURE.md`
- [ ] Document HTTP methods supported
- [ ] Document parameters required
- [ ] Add to correct category

### 4.2 Update replit.md (if significant change)
- [ ] Add to recent changes if major feature
- [ ] Update relevant sections

---

## Step 5: Deployment

### 5.1 Pre-Deploy
- [ ] Verify NO LSP errors
- [ ] Verify NO dynamic route conflicts
- [ ] Verify all imports are correct
- [ ] Commit with clear message

### 5.2 Deploy to Vercel
- [ ] Push to repository
- [ ] Wait for Vercel deploy
- [ ] Check build logs for errors
- [ ] Verify no path conflicts in Vercel build

### 5.3 Post-Deploy
- [ ] Test endpoint in production
- [ ] Verify auth works
- [ ] Verify error handling
- [ ] Monitor logs for issues

---

## 🚨 Red Flags - STOP if you see these

1. ⛔ Path conflict warning in Vercel build logs
2. ⛔ Import from `api/_lib/` anywhere
3. ⛔ Business logic in endpoint file (should be in handler)
4. ⛔ Different auth pattern than standard
5. ⛔ No error handling
6. ⛔ LSP TypeScript errors
7. ⛔ Hardcoded credentials or URLs

---

## 📋 Quick Reference

### Dynamic Route Naming
✅ `api/projects/[projectId]/clients/[clientId].ts`  
❌ `api/projects/[id]/clients/[id].ts` (ambiguous)

### Import Paths
✅ `import { x } from "../../lib/handlers/y.js"`  
❌ `import { x } from "../../_lib/handlers/y.js"`

### Parameter Extraction
```typescript
// For /api/projects/123/clients/456?organization_id=789
const projectId = req.query.projectId as string;      // From path
const clientId = req.query.clientId as string;        // From path
const organizationId = req.query.organization_id as string;  // From query
```

---

**Purpose**: This checklist ensures ZERO regressions and ZERO broken deployments.  
**Usage**: Follow EVERY step, EVERY time. No exceptions.  
**Last Updated**: November 14, 2025
