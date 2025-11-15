# 📋 Análisis COMPLETO del Sistema de Suscripciones - Organizaciones

**Fecha**: 12 de Noviembre, 2025  
**Objetivo**: Lanzar mañana con funcionalidad básica de suscripciones  
**Última actualización**: Con todas las tablas de Supabase

---

## 📊 ESTRUCTURA DE BASE DE DATOS ACTUAL

### ✅ Tablas Existentes y Su Rol

#### **1. ORGANIZATIONS** (Core)
```sql
- id (uuid, PK)
- name (text)
- created_by (uuid, FK users)
- plan_id (uuid, FK plans) ← CLAVE: Vincula al plan actual
- is_active (boolean)
- is_system (boolean)
- logo_url (text)
- created_at, updated_at
```
**Estado**: ✅ Lista para suscripciones

---

#### **2. PLANS** (Catálogo de Planes)
```sql
- id (uuid, PK)
- name (text, UNIQUE) ← 'Free', 'Pro', 'Teams', 'Enterprise'
- features (jsonb) ← Definición completa de límites y permisos
- price (numeric) ← Precio base (probablemente mensual)
- is_active (boolean)
- billing_type (text) ← 'per_user', 'flat', etc.
```
**Estado**: ✅ Lista, pero necesitamos verificar:
- ¿Tiene columnas `price_monthly` y `price_annual`?
- ¿O solo `price` y se calcula anual = price * 12 * 0.8?

**PENDIENTE**: Verificar si necesitamos tabla `plan_prices` similar a `course_prices`

---

#### **3. PAYMENTS** (Registro de Pagos)
```sql
- id (uuid, PK)
- provider (text) ← 'mercadopago', 'paypal', 'bank_transfer'
- provider_payment_id (text)
- user_id (uuid, FK users) ← Usuario que pagó
- course_id (uuid, nullable) ← Para pagos de cursos
- product_type (text) ← 'course' | 'subscription' | 'plan' ← 🎯 CLAVE
- product_id (uuid) ← ID del plan o curso
- organization_id (uuid) ← 🎯 Para suscripciones de org
- approved_at (timestamp)
- metadata (jsonb) ← Datos adicionales
- amount (numeric)
- currency (text)
- status (text) ← 'completed', 'pending', 'failed'
- created_at
```
**Estado**: ✅ ✅ ¡PERFECTA! Ya soporta suscripciones
- Columna `product_type` para diferenciar
- Columna `organization_id` para vincular
- Columna `metadata` para billing_period, etc.

---

#### **4. PAYMENT_EVENTS** (Webhooks)
```sql
- id (uuid, PK)
- provider (text)
- provider_event_id (text)
- provider_event_type (text)
- status (text)
- raw_payload (jsonb)
- raw_headers (jsonb)
- order_id (text)
- custom_id (text)
- user_hint (text)
- course_hint (text)
- provider_payment_id (text)
- amount, currency
- created_at
```
**Estado**: ✅ Lista para recibir webhooks de suscripciones

---

#### **5. BANK_TRANSFER_PAYMENTS** (Transferencias)
```sql
- id (uuid, PK)
- order_id (uuid)
- user_id (uuid, FK users)
- course_id (uuid, nullable)
- payment_id (uuid, FK payments)
- amount, currency
- receipt_url (text)
- payer_name, payer_note
- status ('pending', 'approved', 'rejected')
- reviewed_by, reviewed_at, review_reason
- discount_percent (default 5%)
- discount_amount
- created_at, updated_at
```
**Estado**: ⚠️ Funciona para cursos, PUEDE funcionar para suscripciones
- `course_id` es nullable, así que no hay problema
- El `payment_id` vincula a `payments` que tiene `organization_id`

**PENDIENTE**: Decidir si agregar `organization_id` directo aquí también

---

#### **6. BILLING_PROFILES** (Datos Facturación)
```sql
- id (uuid, PK)
- user_id (uuid, FK users, UNIQUE)
- is_company (boolean)
- full_name, company_name
- tax_id
- country_id (FK countries)
- address_line1, city, postcode
- created_at, updated_at
```
**Estado**: ✅ Lista, vinculada a usuarios
- Para suscripciones, usamos billing_profile del admin que paga

---

#### **7. COURSE_ENROLLMENTS** (Solo referencia)
```sql
- user_id, course_id (UNIQUE)
- status ('active', 'expired', etc.)
- started_at, expires_at ← Concepto reutilizable
```
**Aprendizaje**: Similar a lo que necesitamos para suscripciones

---

### 📊 Vista: ORGANIZATION_BILLING_SUMMARY

```sql
Columnas:
- organization_id (uuid)
- organization_name (text)
- plan_name (text)
- price (numeric)
- billing_type (text)
- active_members (bigint)
- monthly_cost (numeric) ← CALCULADO: price * members si billing_type='per_user'
```

**Estado**: ✅ ✅ ¡SÚPER ÚTIL!
- Ya calcula el costo mensual
- Cuenta miembros activos
- Perfecto para dashboard de facturación

---

### 📊 Vista: COURSE_ACTIVE_PRICES (Referencia)
Similar a lo que podríamos necesitar para planes:
```sql
- course_id
- currency_code ('ARS', 'USD', 'EUR')
- amount
- provider ('mercadopago', 'paypal', 'any')
```

---

## ❌ LO QUE FALTA EN BASE DE DATOS

### 🔴 CRÍTICO: Tabla `ORGANIZATION_SUBSCRIPTIONS`

Necesitamos un **historial** de suscripciones para:
- Saber cuándo expira el plan actual
- Tracking de renovaciones
- Cancelaciones
- Historial de cambios de plan

```sql
CREATE TABLE organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  payment_id UUID REFERENCES payments(id), -- Vincula al pago que activó
  
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  billing_period TEXT NOT NULL, -- 'monthly', 'annual'
  
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Solo una suscripción activa por organización
  CONSTRAINT org_subscriptions_unique_active 
    UNIQUE(organization_id) 
    WHERE status = 'active'
);

CREATE INDEX idx_org_subs_org ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subs_status ON organization_subscriptions(status);
CREATE INDEX idx_org_subs_expires ON organization_subscriptions(expires_at);
```

**Razón**: 
- `organizations.plan_id` solo dice el plan actual
- No sabemos CUÁNDO expira
- No hay historial

---

### 🟡 OPCIONAL: Tabla `PLAN_PRICES`

Similar a `course_prices`, para múltiples monedas:

```sql
CREATE TABLE plan_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) NOT NULL,
  currency_code TEXT NOT NULL CHECK (currency_code IN ('ARS', 'USD', 'EUR')),
  monthly_amount NUMERIC(10,2) NOT NULL,
  annual_amount NUMERIC(10,2) NOT NULL,
  provider TEXT DEFAULT 'any',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT plan_prices_unique 
    UNIQUE(plan_id, currency_code, provider)
);
```

**Alternativa simple** (recomendada para MVP):
- Agregar columnas a `plans`:
  - `price_monthly_usd`, `price_annual_usd`
  - `price_monthly_ars`, `price_annual_ars`
- O simplemente: `price_annual = price_monthly * 12 * 0.8`

---

## ✅ LO QUE YA TENEMOS - FRONTEND

### 1. **Página de Pricing** ✅
- **Archivo**: `src/pages/PricingPlan.tsx`
- **Features**:
  - 4 planes: FREE, PRO, TEAMS, ENTERPRISE
  - Toggle Mensual/Anual con descuento 20%
  - Comparación completa de features
  - Banner "Oferta Fundador"
  
**PROBLEMA**: Botones deshabilitados para Pro/Teams
```tsx
disabled={plan.name.toLowerCase() === 'pro' || plan.name.toLowerCase() === 'teams'}
```

---

### 2. **Sistema de Restricciones** ✅
- **Archivo**: `src/hooks/usePlanFeatures.ts`
  - `can(feature)`: Verifica permisos
  - `limit(feature)`: Devuelve límites numéricos
  - Lee desde `organization.plan.features`

- **Archivo**: `src/components/ui-custom/security/PlanRestricted.tsx`
  - Bloquea UI con overlay
  - Muestra badge "Requiere Plan Pro/Teams"
  - Redirige a `/pricing`

---

### 3. **Checkout de Cursos** ✅ (REUTILIZABLE)
- **Archivo**: `src/pages/checkout/CheckoutPage.tsx`
- **Providers**:
  - MercadoPago (ARS)
  - PayPal (USD)
  - Transferencia Bancaria (+5% descuento)
- **Features**:
  - Cupones
  - Facturación opcional
  - Upload de comprobantes
  - Validación de sesión

**Plan**: Duplicar como `SubscriptionCheckoutPage.tsx`

---

## ✅ LO QUE YA TENEMOS - BACKEND

### 1. **Endpoints de Pagos** ✅
- **Archivo**: `server/routes/payments.ts`

**Endpoints actuales**:
```typescript
POST /api/checkout/mp/create          // MercadoPago cursos
POST /api/paypal/create-order         // PayPal cursos
POST /api/checkout/free-enroll        // Cupón 100%
POST /api/webhooks/mp                 // Webhook MP
POST /api/paypal/webhook              // Webhook PayPal
POST /api/checkout/transfer/create    // Transferencia bancaria
```

**Helpers existentes**:
- `enrollUserInCourse()` ← Similar a lo que necesitamos
- `logPayPalPayment()`
- `createBankTransferOrder()`

---

## ❌ LO QUE FALTA - FRONTEND

### 🔴 1. Página de Checkout Suscripciones
**Crear**: `src/pages/checkout/SubscriptionCheckoutPage.tsx`

**Diferencias vs CheckoutPage**:
- URL params: `?plan=pro&billing=annual`
- Cargar precio desde `plans` (no `course_prices`)
- Metadata:
  ```js
  {
    product_type: 'subscription',
    organization_id: currentOrgId,
    plan_id: planId,
    billing_period: 'monthly' | 'annual'
  }
  ```

---

### 🟡 2. Vincular Botones de Pricing
**Modificar**: `src/pages/PricingPlan.tsx`

```tsx
<Button
  onClick={() => {
    if (plan.name === 'Free') {
      navigate('/organization/dashboard');
    } else {
      navigate(
        `/checkout/subscription?plan=${plan.slug}&billing=${billingPeriod}`
      );
    }
  }}
  disabled={false} // QUITAR disabled
>
  {billingPeriod === 'annual' ? 'Ser Fundador' : 'Comenzar ahora'}
</Button>
```

---

### 🟡 3. Dashboard de Suscripción
**Ubicación sugerida**: `src/pages/organization/OrganizationBilling.tsx`

**Mostrar**:
- Plan actual
- Próxima fecha de renovación (`expires_at`)
- Costo mensual (usar vista `ORGANIZATION_BILLING_SUMMARY`)
- Botón "Upgrade Plan"
- Historial de pagos

---

## ❌ LO QUE FALTA - BACKEND

### 🔴 1. Endpoints Nuevos
**Archivo**: `server/routes/payments.ts`

```typescript
// MercadoPago Suscripciones
POST /api/checkout/subscription/mp/create
Body: { plan_slug, organization_id, billing_period }

// PayPal Suscripciones  
POST /api/paypal/subscription/create-order
Body: { plan_slug, organization_id, billing_period }

// Transferencia Suscripciones
POST /api/checkout/subscription/transfer/create
Body: { plan_slug, organization_id, billing_period, ... }
```

---

### 🔴 2. Función Helper: `upgradeOrganizationPlan()`

```typescript
async function upgradeOrganizationPlan(params: {
  organization_id: string;
  plan_id: string;
  billing_period: 'monthly' | 'annual';
  payment_id: string;
  amount: number;
  currency: string;
}) {
  // 1. Cancelar suscripción activa anterior (si existe)
  await db
    .update(organization_subscriptions)
    .set({ status: 'cancelled', cancelled_at: new Date() })
    .where(
      and(
        eq(organization_subscriptions.organization_id, params.organization_id),
        eq(organization_subscriptions.status, 'active')
      )
    );

  // 2. Calcular expires_at
  const expiresAt = new Date();
  if (params.billing_period === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  // 3. Crear nueva suscripción activa
  await db.insert(organization_subscriptions).values({
    organization_id: params.organization_id,
    plan_id: params.plan_id,
    payment_id: params.payment_id,
    status: 'active',
    billing_period: params.billing_period,
    expires_at: expiresAt,
    amount: params.amount,
    currency: params.currency,
  });

  // 4. Actualizar organizations.plan_id
  await db
    .update(organizations)
    .set({ plan_id: params.plan_id })
    .where(eq(organizations.id, params.organization_id));

  // 5. Crear notificación para el admin
  // ... código de notificación

  return { success: true };
}
```

---

### 🔴 3. Modificar Webhooks
**Archivos**: Handlers de MP y PayPal

**Detectar tipo de producto**:
```typescript
// En el webhook
const payment = await db
  .select()
  .from(payments)
  .where(eq(payments.provider_payment_id, webhookPaymentId))
  .limit(1);

if (payment.product_type === 'subscription') {
  // Llamar a upgradeOrganizationPlan()
  await upgradeOrganizationPlan({
    organization_id: payment.organization_id,
    plan_id: payment.product_id,
    billing_period: payment.metadata.billing_period,
    payment_id: payment.id,
    amount: payment.amount,
    currency: payment.currency,
  });
} else if (payment.product_type === 'course') {
  // Llamar a enrollUserInCourse() (existente)
  await enrollUserInCourse(...);
}
```

---

## 🎯 PLAN DE ACCIÓN (Orden Sugerido)

### ✅ PASO 1: Base de Datos (30 min)
1. Crear tabla `organization_subscriptions`
2. Verificar columnas en `plans` (price_monthly, price_annual)
3. Agregar `organization_id` a `bank_transfer_payments` (opcional)

---

### ✅ PASO 2: Backend - Helper (1 hora)
4. Implementar función `upgradeOrganizationPlan()`
5. Agregar a `shared/schema.ts` el schema de `organization_subscriptions`

---

### ✅ PASO 3: Backend - Endpoints (2 horas)
6. Endpoint MercadoPago suscripciones
7. Endpoint PayPal suscripciones
8. Endpoint Transferencia suscripciones
9. Modificar webhooks para detectar `product_type === 'subscription'`

---

### ✅ PASO 4: Frontend - Checkout (2 horas)
10. Crear `SubscriptionCheckoutPage.tsx` (copiar CheckoutPage)
11. Adaptar para recibir `plan` en query params
12. Cambiar lógica de precio (de course_prices a plans)
13. Agregar ruta en `App.tsx`

---

### ✅ PASO 5: Frontend - Pricing (30 min)
14. Habilitar botones en `PricingPlan.tsx`
15. Vincular navegación a checkout

---

### ✅ PASO 6: Testing (1 hora)
16. Probar flujo MercadoPago sandbox
17. Probar flujo PayPal sandbox
18. Verificar actualización de `organizations.plan_id`
19. Verificar creación en `organization_subscriptions`

---

### ⭐ PASO 7: Extras (Post-MVP)
20. Dashboard de facturación (usar `ORGANIZATION_BILLING_SUMMARY`)
21. Botón "Upgrade Plan" en OrganizationPreferences
22. Email de confirmación
23. Notificaciones de expiración

---

## 💡 DECISIONES DE DISEÑO

### Para el MVP de Mañana:

1. **NO renovación automática**
   - Evita complejidad de recurring payments
   - Usuario renueva manualmente

2. **Un plan activo por organización**
   - UNIQUE constraint en suscripciones donde `status='active'`

3. **No downgrades automáticos**
   - Si expira, vuelve a FREE
   - Se bloquean features pero no se pierden datos

4. **Reutilizar checkout al 100%**
   - Misma UI, solo cambia metadata

5. **No cupones en suscripciones**
   - Simplifica MVP
   - Se puede agregar después

6. **Precios hardcodeados o simples**
   - `price_annual = price_monthly * 12 * 0.8`
   - O usar tabla `plan_prices` si ya existe

---

## 📝 PREGUNTAS PARA EL USUARIO

1. **¿La tabla `plans` tiene columnas separadas para precio mensual y anual?**
   - O calculamos: annual = monthly * 12 * 0.8

2. **¿Necesitamos soporte multi-moneda en planes?**
   - Igual que cursos (ARS para MP, USD para PayPal)
   - O solo USD

3. **¿El descuento 5% de transferencia aplica también a suscripciones?**

4. **¿Solo el admin puede upgradear el plan?**
   - O cualquier miembro de la org

5. **¿Necesitamos dashboard de facturación para este lanzamiento?**
   - O solo el checkout

---

## ✨ TABLA DE COMPATIBILIDAD

| Feature | Cursos | Suscripciones | Estado |
|---------|--------|---------------|--------|
| MercadoPago | ✅ | 🔴 Falta endpoint | 80% listo |
| PayPal | ✅ | 🔴 Falta endpoint | 80% listo |
| Transferencia | ✅ | 🔴 Falta endpoint | 80% listo |
| Webhooks | ✅ | 🔴 Falta detección | 90% listo |
| Tabla payments | ✅ | ✅ Ya soporta | 100% |
| Cupones | ✅ | ❌ No en MVP | 0% |
| Facturación | ✅ | ✅ Reutilizar | 100% |
| UI Checkout | ✅ | 🔴 Falta página | 5% |
| Historial | ✅ enrollments | 🔴 Falta tabla subs | 0% |

---

**¿Por dónde empezamos?** 🚀
