# Sistema de Suscripciones y Planes - Documentación Exhaustiva

> **ESTADO: ANÁLISIS PRE-LANZAMIENTO**  
> Fecha: 29 de Noviembre, 2025  
> Objetivo: Documentar TODO el sistema de planes/suscripciones para validar antes del lanzamiento

---

## 1. TABLAS DE BASE DE DATOS

### 1.1 `plans` - Catálogo de Planes
```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,           -- 'Free', 'Pro', 'Teams', 'Enterprise'
  slug TEXT NOT NULL UNIQUE,           -- 'free', 'pro', 'teams', 'enterprise'
  features JSONB,                       -- Features del plan (deprecated, usar plan_features)
  price NUMERIC(10,2),                  -- DEPRECATED - mantener compatibilidad
  monthly_amount NUMERIC(10,2),         -- Precio mensual en USD
  annual_amount NUMERIC(10,2),          -- Precio anual en USD
  is_active BOOLEAN DEFAULT true,
  billing_type TEXT DEFAULT 'per_user'  -- 'per_user' para TEAMS
);
```

### 1.2 `plan_prices` - Precios Multi-Moneda
```sql
CREATE TABLE plan_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  currency_code TEXT NOT NULL,          -- 'USD', 'ARS'
  monthly_amount NUMERIC(10,2) NOT NULL,
  annual_amount NUMERIC(10,2) NOT NULL,
  provider TEXT DEFAULT 'any',          -- 'paypal', 'mercadopago', 'any'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 `organization_subscriptions` - Suscripciones Activas
```sql
CREATE TABLE organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  payment_id UUID,                       -- Referencia a tabla payments
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'trialing', 'pending'
  billing_period TEXT NOT NULL,          -- 'monthly', 'annual'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  scheduled_downgrade_plan_id UUID,      -- Plan al que se baja cuando expire
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.4 `organization_billing_cycles` - Historial de Facturación
```sql
CREATE TABLE organization_billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  subscription_id UUID,
  plan_id UUID NOT NULL,
  
  -- Snapshots de seats
  seats INTEGER NOT NULL,                -- Cantidad REAL de miembros billable
  billed_seats INTEGER NOT NULL DEFAULT 1, -- Seats realmente facturados
  amount_per_seat NUMERIC(10,2) NOT NULL,
  seat_price_source TEXT,                -- 'plans.monthly_amount'
  
  -- Montos
  base_amount NUMERIC(10,2) NOT NULL,
  proration_adjustment NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  -- Período
  billing_period TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Estado de pago
  paid BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',         -- 'pending', 'paid', 'failed'
  payment_provider TEXT,                 -- 'paypal', 'mercadopago'
  payment_id TEXT,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.5 `organization_member_events` - Auditoría de Miembros
```sql
CREATE TABLE organization_member_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  subscription_id UUID,
  member_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,              -- 'member_added', 'member_removed', 'billable_enabled', 'billable_disabled'
  was_billable BOOLEAN,
  is_billable BOOLEAN,
  event_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.6 `exchange_rates` - Tasas de Cambio (USD → ARS)
```sql
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (from_currency, to_currency)
);
```

### 1.7 `organizations.plan_id` - Referencia Rápida
```sql
-- En la tabla organizations
plan_id UUID  -- Referencia al plan actual (denormalizado para queries rápidas)
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

### Reglas:
- **Upgrade**: Solo se puede subir a un plan de nivel superior
- **Downgrade**: Solo se puede bajar a un plan de nivel inferior
- **Downgrade programado**: Se guarda en `scheduled_downgrade_plan_id` y se aplica cuando expire la suscripción

---

## 3. FLUJO PASO A PASO DEL USUARIO

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
│ → Llama upgradeOrganizationPlan│   │                                │
│ → Muestra HTML de éxito       │   │                                │
│ → Redirige a /organization/   │   │                                │
│     billing?payment=success   │   │                                │
└───────────────────────────────┘   └───────────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ upgradeOrganizationPlan() en server/lib/handlers/checkout/shared/           │
│ subscriptions.ts                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Cancela suscripción anterior (status: 'expired')                         │
│ 2. Calcula expires_at (+1 mes o +1 año)                                     │
│ 3. Inserta nueva suscripción en organization_subscriptions                   │
│ 4. Cuenta billable_members REALES                                            │
│ 5. Para primer pago TEAMS: billed_seats = 1 (solo admin)                    │
│ 6. Inserta billing_cycle con snapshot histórico                              │
│ 7. Actualiza organizations.plan_id                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Flujo de Downgrade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO QUIERE BAJAR DE PLAN                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Usuario va a /settings/pricing-plan                                       │
│ 2. Click en "Cambiar a [Plan Inferior]"                                     │
│ 3. Sistema valida que es un downgrade (targetTier < currentTier)            │
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
│ ⚠️  CUANDO EXPIRA LA SUSCRIPCIÓN...                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ❌ NO HAY CRON JOB QUE EJECUTE EL DOWNGRADE AUTOMÁTICAMENTE               │
│                                                                              │
│   El campo scheduled_downgrade_plan_id está guardado, pero:                 │
│   - No hay proceso automatizado que lo ejecute                               │
│   - No se actualiza organizations.plan_id                                   │
│   - No se crea nueva suscripción con el plan FREE                           │
│                                                                              │
│   🔴 GAP CRÍTICO: DOWNGRADE MANUAL ACTUALMENTE                              │
│                                                                              │
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

## 4. ENDPOINTS DEL SISTEMA

### 4.1 Subscriptions Routes (`server/routes/subscriptions.ts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/subscriptions/current` | Obtiene suscripción activa de la organización |
| POST | `/api/subscriptions/schedule-downgrade` | Programa un downgrade para cuando expire |
| DELETE | `/api/subscriptions/cancel-scheduled-downgrade` | Cancela downgrade programado |
| POST | `/api/subscriptions/:id/cancel` | Cancela suscripción (mantiene acceso hasta expiración) |

### 4.2 Payment Routes (`server/routes/payments.ts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/checkout/paypal/create-subscription` | Crea orden PayPal para suscripción |
| GET | `/api/checkout/paypal/capture-subscription` | Captura pago y activa plan (redirect) |
| POST | `/api/checkout/paypal/webhook` | Webhook PayPal para pagos |
| POST | `/api/checkout/mp/create-subscription` | Crea preferencia MP para suscripción |
| GET | `/api/checkout/mp/success-handler` | Handler de retorno MP |
| POST | `/api/checkout/mp/webhook` | Webhook MP para pagos |

### 4.3 Billing Routes (`server/routes/billing.ts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/billing/next-invoice/:organizationId` | Calcula próxima factura |
| GET | `/api/billing/cycles/:organizationId` | Historial de ciclos de facturación |

---

## 5. INTEGRACIONES DE PAGO

### 5.1 PayPal (USD)

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
8. Si es nuevo pago, llama `upgradeOrganizationPlan()`

**Seguridad:**
- Precio SIEMPRE de la base de datos (nunca del cliente)
- `auth_id` extraído de sesión autenticada
- Verificación de admin para la organización

### 5.2 Mercado Pago (ARS)

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
10. Si es nuevo pago, llama `upgradeOrganizationPlan()`

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
```

---

## 6. CUMPLIMIENTO DE MASTER PROMPT

### ✅ CUMPLE:

| Regla | Estado | Evidencia |
|-------|--------|-----------|
| Todo por backend | ✅ | Todos los endpoints usan `server/routes/*.ts` |
| Frontend usa auth_id, backend resuelve | ✅ | `captureSubscriptionOrder.ts` línea 129-147 |
| No queries directas a Supabase | ✅ | Todo pasa por handlers del servidor |
| Arquitectura modular | ✅ | Handlers separados en `server/lib/handlers/checkout/` |

### ⚠️ REVISAR:

| Aspecto | Observación |
|---------|-------------|
| Documentación de tablas | Falta en `prompts/tables/` para tablas de suscripción |
| Soft delete | No implementado para suscripciones (solo status change) |

---

## 7. ANÁLISIS DE COMPLETITUD

### ✅ LO QUE ESTÁ IMPLEMENTADO:

1. **Upgrade a plan superior** - Funciona con PayPal y MP
2. **Downgrade programado** - Se guarda en `scheduled_downgrade_plan_id`
3. **Cancelación de suscripción** - Mantiene acceso hasta expiración
4. **Historial de facturación** - `organization_billing_cycles`
5. **Tracking de miembros billable** - `organization_member_events`
6. **Multi-moneda** - USD (PayPal) y ARS (MP con conversión)
7. **Restricción de features por plan** - `PlanRestricted` component
8. **Idempotencia en pagos** - Previene duplicados en webhooks

### 🔴 GAPS CRÍTICOS - NO IMPLEMENTADO:

#### GAP 1: DOWNGRADE AUTOMÁTICO
```
❌ No hay cron job que ejecute el downgrade cuando expire la suscripción

PROBLEMA:
- Usuario tiene PRO, programa downgrade a FREE
- PRO expira el 29/12/2025
- scheduled_downgrade_plan_id tiene el UUID de FREE
- Pero NADA ejecuta el cambio a FREE automáticamente
- El usuario pierde acceso pero sigue sin plan asignado

SOLUCIÓN REQUERIDA:
1. Crear cron job que corra cada hora
2. Buscar suscripciones donde expires_at < now() AND status = 'active'
3. Si tiene scheduled_downgrade_plan_id:
   - Crear nueva suscripción con ese plan
   - Actualizar organizations.plan_id
4. Si NO tiene scheduled_downgrade_plan_id:
   - ¿Bajar a FREE automáticamente? ¿O bloquear acceso?
```

#### GAP 2: RENOVACIÓN AUTOMÁTICA
```
❌ No hay suscripciones recurrentes reales

PROBLEMA:
- PayPal y MP se usan como pagos únicos, no suscripciones
- Al expirar la suscripción, el usuario debe pagar manualmente
- No hay cobro automático del siguiente período

NOTA:
- Esto puede ser INTENCIONAL (pago manual más control)
- Pero debe documentarse claramente
- Y notificar al usuario antes de expiración
```

#### GAP 3: NOTIFICACIONES DE EXPIRACIÓN
```
❌ No hay emails/notificaciones antes de expiración

PROBLEMA:
- Usuario no sabe que su suscripción está por expirar
- No hay recordatorio a 7 días, 3 días, 1 día
- No hay email post-expiración

SOLUCIÓN REQUERIDA:
1. Cron job diario que busque suscripciones próximas a expirar
2. Enviar email a 7, 3, 1 días antes
3. Enviar email cuando expire
4. Mostrar banner en dashboard
```

#### GAP 4: QUÉ PASA CON LOS DATOS AL BAJAR DE PLAN
```
❌ No hay manejo de exceso de datos al hacer downgrade

PROBLEMA EJEMPLO - TEAMS → FREE:
- Usuario tiene 15 miembros en TEAMS
- Hace downgrade a FREE (1 usuario)
- ¿Qué pasa con los otros 14 miembros?
- ¿Se desactivan? ¿Se borran? ¿Cuáles?

PROBLEMA EJEMPLO - PRO → FREE:
- Usuario tiene 30 proyectos en PRO
- FREE permite solo 4 proyectos
- ¿Cuáles se archivan? ¿Se bloquean?

SOLUCIÓN REQUERIDA:
1. Definir política de retención
2. Antes de downgrade, mostrar warning:
   "Tienes 15 miembros. FREE permite 1. Los siguientes miembros serán desactivados..."
3. Implementar lógica de downgrade que:
   - Archive proyectos excedentes (no borre)
   - Desactive miembros excedentes (no borre)
   - Notifique a usuarios afectados
```

#### GAP 5: VALIDACIÓN PRE-DOWNGRADE
```
❌ No hay validación de límites antes de programar downgrade

PROBLEMA:
- Usuario puede programar downgrade TEAMS → FREE
- Aunque tenga 50 proyectos y 20 miembros
- No hay warning ni bloqueo

SOLUCIÓN REQUERIDA:
1. Antes de schedule-downgrade, validar:
   - Cantidad de proyectos vs límite del plan target
   - Cantidad de miembros vs límite del plan target
   - Storage usado vs límite del plan target
2. Mostrar modal con impacto:
   "Al cambiar a FREE:
    - 46 proyectos serán archivados
    - 19 miembros serán desactivados
    - 45GB de archivos quedarán de solo lectura"
```

#### GAP 6: MANEJO DE FALLAS DE PAGO
```
❌ No hay proceso para pagos fallidos

PROBLEMA:
- Si el webhook de PayPal/MP falla, ¿qué pasa?
- Si hay un error en upgradeOrganizationPlan, ¿se reintenta?
- ¿Hay dead letter queue para webhooks fallidos?

SOLUCIÓN REQUERIDA:
1. Reintentos automáticos de webhooks fallidos
2. Cola de procesamiento con backoff exponencial
3. Alertas a admin si falla después de N intentos
4. Panel de admin para ver pagos pendientes de procesar
```

#### GAP 7: SINCRONIZACIÓN organizations.plan_id
```
⚠️ Posible desincronización entre organization_subscriptions y organizations.plan_id

PROBLEMA:
- organizations.plan_id es denormalizado para queries rápidas
- Si upgradeOrganizationPlan falla parcialmente, puede quedar desincronizado
- No hay proceso de reconciliación

SOLUCIÓN REQUERIDA:
1. Usar transacciones donde sea posible
2. Crear job de reconciliación diario
3. El job compara organizations.plan_id con la suscripción activa más reciente
```

---

## 8. COMPONENTE PlanRestricted

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

**Determina plan requerido:**
```typescript
const getRequiredPlan = (): 'pro' | 'teams' => {
  const teamsFeatures = ['max_members', 'team_collaboration', 'advanced_permissions'];
  if (teamsFeatures.some(f => feature.includes(f))) return 'teams';
  return 'pro';
};
```

---

## 9. CONFIGURACIÓN DE PLANES

**Ubicación:** `src/features/shared-content/pricing/data/plans-config.ts`

```typescript
export const plansConfig: Record<PlanSlug, PlanConfig> = {
  'free': {
    icon: Folder,
    iconColor: '#84cc16',  // Verde lima
    features: ['Gestión de proyectos', 'Seguimiento de obra', 'Finanzas generales', ...],
    limits: [
      { iconComponent: Folder, value: '4 proyectos' },
      { iconComponent: HardDrive, value: '500 MB' },
      { iconComponent: Bot, value: 'Resúmenes básicos' },
      { iconComponent: Users, value: '1 usuario' }
    ]
  },
  'pro': {
    icon: Bot,
    iconColor: '#0047AB',  // Azul
    features: ['Todo en Free', 'PDFs personalizables', 'Tokens IA avanzados', ...],
    limits: [
      { iconComponent: Folder, value: '50 proyectos' },
      { iconComponent: HardDrive, value: '50 GB' },
      { iconComponent: Bot, value: '10,000 tokens/mes' },
      { iconComponent: Users, value: '1 usuario' }
    ]
  },
  'teams': {
    icon: Users,
    iconColor: '#8B5CF6',  // Morado
    features: ['Todo en Pro', 'Miembros ilimitados', 'Tokens IA ilimitados', ...],
    limits: [
      { iconComponent: Folder, value: 'Ilimitados' },
      { iconComponent: HardDrive, value: '500 GB' },
      { iconComponent: Bot, value: 'Ilimitados' },
      { iconComponent: Users, value: 'Ilimitados' }
    ]
  }
};
```

---

## 10. CHECKLIST PRE-LANZAMIENTO

### ✅ Listo para Producción:
- [x] Flujo de upgrade PayPal funciona
- [x] Flujo de upgrade MP funciona
- [x] Programación de downgrade funciona
- [x] Cancelación de suscripción funciona
- [x] Historial de facturación visible
- [x] Conversión USD→ARS funciona
- [x] Idempotencia en webhooks
- [x] Resolución auth_id → users.id
- [x] Restricción de features por plan (UI)

### 🔴 Requiere Implementación ANTES de Lanzamiento:
- [ ] **CRÍTICO**: Cron job para ejecutar downgrades automáticos
- [ ] **CRÍTICO**: Notificaciones de expiración (email)
- [ ] **ALTO**: Validación pre-downgrade (límites excedidos)
- [ ] **ALTO**: Manejo de datos excedentes al bajar de plan

### 🟡 Puede Lanzarse Sin Esto (Pero Recomendado):
- [ ] Panel admin para ver pagos pendientes
- [ ] Reconciliación de plan_id
- [ ] Dead letter queue para webhooks
- [ ] Métricas de suscripciones (MRR, churn, etc.)

---

## 11. RECOMENDACIONES PARA LANZAMIENTO

### Opción A: Lanzamiento Mínimo Viable
1. Documentar que **renovación es manual** (usuario debe pagar de nuevo)
2. Crear endpoint simple para **ejecutar downgrade manualmente** (admin)
3. Agregar **banner en dashboard** si suscripción expira en <7 días
4. Lanzar con estos 3 items

### Opción B: Lanzamiento Robusto
1. Implementar **cron job de expiración** (1-2 horas de trabajo)
2. Implementar **emails de recordatorio** (2-3 horas con Resend)
3. Implementar **modal de impacto pre-downgrade** (2-3 horas)
4. Probar todo el flujo end-to-end

---

## 12. ARCHIVOS CLAVE PARA REFERENCIA

```
server/
├── routes/
│   ├── subscriptions.ts          # Endpoints de suscripción
│   ├── payments.ts               # Rutas de checkout PayPal/MP
│   └── billing.ts                # Historial de facturación
├── lib/
│   ├── handlers/checkout/
│   │   ├── paypal/
│   │   │   ├── createSubscriptionOrder.ts
│   │   │   ├── captureSubscriptionOrder.ts
│   │   │   └── processWebhook.ts
│   │   ├── mp/
│   │   │   ├── createSubscriptionPreference.ts
│   │   │   └── processWebhook.ts
│   │   └── shared/
│   │       ├── subscriptions.ts  # upgradeOrganizationPlan()
│   │       └── payments.ts       # insertPayment()
│   └── billing/
│       └── events.ts             # registerMemberEvent()

src/
├── features/
│   ├── shared-content/pricing/
│   │   ├── PricingContent.tsx
│   │   ├── components/
│   │   │   ├── PlanCard.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   └── FounderBanner.tsx
│   │   └── data/
│   │       └── plans-config.ts
│   └── users/components/plans/
│       └── PlanRestricted.tsx

shared/
└── schema.ts                     # Definiciones de tablas Drizzle
```

---

## 13. GLOSARIO

| Término | Definición |
|---------|------------|
| `billing_period` | 'monthly' o 'annual' |
| `billable_seats` | Miembros que se cobran (vs invitados gratis) |
| `scheduled_downgrade_plan_id` | Plan al que se baja cuando expire |
| `expires_at` | Fecha en que termina la suscripción actual |
| `organization_billing_cycles` | Snapshot histórico de cada facturación |
| `PlanRestricted` | Componente que bloquea UI si el plan no lo permite |

---

**Documento generado para revisión por GPT, Gemini y equipo de desarrollo.**
**Fecha: 29 de Noviembre, 2025**
