# SEENCEL - Sistema Completo de Suscripciones, Planes y Facturación

> **Última Actualización**: 11 de Diciembre 2025
> **Estado**: DOCUMENTACIÓN CONSOLIDADA - AUDITORÍA COMPLETA
> **Versión**: 4.0

---

## ÍNDICE

1. [Arquitectura del Sistema](#1-arquitectura-del-sistema)
2. [Modelo de Datos](#2-modelo-de-datos)
3. [Jerarquía de Planes](#3-jerarquía-de-planes)
4. [Flujos de Pago](#4-flujos-de-pago)
5. [Sistema de Proration](#5-sistema-de-proration)
6. [Seat-Based Billing (TEAMS)](#6-seat-based-billing-teams)
7. [Sistema de Cupones](#7-sistema-de-cupones)
8. [Invitaciones y Miembros](#8-invitaciones-y-miembros)
9. [Soft-Lock System](#9-soft-lock-system)
10. [Founders Program](#10-founders-program)
11. [Cron Jobs Automatizados](#11-cron-jobs-automatizados)
12. [Gateways de Pago](#12-gateways-de-pago)
13. [Endpoints API](#13-endpoints-api)
14. [Componentes Frontend](#14-componentes-frontend)
15. [Arquitectura de Archivos](#15-arquitectura-de-archivos)
16. [Estados de Suscripción](#16-estados-de-suscripción)
17. [Reglas Críticas](#17-reglas-críticas)
18. [Escenarios de Negocio](#18-escenarios-de-negocio)
19. [Propuesta de Mejoras](#19-propuesta-de-mejoras)
20. [Auditoría Técnica - Preguntas Críticas](#20-auditoría-técnica---preguntas-críticas)
21. [Flujos Detallados a Documentar](#21-flujos-detallados-a-documentar)
22. [Mapa de Validaciones y Dependencias](#22-mapa-de-validaciones-y-dependencias)
23. [Roadmap de Correcciones](#23-roadmap-de-correcciones)
24. [Tabla Comparativa: Actual vs Ideal](#24-tabla-comparativa-actual-vs-ideal)
25. [Instrucciones de Mantenimiento](#25-instrucciones-de-mantenimiento) ⚠️ **LEER SIEMPRE**

---

## 1. ARQUITECTURA DEL SISTEMA

### Diagrama de Flujo de Pagos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USUARIO EN SEENCEL                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   FREE      │    │    PRO      │    │   TEAMS     │    │ ENTERPRISE  │   │
│  │ (Gratis)    │───▶│  ($9/mes)   │───▶│ ($X/seat)   │───▶│ (Contacto)  │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│        │                   │                  │                              │
│        ▼                   ▼                  ▼                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │               SELECCIÓN DE GATEWAY DE PAGO                            │  │
│  │  ┌───────────────┐              ┌───────────────────┐                 │  │
│  │  │   PayPal      │              │   Mercado Pago    │                 │  │
│  │  │   (USD)       │              │   (ARS)           │                 │  │
│  │  └───────────────┘              └───────────────────┘                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                    ┌───────────────┴───────────────┐                        │
│                    ▼                               ▼                        │
│         ┌─────────────────────┐       ┌─────────────────────┐              │
│         │   Nueva Suscripción │       │   Upgrade con       │              │
│         │   (Recurrente)      │       │   Proration         │              │
│         └─────────────────────┘       └─────────────────────┘              │
│                    │                               │                        │
│                    └───────────────┬───────────────┘                        │
│                                    ▼                                        │
│         ┌───────────────────────────────────────────────────────────────┐  │
│         │                 ACTIVACIÓN DE SUSCRIPCIÓN                      │  │
│         │  1. Crear payment record                                       │  │
│         │  2. Crear organization_subscription                            │  │
│         │  3. Actualizar organizations.plan_id                           │  │
│         │  4. Crear organization_billing_cycles                          │  │
│         │  5. Aplicar Founders Program (si annual)                       │  │
│         │  6. Reactivar bonus course enrollments                         │  │
│         └───────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│                                    ▼                                        │
│         ┌───────────────────────────────────────────────────────────────┐  │
│         │               RENOVACIÓN AUTOMÁTICA                            │  │
│         │  - PayPal: PAYMENT.SALE.COMPLETED webhook                      │  │
│         │  - MP: subscription_authorized_payment webhook                 │  │
│         │  - Extiende expires_at                                         │  │
│         │  - Crea nuevo billing_cycle                                    │  │
│         └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Principios de Arquitectura

1. **plan_id es la Fuente de Verdad**: Los límites y features se leen de `organizations.plan_id` → `plans.features`
2. **Subscriptions son Históricas**: `organization_subscriptions` registra el historial de pagos
3. **Soft-Lock sobre Hard-Delete**: Recursos no se eliminan, se marcan con `is_over_limit`
4. **Idempotencia**: Pagos duplicados no crean suscripciones duplicadas
5. **Separación de Gateways**: MP y PayPal tienen handlers independientes

---

## 2. MODELO DE DATOS

### 2.1 Tabla `plans`

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 'Free', 'Pro', 'Teams', 'Enterprise'
  slug TEXT,                             -- 'free', 'pro', 'teams', 'enterprise'
  features JSONB,                        -- Límites en JSON (ÚNICA FUENTE DE VERDAD)
  billing_type TEXT DEFAULT 'per_user',
  is_active BOOLEAN DEFAULT true,
  monthly_amount NUMERIC,                -- Precio mensual en USD
  annual_amount NUMERIC,                 -- Precio anual en USD
  
  -- PayPal IDs
  paypal_product_id TEXT,
  paypal_plan_monthly_id TEXT,
  paypal_plan_annual_id TEXT,
  
  -- MercadoPago IDs
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

### 2.2 Tabla `organization_subscriptions`

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
  coupon_id UUID REFERENCES coupons(id),
  coupon_code TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Tabla `organization_billing_cycles`

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

### 2.4 Tabla `payments` (Universal)

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

### 2.5 Tabla `organization_members`

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  is_billable BOOLEAN DEFAULT true,      -- ⚠️ TRUE = se cobra en TEAMS
  is_over_limit BOOLEAN DEFAULT false,   -- Soft-lock
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.6 Tabla `organization_invitations`

```sql
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  user_id UUID REFERENCES users(id),     -- Se llena si el usuario ya existe
  status TEXT DEFAULT 'pending',          -- 'pending', 'accepted', 'rejected', 'registered'
  invited_by UUID REFERENCES users(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.7 Tablas Auxiliares

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

-- Tabla auxiliar para MercadoPago
CREATE TABLE mp_subscription_preferences (
  id TEXT PRIMARY KEY,                   -- "mps_xxx" o "mpu_xxx"
  preapproval_id TEXT,
  user_id UUID NOT NULL,                 -- ⚠️ auth_id de Supabase, NO users.id
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

-- Campos en organizations
ALTER TABLE organizations ADD COLUMN settings JSONB DEFAULT '{}';
-- settings = { "is_founder": true, "founder_since": "2025-11-30T12:00:00Z" }

-- Campos de soft-lock
ALTER TABLE projects ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
ALTER TABLE organization_members ADD COLUMN is_over_limit BOOLEAN DEFAULT false;
```

---

## 3. JERARQUÍA DE PLANES

```typescript
const PLAN_HIERARCHY = {
  free: 1,
  pro: 2,
  teams: 3,
  enterprise: 4
} as const;
```

### Límites por Plan (del JSON `features`)

| Plan | max_projects | max_members | max_storage_mb | max_ai_tokens |
|------|--------------|-------------|----------------|---------------|
| Free | 4 | 1 | 500 | Básico |
| Pro | 50 | 1 | 50000 | 10000/mes |
| Teams | -1 (∞) | -1 (∞) | 500000 | -1 (∞) |
| Enterprise | -1 (∞) | -1 (∞) | Custom | Custom |

### Reglas de Cambio de Plan

| Acción | Condición | Comportamiento |
|--------|-----------|----------------|
| **Upgrade** | `targetTier > currentTier` | Pago inmediato, activación inmediata |
| **Downgrade** | `targetTier < currentTier` | Programado para fin del ciclo actual |
| **Cancelación** | Usuario solicita | Mantiene acceso hasta `expires_at` |

---

## 4. FLUJOS DE PAGO

### 4.1 Flujo de Nueva Suscripción

```
Usuario → UpgradeModal → Selecciona Plan/Período/Gateway
    │
    ├── PayPal ──────────────────────────────────┐
    │   POST /api/checkout/paypal/create-subscription
    │   → Crea PayPal Subscription (si hay plan_id) o Order (legacy)
    │   → Usuario aprueba en PayPal
    │   → GET /api/checkout/paypal/capture-subscription
    │   → Activa suscripción
    │
    └── MercadoPago ─────────────────────────────┐
        POST /api/checkout/mp/create-recurring
        → Crea Preapproval en MP
        → Usuario aprueba en MP
        → GET /api/checkout/mp/subscription-success
        → Activa suscripción
```

### 4.2 Flujo de Upgrade (con Proration - Solo MercadoPago)

```
Usuario con suscripción activa → Quiere upgrade
    │
    ├── POST /api/checkout/calculate-proration
    │   → Calcula días restantes y crédito
    │
    └── POST /api/checkout/mp/create-upgrade-preference
        → Crea Preference de pago único (diferencia prorrateada)
        → Crea Preapproval diferido (start_date = expires_at actual)
        → Usuario paga en MP
        → GET /api/checkout/mp/upgrade-success
        → Cancela suscripción anterior
        → Activa nuevo plan INMEDIATAMENTE
```

### 4.3 Flujo de Downgrade

```
Usuario → Click "Bajar a [Plan Inferior]"
    │
    └── DowngradeModal
        │
        ├── GET /api/organizations/:id/usage-stats
        │   → Calcula proyectos y miembros que serán bloqueados
        │
        └── POST /api/subscriptions/schedule-downgrade
            → SET scheduled_downgrade_plan_id = [target_plan_id]
            → Mensaje: "Mantiene acceso hasta fecha de expiración"
            
            ↓ (Cuando expires_at < now())
            
        CRON JOB: execute-scheduled-downgrades.ts (cada hora)
            → Ejecuta executeScheduledPlanSwitch()
            → Crea nueva suscripción con plan target
            → Actualiza organizations.plan_id
            → Llama applyPlanLimits() para soft-lock
            → Suspende bonus course enrollments (si baja a FREE)
```

---

## 5. SISTEMA DE PRORATION

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
| **MercadoPago** | ✅ SÍ | Hybrid: pago único + suscripción diferida |
| **PayPal** | ⚠️ Limitado | Requiere reconstruir planes con TRIAL + REGULAR |

---

## 6. SEAT-BASED BILLING (TEAMS)

### Flujo de Agregar Miembro Pagado

```
Admin en TEAMS → "Invitar miembro"
    │
    ├── POST /api/checkout/calculate-seat-proration
    │   → Días restantes del ciclo
    │   → Precio prorrateado del nuevo seat
    │
    ├── POST /api/checkout/mp/create-seat
    │   → Preference de pago único prorrateado
    │   → Usuario paga
    │
    └── GET /api/checkout/mp/seat-success
        → Crea payment (product_type: 'seat')
        → Actualiza transaction_amount en suscripción recurrente
        → Crea invitación con is_billable = true
```

### Campos de Billing en `organization_members`

- **`is_billable = true`**: Se cobra en TEAMS (default para nuevos miembros)
- **`is_billable = false`**: NO se cobra (owner de org con cupón 100%, invitados gratuitos)

---

## 7. SISTEMA DE CUPONES

### Tabla `coupons`

```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,                    -- 'percent' o 'fixed'
  amount NUMERIC NOT NULL,               -- Porcentaje o monto fijo
  applies_to TEXT DEFAULT 'courses',     -- 'courses', 'subscriptions', 'all'
  applies_to_all BOOLEAN DEFAULT true,   -- Si aplica a todos los productos del tipo
  max_redemptions INTEGER,               -- NULL = ilimitado
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  currency TEXT,                         -- NULL = cualquier moneda
  min_order_total NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE coupon_plans (
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  PRIMARY KEY (coupon_id, plan_id)
);

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY,
  coupon_id UUID REFERENCES coupons(id),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),  -- Para cursos
  subscription_id UUID REFERENCES organization_subscriptions(id),  -- Para suscripciones
  plan_id UUID REFERENCES plans(id),
  order_id UUID REFERENCES payments(id),
  amount_saved NUMERIC,
  currency TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Flujos de Cupones

1. **Cupón con Descuento Parcial**: Reduce precio, pasa por gateway
2. **Cupón 100% (Gratis)**: 
   - NO pasa por MP/PayPal
   - Crea suscripción directamente con `provider_subscription_id = null`
   - Marca owner como `is_billable = false`

### Caso Borde: Primer Seat Pagado en Org con Cupón 100%

Cuando una org creada con cupón 100% quiere agregar su primer miembro pagado:
1. Detecta que no hay `provider_subscription_id`
2. CREA nueva suscripción en MP (en vez de actualizar)
3. Sincroniza fecha de renovación
4. Guarda el nuevo `provider_subscription_id`

---

## 8. INVITACIONES Y MIEMBROS

### Flujo de Invitación

```
Admin → POST /api/invitations/invite
    │
    ├── Verificar límite de miembros (max_members del plan)
    │   → Cuenta: active members + pending invitations
    │
    ├── Usuario existe?
    │   ├── SÍ → Crear notification in-app
    │   └── NO → Enviar email de invitación
    │
    └── Crear organization_invitation (status: 'pending')
```

### Flujo de Aceptación

```
Usuario → POST /api/invitations/accept
    │
    ├── Verificar invitación válida y pending
    │
    ├── Crear organization_member
    │   → is_billable = true (por defecto)
    │   → is_over_limit = false
    │
    └── Actualizar invitation (status: 'accepted')
```

### Verificación de Límites

```typescript
// server/lib/handlers/organization/inviteMember.ts

const features = plan.features || {};
const maxMembers = features.max_members ?? 1; // -1 = ilimitado

if (maxMembers !== -1) {
  const currentCount = activeMembersCount + pendingInvitationsCount;
  if (currentCount >= maxMembers) {
    return { error: `Límite de ${maxMembers} miembros alcanzado` };
  }
}
```

---

## 9. SOFT-LOCK SYSTEM

### Funcionamiento

1. Cuando se baja de plan, NO se eliminan proyectos ni miembros
2. Se marcan con `is_over_limit = true`
3. El frontend bloquea acceso a recursos marcados
4. Al subir de plan, se limpian las marcas

### Función `applyPlanLimits()`

```typescript
// server/lib/handlers/checkout/shared/plan-limits.ts

export async function applyPlanLimits(supabase, organizationId, newPlanName) {
  const limits = await getPlanLimitsByName(supabase, newPlanName);
  
  // 1. Obtener todos los proyectos ordenados por created_at
  const projects = await getProjects(organizationId);
  
  // 2. Marcar proyectos excedentes
  if (projects.length > limits.max_projects) {
    const projectsToMark = projects.slice(limits.max_projects);
    await markProjectsOverLimit(projectsToMark);
  }
  
  // 3. Obtener miembros (admins primero)
  const members = await getMembers(organizationId);
  
  // 4. Marcar miembros excedentes (nunca admins)
  if (members.length > limits.max_members) {
    const membersToMark = members.slice(limits.max_members);
    await markMembersOverLimit(membersToMark);
  }
  
  return { projectsMarked, membersMarked };
}
```

---

## 10. FOUNDERS PROGRAM

### Criterio de Elegibilidad

- Primera suscripción **ANNUAL** a PRO o TEAMS
- Se aplica automáticamente en `upgradeOrganizationPlan()`

### Beneficios

1. **Título de Fundador**: Marca permanente en `organizations.settings.is_founder`
2. **Curso Bonus Gratuito**: Enrollment de por vida al curso configurado en `app_settings.founder_bonus_course_id`

### Lógica de Suspensión/Reactivación

- **Baja a FREE**: `suspendBonusCourseEnrollments()` cambia status a 'suspended'
- **Upgrade a pagado**: `reactivateBonusCourseEnrollments()` cambia status a 'active'
- **Importante**: Solo afecta a orgs con `is_founder = true` Y suscripción activa pagada

---

## 11. CRON JOBS AUTOMATIZADOS

### 11.1 Subscription Expiry Notifier (Diario a las 9:00 AM UTC)

```
server/cron/jobs/subscription-expiry-notifier.ts

→ Busca suscripciones que expiran en 7, 3, 1, 0 días
→ Envía emails a todos los admins de la organización
→ Registra en subscription_notifications_log (evita duplicados)
```

### 11.2 Execute Scheduled Downgrades (Cada Hora)

```
server/cron/jobs/execute-scheduled-downgrades.ts

PARTE 1: Downgrades Programados
→ Busca: status='active', expires_at < now(), scheduled_downgrade_plan_id IS NOT NULL
→ Ejecuta executeScheduledPlanSwitch()
→ Aplica soft-locks

PARTE 2: Suscripciones Canceladas Expiradas
→ Busca: status='cancelled', expires_at < now()
→ Mueve a FREE automáticamente
→ Suspende bonus course enrollments
```

---

## 12. GATEWAYS DE PAGO

### 12.1 PayPal (USD)

**Modos:**
1. **Recurring Subscriptions** (con billing plan IDs)
2. **Legacy CAPTURE** (sin billing plan IDs)

**Webhooks:**
- `BILLING.SUBSCRIPTION.ACTIVATED`: Log
- `BILLING.SUBSCRIPTION.CANCELLED`: Marcar cancelada
- `PAYMENT.SALE.COMPLETED`: Renovación

**Archivos Clave:**
```
server/lib/handlers/checkout/paypal/
├── subscriptions-api.ts       # API wrappers
├── sync-plans.ts              # Sincronizar productos y planes
├── createSubscriptionOrder.ts # Crear suscripción
├── captureSubscriptionOrder.ts # Capturar/activar
├── createCourseOrder.ts       # Cursos
├── captureCourseOrder.ts      # Cursos
└── processWebhook.ts          # Handler de webhooks
```

### 12.2 Mercado Pago (ARS)

**Modos:**
1. **Recurring Preapproval** (nuevas suscripciones)
2. **Hybrid Upgrade** (pago único + preapproval diferido)
3. **Legacy Preference** (fallback)

**Webhooks:**
- `subscription_preapproval`: Autorización inicial
- `subscription_authorized_payment`: Renovación
- `payment`: Pago único (upgrades, cursos)

**Tabla Auxiliar:** `mp_subscription_preferences`
- Resuelve límite de 64 chars en `external_reference`
- Prefijos: `mps_` (nueva), `mpu_` (upgrade), `mp_` (curso)

**Archivos Clave:**
```
server/lib/handlers/checkout/mp/
├── subscriptions-api.ts          # API wrappers
├── sync-plans.ts                 # Sincronizar planes
├── createRecurringSubscription.ts
├── handleSubscriptionReturn.ts
├── createUpgradePreference.ts
├── handleUpgradeReturn.ts
├── createSeatSubscription.ts
├── updateSeatSubscription.ts
├── createCoursePreference.ts
└── processWebhook.ts
```

---

## 13. ENDPOINTS API

### Subscriptions

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/checkout/paypal/create-subscription` | Crear suscripción PayPal |
| GET | `/api/checkout/paypal/capture-subscription` | Capturar suscripción PayPal |
| POST | `/api/checkout/mp/create-recurring` | Crear suscripción MP |
| GET | `/api/checkout/mp/subscription-success` | Callback éxito MP |
| POST | `/api/checkout/mp/create-upgrade-preference` | Upgrade con proration |
| GET | `/api/checkout/mp/upgrade-success` | Callback upgrade MP |
| POST | `/api/checkout/calculate-proration` | Calcular proration |
| POST | `/api/subscriptions/schedule-downgrade` | Programar downgrade |
| DELETE | `/api/subscriptions/cancel-scheduled-downgrade` | Cancelar downgrade |
| POST | `/api/subscriptions/:id/cancel` | Cancelar suscripción |

### Seats (TEAMS)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/checkout/calculate-seat-proration` | Calcular costo seat |
| POST | `/api/checkout/mp/create-seat` | Crear pago seat |
| GET | `/api/checkout/mp/seat-success` | Callback seat MP |

### Admin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/admin/paypal/sync-plans` | Sincronizar planes PayPal |
| POST | `/api/admin/mp/sync-plans` | Sincronizar planes MP |
| GET | `/api/admin/subscriptions` | Listar suscripciones |
| GET | `/api/admin/coupons` | Listar cupones |
| POST | `/api/admin/coupons` | Crear cupón |

---

## 14. COMPONENTES FRONTEND

### Modals Principales

```
src/features/users/modals/
├── UpgradeModal.tsx      # Upgrade de plan
├── DowngradeModal.tsx    # Downgrade (muestra impacto)
└── InvitationModal.tsx   # Invitar miembros
```

### Páginas de Billing

```
src/pages/billing/
├── Billing.tsx           # Página principal
└── tabs/
    └── BillingListTab.tsx  # Historial de pagos
```

### Componentes de Pricing

```
src/features/shared-content/pricing/
├── PricingContent.tsx         # Cards de planes
└── data/plans-config.ts       # Configuración visual
```

### Helpers

```
src/utils/planHelpers.ts
├── isProOrTeams()            # Verificar plan pagado
└── getPlanDisplayName()      # Nombre legible
```

---

## 15. ARQUITECTURA DE ARCHIVOS

```
server/
├── routes/
│   ├── subscriptions.ts      # Rutas de suscripciones
│   ├── payments.ts           # Rutas de pagos
│   └── billing.ts            # Rutas de billing
│
├── controllers/
│   ├── admin/
│   │   ├── subscriptions.controller.ts
│   │   ├── plans.controller.ts
│   │   └── coupons.controller.ts
│   ├── organization/
│   │   └── invitations.controller.ts
│   └── payments/
│       └── paypal.controller.ts
│
├── lib/handlers/
│   └── checkout/
│       ├── shared/
│       │   ├── subscriptions.ts      # upgradeOrganizationPlan, executeScheduledPlanSwitch
│       │   ├── plan-limits.ts        # applyPlanLimits
│       │   ├── proration.ts          # calculateProration
│       │   ├── payments.ts           # insertPayment
│       │   ├── coupons.ts            # validateCoupon, markCouponAsUsed
│       │   ├── subscription-coupons.ts
│       │   ├── seat-proration.ts
│       │   └── enrollments.ts
│       ├── paypal/
│       │   └── ... (handlers PayPal)
│       └── mp/
│           └── ... (handlers MercadoPago)
│
└── cron/jobs/
    ├── subscription-expiry-notifier.ts
    └── execute-scheduled-downgrades.ts
```

---

## 16. ESTADOS DE SUSCRIPCIÓN

### Checklist de Estados

| Estado | Descripción | Acceso a Features | Puede Renovar | Puede Cancelar |
|--------|-------------|-------------------|---------------|----------------|
| `active` | Suscripción vigente | ✅ Completo | ✅ | ✅ |
| `trialing` | Período de prueba | ✅ Completo | ✅ | ✅ |
| `cancelled` | Cancelada, esperando expiración | ✅ Hasta expires_at | ✅ (reactivar) | ❌ |
| `expired` | Expirada | ❌ | ✅ | ❌ |
| `pending` | Esperando confirmación de pago | ❌ | ❌ | ❌ |

### Transiciones Válidas

```
pending → active (pago confirmado)
pending → expired (timeout)
active → cancelled (usuario cancela)
active → expired (no renueva)
cancelled → active (reactivar)
cancelled → expired (llega expires_at)
expired → active (nuevo pago)
```

---

## 17. REGLAS CRÍTICAS

### ⚠️ ID Resolution (auth_id vs users.id)

```typescript
// mp_subscription_preferences.user_id contiene auth_id
// SIEMPRE resolver a users.id antes de insertar en DB

const { data: userProfile } = await supabase
  .from("users")
  .select("id")
  .eq("auth_id", authId)
  .maybeSingle();

const publicUserId = userProfile.id; // ✅ Usar este
```

### ⚠️ Precios Siempre del Backend

```typescript
// NUNCA confiar en precios del frontend
const price = plan.billing_period === 'monthly' 
  ? plan.monthly_amount 
  : plan.annual_amount;
```

### ⚠️ MercadoPago Argentina - Sin Decimales

```typescript
// ARS no acepta decimales
const priceArs = Math.round(priceUsd * exchangeRate);
```

### ⚠️ Verificar Admin Antes de Cambios

```typescript
const member = await getMember(userId, organizationId);
const isAdmin = member.roles?.name?.toLowerCase().includes('admin');
if (!isAdmin) throw new Error('Solo admins pueden hacer esto');
```

---

## 18. ESCENARIOS DE NEGOCIO

### A) Planes Gratuitos Regalados

**Implementación Actual:** Soportado via cupones 100%
```typescript
if (couponResult.is_free) {
  // NO pasar por gateway
  // Crear suscripción con provider_subscription_id = null
  // Marcar owner como is_billable = false
}
```

### B) Cupones del 100%

**Implementación Actual:** Soportada
- Validación via `validate_subscription_coupon` RPC
- Activación directa sin gateway

### C) Invitar Miembros Facturables Solo con Método de Pago

**Estado Actual:** ⚠️ NO IMPLEMENTADO COMPLETAMENTE
- Se verifica límite de miembros del plan
- NO se verifica si hay `provider_subscription_id` para TEAMS

**Propuesta:**
```typescript
// En inviteMember.ts, agregar:
if (plan.slug === 'teams' && member.is_billable) {
  const activeSub = await getActiveSubscription(organizationId);
  if (!activeSub?.provider_subscription_id) {
    return { error: 'Debe configurar un método de pago antes de agregar miembros facturables' };
  }
}
```

### D) Permitir Invitados No Facturables Sin Método de Pago

**Estado Actual:** Requiere agregar opción `is_billable = false` en invitación

**Propuesta:** Agregar checkbox "Invitar como no facturable" en UI

### E) Gestión de Upgrades a TEAMS

**Estado Actual:** ✅ Implementado con proration (solo MP)

### F) Eventos de Renovación Automática

**Estado Actual:** ✅ Implementado via webhooks
- PayPal: `PAYMENT.SALE.COMPLETED`
- MP: `subscription_authorized_payment`

---

## 19. PROPUESTA DE MEJORAS

### 19.1 Dependencias Incorrectas de subscription_id vs plan_id

**Problema Detectado:** Algunas partes del código chequean `subscription` cuando deberían chequear `plan`.

**Regla Correcta:**
- `plan_id` → Para verificar features y límites
- `subscription_id` → Para historial de pagos y estado de billing

**Archivos a Revisar:**
- Componentes que usan `useSubscription` cuando deberían usar `usePlan`
- Validaciones que chequean `subscription.status` para features

### 19.2 Verificación de Método de Pago para TEAMS

Agregar verificación de `provider_subscription_id` antes de:
- Invitar miembros facturables
- Crear seats adicionales

### 19.3 UI para Invitados No Facturables

Agregar opción en `InvitationModal`:
```tsx
<Checkbox 
  checked={!isBillable}
  onChange={() => setIsBillable(!isBillable)}
  label="Invitar como colaborador gratuito (no se cobrará en el plan)"
/>
```

### 19.4 Proration para PayPal

Implementar flujo similar a MP:
1. Crear plan con TRIAL period = días restantes
2. Primer ciclo con monto prorrateado
3. Ciclos regulares con monto completo

### 19.5 Monitoreo y Alertas

Agregar dashboards para:
- Suscripciones próximas a expirar
- Pagos fallidos
- Cupones próximos a expirar
- Orgs con recursos bloqueados

---

## CHECKLIST DE TESTING

### Suscripciones
- [ ] Nueva suscripción PayPal (recurring)
- [ ] Nueva suscripción MP (recurring)
- [ ] Upgrade con proration MP
- [ ] Downgrade programado
- [ ] Cancelación de suscripción
- [ ] Reactivación después de expirar

### Cupones
- [ ] Cupón porcentual
- [ ] Cupón 100% (suscripción gratis)
- [ ] Cupón expirado
- [ ] Cupón límite alcanzado

### TEAMS
- [ ] Agregar seat (pago prorrateado)
- [ ] Invitar miembro facturado
- [ ] Invitar miembro no facturado

### Webhooks
- [ ] PayPal renovación
- [ ] MP renovación
- [ ] Cancelación via webhook

### Cron Jobs
- [ ] Ejecutar downgrade programado
- [ ] Notificar expiración próxima
- [ ] Suspender bonus course

---

## QUERIES DE MONITOREO

```sql
-- Suscripciones activas por plan
SELECT p.name, COUNT(*) 
FROM organization_subscriptions os
JOIN plans p ON p.id = os.plan_id
WHERE os.status = 'active'
GROUP BY p.name;

-- Suscripciones próximas a expirar
SELECT os.*, o.name as org_name, p.name as plan_name
FROM organization_subscriptions os
JOIN organizations o ON o.id = os.organization_id
JOIN plans p ON p.id = os.plan_id
WHERE os.status = 'active'
AND os.expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';

-- Pagos recientes
SELECT * FROM payments 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Cupones activos
SELECT * FROM coupons 
WHERE is_active = true 
AND (expires_at IS NULL OR expires_at > NOW());

-- Orgs con recursos bloqueados
SELECT o.name, 
  (SELECT COUNT(*) FROM projects WHERE organization_id = o.id AND is_over_limit = true) as locked_projects,
  (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id AND is_over_limit = true) as locked_members
FROM organizations o
WHERE EXISTS (
  SELECT 1 FROM projects WHERE organization_id = o.id AND is_over_limit = true
  UNION
  SELECT 1 FROM organization_members WHERE organization_id = o.id AND is_over_limit = true
);
```

---

## 20. AUDITORÍA TÉCNICA - PREGUNTAS CRÍTICAS

> **IMPORTANTE**: Esta sección contiene las preguntas que DEBEN responderse explícitamente cada vez que se realice una auditoría del sistema de billing.

### 20.1 Preguntas de Validación de Arquitectura

| # | Pregunta | Respuesta Esperada | Estado Actual |
|---|----------|-------------------|---------------|
| 1 | ¿Hay algún lugar donde se consulta "subscription" para validar permisos o features? | NO debería haber | ⚠️ PENDIENTE VERIFICAR |
| 2 | ¿Hay algún lugar que bloquea invitaciones por no tener suscripción, aunque el plan sea Teams regalado? | NO debería haber | ⚠️ PENDIENTE VERIFICAR |
| 3 | ¿Está bien implementado el cupón 100%? | Debe crear suscripción sin gateway | ✅ IMPLEMENTADO |
| 4 | ¿Se crea correctamente la suscripción con `provider_subscription_id = NULL`? | SÍ para cupones 100% | ✅ IMPLEMENTADO |
| 5 | ¿Dónde falla exactamente el upgrade a Teams? | No debería fallar | ⚠️ PENDIENTE VERIFICAR |
| 6 | ¿Qué pasa hoy si se invita un miembro facturable sin método de pago? | Debería exigir método de pago | ⚠️ PENDIENTE IMPLEMENTAR |
| 7 | ¿Qué pasa hoy si se invita un miembro NO facturable? | Debería permitirse sin restricciones | ⚠️ PENDIENTE VERIFICAR |
| 8 | ¿El sistema distingue correctamente entre: owner, miembros gratis, miembros facturables? | SÍ via `is_billable` | ✅ PARCIAL |
| 9 | ¿Hay dependencias incorrectas con Mercado Pago o PayPal? | NO debería haber | ⚠️ PENDIENTE VERIFICAR |
| 10 | ¿El backend y el frontend usan la misma lógica o hay contradicciones? | Misma lógica | ⚠️ PENDIENTE VERIFICAR |

### 20.2 Principios de SaaS Seat-Based Moderno

Estas son las reglas que el sistema DEBE cumplir:

1. **Features dependen SOLO de `organizations.plan_id`**, NO del estado de la suscripción
2. **Seats facturables dependen de `organization_members.is_billable = true`**
3. **Invitar miembros facturables solo requiere método de pago**, no suscripción activa si el plan fue regalado
4. **Cupones 100% crean suscripciones válidas** sin pasar por PayPal/MercadoPago
5. **Plan Teams regalado permite invitar miembros NO facturables** sin errores
6. **Plan Teams regalado exige método de pago** solo cuando se agrega el primer miembro facturable
7. **Ninguna parte del código bloquea acciones** por falta de suscripción si el plan es válido
8. **La UI no chequea "suscripción activa" para features**, solo para billing

---

## 21. FLUJOS DETALLADOS A DOCUMENTAR

### 21.1 Creación de Organización FREE

```
1. Usuario se registra
2. Se crea organization con plan_id = FREE
3. Se crea organization_member (owner, is_billable = false)
4. NO se crea organization_subscription (FREE no requiere)
5. Features limitados según plans.features del FREE
```

### 21.2 Creación de Suscripción Normal (Pago)

```
1. Usuario selecciona plan (PRO/TEAMS)
2. Usuario selecciona período (monthly/annual)
3. Usuario selecciona gateway (PayPal/MP)
4. Se crea preferencia/orden en gateway
5. Usuario paga en gateway externo
6. Webhook/callback confirma pago
7. Se crea payment record
8. Se crea organization_subscription
9. Se actualiza organizations.plan_id
10. Se crea billing_cycle
11. Si es annual → aplicar Founders Program
```

### 21.3 Creación de Suscripción con Cupón 100%

```
1. Usuario aplica cupón en checkout
2. Backend valida cupón (validate_subscription_coupon RPC)
3. Si amount_after_discount = 0:
   a. NO se pasa por gateway
   b. Se crea organization_subscription directamente
   c. provider_subscription_id = NULL
   d. Se marca owner como is_billable = false
   e. Se registra coupon_redemption
4. Se actualiza organizations.plan_id
5. Features activados inmediatamente
```

### 21.4 Invitación de Miembro

```
1. Admin hace click en "Invitar"
2. Backend verifica:
   a. ¿Admin tiene permisos? (role check)
   b. ¿Límite de miembros del plan alcanzado? (max_members check)
3. Si pasa validaciones → crear invitation
4. Si usuario existe → notificación in-app
5. Si usuario no existe → email de invitación
```

### 21.5 Invitación de Miembro Facturable (TEAMS)

```
1. Mismo flujo que 21.4
2. ADICIONAL: verificar provider_subscription_id
   a. Si NULL y is_billable = true → ERROR "Debe configurar método de pago"
   b. Si existe → calcular proration del seat
   c. Crear pago del seat prorrateado
   d. Actualizar transaction_amount en suscripción recurrente
3. Crear invitation con is_billable = true
```

### 21.6 Invitación de Miembro NO Facturable

```
1. Mismo flujo que 21.4
2. NO requiere provider_subscription_id
3. NO cobra seat adicional
4. Crear invitation con is_billable = false
```

### 21.7 Upgrade de Plan

```
1. Usuario en plan X quiere plan Y (Y > X)
2. Calcular proration (días restantes × precio actual)
3. Precio final = precio nuevo - crédito proration
4. Si gateway = MP:
   a. Crear preference de pago único (diferencia)
   b. Crear preapproval diferido (start_date = expires_at actual)
5. Usuario paga
6. Cancelar suscripción anterior
7. Activar nuevo plan INMEDIATAMENTE
8. Reactivar bonus course enrollments si aplica
```

### 21.8 Owner con Cupón 100% Agregando Primer Miembro Pagado

```
1. Org tiene plan TEAMS via cupón 100%
2. provider_subscription_id = NULL (nunca pagó)
3. Admin quiere agregar miembro facturable
4. Sistema detecta: no hay suscripción recurrente
5. CREAR nueva suscripción en MP (no actualizar):
   a. Precio = precio por seat del plan
   b. Guardar nuevo provider_subscription_id
6. Cobrar seat prorrateado
7. Crear invitation con is_billable = true
```

---

## 22. MAPA DE VALIDACIONES Y DEPENDENCIAS

### 22.1 Archivos que Consultan Plans/Subscriptions

| Archivo | Qué Consulta | Propósito | Correcto? |
|---------|--------------|-----------|-----------|
| `server/lib/handlers/organization/inviteMember.ts` | `plans.features` | Límite de miembros | ✅ |
| `server/lib/handlers/checkout/shared/plan-limits.ts` | `plans.features` | Soft-lock | ✅ |
| `src/utils/planHelpers.ts` | `plan.slug` | Verificar plan pagado | ✅ |
| `src/features/shared-content/pricing/*` | `plans.*` | UI de pricing | ✅ |

### 22.2 Lugares Donde Se Mezcla Features con Billing

> IMPORTANTE: Documentar aquí cada lugar donde se encuentre esta mezcla incorrecta.

| Archivo | Línea | Problema | Corrección |
|---------|-------|----------|------------|
| *Pendiente auditar* | - | - | - |

### 22.3 Lugares Que Bloquean por Ausencia de Suscripción

> IMPORTANTE: Estos son ERRORES si el plan es válido.

| Archivo | Línea | Problema | Corrección |
|---------|-------|----------|------------|
| *Pendiente auditar* | - | - | - |

### 22.4 Dependencias de Gateways

| Archivo | Gateway | Problema Potencial |
|---------|---------|-------------------|
| `server/lib/handlers/checkout/mp/*` | MercadoPago | Correcto (handler específico) |
| `server/lib/handlers/checkout/paypal/*` | PayPal | Correcto (handler específico) |

---

## 23. ROADMAP DE CORRECCIONES

### P0 - Crítico (Bloquea funcionalidad core)

| # | Descripción | Archivo | Estado |
|---|-------------|---------|--------|
| 1 | Verificar `provider_subscription_id` antes de agregar seats facturables | `inviteMember.ts` | ⚠️ PENDIENTE |
| 2 | Permitir miembros NO facturables sin método de pago | `inviteMember.ts` | ⚠️ PENDIENTE |
| 3 | UI para marcar miembro como `is_billable = false` | `InvitationModal.tsx` | ⚠️ PENDIENTE |

### P1 - Importante (Mejora experiencia)

| # | Descripción | Archivo | Estado |
|---|-------------|---------|--------|
| 1 | Proration para PayPal | `paypal/*` | ⚠️ PENDIENTE |
| 2 | Crear suscripción recurrente al primer seat pagado en org con cupón 100% | `mp/createSeatSubscription.ts` | ⚠️ PENDIENTE |

### P2 - Mejora (Nice to have)

| # | Descripción | Archivo | Estado |
|---|-------------|---------|--------|
| 1 | Dashboard de monitoreo de suscripciones | - | ⚠️ PENDIENTE |
| 2 | Alertas de pagos fallidos | - | ⚠️ PENDIENTE |

---

## 24. TABLA COMPARATIVA: ACTUAL vs IDEAL

| Aspecto | Estado Actual | Estado Ideal |
|---------|---------------|--------------|
| Features dependen de... | `plan_id` | ✅ `plan_id` |
| Billing depende de... | `subscription.status` | ✅ `subscription.status` |
| Invitar miembro NO facturable | Requiere verificar límite | ✅ Solo verificar límite |
| Invitar miembro facturable | Requiere verificar límite | Verificar límite + `provider_subscription_id` |
| Cupón 100% crea suscripción | ✅ Sin gateway | ✅ Sin gateway |
| Primer seat en org con cupón 100% | ⚠️ Posible error | Crear nueva suscripción recurrente |
| UI para `is_billable` | ❌ No existe | Checkbox en InvitationModal |

---

## 25. INSTRUCCIONES DE MANTENIMIENTO

### ⚠️ REGLA CRÍTICA DE AUTO-ACTUALIZACIÓN

> **CADA VEZ QUE SE IMPLEMENTE ALGO NUEVO EN EL SISTEMA DE BILLING/SUSCRIPCIONES, ESTA DOCUMENTACIÓN DEBE ACTUALIZARSE.**

### Cuándo Actualizar Este Documento

1. **Nuevo endpoint de billing** → Agregar a sección 13 (Endpoints API)
2. **Nuevo flujo de pago** → Agregar a sección 4 o 21 (Flujos)
3. **Cambio en modelo de datos** → Actualizar sección 2 (Modelo de Datos)
4. **Nuevo cron job** → Agregar a sección 11 (Cron Jobs)
5. **Fix de bug crítico** → Documentar en sección 22/23 y marcar como resuelto
6. **Nueva integración de gateway** → Agregar a sección 12 (Gateways)
7. **Cambio en límites de plan** → Actualizar sección 3 (Jerarquía de Planes)
8. **Nuevo componente frontend** → Agregar a sección 14 (Componentes Frontend)

### Formato de Actualización

```markdown
### [Fecha] - [Descripción breve]

**Archivos modificados:**
- `path/to/file.ts` - Descripción del cambio

**Impacto:**
- [Qué funcionalidad cambia]

**Testing requerido:**
- [ ] Test 1
- [ ] Test 2
```

### Historial de Cambios

| Fecha | Cambio | Autor |
|-------|--------|-------|
| 2025-12-11 | Documentación consolidada inicial | Auditoría Técnica |
| 2025-12-11 | Agregadas secciones 20-25 con auditoría exhaustiva | Prompt de Auditoría |

---

**Última Actualización:** 11 de Diciembre 2025
**Autor:** Auditoría Técnica Completa
