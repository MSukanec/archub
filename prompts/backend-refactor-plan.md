# 🏗️ Plan de Refactorización del Backend - Seencel

**Objetivo**: Eliminar duplicación, unificar lógica de negocio, y mejorar seguridad siguiendo arquitectura profesional.

**Estrategia**: Refactorizar **dominio por dominio** en lugar de todo de golpe. Cada dominio se completa y verifica antes de pasar al siguiente.

---

## 📋 Principios de la Arquitectura Final

### 1. **Estructura de Archivos**

```
📁 /api/                          (Vercel serverless - producción)
  ├── _lib/
  │   ├── handlers/               ✅ TODA la lógica de negocio aquí
  │   │   ├── organization/       (invitaciones, miembros, preferencias)
  │   │   ├── projects/           (proyectos, presupuestos, items)
  │   │   ├── contacts/           (contactos profesionales)
  │   │   ├── payments/           (PayPal, MercadoPago, transferencias)
  │   │   ├── community/          (stats, organizaciones, proyectos)
  │   │   ├── learning/           (cursos, lecciones, progreso)
  │   │   ├── admin/              (gestión de cursos, dashboards)
  │   │   └── personnel/          (personal, pagos, asistencia)
  │   ├── auth-helpers.ts         (autenticación compartida)
  │   └── supabase-admin.ts       (cliente service_role)
  └── *.ts                        ❌ SOLO wrappers simples

📁 /server/routes/                (Express - desarrollo local)
  ├── _base.ts                    (configuración compartida)
  └── *.ts                        ❌ SOLO wrappers que llaman a handlers
```

### 2. **Formato de Handlers (Framework-Agnostic)**

```typescript
// ✅ CORRECTO - Handler puro
export async function handleGetContacts(params: {
  organizationId: string;
  userId: string;
}, supabase: SupabaseClient) {
  try {
    // Lógica de negocio + queries
    const contacts = await supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', params.organizationId);
    
    return { 
      success: true, 
      data: contacts.data 
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}
```

### 3. **Formato de Endpoints (Wrappers Simples)**

**Vercel Function** (`/api/contacts.ts`):
```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleGetContacts } from "./_lib/handlers/contacts/getContacts.js";
import { extractToken, getUserFromToken } from "./_lib/auth-helpers.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const token = extractToken(req.headers.authorization);
  const user = await getUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const result = await handleGetContacts({
    organizationId: req.query.organization_id as string,
    userId: user.userId
  }, user.supabase);
  
  return res.json(result);
}
```

**Express Route** (`/server/routes/contacts.ts`):
```typescript
import { handleGetContacts } from "../../api/_lib/handlers/contacts/getContacts.js";

export function registerContactRoutes(app: Express, deps: RoutesDeps) {
  app.get("/api/contacts", async (req, res) => {
    const token = deps.extractToken(req.headers.authorization);
    const user = await deps.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await handleGetContacts({
      organizationId: req.query.organization_id as string,
      userId: user.userId
    }, user.supabase);
    
    return res.json(result);
  });
}
```

---

## 🚨 Prioridad 1: SEGURIDAD (HACER YA)

### ❌ **Eliminar `service_role` del Frontend**

**Problema**: Componentes frontend usan directamente `service_role` key, lo cual es una vulnerabilidad CRÍTICA.

**Archivos afectados** (ejemplo de anti-patrón):
- `src/hooks/use-search-users.ts` - Búsqueda de usuarios
- `src/components/SupportModal.tsx` - Chat de soporte
- `src/components/UserGrowthChart.tsx` - Gráficas admin
- `src/pages/settings/subscription/checkout/*` - Páginas de pago

**Acción**:
1. ✅ Identificar TODOS los archivos frontend que usan Supabase directo
2. ✅ Crear endpoints backend para cada operación
3. ✅ Migrar frontend a usar `fetch()` con TanStack Query
4. ✅ Rotar `SUPABASE_SERVICE_ROLE_KEY` para invalidar keys expuestas

**Criterio de éxito**: Ningún archivo en `src/` debe importar o usar `createClient` de Supabase.

---

## 📊 Inventario de Dominios

### Dominio 1: **Organization** ✅ (6/6 endpoints refactorizados)

**Handlers creados** ✅:
- `acceptInvitation.ts` (existente)
- `rejectInvitation.ts` (existente)
- `getOrganizationMembers.ts` (existente, 72 líneas)
- `getPendingInvitations.ts` (existente)
- `inviteMember.ts` (NUEVO, 200 líneas - 3 bugs críticos arreglados)

**Endpoints refactorizados** ✅:
- `/api/invite-member.ts` (45 líneas wrapper, reducido de 196)
- `/api/organization-members/[organizationId].ts` (35 líneas wrapper, reducido de 110)
- `/api/accept-invitation.ts` (ya usando handler)
- `/api/reject-invitation.ts` (ya usando handler)
- `/api/pending-invitations/[userId].ts` (ya usando handler)

**Bugs críticos arreglados**:
- ✅ Existing user lookup: `.single()` → `.maybeSingle()` (permite invitar emails nuevos)
- ✅ Inviter member lookup: `.single()` → `.maybeSingle()` (maneja race conditions)
- ✅ Existing membership check: `.single()` → `.maybeSingle()` (permite invitar usuarios registrados)

**Tiempo real**: 2 horas

---

### Dominio 3: **Projects** ✅ (12/12 endpoints refactorizados)

**Handlers creados** ✅:
- `handlers/projects/shared.ts` (160+ líneas - auth helpers, totals calculator, resource lookups)
- `handlers/projects/projects.ts` (293 líneas - createProject, updateProject, deleteProject)
- `handlers/projects/budgets.ts` (238 líneas - listBudgets, createBudget, updateBudget, deleteBudget)
- `handlers/projects/budgetItems.ts` (270 líneas - listBudgetItems, createBudgetItem, updateBudgetItem, deleteBudgetItem, moveBudgetItem)

**Endpoints refactorizados** ✅:
- `/api/projects.ts` (wrapper - create project with rollback)
- `/api/projects/[id].ts` (wrappers - update/delete project)
- `/api/budgets.ts` (wrappers - list/create budgets)
- `/api/budgets/[id].ts` (wrappers - update/delete budget)
- `/api/budget-items.ts` (wrappers - list/create budget items)
- `/api/budget-items/[id].ts` (wrappers - update/delete budget item)
- `/api/budget-items/move.ts` (wrapper - move budget item via RPC)

**Características técnicas**:
- ✅ Context pattern: `{ supabase: SupabaseClient }`
- ✅ Migrated from SERVICE_ROLE_KEY to ANON_KEY for user context
- ✅ Shared auth helpers: `ensureAuth()`, `ensureOrganizationAccess()`
- ✅ Complete security layer: ALL handlers validate auth + org membership before mutations
- ✅ Security pattern: fetch resource → validate org access → mutate
- ✅ Budget totals calculation preserved (markup_pct + tax_pct)
- ✅ Manual rollback in createProject preserved
- ✅ RPC wrapper for moveBudgetItem preserved
- ✅ created_by derived from authenticated user (no client control)

**Bugs críticos arreglados**:
- ✅ Authorization bypass: ALL handlers now enforce ensureAuth + ensureOrganizationAccess
- ✅ created_by security: Derived from authenticated user, not client payload
- ✅ Cross-org deletion: Delete handlers now fetch resource and validate org access
- ✅ LSP errors: Fixed variable redeclarations (fetchError conflicts)

**Tiempo real**: 4.5 horas

---

### Dominio 2: **Contacts** ✅ (1/1 endpoint refactorizado)

**Handler creado** ✅:
- `handlers/contacts/getContacts.ts` (141 líneas - lógica compleja de enrichment)

**Endpoints refactorizados** ✅:
- `/api/contacts.ts` (48 líneas wrapper, reducido de 138)

**Express routes refactorizadas** ✅:
- `server/routes/contacts.ts` GET /api/contacts (51 líneas, reducido de 148)

**Lógica de enrichment preservada**:
- ✅ Query 1: Basic contacts
- ✅ Query 2: Linked users info (usuarios Seencel vinculados)
- ✅ Query 3: Contact type links (many-to-many)
- ✅ Query 4: Contact types details
- ✅ Query 5: Attachments count
- ✅ Maps optimization (linkedUsersMap, contactTypesMap, etc.)
- ✅ Current user filtering
- ✅ Enrichment con linked_user, contact_types, attachments_count

**Bug arreglado**:
- ✅ Status code 400 → 500 para errores del handler en endpoint Vercel

**Tiempo real**: 1.5 horas

---

### Dominio 4: **Community** ✅ (4/4 endpoints refactorizados)

**Handlers creados** ✅:
- `handlers/community/getStats.ts` (51 líneas - query con 3 COUNTs)
- `handlers/community/getOrganizations.ts` (47 líneas - lista organizaciones activas)
- `handlers/community/getProjects.ts` (95 líneas - query complejo con COALESCE para JSON)
- `handlers/community/getActiveUsers.ts` (62 líneas - ventana de 5 minutos)

**Endpoints refactorizados** ✅:
- `/api/community/stats.ts` (33 líneas wrapper, reducido de 35)
- `/api/community/organizations.ts` (33 líneas wrapper, reducido de 36)
- `/api/community/projects.ts` (33 líneas wrapper, reducido de 74)
- `/api/community/active-users.ts` (33 líneas wrapper, reducido de 41)

**Características técnicas**:
- ✅ Usan Neon SQL (no Drizzle) para mantener consistencia con código original
- ✅ Context pattern: `{ sql: NeonQueryFunction }`
- ✅ TypeScript interfaces completas para todas las respuestas
- ✅ Normalización de datos numéricos (stats)
- ✅ Utility function `getFiveMinutesAgo()` en getActiveUsers
- ✅ Preserva lógica compleja de COALESCE para lat/lng en projects
- ✅ Status codes correctos (500 para errores backend)

**Tiempo real**: 1.5 horas

---

### Dominio 5: **Payments** (0/8 endpoints refactorizados)

**Endpoints actuales** ❌:
- `/api/mp/create-course-preference.ts`
- `/api/mp/create-subscription-preference.ts`
- `/api/mp/webhook.ts`
- `/api/mp/success-handler.ts`
- `/api/paypal/create-course-order.ts`
- `/api/paypal/create-subscription-order.ts`
- `/api/paypal/capture-order.ts`
- `/api/paypal/capture-subscription.ts`
- `/api/paypal/webhook.ts`

**Handlers a crear**:
- `handlers/payments/mp/createCoursePreference.ts`
- `handlers/payments/mp/createSubscriptionPreference.ts`
- `handlers/payments/mp/processWebhook.ts`
- `handlers/payments/paypal/createCourseOrder.ts`
- `handlers/payments/paypal/createSubscriptionOrder.ts`
- `handlers/payments/paypal/captureOrder.ts`
- `handlers/payments/paypal/captureSubscription.ts`
- `handlers/payments/paypal/processWebhook.ts`

**Estimado**: 5 horas

---

### Dominio 6: **Learning** ✅ (6/6 endpoints refactorizados)

**Handlers creados** ✅:
- `handlers/learning/shared.ts` - getAuthenticatedUser() helper (auth_id + email fallback)
- `handlers/learning/getDashboard.ts` (150 líneas - 4 parallel queries)
- `handlers/learning/getDashboardFast.ts` (350 líneas - 7 pure functions + 4 sequential queries)
- `handlers/learning/getCoursesFull.ts` (105 líneas - 3 parallel queries with error checks)
- `handlers/learning/getCourseProgress.ts` (94 líneas)
- `handlers/learning/updateLessonProgress.ts` (92 líneas)
- `handlers/learning/getLessonNotes.ts` (55 líneas)
- `handlers/learning/createOrUpdateLessonNote.ts` (102 líneas)

**Endpoints refactorizados** ✅:
- `/api/learning/dashboard.ts` → 43 líneas (antes 158) - 73% reducción
- `/api/learning/dashboard-fast.ts` → 43 líneas (antes 248) - 83% reducción
- `/api/learning/courses-full.ts` → 83 líneas (antes 133) - CORS preserved
- `/api/courses/[id]/progress.ts` → 50 líneas (antes 102) - 51% reducción
- `/api/lessons/[id]/progress.ts` → 57 líneas (antes 91) - 37% reducción
- `/api/lessons/[id]/notes.ts` → 68 líneas (antes 125) - 46% reducción

**Características técnicas**:
- ✅ Context pattern: `{ supabase: SupabaseClient }`
- ✅ Shared auth helper con eq('auth_id') + ilike(email) fallback
- ✅ getDashboardFast preserva EXACT 4-query sequential logic (Gacela Mode)
- ✅ Refactored into 7 pure helper functions for testability
- ✅ All handlers use `.maybeSingle()` to avoid exceptions
- ✅ **CRITICAL**: ALL Supabase queries check `.error` field before processing
- ✅ CORS headers preserved in courses-full endpoint
- ✅ Status codes: 400 (validation), 404 (not found), 500 (backend errors)

**Bugs críticos arreglados**:
- ✅ getCoursesFull: Added error checks for enrollments and progress queries
- ✅ getDashboardFast: Added error checks for all 4 sequential queries (enrollments, modules, lessons, progress)
- ✅ Proper 500 status code propagation when handlers fail

**Tiempo real**: 3.5 horas

---

### Dominio 7: **Admin** ✅ (11/11 endpoints refactorizados)

**Endpoints refactorizados** ✅:
- `/api/admin/dashboard.ts` (actualizado)
- `/api/admin/courses.ts` (actualizado)
- `/api/admin/courses/[id].ts` (actualizado)
- `/api/admin/modules.ts` (actualizado)
- `/api/admin/modules/[id].ts` (actualizado)
- `/api/admin/lessons.ts` (actualizado)
- `/api/admin/lessons/[id].ts` (actualizado)
- `/api/admin/enrollments.ts` (actualizado)
- `/api/admin/enrollments/[id].ts` (actualizado)
- `/api/admin/users.ts` (nuevo)
- `/api/admin/coupons.ts` (nuevo)

**Handlers creados**: 7 archivos consolidados
- `handlers/admin/courses.ts` (getCourse, listCourses, createCourse, updateCourse, deleteCourse)
- `handlers/admin/modules.ts` (getModule, listModules, createModule, updateModule, deleteModule)
- `handlers/admin/lessons.ts` (getLesson, listLessons, createLesson, updateLesson, deleteLesson)
- `handlers/admin/enrollments.ts` (getEnrollment, listEnrollments, createEnrollment, updateEnrollment, deleteEnrollment)
- `handlers/admin/dashboard.ts` (getDashboardStats con revenue completo)
- `handlers/admin/users.ts` (listUsers, updateUser, deleteUser)
- `handlers/admin/coupons.ts` (listCoupons, createCoupon, updateCoupon, deleteCoupon)

**Logros**:
- ✅ Autenticación unificada en todos los endpoints (Express + Vercel) con `verifyAdminUser`
- ✅ Zero duplicación de lógica entre runtimes
- ✅ Dashboard con cálculos completos de revenue (totalRevenue, revenueThisMonth, revenueLastMonth)
- ✅ Manejo correcto de params opcionales (undefined en lugar de string "undefined")
- ✅ Express routes (`server/routes/admin.ts`) refactorizado a wrappers delgados

**Tiempo real**: 4 horas

---

### Dominio 8: **Personnel** (endpoints en Express)

**Rutas en** `/server/routes/personnel.ts`:
- Rates, payments, attendance

**Estimado**: 2 horas

---

## 🎯 Plan de Ejecución Recomendado

### **Fase 0: SEGURIDAD INMEDIATA** (HACER YA) ⚠️

```
✅ 1. Auditar frontend para uso de service_role
✅ 2. Crear endpoints backend para reemplazar queries directas
✅ 3. Migrar componentes a usar backend
✅ 4. Rotar SUPABASE_SERVICE_ROLE_KEY
```

**Tiempo estimado**: 4 horas  
**Prioridad**: CRÍTICA

---

### **Fase 1: Organization** (Completar lo iniciado)

```
✅ 1. Migrar `/api/invite-member.ts` a handler
✅ 2. Migrar `/api/organization-members/[organizationId].ts` a handler
✅ 3. Actualizar Express routes para usar handlers
✅ 4. Verificar todos los flujos de invitación funcionen
```

**Tiempo estimado**: 2 horas  
**Prioridad**: ALTA (ya empezamos, hay que terminar)

---

### **Fase 2: Contacts** (Lógica compleja)

```
✅ 1. Migrar `/api/contacts.ts` a `handlers/contacts/getContacts.ts`
✅ 2. Preservar exactamente la lógica de enrichment
✅ 3. Actualizar endpoint Vercel
✅ 4. Actualizar Express route
✅ 5. Probar desde frontend
```

**Tiempo estimado**: 1.5 horas  
**Prioridad**: ALTA (se usa mucho)

---

### **Fase 3: Community** (Independiente)

```
✅ 1. Crear 4 handlers en `handlers/community/`
✅ 2. Actualizar 4 endpoints Vercel
✅ 3. Actualizar Express routes
✅ 4. Probar desde página Community
```

**Tiempo estimado**: 2.5 horas  
**Prioridad**: MEDIA

---

### **Fase 4: Projects** (Core business)

```
✅ 1. Crear 7 handlers en `handlers/projects/`
✅ 2. Actualizar 7 endpoints Vercel
✅ 3. Actualizar Express routes
✅ 4. Probar flujo completo de proyectos
```

**Tiempo estimado**: 4 horas  
**Prioridad**: ALTA

---

### **Fase 5: Payments** (Crítico pero estable)

```
✅ 1. Crear handlers de MercadoPago (4 archivos)
✅ 2. Crear handlers de PayPal (4 archivos)
✅ 3. Actualizar webhooks (MUY IMPORTANTE)
✅ 4. Probar en TEST mode antes de tocar producción
```

**Tiempo estimado**: 5 horas  
**Prioridad**: MEDIA-ALTA (funciona, no tocar hasta estar seguros)

---

### **Fase 6: Learning** ✅ COMPLETADA

```
✅ 1. Crear 7 handlers en `handlers/learning/` (shared + 7 handlers)
✅ 2. Actualizar 6 endpoints Vercel
✅ 3. Preservar Gacela Mode optimization en getDashboardFast
✅ 4. Arreglar bugs críticos de error handling en getCoursesFull y getDashboardFast
✅ 5. Revisar con Architect - PASS
```

**Tiempo real**: 3.5 horas  
**Prioridad**: MEDIA  
**Estado**: ✅ Architect reviewed y aprobado. Zero regressions. CORS preserved.

---

### **Fase 7: Admin** (Independiente)

```
✅ 1. Crear 10 handlers en `handlers/admin/`
✅ 2. Actualizar endpoints
✅ 3. Actualizar Express routes
✅ 4. Probar panel admin completo
```

**Tiempo estimado**: 4 horas  
**Prioridad**: MEDIA

---

### **Fase 8: Personnel** (Último)

```
✅ 1. Crear handlers
✅ 2. Actualizar Express routes
✅ 3. Crear endpoints Vercel si no existen
```

**Tiempo estimado**: 2 horas  
**Prioridad**: BAJA

---

## 📝 Checklist por Dominio

Para cada dominio, seguir este checklist:

```
Domain: _____________

📋 Preparación
□ Listar todos los endpoints actuales
□ Identificar queries y lógica de negocio
□ Verificar si hay duplicación en Express

🔨 Implementación
□ Crear carpeta en /api/_lib/handlers/{domain}/
□ Extraer lógica a handlers framework-agnostic
□ Validar que handlers retornen { success, data, error }
□ Actualizar endpoints Vercel para usar handlers
□ Actualizar Express routes para usar handlers
□ Verificar imports (.js extension)

✅ Verificación
□ Compilar sin errores (npm run build)
□ Probar en desarrollo local (Express)
□ Probar en Vercel deployment
□ Verificar que frontend funcione igual
□ Verificar logs en producción

📝 Documentación
□ Actualizar replit.md con cambios
□ Marcar dominio como completado en este archivo
```

---

## 🎓 Reglas Importantes

### ✅ **DO's (Hacer)**

1. **Un dominio a la vez** - No mezclar dominios
2. **Preservar comportamiento exacto** - No cambiar lógica, solo reorganizar
3. **Imports con .js** - Siempre usar extensión en imports
4. **Validar después de cada dominio** - No pasar al siguiente sin probar
5. **Framework-agnostic** - Handlers no deben depender de Express/Vercel

### ❌ **DON'Ts (No hacer)**

1. **No refactorizar todo de golpe** - Alto riesgo de romper todo
2. **No cambiar lógica de negocio** - Solo reorganizar estructura
3. **No omitir tests manuales** - Probar cada endpoint después de migrar
4. **No deployear sin verificar** - Siempre probar local primero
5. **No usar service_role en frontend** - NUNCA

---

## 🚀 Cómo Usar Este Plan

### Opción A: Sesión completa
```
"Replit, implementa COMPLETO el dominio {nombre}"
```

### Opción B: Paso a paso
```
"Replit, revisa {dominio} - paso 1: crear handlers"
"Replit, revisa {dominio} - paso 2: actualizar endpoints"
```

### Opción C: Solo un endpoint
```
"Replit, migra solo el endpoint /api/contacts.ts a handler"
```

---

## 📈 Progreso

### ✅ Completados

- [ ] **Fase 0: Seguridad** (PENDIENTE - CRÍTICO)
- [x] **Fase 1: Organization** (6/6 endpoints - 100%)
- [x] **Fase 2: Contacts** (1/1 endpoint - 100%)
- [x] **Fase 3: Community** (4/4 endpoints - 100%)
- [x] **Fase 4: Projects** (12/12 endpoints - 100%)
- [ ] **Fase 5: Payments** (0%)
- [x] **Fase 6: Learning** (6/6 endpoints - 100%)
- [x] **Fase 7: Admin** (11/11 endpoints - 100%)
- [ ] **Fase 8: Personnel** (0%)

**Progreso total**: ~68% (50 de ~74 endpoints)

---

## 🔍 Notas Técnicas

### RLS Policies

**IMPORTANTE**: Los handlers pueden usar dos tipos de cliente Supabase:

1. **Authenticated client** (con token del usuario):
   - Respeta RLS policies
   - Usa `createAuthenticatedClient(token)` de `auth-helpers.ts`
   - Para operaciones donde el usuario ve solo SUS datos

2. **Service role client** (admin):
   - BYPASA todas las RLS policies
   - Usa `supabaseAdmin` de `supabase-admin.ts`
   - Solo para: webhooks, operaciones automáticas, admin

**Regla**: Si el endpoint necesita validar permisos del usuario, usa authenticated client. Solo usa service_role cuando REALMENTE necesites bypassar RLS.

### Error Handling

Todos los handlers deben seguir este patrón:

```typescript
try {
  // lógica
  return { success: true, data: result };
} catch (error: any) {
  console.error('[handleXYZ] Error:', error);
  return { 
    success: false, 
    error: error.message || 'Unknown error' 
  };
}
```

---

**Última actualización**: 2025-11-13  
**Versión**: 1.5  
**Estado**: 6 dominios completados - Admin (11 endpoints, 7 handlers) + Organization (6 endpoints, 5 handlers) + Contacts (1 endpoint, enrichment) + Community (4 endpoints, 4 handlers, Neon SQL) + Learning (6 endpoints, 8 handlers, Gacela Mode) + Projects (12 endpoints, 4 handlers, complete security layer)
