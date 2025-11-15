# Backend Architecture - Seencel Express Server

**Stack:** Node.js · Express · Supabase · TypeScript (ES Modules)  
**Objetivo:** Backend estable, escalable y 100% Express (sin serverless)

---

## 📂 1. Estructura Real del Backend

```
server/
  ├── index.ts                      # Punto de entrada - Express server
  ├── routes.ts                     # Registro central de TODAS las rutas
  ├── db.ts                         # Cliente Drizzle ORM
  ├── storage.ts                    # Interfaz de almacenamiento
  │
  ├── routes/                       # Rutas modulares por dominio
  │   ├── _base.ts                  # Tipos compartidos (RouteDeps)
  │   ├── projects.ts               # Rutas de proyectos
  │   ├── learning.ts               # Rutas de capacitaciones
  │   ├── admin.ts                  # Rutas de administración
  │   ├── clients.ts                # Rutas de client roles
  │   ├── contacts.ts               # Rutas de contactos
  │   ├── personnel.ts              # Rutas de personal
  │   ├── support.ts                # Rutas de soporte
  │   ├── subscriptions.ts          # Rutas de suscripciones
  │   ├── billing.ts                # Rutas de facturación
  │   ├── organization.ts           # Rutas de organizaciones
  │   ├── community.ts              # Rutas de comunidad
  │   └── ai.ts                     # Rutas de AI
  │
  ├── controllers/                  # Controladores por dominio
  │   ├── projects/                 # Controladores de proyectos
  │   │   └── projectClients.controller.ts
  │   ├── payments/                 # Controladores de pagos
  │   │   ├── mp.controller.ts
  │   │   └── paypal.controller.ts
  │   ├── learning/                 # Controladores de capacitaciones
  │   │   └── learning.controller.ts
  │   ├── admin/                    # Controladores de admin
  │   │   ├── courses.controller.ts
  │   │   ├── dashboard.controller.ts
  │   │   └── ...
  │   ├── ai/                       # Controladores de AI
  │   │   └── ai.controller.ts
  │   ├── organization/             # Controladores de org
  │   │   └── organization.controller.ts
  │   └── community/                # Controladores de comunidad
  │       └── community.controller.ts
  │
  └── lib/                          # Helpers y lógica compartida
      ├── auth/                     # Autenticación
      │   └── helpers.ts            # extractToken, getUserFromToken
      ├── handlers/                 # ⭐ LÓGICA DE NEGOCIO PRINCIPAL
      │   ├── projects/
      │   │   ├── projectClients.ts
      │   │   └── shared.ts
      │   ├── checkout/             # Pagos (MP & PayPal)
      │   │   ├── mp/
      │   │   ├── paypal/
      │   │   └── shared/
      │   ├── learning/
      │   ├── admin/
      │   ├── ai/
      │   ├── organization/
      │   ├── community/
      │   ├── clients/
      │   └── contacts/
      ├── supabase.ts               # Cliente Supabase
      └── utils.ts                  # Utilidades genéricas
```

---

## 🧱 2. Arquitectura Actual (Post-Migración)

### ⚠️ REALIDAD IMPORTANTE

La arquitectura actual tiene **2 capas de lógica**:

1. **Controllers** (`server/controllers/`) → Capa delgada que:
   - Extrae parámetros de `req`
   - Llama a handlers en `lib/handlers/`
   - Maneja respuestas `res.json()` o errores

2. **Handlers** (`server/lib/handlers/`) → **Lógica de negocio real**:
   - Operaciones de base de datos
   - Validaciones de negocio
   - Transformaciones de datos
   - Reglas de negocio complejas

**Esto se hereda de la migración de Vercel → Express.**  
Los handlers existían en `/api/lib/handlers/` y se movieron a `/server/lib/handlers/`.

---

## 📍 3. Cómo Funcionan las Rutas

### server/routes.ts (Archivo Central)

Registra **TODAS** las rutas del sistema:

```typescript
export function registerRoutes(app: Express) {
  // 1. Rutas de proyectos
  registerProjectRoutes(app, deps);
  
  // 2. Rutas de pagos (MP & PayPal)
  registerPaymentRoutes(app, deps);
  
  // 3. Rutas de capacitaciones
  registerLearningRoutes(app, deps);
  
  // 4. Rutas de admin
  registerAdminRoutes(app, deps);
  
  // 5. Rutas de AI
  registerAIRoutes(app, deps);
  
  // 6. Rutas de organización
  registerOrganizationRoutes(app, deps);
  
  // ... etc
}
```

### Archivos de Rutas Modulares (server/routes/*.ts)

Cada dominio tiene su archivo:

```typescript
// server/routes/projects.ts
export function registerProjectRoutes(app: Express, deps: RouteDeps) {
  app.get("/api/projects/:projectId/clients", async (req, res) => {
    // Llama al controlador
    await getProjectClients(req, res);
  });
  
  app.post("/api/projects/:projectId/clients", async (req, res) => {
    await createProjectClient(req, res);
  });
}
```

---

## 🎮 4. Patrón de Autenticación Estándar

**TODOS** los endpoints usan el mismo patrón:

```typescript
import { extractToken, getUserFromToken } from '../lib/auth/helpers.js';

export async function myEndpoint(req, res) {
  // 1. Extraer token
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: "No authorization token" });
  }
  
  // 2. Obtener usuario autenticado
  const userAuth = await getUserFromToken(token);
  if (!userAuth) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // 3. Usar userAuth.userId, userAuth.supabase
  const { userId, supabase } = userAuth;
  
  // 4. Lógica del endpoint...
}
```

**Helpers disponibles:**
- `extractToken(authHeader)` → Extrae token Bearer
- `getUserFromToken(token)` → Retorna `{ userId, supabase }` o `null`
- `createAuthenticatedClient(token)` → Crea cliente Supabase con token

---

## ✅ 5. Cómo Crear un Nuevo Endpoint

### Ejemplo: Crear endpoint GET /api/materials

**1. Crear handler en `server/lib/handlers/materials/getMaterials.ts`:**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export async function getMaterials(
  ctx: { supabase: SupabaseClient },
  params: { organizationId: string; userId: string }
) {
  const { data, error } = await ctx.supabase
    .from('materials')
    .select('*')
    .eq('organization_id', params.organizationId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}
```

**2. Crear controlador en `server/controllers/materials/materials.controller.ts`:**

```typescript
import { extractToken, getUserFromToken } from '../../lib/auth/helpers.js';
import { getMaterials } from '../../lib/handlers/materials/getMaterials.js';

export async function getMaterialsController(req, res) {
  try {
    const { organization_id } = req.query;
    
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token" });
    }
    
    const userAuth = await getUserFromToken(token);
    if (!userAuth) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const result = await getMaterials(
      { supabase: userAuth.supabase },
      { organizationId: organization_id as string, userId: userAuth.userId }
    );
    
    if (result.success) {
      return res.status(200).json(result.data);
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('[getMaterials] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

**3. Crear archivo de rutas en `server/routes/materials.ts`:**

```typescript
import type { Express } from "express";
import type { RouteDeps } from './_base';
import { getMaterialsController } from '../controllers/materials/materials.controller.js';

export function registerMaterialRoutes(app: Express, deps: RouteDeps) {
  app.get("/api/materials", getMaterialsController);
}
```

**4. Registrar en `server/routes.ts`:**

```typescript
import { registerMaterialRoutes } from './routes/materials.js';

export function registerRoutes(app: Express) {
  // ... otras rutas
  
  // Register material routes
  registerMaterialRoutes(app, deps);
}
```

✅ **¡Listo!** Endpoint funcional.

---

## 🎯 6. Dominios Existentes (9 Dominios Migrados)

| Dominio | Carpetas | Descripción |
|---------|----------|-------------|
| **Projects** | `controllers/projects/`, `lib/handlers/projects/` | Proyectos, clientes de proyectos |
| **Payments (MP)** | `controllers/payments/mp.controller.ts`, `lib/handlers/checkout/mp/` | Mercado Pago checkout |
| **Payments (PayPal)** | `controllers/payments/paypal.controller.ts`, `lib/handlers/checkout/paypal/` | PayPal checkout |
| **Learning** | `controllers/learning/`, `lib/handlers/learning/` | Capacitaciones, cursos |
| **Admin** | `controllers/admin/`, `lib/handlers/admin/` | Panel admin, dashboard |
| **AI** | `controllers/ai/`, `lib/handlers/ai/` | Chat AI, sugerencias |
| **Organization** | `controllers/organization/`, `lib/handlers/organization/` | Miembros, invitaciones |
| **Community** | `controllers/community/`, `lib/handlers/community/` | Mapa comunitario, stats |
| **Subscriptions** | `routes/subscriptions.ts`, `routes/billing.ts` | Suscripciones, facturación |

---

## 🚫 7. Reglas Críticas - NUNCA Romper

### ❌ Prohibido

1. **NO crear carpeta `/api`** → Eliminada completamente
2. **NO importar `@vercel/node`** → Dependencia eliminada
3. **NO poner lógica en `server/index.ts`** → Solo configuración
4. **NO poner lógica en archivos de rutas** → Delegar a controllers
5. **NO duplicar autenticación** → Usar `extractToken` / `getUserFromToken`
6. **NO crear clientes Supabase ad-hoc** → Usar helpers existentes

### ✅ Obligatorio

1. **SIEMPRE** usar helpers de autenticación de `server/lib/auth/helpers.ts`
2. **SIEMPRE** registrar nuevas rutas en `server/routes.ts`
3. **SIEMPRE** seguir patrón: Handler → Controller → Route → Register
4. **SIEMPRE** usar tipos de Express (`Request`, `Response`) - NO Vercel types
5. **SIEMPRE** manejar errores con try/catch y logs descriptivos

---

## 📋 8. Checklist para Nuevos Endpoints

Antes de crear un endpoint, verificar:

- [ ] Handler creado en `server/lib/handlers/<dominio>/`
- [ ] Controller creado en `server/controllers/<dominio>/`
- [ ] Archivo de rutas en `server/routes/<dominio>.ts` o agregado a existente
- [ ] Ruta registrada en `server/routes.ts`
- [ ] Autenticación implementada con `extractToken` / `getUserFromToken`
- [ ] Manejo de errores con try/catch
- [ ] Logs descriptivos agregados
- [ ] Tipos TypeScript correctos (Express, no Vercel)
- [ ] Probado localmente en puerto 5000

---

## 🧠 9. Recordatorios para el Agent

### Al crear funcionalidad nueva:

1. **Buscar primero**: ¿Ya existe handler similar en `lib/handlers/`?
2. **Reutilizar**: Usar patrones existentes en otros dominios
3. **No reinventar**: La autenticación ya está resuelta
4. **Consistencia**: Seguir estructura de otros dominios

### Al debuggear:

1. Revisar logs en consola (Express registra cada request)
2. Verificar que ruta esté registrada en `routes.ts`
3. Confirmar autenticación correcta
4. Revisar que handler retorne formato esperado

### Al refactorizar:

1. NO eliminar handlers existentes sin confirmar no se usan
2. Mantener compatibilidad con frontend (mismo formato de respuesta)
3. Actualizar este documento si cambia arquitectura significativamente

---

## 🎯 10. Objetivo Final

Un backend:

✅ **100% Express** (sin serverless)  
✅ **Ordenado** por dominios claros  
✅ **Consistente** en patrones de auth y estructura  
✅ **Mantenible** con separación clara de responsabilidades  
✅ **Escalable** para agregar nuevos dominios fácilmente  
✅ **Profesional** siguiendo estándares de la industria  

---

📌 **FIN DE ARCHITECTURE.md**
