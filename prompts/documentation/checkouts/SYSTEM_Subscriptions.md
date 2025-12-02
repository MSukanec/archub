# SISTEMA DE SUSCRIPCIONES Y PLANES - SEENCEL

> **Última Actualización**: 2 de Diciembre 2025
> **Estado**: PRODUCCIÓN READY
> **Versión**: 3.0 (Sistema Agnóstico + Seat Billing)

---

## ÍNDICE

1. [Modelo de Datos](#1-modelo-de-datos)
2. [Jerarquía de Planes](#2-jerarquía-de-planes)
3. [Flujos de Usuario](#3-flujos-de-usuario)
4. [Sistema de Proration](#4-sistema-de-proration)
5. [Seat-Based Billing (TEAMS)](#5-seat-based-billing-teams)
6. [Founders Program](#6-founders-program)
7. [Soft-Lock System](#7-soft-lock-system)
8. [Cron Jobs Automatizados](#8-cron-jobs-automatizados)
9. [Endpoints del Sistema](#9-endpoints-del-sistema)
10. [Componentes Frontend](#10-componentes-frontend)
11. [Archivos de Pago por Gateway](#11-archivos-de-pago-por-gateway)

---

## 1. MODELO DE DATOS

### 1.1 Tabla `plans`

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Free', 'Pro', 'Teams', 'Enterprise'
  slug TEXT,                             -- 'free', 'pro', 'teams', 'enterprise'
  features JSONB,                        -- Límites en JSON (ÚNICA FUENTE DE VERDAD)
  billing_type TEXT DEFAULT 'per_user',  -- Modelo de facturación
  is_active BOOLEAN DEFAULT true,
  monthly_amount NUMERIC,                -- Precio mensual en USD
  annual_amount NUMERIC,                 -- Precio anual en USD
  
  -- IDs de PayPal (para suscripciones recurrentes)
  paypal_product_id TEXT,
  paypal_plan_monthly_id TEXT,
  paypal_plan_annual_id TEXT,
  
  -- IDs de MercadoPago (para suscripciones recurrentes)
  mp_plan_monthly_id TEXT,
  mp_plan_annual_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ESTRUCTURA DE FEATURES JSON:
-- {
--   "max_projects": 25,        -- -1 = ilimitado
--   "max_members": -1,         -- -1 = ilimitado
--   "max_storage_mb": 5000,
--   "max_ai_tokens": 50000,
--   "custom_project_color": true,
--   ... otras features
-- }
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
  external_subscription_id TEXT,         -- ID externo del gateway (legacy)
  provider_subscription_id TEXT,         -- ID del gateway para renovaciones automáticas
  scheduled_downgrade_plan_id UUID REFERENCES plans(id),
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
  billing_period TEXT NOT NULL,
  cycle_start TIMESTAMPTZ NOT NULL,
  cycle_end TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending',
  payment_id UUID REFERENCES payments(id),
  billable_members INTEGER DEFAULT 1,    -- Snapshot de miembros al momento
  billed_seats INTEGER DEFAULT 1,        -- Asientos cobrados
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 Tabla `payments` (Universal)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  product_type TEXT NOT NULL,            -- 'subscription' | 'subscription_upgrade' | 'seat' | 'course'
  product_id TEXT NOT NULL,              -- ID del plan/curso
  gateway TEXT NOT NULL,                 -- 'paypal' | 'mercadopago' | 'bank_transfer'
  gateway_payment_id TEXT,               -- ID único del gateway (idempotencia)
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice único para prevenir duplicados
CREATE UNIQUE INDEX idx_payments_gateway_unique 
  ON payments(gateway, gateway_payment_id) 
  WHERE gateway_payment_id IS NOT NULL;
```

### 1.5 Tabla `organization_member_events`

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

### 1.6 Campo `organizations.settings` (JSONB)

```sql
ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}';

-- Estructura para Founders:
-- { "is_founder": true, "founder_since": "2025-11-30T12:00:00Z" }
```

### 1.7 Campos `is_over_limit` (Soft-Lock)

```sql
ALTER TABLE projects ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
ALTER TABLE organization_members ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
```

### 1.8 Tablas de Soporte

```sql
-- Log de trabajos programados
CREATE TABLE system_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  subscription_id UUID REFERENCES organization_subscriptions(id),
  job_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de notificaciones de expiración
CREATE TABLE subscription_notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id),
  notification_type TEXT NOT NULL,       -- '7_days_before', '3_days_before', '1_day_before', 'expired'
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla auxiliar para MercadoPago (límite 64 chars en external_reference)
CREATE TABLE mp_subscription_preferences (
  id TEXT PRIMARY KEY,                   -- "mps_xxx" o "mpu_xxx"
  preapproval_id TEXT,
  user_id UUID NOT NULL,                 -- auth_id de Supabase
  organization_id UUID NOT NULL,
  plan_id UUID,
  plan_slug TEXT NOT NULL,
  billing_period TEXT NOT NULL,
  amount_ars NUMERIC,
  is_upgrade BOOLEAN DEFAULT FALSE,
  previous_subscription_id UUID,
  proration_credit NUMERIC,
  product_type TEXT,
  preference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
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

> **CRÍTICO**: Los límites se leen SIEMPRE del JSON `features` en la tabla `plans`.
> **NUNCA** hardcodear valores. El JSON es la ÚNICA fuente de verdad.

```typescript
// Lectura correcta de límites
const features = plan.features || {};
const maxProjects = features.max_projects ?? 2;
const maxMembers = features.max_members ?? 1;
const maxStorageMb = features.max_storage_mb ?? 500;
```

### Reglas de Cambio de Plan

| Acción | Condición | Comportamiento |
|--------|-----------|----------------|
| **Upgrade** | `targetTier > currentTier` | Pago inmediato, activación inmediata |
| **Downgrade** | `targetTier < currentTier` | Programado para fin del ciclo actual |
| **Cancelación** | Usuario solicita | Mantiene acceso hasta `expires_at` |

---

## 3. FLUJOS DE USUARIO

### 3.1 Flujo de Upgrade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO EN /settings/pricing-plan                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Ve cards de planes (FREE, PRO, TEAMS, ENTERPRISE)                        │
│ 2. Click en "Cambiar a [Plan]"                                              │
│ 3. Sistema detecta upgrade (targetTier > currentTier)                       │
│ 4. Abre UpgradeModal con cálculo de proration                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SELECCIÓN DE PERÍODO Y MÉTODO DE PAGO                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Usuario selecciona: Mensual o Anual                                       │
│ 2. Usuario selecciona: PayPal (USD) o Mercado Pago (ARS)                    │
│ 3. Sistema calcula proration si hay suscripción activa                      │
│ 4. Click en "Pagar"                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          [VER: Payment_Subscription_PayPal.md]   [VER: Payment_Subscription_MercadoPago.md]
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
│ 8. SI billing_period === 'annual' → Aplica Founders Program                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Downgrade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO QUIERE BAJAR DE PLAN                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Click en "Cambiar a [Plan Inferior]"                                     │
│ 2. Sistema detecta downgrade (targetTier < currentTier)                      │
│ 3. Abre DowngradeModal con cálculo de impacto                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ DowngradeModal                                                               │
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
│ → UPDATE organization_subscriptions                                          │
│   SET scheduled_downgrade_plan_id = [target_plan_id]                        │
│                                                                              │
│ Respuesta: "Downgrade a Free programado para 29/12/2025"                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ CRON JOB: execute-scheduled-downgrades.ts (cada hora)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Cuando expires_at < now():                                                   │
│ 1. Busca suscripciones expiradas con scheduled_downgrade_plan_id            │
│ 2. Crea nueva suscripción con el plan target                                 │
│ 3. Actualiza organizations.plan_id                                           │
│ 4. Llama applyPlanLimits() para soft-lock                                    │
│ 5. Suspende enrollments del curso bonus si baja a FREE                      │
│ 6. Inserta log en system_job_logs                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Cancelación de Suscripción

```
POST /api/subscriptions/:id/cancel

→ Actualiza status = 'cancelled'
→ Establece cancelled_at = now()
→ Mensaje: "Mantendrá acceso hasta la fecha de expiración"
```

### 3.4 Cancelación de Downgrade Programado

```
DELETE /api/subscriptions/cancel-scheduled-downgrade

→ Limpia scheduled_downgrade_plan_id = null
→ Usuario mantiene su plan actual
```

---

## 4. SISTEMA DE PRORATION

### Cálculo de Crédito

```typescript
// server/lib/handlers/checkout/shared/proration.ts

export async function calculateProration(supabase, params) {
  const { organizationId, targetPlanSlug, billingPeriod } = params;
  
  // 1. Obtener suscripción actual
  const currentSub = await getCurrentSubscription(supabase, organizationId);
  
  // 2. Calcular días restantes
  const daysRemaining = differenceInDays(
    new Date(currentSub.expires_at), 
    new Date()
  );
  const totalDays = currentSub.billing_period === 'monthly' ? 30 : 365;
  const percentageRemaining = daysRemaining / totalDays;
  
  // 3. Calcular crédito
  const currentPlanPrice = getCurrentPlanPrice(currentSub);
  const creditAmount = currentPlanPrice * percentageRemaining;
  
  // 4. Precio final
  const targetPlanPrice = getTargetPlanPrice(targetPlan, billingPeriod);
  const finalPrice = Math.max(0, targetPlanPrice - creditAmount);
  
  return {
    hasActiveSubscription: true,
    currentPlan: currentSub.plans.name,
    targetPlan: targetPlan.name,
    credit: { daysRemaining, creditAmount },
    finalPrice: { usd: finalPriceUSD, ars: finalPriceARS },
  };
}
```

### Limitaciones por Gateway

| Gateway | Proration Soportado | Notas |
|---------|---------------------|-------|
| **MercadoPago** | ✅ SÍ | Hybrid: pago único por diferencia + suscripción diferida |
| **PayPal** | ⚠️ Limitado | Requiere reconstruir planes con TRIAL + REGULAR cycles |

---

## 5. SEAT-BASED BILLING (TEAMS)

### Flujo de Agregar Miembro

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN AGREGA NUEVO MIEMBRO A TEAMS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Click en "Invitar miembro"                                               │
│ 2. Sistema calcula cobro prorrateado del nuevo seat                         │
│ 3. Muestra modal con breakdown de costos                                     │
│ 4. Admin confirma y paga                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/checkout/calculate-seat-proration                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Entrada: { organization_id }                                                 │
│                                                                              │
│ Cálculo:                                                                     │
│ - Días restantes del ciclo actual                                           │
│ - Precio por seat = plan.monthly_amount o plan.annual_amount                │
│ - Cobro prorrateado = (días_restantes / días_totales) × precio_seat         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ POST /api/checkout/mp/create-seat                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Crea preference de pago único por el seat prorrateado                    │
│ 2. Almacena datos en mp_subscription_preferences (prefix: mps_seat_)        │
│ 3. Retorna init_point para checkout                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ GET /api/checkout/mp/seat-success (después del pago)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Verifica pago con MercadoPago                                             │
│ 2. Crea registro en payments (product_type: 'seat')                         │
│ 3. Actualiza transaction_amount de la suscripción recurrente                │
│ 4. Crea invitación para el nuevo miembro                                     │
│ 5. Redirige a /organization/members?payment=success                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Actualización de Suscripción Recurrente

Después del pago del seat, se actualiza el monto de la suscripción recurrente:

```typescript
// server/lib/handlers/checkout/mp/updateSeatSubscription.ts

export async function updateSeatSubscription(supabase, params) {
  const { subscriptionId, newSeatCount } = params;
  
  // 1. Obtener suscripción actual de MercadoPago
  const mpSub = await getMPPreapproval(subscriptionId);
  
  // 2. Calcular nuevo monto (IMPORTANTE: usar transaction_amount actual)
  const currentAmountPerSeat = mpSub.auto_recurring.transaction_amount / (newSeatCount - 1);
  const newAmount = currentAmountPerSeat * newSeatCount;
  
  // 3. Actualizar en MercadoPago
  await updateMPPreapproval(subscriptionId, {
    auto_recurring: {
      ...mpSub.auto_recurring,
      transaction_amount: newAmount
    }
  });
}
```

### Eliminación de Miembros

```typescript
// server/lib/handlers/organization/removeMember.ts

// Verificaciones:
// 1. Usuario que remueve debe ser Admin/Owner (isPrivilegedRole)
// 2. No se puede eliminar al último admin
// 3. Soft-delete del miembro
// 4. Suspende enrollment del curso bonus si aplica

// El monto de la suscripción NO se reduce inmediatamente
// Se ajusta en la próxima renovación
```

### Abandono Voluntario

```typescript
// POST /api/organizations/:id/leave

// Verificaciones:
// 1. El Owner NO puede abandonar (debe transferir ownership primero)
// 2. Soft-delete del miembro
// 3. Suspende enrollment del curso bonus
```

---

## 6. FOUNDERS PROGRAM

### Activación Automática

Se activa automáticamente cuando un usuario paga una suscripción **anual** de PRO, TEAMS o ENTERPRISE:

```typescript
// server/lib/handlers/checkout/shared/subscriptions.ts

async function applyFoundersProgram(supabase, organizationId, billingPeriod) {
  if (billingPeriod !== 'annual') return;
  
  // 1. Marcar organización como founder
  await supabase
    .from('organizations')
    .update({ 
      settings: { is_founder: true, founder_since: new Date().toISOString() }
    })
    .eq('id', organizationId);
  
  // 2. Obtener curso bonus de app_settings
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'founder_bonus_course_id')
    .single();
  
  if (!setting?.value) return;
  
  // 3. Crear enrollments vitalicios para todos los miembros
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);
  
  for (const member of members) {
    await supabase
      .from('course_enrollments')
      .upsert({
        user_id: member.user_id,
        course_id: setting.value,
        status: 'active',
        expires_at: null,  // Vitalicio
      });
  }
}
```

### Gestión de Acceso al Curso Bonus

| Evento | Acción |
|--------|--------|
| Org downgrades a FREE | Suspender enrollments (no eliminar) |
| Org upgrades a paid | Reactivar enrollments |
| Miembro removido | Suspender su enrollment |
| Miembro reingresa | Reactivar su enrollment |

---

## 7. SOFT-LOCK SYSTEM

### Campos de Control

```sql
projects.is_over_limit BOOLEAN DEFAULT false
organization_members.is_over_limit BOOLEAN DEFAULT false
```

### Aplicación de Límites

```typescript
// server/lib/handlers/checkout/shared/plan-limits.ts

export async function applyPlanLimits(supabase, organizationId, planId) {
  const plan = await getPlan(supabase, planId);
  const features = plan.features || {};
  
  // 1. Soft-lock proyectos excedentes (más antiguos primero)
  if (features.max_projects > 0) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });
    
    const overLimit = projects.slice(features.max_projects);
    for (const project of overLimit) {
      await supabase
        .from('projects')
        .update({ is_over_limit: true })
        .eq('id', project.id);
    }
  }
  
  // 2. Soft-lock miembros excedentes (admins protegidos)
  if (features.max_members > 0) {
    // Lógica similar, protegiendo admins
  }
}
```

### Comportamiento UI

- Recursos con `is_over_limit: true` se muestran con badge "Bloqueado"
- No se pueden editar, pero SÍ se pueden visualizar
- Al hacer upgrade, se desbloquean automáticamente

---

## 8. CRON JOBS AUTOMATIZADOS

### execute-scheduled-downgrades.ts (Cada hora)

```typescript
// Procesa dos tipos de suscripciones expiradas:
// 1. Con scheduled_downgrade_plan_id → ejecuta el downgrade programado
// 2. Sin scheduled_downgrade → mueve a FREE

async function executeScheduledDowngrades() {
  // 1. Buscar suscripciones expiradas
  const { data: expiredSubs } = await supabase
    .from('organization_subscriptions')
    .select('*')
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());
  
  for (const sub of expiredSubs) {
    if (sub.scheduled_downgrade_plan_id) {
      // Ejecutar downgrade programado
      await executeScheduledPlanSwitch(supabase, sub);
    } else {
      // Mover a FREE
      await downgradeToFree(supabase, sub);
    }
    
    // Aplicar límites del nuevo plan
    await applyPlanLimits(supabase, sub.organization_id, newPlanId);
    
    // Suspender enrollments bonus si baja a FREE
    if (isFreePlan(newPlanId)) {
      await suspendBonusCourseEnrollments(supabase, sub.organization_id);
    }
  }
}
```

### send-expiry-notifications.ts (Diario)

```typescript
// Envía notificaciones multi-destinatario antes de expiración

const NOTIFICATION_DAYS = [7, 3, 1, 0]; // Días antes de expirar

async function sendExpiryNotifications() {
  for (const days of NOTIFICATION_DAYS) {
    const targetDate = addDays(new Date(), days);
    
    const { data: subs } = await supabase
      .from('organization_subscriptions')
      .select('*, organizations(name, members:organization_members(user:users(email)))')
      .eq('status', 'active')
      .gte('expires_at', startOfDay(targetDate))
      .lt('expires_at', endOfDay(targetDate));
    
    for (const sub of subs) {
      // Verificar idempotencia
      const { data: existing } = await supabase
        .from('subscription_notifications_log')
        .select('id')
        .eq('subscription_id', sub.id)
        .eq('notification_type', `${days}_days_before`)
        .maybeSingle();
      
      if (existing) continue;
      
      // Enviar emails a todos los admins
      await sendExpiryEmail(sub, days);
      
      // Registrar en log
      await supabase
        .from('subscription_notifications_log')
        .insert({
          subscription_id: sub.id,
          notification_type: `${days}_days_before`
        });
    }
  }
}
```

---

## 9. ENDPOINTS DEL SISTEMA

### Suscripciones (Agnósticos)

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/subscriptions/current` | GET | Suscripción activa de la org |
| `/api/subscriptions/schedule-downgrade` | POST | Programa downgrade |
| `/api/subscriptions/cancel-scheduled-downgrade` | DELETE | Cancela downgrade programado |
| `/api/subscriptions/:id/cancel` | POST | Cancela suscripción |
| `/api/checkout/calculate-proration` | POST | Calcula proration para upgrade |
| `/api/checkout/calculate-seat-proration` | POST | Calcula proration para nuevo seat |

### Organizaciones

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/organizations/:id/usage-stats` | GET | Estadísticas de uso actual |
| `/api/organizations/:id/members` | GET | Lista de miembros |
| `/api/organizations/:id/members/:memberId` | DELETE | Elimina miembro |
| `/api/organizations/:id/leave` | POST | Abandono voluntario |

### Admin

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/admin/paypal/sync-plans` | POST | Sincroniza planes con PayPal |
| `/api/admin/mp/sync-plans` | POST | Sincroniza planes con MercadoPago |

---

## 10. COMPONENTES FRONTEND

### Modals

| Componente | Ubicación | Propósito |
|------------|-----------|-----------|
| `UpgradeModal` | `src/features/users/modals/` | Muestra proration y confirma upgrade |
| `DowngradeModal` | `src/features/users/modals/` | Muestra impacto y confirma downgrade |
| `MemberFormModal` | `src/features/organization/modals/` | Invitar miembro (con cobro de seat) |

### Páginas

| Página | Ruta | Propósito |
|--------|------|-----------|
| `PricingPlan` | `/settings/pricing-plan` | Selección de plan |
| `Billing` | `/organization/billing` | Historial de pagos |
| `SubscriptionCheckout` | `/subscription/checkout` | Checkout de suscripción |
| `Members` | `/organization/members` | Gestión de miembros |

### Hooks

| Hook | Archivo | Propósito |
|------|---------|-----------|
| `useOrganization` | `use-organization.ts` | Datos de org actual |
| `useSubscription` | `use-subscription.ts` | Suscripción activa |
| `usePlanLimits` | `use-plan-limits.ts` | Límites del plan actual |

---

## 11. ARCHIVOS DE PAGO POR GATEWAY

Para los flujos específicos de cada gateway, consultar:

| Gateway | Suscripciones | Cursos |
|---------|---------------|--------|
| **PayPal** | [Payment_Subscription_PayPal.md](./Payment_Subscription_PayPal.md) | [Payment_Course_PayPal.md](./Payment_Course_PayPal.md) |
| **MercadoPago** | [Payment_Subscription_MercadoPago.md](./Payment_Subscription_MercadoPago.md) | [Payment_Course_MercadoPago.md](./Payment_Course_MercadoPago.md) |

### Archivos Compartidos (Agnósticos)

```
server/lib/handlers/checkout/shared/
├── subscriptions.ts      # upgradeOrganizationPlan, applyFoundersProgram
├── proration.ts          # calculateProration
├── seat-proration.ts     # calculateSeatProration
├── payments.ts           # insertPayment (idempotente)
├── enrollments.ts        # upsertEnrollment
├── plan-limits.ts        # applyPlanLimits
├── user-enrollments.ts   # suspendUserBonusCourseEnrollment
└── coupons.ts            # validateAndApplyCoupon
```

---

## 🔗 REFERENCIAS CRUZADAS

- **Founders Program**: Ver sección 6 de este documento
- **Soft-Lock**: Ver sección 7 de este documento
- **Modificaciones de Suscripción**: Ver archivos de pago por gateway
- **Helpers de Roles**: `server/lib/handlers/organization/roleHelpers.ts`
