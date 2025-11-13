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

### Dominio 1: **Organization** (4/6 endpoints refactorizados)

**Handlers existentes** ✅:
- `acceptInvitation.ts`
- `rejectInvitation.ts`
- `getOrganizationMembers.ts`
- `getPendingInvitations.ts`

**Endpoints que FALTAN migrar** ❌:
- `/api/invite-member.ts` (130 líneas de lógica)
- `/api/organization-members/[organizationId].ts` (query complejo)

**Estimado**: 2 horas

---

### Dominio 2: **Projects** (0/4 endpoints refactorizados)

**Endpoints actuales** ❌:
- `/api/projects.ts` (100 líneas - crear proyecto)
- `/api/projects/[id].ts` (actualizar proyecto)
- `/api/budgets.ts` (presupuestos)
- `/api/budgets/[id].ts` (presupuesto individual)
- `/api/budget-items.ts` (items de presupuesto)
- `/api/budget-items/[id].ts` (item individual)
- `/api/budget-items/move.ts` (mover items)

**Handlers a crear**:
- `handlers/projects/createProject.ts`
- `handlers/projects/updateProject.ts`
- `handlers/projects/getBudgets.ts`
- `handlers/projects/updateBudget.ts`
- `handlers/projects/getBudgetItems.ts`
- `handlers/projects/updateBudgetItem.ts`
- `handlers/projects/moveBudgetItem.ts`

**Estimado**: 4 horas

---

### Dominio 3: **Contacts** (0/1 endpoint refactorizado)

**Endpoints actuales** ❌:
- `/api/contacts.ts` (138 líneas - query súper complejo con enrichment)

**Handlers a crear**:
- `handlers/contacts/getContacts.ts` (lógica de enrichment)

**Estimado**: 1.5 horas

---

### Dominio 4: **Community** (0/4 endpoints refactorizados)

**Endpoints actuales** ❌:
- `/api/community/stats.ts` (estadísticas globales)
- `/api/community/organizations.ts` (organizaciones públicas)
- `/api/community/projects.ts` (proyectos públicos)
- `/api/community/active-users.ts` (usuarios activos)

**Handlers a crear**:
- `handlers/community/getStats.ts`
- `handlers/community/getOrganizations.ts`
- `handlers/community/getProjects.ts`
- `handlers/community/getActiveUsers.ts`

**Estimado**: 2.5 horas

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

### Dominio 6: **Learning** (0/7 endpoints refactorizados)

**Endpoints actuales** ❌:
- `/api/learning/dashboard.ts`
- `/api/learning/dashboard-fast.ts`
- `/api/learning/courses-full.ts`
- `/api/courses/[id]/progress.ts`
- `/api/lessons/[id]/progress.ts`
- `/api/lessons/[id]/notes.ts`

**Handlers a crear**:
- `handlers/learning/getDashboard.ts`
- `handlers/learning/getCourseFull.ts`
- `handlers/learning/getCourseProgress.ts`
- `handlers/learning/updateLessonProgress.ts`
- `handlers/learning/getLessonNotes.ts`
- `handlers/learning/createNote.ts`

**Estimado**: 3.5 horas

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

### **Fase 6: Learning** (Independiente)

```
✅ 1. Crear 6 handlers en `handlers/learning/`
✅ 2. Actualizar endpoints
✅ 3. Actualizar Express routes
✅ 4. Probar módulo completo
```

**Tiempo estimado**: 3.5 horas  
**Prioridad**: MEDIA

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
- [ ] **Fase 1: Organization** (4/6 endpoints - 66%)
- [ ] **Fase 2: Contacts** (0%)
- [ ] **Fase 3: Community** (0%)
- [ ] **Fase 4: Projects** (0%)
- [ ] **Fase 5: Payments** (0%)
- [ ] **Fase 6: Learning** (0%)
- [x] **Fase 7: Admin** (11/11 endpoints - 100%)
- [ ] **Fase 8: Personnel** (0%)

**Progreso total**: ~25% (15 de ~60 endpoints)

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
**Versión**: 1.1  
**Estado**: Admin domain completamente refactorizado (11 endpoints, 7 handlers consolidados, autenticación unificada)
