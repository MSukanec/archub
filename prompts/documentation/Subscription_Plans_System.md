# SISTEMA DE SUSCRIPCIONES Y PLANES - SEENCEL

> **Última Auditoría Completa**: 30 de Noviembre 2025
> **Estado**: PRODUCCIÓN READY
> **Versión del Sistema**: 2.0 (incluye Founders Program, Soft-Lock, y Cron Jobs)

---

## ÍNDICE

1. [Modelo de Datos](#1-modelo-de-datos)
2. [Jerarquía de Planes](#2-jerarquía-de-planes)
3. [Flujos de Usuario](#3-flujos-de-usuario)
4. [Integraciones de Pago](#4-integraciones-de-pago)
5. [Founders Program](#5-founders-program)
6. [Soft-Lock System](#6-soft-lock-system)
7. [Cron Jobs Automatizados](#7-cron-jobs-automatizados)
8. [Endpoints del Sistema](#8-endpoints-del-sistema)
9. [Componentes Frontend](#9-componentes-frontend)
10. [Reporte de Auditoría](#10-reporte-de-auditoría)
11. [Gaps y TODOs](#11-gaps-y-todos)

---

## 1. MODELO DE DATOS

### 1.1 Tabla `plans`

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Free', 'Pro', 'Teams', 'Enterprise'
  slug TEXT UNIQUE NOT NULL,             -- 'free', 'pro', 'teams', 'enterprise'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  monthly_amount DECIMAL(10,2),          -- Precio mensual en USD
  annual_amount DECIMAL(10,2),           -- Precio anual en USD (con descuento)
  max_projects INTEGER DEFAULT -1,       -- -1 = ilimitado
  max_members INTEGER DEFAULT -1,        -- -1 = ilimitado
  max_storage_mb INTEGER DEFAULT 500,
  max_ai_tokens INTEGER DEFAULT 0,
  tier INTEGER NOT NULL,                 -- Nivel jerárquico (1=free, 2=pro, 3=teams, 4=enterprise)
  features JSONB DEFAULT '[]',           -- Lista de features habilitadas
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.2 Tabla `organization_subscriptions`

```sql
CREATE TABLE organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT DEFAULT 'active',          -- 'active', 'trialing', 'cancelled', 'expired', 'pending'
  billing_period TEXT,                   -- 'monthly' o 'annual'
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  payment_gateway TEXT,                  -- 'paypal' o 'mercadopago'
  external_subscription_id TEXT,         -- ID externo del gateway
  scheduled_downgrade_plan_id UUID REFERENCES plans(id),  -- Plan programado para downgrade
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 Tabla `organization_billing_cycles`

```sql
CREATE TABLE organization_billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID REFERENCES organization_subscriptions(id),
  plan_id UUID REFERENCES plans(id),
  billing_period TEXT NOT NULL,          -- 'monthly' o 'annual'
  cycle_start TIMESTAMPTZ NOT NULL,
  cycle_end TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2),                  -- Monto facturado
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  payment_id UUID REFERENCES payments(id),
  billable_members INTEGER DEFAULT 1,    -- Snapshot de miembros al momento
  billed_seats INTEGER DEFAULT 1,        -- Asientos cobrados
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Tabla `organization_member_events`

```sql
CREATE TABLE organization_member_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL,              -- 'joined', 'left', 'upgraded', 'downgraded'
  role TEXT,
  event_date TIMESTAMPTZ DEFAULT now(),
  billing_cycle_id UUID REFERENCES organization_billing_cycles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.5 Tabla `payments` (Universal)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  product_type TEXT NOT NULL,            -- 'subscription' | 'course' | 'one_time'
  product_id TEXT NOT NULL,              -- ID del plan/curso/producto
  gateway TEXT NOT NULL,                 -- 'paypal' | 'mercadopago' | 'bank_transfer'
  gateway_payment_id TEXT,               -- ID único del gateway (para idempotencia)
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',         -- 'pending', 'completed', 'failed', 'refunded'
  metadata JSONB DEFAULT '{}',           -- Datos adicionales (billing_period, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único para prevenir duplicados
CREATE UNIQUE INDEX idx_payments_gateway_unique 
  ON payments(gateway, gateway_payment_id) 
  WHERE gateway_payment_id IS NOT NULL;
```

### 1.6 Tabla `app_settings` (Para Founders Program)

```sql
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Valor crítico para Founders Program:
INSERT INTO app_settings (key, value) 
VALUES ('founder_bonus_course_id', '<UUID_del_curso_bonus>');
```

### 1.7 Campo `organizations.settings` (JSONB)

```sql
-- Columna JSONB en organizations para almacenar configuraciones
ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}';

-- Estructura para Founders:
-- { "is_founder": true, "founder_since": "2025-11-30T12:00:00Z" }
```

### 1.8 Campo `organizations.plan_id` - Referencia Rápida

```sql
-- En la tabla organizations
plan_id UUID  -- Referencia al plan actual (denormalizado para queries rápidas)
```

### 1.9 Campos `is_over_limit` (Soft-Lock)

```sql
-- En projects
ALTER TABLE projects ADD COLUMN is_over_limit BOOLEAN DEFAULT false;

-- En organization_members
ALTER TABLE organization_members ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
```

### 1.10 Tablas de Soporte Cron Jobs

```sql
-- Log de trabajos programados ejecutados
CREATE TABLE system_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  subscription_id UUID REFERENCES organization_subscriptions(id),
  job_type TEXT NOT NULL,                -- 'execute_downgrade', 'apply_limits', etc.
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',         -- 'success', 'error', 'pending'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de notificaciones enviadas (idempotencia)
CREATE TABLE subscription_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id),
  notification_type TEXT NOT NULL,       -- '7_days_before', '3_days_before', '1_day_before', 'expired'
  sent_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. JERARQUÍA DE PLANES

```typescript
const PLAN_HIERARCHY = {
  free: 1,
  pro: 2,
  teams: 3,
  enterprise: 4
} as const;
```

### Límites por Plan

| Plan | max_projects | max_members | max_storage_mb | max_ai_tokens |
|------|-------------|-------------|----------------|---------------|
| Free | 2 | 1 | 500 | 1000 |
| Pro | 25 | -1 (ilimitado) | 5000 | 50000 |
| Teams | -1 (ilimitado) | 999 | 25000 | -1 (ilimitado) |
| Enterprise | -1 | -1 | -1 | -1 |

### Reglas de Cambio de Plan

- **Upgrade**: Solo se puede subir a un plan de nivel superior (requiere pago)
- **Downgrade**: Solo se puede bajar a un plan de nivel inferior (programado)
- **Downgrade programado**: Se guarda en `scheduled_downgrade_plan_id` y se ejecuta automáticamente vía cron job

---

## 3. FLUJOS DE USUARIO

### 3.1 Flujo de Upgrade (Pago)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO EN DASHBOARD                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Usuario va a /settings/pricing-plan                                       │
│ 2. Ve cards de planes (FREE, PRO, TEAMS, ENTERPRISE)                        │
│ 3. Click en "Cambiar a [Plan]"                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SELECCIÓN DE PERÍODO Y MÉTODO DE PAGO                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. Usuario selecciona: Mensual o Anual                                       │
│ 5. Usuario selecciona: PayPal (USD) o Mercado Pago (ARS)                    │
│ 6. Click en "Pagar"                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ PAYPAL (USD)                  │   │ MERCADO PAGO (ARS)             │
├───────────────────────────────┤   ├───────────────────────────────┤
│ POST /api/checkout/paypal/    │   │ POST /api/checkout/mp/         │
│     create-subscription       │   │     create-subscription        │
│                               │   │                                │
│ → Crea orden PayPal           │   │ → Convierte USD→ARS usando     │
│ → Redirige a PayPal           │   │   exchange_rates               │
│                               │   │ → Crea preferencia MP          │
│                               │   │ → Redirige a Mercado Pago      │
└───────────────────────────────┘   └───────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ USUARIO PAGA EN PAYPAL        │   │ USUARIO PAGA EN MP             │
└───────────────────────────────┘   └───────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│ REDIRECT + CAPTURE            │   │ WEBHOOK DE MP                  │
├───────────────────────────────┤   ├───────────────────────────────┤
│ GET /api/paypal/              │   │ POST /api/checkout/mp/webhook  │
│     capture-subscription      │   │                                │
│                               │   │ → Verifica status: 'approved'  │
│ → Captura pago en PayPal      │   │ → Resuelve auth_id → users.id  │
│ → Resuelve auth_id → users.id │   │ → Inserta en payments          │
│ → Inserta en payments         │   │ → Llama upgradeOrganizationPlan│
│ → Llama upgradeOrganizationPlan│   │ → Aplica Founders Program     │
│ → Aplica Founders Program     │   │                                │
│ → Muestra HTML de éxito       │   │                                │
│ → Redirige a /organization/   │   │                                │
│     billing?payment=success   │   │                                │
└───────────────────────────────┘   └───────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ upgradeOrganizationPlan() + applyFoundersProgram()                           │
│ en server/lib/handlers/checkout/shared/subscriptions.ts                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Cancela suscripción anterior (status: 'expired')                         │
│ 2. Calcula expires_at (+1 mes o +1 año)                                     │
│ 3. Inserta nueva suscripción en organization_subscriptions                   │
│ 4. Cuenta billable_members REALES                                            │
│ 5. Para primer pago TEAMS: billed_seats = 1 (solo admin)                    │
│ 6. Inserta billing_cycle con snapshot histórico                              │
│ 7. Actualiza organizations.plan_id                                           │
│ 8. SI billing_period === 'annual' → Aplica Founders Program:                │
│    - Guarda is_founder: true en organizations.settings                      │
│    - Lee founder_bonus_course_id de app_settings                            │
│    - Upsert enrollment con expires_at: null (acceso vitalicio)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Downgrade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO QUIERE BAJAR DE PLAN                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Usuario va a /settings/pricing-plan                                       │
│ 2. Click en "Cambiar a [Plan Inferior]"                                     │
│ 3. Sistema detecta que es un downgrade (targetTier < currentTier)            │
│ 4. Abre DowngradeModal con cálculo de impacto                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DowngradeModal (Frontend)                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Fetch /api/organizations/:id/usage-stats                                 │
│ 2. Calcula impacto: proyectos y miembros que serán bloqueados               │
│ 3. Muestra warning con conteo exacto                                         │
│ 4. Usuario confirma                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/subscriptions/schedule-downgrade                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Validaciones:                                                                │
│ 1. Usuario autenticado ✓                                                    │
│ 2. Usuario es admin de la organización ✓                                    │
│ 3. Plan target existe y está activo ✓                                       │
│ 4. Suscripción activa existe y no está expirada ✓                           │
│ 5. Plan target es diferente al actual ✓                                     │
│ 6. targetTier < currentTier (es un downgrade) ✓                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Acción:                                                                      │
│ → UPDATE organization_subscriptions                                          │
│   SET scheduled_downgrade_plan_id = [target_plan_id]                        │
│                                                                              │
│ Respuesta:                                                                   │
│ "Downgrade a Free programado para 29/12/2025"                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRON JOB: execute-scheduled-downgrades.ts (cada hora)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Cuando expires_at < now():                                                   │
│ 1. Busca suscripciones expiradas con scheduled_downgrade_plan_id            │
│ 2. Llama executeScheduledPlanSwitch()                                        │
│ 3. Crea nueva suscripción con el plan target                                 │
│ 4. Actualiza organizations.plan_id                                           │
│ 5. Llama applyPlanLimits() para soft-lock de recursos excedentes            │
│ 6. Inserta log en system_job_logs                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Cancelación de Downgrade Programado

```
DELETE /api/subscriptions/cancel-scheduled-downgrade

→ Limpia scheduled_downgrade_plan_id = null
→ Usuario mantiene su plan actual al expirar (pero igual expira la suscripción)
```

### 3.4 Cancelación de Suscripción

```
POST /api/subscriptions/:id/cancel

→ Actualiza status = 'cancelled'
→ Establece cancelled_at = now()
→ Mensaje: "Access will remain until expiration date"
```

---

## 4. INTEGRACIONES DE PAGO

### 4.1 PayPal (USD)

**Archivos:**
- `server/lib/handlers/checkout/paypal/createSubscriptionOrder.ts`
- `server/lib/handlers/checkout/paypal/captureSubscriptionOrder.ts`
- `server/lib/handlers/checkout/paypal/processWebhook.ts`

**Flujo:**
1. Frontend envía: `plan_slug`, `organization_id`, `billing_period`
2. Backend obtiene precio de `plans.monthly_amount` o `annual_amount`
3. Crea orden PayPal con `custom_id`: `auth_id|plan_id|organization_id|billing_period`
4. Usuario paga en PayPal
5. Redirect a `/api/paypal/capture-subscription?token=...`
6. Captura orden, resuelve `auth_id` → `users.id`
7. Inserta en `payments` (idempotente)
8. Si es nuevo pago, llama `upgradeOrganizationPlan()` con `userId`
9. Aplica Founders Program si es anual

**Seguridad:**
- Precio SIEMPRE de la base de datos (nunca del cliente)
- `auth_id` extraído de sesión autenticada
- Verificación de admin para la organización
- Idempotencia via `gateway_payment_id`

### 4.2 Mercado Pago (ARS)

**Archivos:**
- `server/lib/handlers/checkout/mp/createSubscriptionPreference.ts`
- `server/lib/handlers/checkout/mp/processWebhook.ts`

**Flujo:**
1. Frontend envía: `plan_slug`, `organization_id`, `billing_period`, `currency: 'ARS'`
2. Backend obtiene precio USD de `plans`
3. Convierte a ARS usando `exchange_rates`
4. Verifica que no exista suscripción activa al mismo plan
5. Crea preferencia MP con metadata
6. Usuario paga en MP
7. Webhook recibe `payment` o `merchant_order`
8. Resuelve `auth_id` → `users.id`
9. Inserta en `payments` (idempotente)
10. Si es nuevo pago, llama `upgradeOrganizationPlan()` con `userId`
11. Aplica Founders Program si es anual

**Conversión USD → ARS:**
```typescript
const { data: exchangeRate } = await supabase
  .from("exchange_rates")
  .select("rate")
  .eq("from_currency", "USD")
  .eq("to_currency", "ARS")
  .eq("is_active", true)
  .single();

unit_price = basePrice * Number(exchangeRate.rate);

// Para cursos: redondeo a entero
unit_price = Math.round(rawArsPrice);
```

**Detalle del Webhook de MercadoPago (`processWebhook.ts`):**

```typescript
// 1. Parsear body del webhook
const body = await parseBody(req);
const type = body?.type || body?.topic;
const finalId = body?.data?.id;

// 2. Si es payment type y está aprobado
if (type === "payment" && finalId) {
  const pay = await getMPPayment(String(finalId));
  const md = extractMetadata(pay);
  
  // 3. CRITICAL: Resolver auth_id → public.users.id
  const { data: userProfile } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", resolvedUserId)
    .maybeSingle();
  
  const publicUserId = userProfile.id;

  // 4. Si es suscripción y está aprobado
  if (pay?.status === "approved" && productType === 'subscription') {
    // 5. Insertar payment (idempotente)
    const subPaymentResult = await insertPayment(supabase, "mercadopago", {
      providerPaymentId: providerPaymentId,
      userId: publicUserId,  // ✅ CRITICAL: Required
      productType: 'subscription',
      organizationId: organizationId,
      productId: resolvedPlanId,
    });

    // 6. IDEMPOTENT: Solo upgrade si payment fue NEWLY inserted
    if (subPaymentResult.inserted && subPaymentResult.paymentId) {
      await upgradeOrganizationPlan(supabase, {
        organizationId: organizationId,
        planId: resolvedPlanId,
        billingPeriod: billingPeriod,
        paymentId: subPaymentResult.paymentId,
        userId: publicUserId,  // ✅ Para Founders Program
      });
      // upgradeOrganizationPlan internamente llama a applyFoundersProgram()
    }
  }
}
```

**Puntos Clave del Webhook:**
- `auth_id` → `users.id` resolución obligatoria (línea 128-145 en processWebhook.ts)
- `userId` pasado a `upgradeOrganizationPlan()` para que Founders Program funcione
- Idempotencia garantizada: `subPaymentResult.inserted` previene duplicados
- Founders Program ejecutado automáticamente dentro de `upgradeOrganizationPlan()`

---

## 5. FOUNDERS PROGRAM

### Descripción
Los suscriptores anuales (PRO o TEAMS) reciben automáticamente:
1. **Status de fundador permanente** guardado en `organizations.settings`
2. **Acceso vitalicio** al curso bonus configurado en `app_settings.founder_bonus_course_id`

### Implementación

**Archivo:** `server/lib/handlers/checkout/shared/subscriptions.ts`

**Función:** `applyFoundersProgram()`

```typescript
async function applyFoundersProgram(
  supabase: SupabaseClient,
  organizationId: string,
  billingPeriod: string,
  userId?: string
): Promise<{
  success: boolean;
  isFounder: boolean;
  courseEnrolled: boolean;
  courseId?: string;
  error?: string;
}> {
  // Solo aplica para suscripciones anuales
  if (billingPeriod !== 'annual') {
    return { success: true, isFounder: false, courseEnrolled: false };
  }

  // 1. Marcar como founder (idempotente)
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', organizationId)
    .single();

  const currentSettings = org?.settings || {};
  
  if (!currentSettings.is_founder) {
    await supabase
      .from('organizations')
      .update({
        settings: {
          ...currentSettings,
          is_founder: true,
          founder_since: new Date().toISOString()
        }
      })
      .eq('id', organizationId);
  }

  // 2. Obtener curso bonus
  const { data: appSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'founder_bonus_course_id')
    .single();

  if (!appSetting?.value || !userId) {
    return { success: true, isFounder: true, courseEnrolled: false };
  }

  // 3. Upsert enrollment con acceso vitalicio
  await supabase
    .from('course_enrollments')
    .upsert({
      user_id: userId,
      course_id: appSetting.value,
      status: 'active',
      enrolled_at: new Date().toISOString(),
      expires_at: null,  // ⚠️ NULL = acceso vitalicio
      access_months: null,
      is_lifetime: true
    }, {
      onConflict: 'user_id,course_id'
    });

  return { 
    success: true, 
    isFounder: true, 
    courseEnrolled: true,
    courseId: appSetting.value 
  };
}
```

### Puntos de Integración

1. **PayPal** (`captureSubscriptionOrder.ts`):
   - Resuelve `auth_id` → `users.id`
   - Pasa `userId` a `upgradeOrganizationPlan()`
   - `upgradeOrganizationPlan()` llama `applyFoundersProgram()`

2. **Mercado Pago** (`processWebhook.ts`):
   - Resuelve `auth_id` → `users.id`
   - Pasa `userId` a `upgradeOrganizationPlan()`
   - `upgradeOrganizationPlan()` llama `applyFoundersProgram()`

### Configuración Requerida

```sql
-- En app_settings, insertar el ID del curso bonus
INSERT INTO app_settings (key, value) 
VALUES ('founder_bonus_course_id', 'UUID-DEL-CURSO-BONUS');
```

---

## 6. SOFT-LOCK SYSTEM

### Descripción
Cuando una organización hace downgrade a un plan con límites más restrictivos, los recursos excedentes se "bloquean suavemente" en lugar de eliminarse.

### Implementación

**Archivo:** `server/lib/handlers/checkout/shared/plan-limits.ts`

**Función:** `applyPlanLimits()`

```typescript
export function getPlanLimits(planName: string): PlanLimits {
  const normalizedName = planName?.toLowerCase() || 'free';
  
  switch (normalizedName) {
    case 'teams':
      return { max_projects: -1, max_members: 999 };
    case 'pro':
      return { max_projects: 25, max_members: -1 };
    case 'free':
    default:
      return { max_projects: 2, max_members: 1 };
  }
}

export async function applyPlanLimits(
  supabase: SupabaseClient,
  organizationId: string,
  newPlanName: string
): Promise<ApplyLimitsResult>
```

### Lógica de Bloqueo

**Para Proyectos:**
1. Obtiene TODOS los proyectos ordenados por `created_at ASC`
2. Los primeros N (según límite) se marcan con `is_over_limit = FALSE`
3. Proyectos N+1 en adelante: `is_over_limit = TRUE`

**Para Miembros:**
1. Prioriza ADMIN/OWNER (siempre activos)
2. Ordena resto por `joined_at ASC` (más antiguos primero)
3. Excedentes: `is_over_limit = TRUE`

### Campos Agregados

```sql
-- En projects
ALTER TABLE projects ADD COLUMN is_over_limit BOOLEAN DEFAULT false;

-- En organization_members
ALTER TABLE organization_members ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
```

### Uso en Frontend

El frontend debe filtrar o mostrar indicadores para recursos con `is_over_limit = TRUE`:

```typescript
// Ejemplo de query con filtro
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('organization_id', orgId)
  .eq('is_over_limit', false);  // Solo proyectos accesibles
```

---

## 7. CRON JOBS AUTOMATIZADOS

### 7.1 Execute Scheduled Downgrades

**Archivo:** `server/cron/jobs/execute-scheduled-downgrades.ts`

**Frecuencia:** Cada hora

**Lógica:**
1. Busca suscripciones donde `expires_at < now()` AND `status = 'active'`
2. Filtra las que tienen `scheduled_downgrade_plan_id` no nulo
3. Para cada una:
   - Llama `executeScheduledPlanSwitch()`
   - Crea nueva suscripción con el plan target
   - Actualiza `organizations.plan_id`
   - Llama `applyPlanLimits()` para soft-lock
   - Inserta log en `system_job_logs`

**Código de Implementación:**
```typescript
export async function runScheduledDowngradesJob(): Promise<DowngradeJobResult> {
  const supabase = createServiceSupabaseClient();
  const now = new Date().toISOString();

  // 1. Buscar suscripciones expiradas con downgrade programado
  const { data: expiredSubscriptions } = await supabase
    .from('organization_subscriptions')
    .select(`
      id, organization_id, plan_id, scheduled_downgrade_plan_id, expires_at,
      organizations!inner (id, name),
      plans!inner (id, name, slug)
    `)
    .eq('status', 'active')
    .lt('expires_at', now)
    .not('scheduled_downgrade_plan_id', 'is', null);

  // 2. Procesar cada suscripción
  for (const subscription of expiredSubscriptions) {
    // 3. Ejecutar el cambio de plan (incluye applyPlanLimits internamente)
    const switchResult = await executeScheduledPlanSwitch(supabase, {
      organizationId: subscription.organization_id,
      oldSubscriptionId: subscription.id,
      newPlanId: subscription.scheduled_downgrade_plan_id!,
      oldPlanId: subscription.plan_id,
    });

    // 4. Registrar en system_job_logs para auditoría
    await supabase.from('system_job_logs').insert({
      organization_id: subscription.organization_id,
      subscription_id: subscription.id,
      job_type: 'execute_downgrade',
      details: {
        from_plan_name: switchResult.details.from_plan_name,
        to_plan_name: switchResult.details.to_plan_name,
        limits_applied: switchResult.limitsApplied,
      },
      status: switchResult.success ? 'success' : 'error',
    });
  }
  return result;
}
```

**`executeScheduledPlanSwitch()` internamente:**
```typescript
// En server/lib/handlers/checkout/shared/subscriptions.ts
export async function executeScheduledPlanSwitch(supabase, params) {
  // 1. Marcar suscripción vieja como expirada
  await supabase.from('organization_subscriptions')
    .update({ status: 'expired' })
    .eq('id', params.oldSubscriptionId);

  // 2. Obtener nombre del plan nuevo
  const { data: newPlan } = await supabase
    .from('plans')
    .select('name')
    .eq('id', params.newPlanId)
    .single();

  // 3. Crear nueva suscripción con el plan downgrade (FREE no expira)
  await supabase.from('organization_subscriptions').insert({
    organization_id: params.organizationId,
    plan_id: params.newPlanId,
    status: 'active',
    billing_period: null,  // FREE no tiene período
    started_at: new Date().toISOString(),
    expires_at: null,      // FREE no expira
  });

  // 4. Actualizar plan en organizations
  await supabase.from('organizations')
    .update({ plan_id: params.newPlanId })
    .eq('id', params.organizationId);

  // 5. ⚠️ CRITICAL: Aplicar soft-lock de recursos excedentes
  const limitsResult = await applyPlanLimits(
    supabase, 
    params.organizationId, 
    newPlan.name  // 'Free', 'Pro', etc.
  );

  return {
    success: true,
    limitsApplied: limitsResult,
    details: { to_plan_name: newPlan.name }
  };
}
```

### 7.2 Subscription Expiry Notifier

**Archivo:** `server/cron/jobs/subscription-expiry-notifier.ts`

**Frecuencia:** Diariamente a las 9:00 AM UTC

**Notificaciones Enviadas:**
- **7 días antes**: "Tu suscripción expira en 7 días"
- **3 días antes**: "Tu suscripción expira en 3 días"
- **1 día antes**: "Tu suscripción expira mañana"
- **ON EXPIRY**: "Tu suscripción ha expirado hoy"

**Lógica:**
1. Busca suscripciones con `expires_at` entre hoy y 7 días
2. Determina tipo de notificación según días restantes
3. Verifica idempotencia en `subscription_notifications_log`
4. Obtiene admins/owners de la organización
5. Envía email via Resend
6. Registra en `subscription_notifications_log`

**Idempotencia:**
- Usa tabla `subscription_notifications_log` con `notification_type`
- No reenvía si ya existe registro para ese tipo

---

## 8. ENDPOINTS DEL SISTEMA

### 8.1 Subscriptions Routes (`server/routes/subscriptions.ts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/subscriptions/current` | Obtiene suscripción activa de la organización |
| POST | `/api/subscriptions/schedule-downgrade` | Programa un downgrade para cuando expire |
| DELETE | `/api/subscriptions/cancel-scheduled-downgrade` | Cancela downgrade programado |
| POST | `/api/subscriptions/:id/cancel` | Cancela suscripción (mantiene acceso hasta expiración) |

### 8.2 Payment Routes (`server/routes/payments.ts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/checkout/paypal/create-subscription` | Crea orden PayPal para suscripción |
| GET | `/api/checkout/paypal/capture-subscription` | Captura pago y activa plan (redirect) |
| POST | `/api/checkout/paypal/webhook` | Webhook PayPal para pagos |
| POST | `/api/checkout/mp/create-subscription` | Crea preferencia MP para suscripción |
| GET | `/api/checkout/mp/success-handler` | Handler de retorno MP |
| POST | `/api/checkout/mp/webhook` | Webhook MP para pagos |

### 8.3 Billing Routes (`server/routes/billing.ts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/billing/next-invoice/:organizationId` | Calcula próxima factura |
| GET | `/api/billing/cycles/:organizationId` | Historial de ciclos de facturación |

### 8.4 Organization Routes (para downgrade impact)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/organizations/:id/usage-stats` | Devuelve conteo de proyectos y miembros |

---

## 9. COMPONENTES FRONTEND

### 9.1 PlanRestricted

**Ubicación:** `src/features/users/components/plans/PlanRestricted.tsx`

**Funcionalidad:**
- Envuelve features que requieren un plan superior
- Usa `usePlanFeatures()` para verificar acceso
- Muestra overlay con candado si no tiene acceso
- Botón "Ver Planes" redirige a pricing

**Props:**
```typescript
interface PlanRestrictedProps {
  feature?: string;          // Feature a validar (ej: 'max_projects')
  current?: number;          // Valor actual (ej: proyectos actuales)
  reason?: "coming_soon" | "general_mode" | string;
  functionName?: string;
  size?: "small" | "large";
  adminBypass?: boolean;     // Admins pueden ver (coming_soon)
  useUpgradeModal?: boolean; // Usar modal en lugar de popover
  modalImage?: string;
  modalTitle?: string;
  modalDescription?: string;
  children: React.ReactNode;
}
```

### 9.2 DowngradeModal

**Ubicación:** `src/features/users/modals/DowngradeModal.tsx`

**Funcionalidad:**
- Muestra impacto del downgrade (recursos a bloquear)
- Fetch a `/api/organizations/:id/usage-stats` para datos reales
- Calcula localmente usando `PLAN_LIMITS`
- Muestra fecha efectiva del cambio
- Lista features que se perderán

**Datos mostrados:**
- Proyectos actuales vs. límite del plan target
- Miembros actuales vs. límite del plan target
- Recursos que serán bloqueados (no eliminados)

### 9.3 PricingContent

**Ubicación:** `src/features/shared-content/pricing/PricingContent.tsx`

**Funcionalidad:**
- Detecta si el cambio es upgrade o downgrade
- Para downgrade, abre `DowngradeModal` en vez de checkout
- Soporta modo `public` (landing) y `dashboard` (autenticado)
- Configurable con período (monthly/annual) y gateway (paypal/mp)

### 9.4 PlanCard

**Ubicación:** `src/features/shared-content/pricing/components/PlanCard.tsx`

**Funcionalidad:**
- Muestra información del plan con icono y color
- Badge "Próximamente" para TEAMS (morado, esquina superior derecha)
- Indicador de plan actual
- Botón de acción contextual (upgrade/downgrade/current)

---

## 10. REPORTE DE AUDITORÍA

### ✅ CUMPLIMIENTO DE ARQUITECTURA

| Regla | Estado | Evidencia |
|-------|--------|-----------|
| Todo por backend | ✅ | Todos los endpoints usan `server/routes/*.ts` |
| Frontend usa auth_id, backend resuelve | ✅ | `captureSubscriptionOrder.ts:129-147`, `processWebhook.ts` |
| No queries directas a Supabase en frontend | ✅ | Todo pasa por handlers del servidor |
| Arquitectura modular | ✅ | Handlers separados en `server/lib/handlers/checkout/` |
| Idempotencia en pagos | ✅ | Índice único `idx_payments_gateway_unique` |
| Precios desde DB (no cliente) | ✅ | `createSubscriptionPreference.ts:109-121` |
| Verificación de admin | ✅ | `verifyAdminRoleForOrganization()` en cada handler |

### ✅ FUNCIONALIDADES IMPLEMENTADAS

| Feature | Estado | Archivo |
|---------|--------|---------|
| Upgrade a plan superior | ✅ | PayPal + MP handlers |
| Downgrade programado | ✅ | `schedule-downgrade` endpoint |
| Ejecución automática de downgrades | ✅ | `execute-scheduled-downgrades.ts` |
| Soft-lock de recursos excedentes | ✅ | `plan-limits.ts` |
| Notificaciones de expiración | ✅ | `subscription-expiry-notifier.ts` |
| Founders Program | ✅ | `subscriptions.ts:applyFoundersProgram()` |
| Multi-moneda (USD/ARS) | ✅ | `exchange_rates` + conversión |
| Historial de facturación | ✅ | `organization_billing_cycles` |
| Tracking de miembros billable | ✅ | `organization_member_events` |
| Restricción de features por plan | ✅ | `PlanRestricted` component |
| Cálculo de impacto pre-downgrade | ✅ | `DowngradeModal.tsx` |

### ⚠️ ITEMS MENORES DETECTADOS

1. **LSP Error en DowngradeModal.tsx (línea 402)**:
   - Prop `isRightDisabled` no existe en `ModalFooterProps`
   - Severidad: BAJA (error de tipado, no afecta funcionalidad)
   - Fix: Cambiar a `disabled` o prop correcta

2. **Redondeo de precios ARS**:
   - Cursos usan `Math.round()` ✅
   - Suscripciones NO redondean (pueden tener decimales) ⚠️
   - Recomendación: Agregar `Math.round()` en `createSubscriptionPreference.ts:127`

---

## 11. GAPS Y TODOS

### ⚠️ GAP 1: MANEJO DE FALLAS DE PAGO
```
ESTADO ACTUAL:
- Webhooks tienen reintentos a nivel de gateway
- No hay dead letter queue implementada

TODO PARA PRODUCCIÓN:
1. Agregar tabla: webhook_failures para logging
2. Implementar reintento con backoff exponencial
3. Alertas a admin después de N fallos
```

### ⚠️ GAP 2: RENOVACIÓN AUTOMÁTICA
```
ESTADO ACTUAL:
- Intencionalmente manual (usuario debe pagar de nuevo)
- Notificaciones advierten de expiración

NOTA:
- Este diseño es intencional para evitar cargos automáticos
- Las notificaciones (7, 3, 1 días) compensan
- TODO: Mostrar banner en dashboard cuando expira pronto
```

### ⚠️ GAP 3: VALIDACIÓN PRE-DOWNGRADE BACKEND
```
ESTADO ACTUAL:
- Frontend calcula impacto localmente en DowngradeModal
- No hay endpoint dedicado para validación

RECOMENDACIÓN:
- Crear GET /api/subscriptions/downgrade-impact
- Devuelve: proyectos a bloquear, miembros a bloquear
- Validación más robusta en servidor
```

### ✅ GAPS RESUELTOS (30-11-2025)

1. ✅ **Downgrade Automático**: Cron job cada hora
2. ✅ **Soft-Lock System**: `is_over_limit` en projects y members
3. ✅ **Notificaciones de Expiración**: Emails diarios con idempotencia
4. ✅ **Founders Program**: Acceso vitalicio a curso bonus
5. ✅ **Cálculo de Impacto**: DowngradeModal con fetch a usage-stats

---

## ARCHIVOS CLAVE DEL SISTEMA

```
server/lib/handlers/checkout/
├── shared/
│   ├── subscriptions.ts       # upgradeOrganizationPlan, applyFoundersProgram
│   ├── plan-limits.ts         # applyPlanLimits, getPlanLimits
│   ├── auth.ts                # getAuthenticatedClient
│   ├── permissions.ts         # verifyAdminRoleForOrganization
│   └── pricing.ts             # getPlanPrice
├── paypal/
│   ├── createSubscriptionOrder.ts
│   ├── captureSubscriptionOrder.ts
│   └── processWebhook.ts
└── mp/
    ├── createSubscriptionPreference.ts
    ├── processWebhook.ts
    └── api.ts

server/cron/jobs/
├── execute-scheduled-downgrades.ts
└── subscription-expiry-notifier.ts

src/features/shared-content/pricing/
├── PricingContent.tsx
├── components/
│   └── PlanCard.tsx
└── data/
    └── plans-config.ts

src/features/users/
├── modals/
│   └── DowngradeModal.tsx
└── components/plans/
    └── PlanRestricted.tsx
```

---

## DIAGRAMA DE DEPENDENCIAS

```
                    ┌─────────────────────┐
                    │  Frontend (React)   │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │ PricingContent│    │DowngradeModal│    │PlanRestricted│
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────────────────────────────────────────────┐
    │           Express Routes (server/routes/)            │
    └─────────────────────────┬───────────────────────────┘
                              │
    ┌─────────────────────────┼───────────────────────────┐
    │                         │                           │
    ▼                         ▼                           ▼
┌─────────────┐       ┌─────────────┐            ┌─────────────┐
│   PayPal    │       │    MP       │            │ Subscriptions│
│  Handlers   │       │  Handlers   │            │   Handlers   │
└──────┬──────┘       └──────┬──────┘            └──────┬──────┘
       │                     │                          │
       └──────────┬──────────┘                          │
                  ▼                                     │
    ┌─────────────────────────┐                         │
    │  upgradeOrganizationPlan │◄───────────────────────┘
    └─────────────┬───────────┘
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌───────────┐
│Founders│  │Plan Limits│  │ Billing   │
│Program │  │ Soft-Lock │  │  Cycles   │
└────────┘  └──────────┘  └───────────┘
                  │
                  ▼
    ┌─────────────────────────┐
    │    Cron Jobs (node-cron) │
    ├─────────────────────────┤
    │ • execute-downgrades    │
    │ • expiry-notifier       │
    └─────────────────────────┘
```

---

> **Nota**: Este documento debe actualizarse cada vez que se modifique la lógica de suscripciones, pagos, o planes.
