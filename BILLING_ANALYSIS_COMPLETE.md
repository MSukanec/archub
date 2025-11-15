# 📊 ANÁLISIS COMPLETO: Sistema de Facturación de Suscripciones

**Fecha**: 14 de Noviembre, 2025
**Objetivo**: Entender el estado actual y definir arquitectura para facturación por miembro (TEAMS)

---

## 🎯 TU PREGUNTA

> "¿Deberíamos hacer una tabla o vista en Supabase para calcular lo que tiene que pagar una organización en su próxima factura? Entiendo que en TEAMS se factura POR USUARIO, y cuando se agrega/elimina un usuario se actualiza el monto. Todo debe ser prorrateable y considerar el flag `is_billable`."

**RESPUESTA CORTA**: SÍ, necesitas:
1. ✅ **Tabla** para registrar eventos de cambios de membresía (join/leave/toggle is_billable)
2. ✅ **Vista o Función** para calcular la próxima factura con prorrateamiento
3. ✅ **Servicio de facturación** en el backend que use estos datos

---

## ✅ ESTADO ACTUAL: QUÉ TENEMOS IMPLEMENTADO

### 📋 1. BASE DE DATOS - Tablas Clave

#### **ORGANIZATIONS** (Tabla principal)
```sql
- id (uuid)
- name (text)
- plan_id (uuid) ← Vincula al plan actual
- created_by (uuid)
- is_active (boolean)
```
**Estado**: ✅ Funcionando perfectamente

---

#### **PLANS** (Catálogo de Planes)
```sql
- id (uuid)
- name (text) ← 'Free', 'Pro', 'Teams', 'Enterprise'
- slug (text) ← 'free', 'pro', 'teams', 'enterprise'
- monthly_amount (numeric) ← Precio base mensual en USD
- annual_amount (numeric) ← Precio base anual en USD
- billing_type (text) ← 'per_user' | 'flat'
- features (jsonb) ← Límites y permisos
- is_active (boolean)
```
**Estado**: ✅ Funcionando
**⚠️ IMPORTANTE**: 
- Los precios están en USD como base
- `billing_type = 'per_user'` para TEAMS
- `billing_type = 'flat'` para FREE, PRO, ENTERPRISE

---

#### **PLAN_PRICES** (Precios Multi-Moneda)
```sql
- id (uuid)
- plan_id (uuid)
- currency_code (text) ← 'ARS', 'USD', 'EUR'
- monthly_amount (numeric) ← Precio mensual en esa moneda
- annual_amount (numeric) ← Precio anual en esa moneda
- provider (text) ← 'mercadopago', 'paypal', 'any'
- is_active (boolean)
```
**Estado**: ✅ Tabla creada
**Uso**: Permite tener precios diferentes para cada moneda y proveedor

---

#### **ORGANIZATION_SUBSCRIPTIONS** (Historial de Suscripciones)
```sql
- id (uuid)
- organization_id (uuid)
- plan_id (uuid)
- payment_id (uuid) ← FK a payments, vincula al pago que activó
- status (text) ← 'active', 'expired', 'cancelled'
- billing_period (text) ← 'monthly', 'annual'
- started_at (timestamp)
- expires_at (timestamp) ← Fecha de renovación
- cancelled_at (timestamp)
- amount (numeric) ← Monto pagado
- currency (text)
- created_at, updated_at
```
**Estado**: ✅ Tabla creada en Supabase
**⚠️ PROBLEMA**: NO está en `shared/schema.ts` (Drizzle), solo existe en Supabase
**Constraint**: Solo UNA suscripción activa por organización

---

#### **ORGANIZATION_MEMBERS** (Miembros de la Org)
```sql
- id (uuid)
- organization_id (uuid)
- user_id (uuid)
- role_id (uuid)
- is_active (boolean)
- is_billable (boolean) ← ✅ RECIÉN AGREGADO al schema
- joined_at (timestamp)
- last_active_at (timestamp)
- created_at, updated_at
```
**Estado**: ✅ Ahora en schema.ts
**⚠️ CRÍTICO**: `is_billable` controla si un miembro se factura o no, pero:
- **NO se usa en ningún endpoint de checkout**
- **NO se usa en cálculos de precio**
- Es solo un flag que existe pero no afecta nada todavía

---

#### **PAYMENTS** (Registro Unificado de Pagos)
```sql
- id (uuid)
- provider (text) ← 'mercadopago', 'paypal', 'bank_transfer'
- provider_payment_id (text)
- user_id (uuid) ← Usuario que pagó
- course_id (uuid, nullable) ← Para cursos
- product_type (text) ← 'course' | 'subscription' ✅
- product_id (uuid) ← ID del plan
- organization_id (uuid) ← ✅ Para suscripciones
- amount (numeric)
- currency (text)
- status (text)
- metadata (jsonb) ← billing_period, etc.
- approved_at (timestamp)
```
**Estado**: ✅ ✅ PERFECTA, ya soporta suscripciones
**Uso**: Almacena todos los pagos (cursos y suscripciones)

---

### 🔄 2. BACKEND - Endpoints Implementados

#### **Checkout de Suscripciones**
```
POST /api/checkout/mp/create-subscription
POST /api/checkout/paypal/create-subscription-order
```
**Estado**: ✅ Implementados
**Qué hacen**:
1. Validan que el usuario es admin de la organización
2. Obtienen precio del plan desde `plans.monthly_amount` o `annual_amount`
3. Si es ARS, convierten usando `exchange_rates`
4. Crean preferencia en MercadoPago o PayPal
5. **⚠️ PROBLEMA: Cobran precio FLAT del plan, NO multiplican por número de miembros**

---

#### **Webhooks (Confirmación de Pago)**
```
POST /api/mp/webhook
POST /api/paypal/webhook
```
**Estado**: ✅ Funcionan para suscripciones
**Qué hacen**:
1. Reciben confirmación de pago
2. Llaman a `upgradeOrganizationPlan()` si `product_type === 'subscription'`

---

#### **Helper: upgradeOrganizationPlan()**
**Ubicación**: `api/lib/handlers/checkout/shared/subscriptions.ts`

**Qué hace**:
```typescript
1. Cancela la suscripción activa anterior (status='expired')
2. Calcula expires_at:
   - Monthly: +1 mes desde ahora
   - Annual: +1 año desde ahora
3. Crea nueva suscripción en organization_subscriptions
4. Actualiza organizations.plan_id
```

**⚠️ PROBLEMAS**:
- No considera miembros billables
- No hace prorrateamiento
- No registra eventos de cambios de membresía
- Asume que `amount` viene correcto del webhook (pero checkout no lo calcula bien)

---

#### **Gestión de Suscripciones**
```
GET /api/subscriptions/current
POST /api/subscriptions/schedule-downgrade
DELETE /api/subscriptions/cancel-scheduled-downgrade
POST /api/subscriptions/[id]/cancel
```
**Estado**: ✅ Implementados
**Uso**: 
- Ver suscripción actual
- Programar downgrade al expirar
- Cancelar downgrade programado
- Cancelar suscripción (sigue activa hasta expires_at)

---

### 💻 3. FRONTEND - Páginas Implementadas

#### **Página de Pricing**
**Ubicación**: `src/pages/settings/PricingPlan.tsx`
**Estado**: ✅ Muestra 4 planes con toggle Monthly/Annual
**⚠️ PROBLEMA**: Botones de TEAMS probablemente apuntan a checkout pero no muestran costo por miembro

#### **Checkout de Suscripciones**
**Ubicación**: `src/pages/checkout/SubscriptionCheckout.tsx`
**Estado**: ✅ Existe y funciona
**Features**:
- MercadoPago (ARS)
- PayPal (USD)
- Transferencia bancaria
- Muestra precio del plan

---

## ❌ LO QUE FALTA: Facturación por Miembro

### 🔴 PROBLEMA CRÍTICO #1: No se Usa `is_billable`

**Situación actual**:
```typescript
// En createSubscriptionPreference.ts
const unit_price = billing_period === 'monthly' 
  ? plan.monthly_amount 
  : plan.annual_amount;

// ❌ NO multiplica por número de miembros
// ❌ NO filtra por is_billable
```

**Lo que debería hacer**:
```typescript
// 1. Contar miembros billables
const { data: billableCount } = await supabase
  .from('organization_members')
  .select('id', { count: 'exact' })
  .eq('organization_id', organization_id)
  .eq('is_active', true)
  .eq('is_billable', true);  // ✅ Filtrar por billable

// 2. Calcular precio total
let unit_price = billing_period === 'monthly' 
  ? plan.monthly_amount 
  : plan.annual_amount;

if (plan.billing_type === 'per_user') {
  unit_price = unit_price * billableCount;  // ✅ Multiplicar
}
```

---

### 🔴 PROBLEMA CRÍTICO #2: No Hay Prorrateamiento

**Escenario**: Organización en plan TEAMS paga $20/mes por usuario
- 1 de Nov: Suscripción activa con 5 miembros billables → Pago: $100
- 15 de Nov: Se agrega 1 miembro nuevo
- 20 de Nov: Se elimina 1 miembro
- **¿Cuánto debe pagar el 1 de Diciembre?**

**Respuesta esperada con prorrateamiento**:
```
Base: 5 miembros × $20 = $100
Ajuste: +1 miembro × $20 × (16 días / 30 días) = +$10.67
Ajuste: -1 miembro × $20 × (11 días / 30 días) = -$7.33
TOTAL próxima factura: $103.34
```

**Problema actual**: 
- ❌ No se registran eventos de join/leave
- ❌ No hay tabla para tracking de cambios
- ❌ No hay lógica de prorrateamiento

---

### 🔴 PROBLEMA CRÍTICO #3: No Hay Historial de Eventos

**Necesitamos saber**:
- ¿Cuándo se agregó un miembro?
- ¿Cuándo se eliminó?
- ¿Cuándo se cambió `is_billable` de `true` a `false`?

**Sin esto es IMPOSIBLE hacer prorrateamiento correcto**

---

## 🏗️ ARQUITECTURA PROPUESTA: Solución Completa

### 📋 1. Nueva Tabla: `organization_member_events`

```sql
CREATE TABLE organization_member_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID REFERENCES organization_subscriptions(id),
  member_id UUID NOT NULL REFERENCES organization_members(id),
  user_id UUID REFERENCES users(id),
  
  event_type TEXT NOT NULL, -- 'member_added', 'member_removed', 'billable_enabled', 'billable_disabled'
  
  -- Estado antes del evento
  was_billable BOOLEAN,
  -- Estado después del evento
  is_billable BOOLEAN,
  
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_member_events_org ON organization_member_events(organization_id);
CREATE INDEX idx_member_events_subscription ON organization_member_events(subscription_id);
CREATE INDEX idx_member_events_date ON organization_member_events(event_date);
```

**Cuándo registrar eventos**:
1. Cuando se agrega un miembro a la org → `member_added`
2. Cuando se elimina un miembro → `member_removed`
3. Cuando un admin cambia `is_billable` de `true` a `false` → `billable_disabled`
4. Cuando un admin cambia `is_billable` de `false` a `true` → `billable_enabled`

---

### 📋 2. Nueva Tabla: `organization_billing_cycles`

```sql
CREATE TABLE organization_billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id),
  
  cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
  cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  base_billable_members INTEGER NOT NULL, -- Miembros al inicio del ciclo
  current_billable_members INTEGER NOT NULL, -- Miembros actuales
  
  base_amount NUMERIC(10,2) NOT NULL,
  proration_adjustment NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Cuándo crear**:
- Al crear una nueva suscripción
- Al renovar una suscripción

---

### 📊 3. Vista o Función: Cálculo de Próxima Factura

#### **Opción A: Vista SQL**
```sql
CREATE OR REPLACE VIEW organization_next_invoice AS
SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  s.id AS subscription_id,
  s.plan_id,
  p.name AS plan_name,
  p.billing_type,
  s.billing_period,
  s.expires_at AS next_billing_date,
  
  -- Contar miembros billables actuales
  (SELECT COUNT(*) 
   FROM organization_members 
   WHERE organization_id = o.id 
     AND is_active = true 
     AND is_billable = true
  ) AS current_billable_members,
  
  -- Precio base por miembro
  CASE 
    WHEN s.billing_period = 'monthly' THEN p.monthly_amount
    ELSE p.annual_amount
  END AS price_per_member,
  
  -- Total base (sin prorrateamiento)
  CASE 
    WHEN p.billing_type = 'per_user' THEN
      (SELECT COUNT(*) 
       FROM organization_members 
       WHERE organization_id = o.id 
         AND is_active = true 
         AND is_billable = true
      ) * CASE 
            WHEN s.billing_period = 'monthly' THEN p.monthly_amount
            ELSE p.annual_amount
          END
    ELSE
      CASE 
        WHEN s.billing_period = 'monthly' THEN p.monthly_amount
        ELSE p.annual_amount
      END
  END AS base_amount,
  
  s.currency

FROM organizations o
JOIN organization_subscriptions s ON o.id = s.organization_id
JOIN plans p ON s.plan_id = p.id
WHERE s.status = 'active'
  AND s.expires_at > NOW();
```

**Ventaja**: Simple, rápida, no requiere código
**Desventaja**: NO calcula prorrateamiento

---

#### **Opción B: Función PostgreSQL con Prorrateamiento**

```sql
CREATE OR REPLACE FUNCTION calculate_next_invoice(
  p_organization_id UUID,
  p_include_proration BOOLEAN DEFAULT true
)
RETURNS TABLE (
  organization_id UUID,
  subscription_id UUID,
  current_billable_members INTEGER,
  base_amount NUMERIC,
  proration_amount NUMERIC,
  total_amount NUMERIC,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  currency TEXT
) AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
  v_cycle_days INTEGER;
  v_price_per_member NUMERIC;
  v_base_members INTEGER;
  v_current_members INTEGER;
  v_base_amount NUMERIC;
  v_proration NUMERIC := 0;
BEGIN
  -- 1. Obtener suscripción activa
  SELECT * INTO v_subscription
  FROM organization_subscriptions
  WHERE organization_id = p_organization_id
    AND status = 'active'
    AND expires_at > NOW()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- 2. Obtener plan
  SELECT * INTO v_plan
  FROM plans
  WHERE id = v_subscription.plan_id;
  
  -- 3. Precio por miembro
  v_price_per_member := CASE 
    WHEN v_subscription.billing_period = 'monthly' THEN v_plan.monthly_amount
    ELSE v_plan.annual_amount
  END;
  
  -- 4. Contar miembros billables actuales
  SELECT COUNT(*) INTO v_current_members
  FROM organization_members
  WHERE organization_id = p_organization_id
    AND is_active = true
    AND is_billable = true;
  
  -- 5. Calcular monto base
  IF v_plan.billing_type = 'per_user' THEN
    v_base_amount := v_current_members * v_price_per_member;
  ELSE
    v_base_amount := v_price_per_member;
  END IF;
  
  -- 6. Calcular prorrateamiento (si está habilitado y es per_user)
  IF p_include_proration AND v_plan.billing_type = 'per_user' THEN
    -- Calcular días del ciclo
    v_cycle_days := EXTRACT(DAY FROM (v_subscription.expires_at - v_subscription.started_at));
    
    -- Iterar eventos de miembros en este ciclo
    FOR event_record IN (
      SELECT 
        event_type,
        event_date,
        EXTRACT(DAY FROM (v_subscription.expires_at - event_date)) AS days_remaining
      FROM organization_member_events
      WHERE organization_id = p_organization_id
        AND subscription_id = v_subscription.id
        AND event_date >= v_subscription.started_at
        AND event_date < v_subscription.expires_at
      ORDER BY event_date
    ) LOOP
      -- Calcular ajuste proporcional
      IF event_record.event_type IN ('member_added', 'billable_enabled') THEN
        v_proration := v_proration + (v_price_per_member * event_record.days_remaining / v_cycle_days);
      ELSIF event_record.event_type IN ('member_removed', 'billable_disabled') THEN
        v_proration := v_proration - (v_price_per_member * event_record.days_remaining / v_cycle_days);
      END IF;
    END LOOP;
  END IF;
  
  -- 7. Retornar resultado
  RETURN QUERY
  SELECT 
    p_organization_id,
    v_subscription.id,
    v_current_members,
    v_base_amount,
    v_proration,
    v_base_amount + v_proration,
    v_subscription.expires_at,
    v_subscription.currency;
END;
$$ LANGUAGE plpgsql;
```

**Ventaja**: Cálculo completo con prorrateamiento
**Desventaja**: Más compleja, requiere eventos registrados

---

### 🔧 4. Cambios en Backend

#### **A. Modificar createSubscriptionPreference()**

```typescript
// En api/lib/handlers/checkout/mp/createSubscriptionPreference.ts
// ANTES DE CREAR LA PREFERENCIA:

// 1. Contar miembros billables
const { count: billableCount, error: countError } = await supabase
  .from('organization_members')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', organization_id)
  .eq('is_active', true)
  .eq('is_billable', true);

if (countError) {
  return { success: false, error: 'Error contando miembros', status: 500 };
}

// 2. Ajustar precio si es per_user
let unit_price = Number(priceAmount);

if (plan.billing_type === 'per_user') {
  const memberCount = billableCount || 0;
  
  // Mínimo 1 miembro (el admin que paga)
  const effectiveMembers = Math.max(1, memberCount);
  
  unit_price = unit_price * effectiveMembers;
  
  console.log('[MP] Per-user pricing:', {
    plan_slug,
    billing_period,
    price_per_member: priceAmount,
    billable_members: effectiveMembers,
    total_price: unit_price
  });
}
```

---

#### **B. Registrar Eventos de Miembros**

**Crear helper**: `api/lib/billing/registerMemberEvent.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

export async function registerMemberEvent(
  supabase: SupabaseClient,
  params: {
    organizationId: string;
    memberId: string;
    userId: string;
    eventType: 'member_added' | 'member_removed' | 'billable_enabled' | 'billable_disabled';
    wasBillable?: boolean;
    isBillable?: boolean;
  }
) {
  // 1. Obtener suscripción activa
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('id')
    .eq('organization_id', params.organizationId)
    .eq('status', 'active')
    .maybeSingle();
  
  // 2. Registrar evento
  const { error } = await supabase
    .from('organization_member_events')
    .insert({
      organization_id: params.organizationId,
      subscription_id: subscription?.id,
      member_id: params.memberId,
      user_id: params.userId,
      event_type: params.eventType,
      was_billable: params.wasBillable,
      is_billable: params.isBillable,
      event_date: new Date().toISOString()
    });
  
  if (error) {
    console.error('[billing] Error registering member event:', error);
  }
  
  return { success: !error };
}
```

**Llamar desde**:
1. Endpoint de agregar miembro → `registerMemberEvent(..., 'member_added')`
2. Endpoint de eliminar miembro → `registerMemberEvent(..., 'member_removed')`
3. Endpoint de toggle is_billable → `registerMemberEvent(..., 'billable_enabled/disabled')`

---

#### **C. Endpoint: Calcular Próxima Factura**

**Crear**: `server/routes/billing.ts`

```typescript
app.get('/api/billing/next-invoice', async (req, res) => {
  // 1. Autenticación
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const authenticatedSupabase = createAuthenticatedClient(token);

  // 2. Obtener usuario y organización actual
  const { data: { user } } = await authenticatedSupabase.auth.getUser();
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: dbUser } = await authenticatedSupabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();

  const { data: prefs } = await authenticatedSupabase
    .from('user_preferences')
    .select('last_organization_id')
    .eq('user_id', dbUser.id)
    .maybeSingle();

  const organizationId = prefs?.last_organization_id;
  if (!organizationId) {
    return res.status(404).json({ error: 'No active organization' });
  }

  // 3. Llamar a función PostgreSQL para calcular
  const { data, error } = await authenticatedSupabase
    .rpc('calculate_next_invoice', {
      p_organization_id: organizationId,
      p_include_proration: true
    });

  if (error) {
    console.error('Error calculating invoice:', error);
    return res.status(500).json({ error: 'Failed to calculate invoice' });
  }

  res.json(data);
});
```

---

### 💻 5. Cambios en Frontend

#### **A. Mostrar Costo Estimado en Pricing**

```tsx
// En src/pages/settings/PricingPlan.tsx

// Si el plan es TEAMS, mostrar cálculo
{plan.slug === 'teams' && (
  <div className="text-sm text-muted-foreground mt-2">
    {billableMembers} miembros facturables × ${pricePerMember}/mes
    = ${totalEstimated}/mes
  </div>
)}
```

---

#### **B. Dashboard de Facturación**

**Crear**: `src/pages/organization/OrganizationBilling.tsx`

**Mostrar**:
- Plan actual
- Miembros billables actuales
- Próxima fecha de facturación
- Monto estimado de próxima factura
- Detalle de prorrateamiento (si aplica)
- Historial de pagos

---

## 📝 RESUMEN: Plan de Acción

### ✅ Fase 1: Base de Datos (1-2 horas)
1. Agregar `is_billable` a `shared/schema.ts` ✅ (YA HECHO)
2. Crear tabla `organization_member_events` en Supabase
3. Crear tabla `organization_billing_cycles` (opcional, para MVP no es crítico)
4. Crear función `calculate_next_invoice()` en PostgreSQL
5. Agregar `organization_subscriptions` a `shared/schema.ts`

### ✅ Fase 2: Backend - Lógica de Facturación (2-3 horas)
6. Modificar `createSubscriptionPreference()` para multiplicar por miembros billables
7. Crear helper `registerMemberEvent()`
8. Modificar endpoints de miembros para registrar eventos
9. Crear endpoint `/api/billing/next-invoice`

### ✅ Fase 3: Frontend (2 horas)
10. Modificar PricingPlan para mostrar costo estimado en TEAMS
11. Crear página OrganizationBilling
12. Agregar sección de gestión de miembros billables

### ✅ Fase 4: Testing (1-2 horas)
13. Probar creación de suscripción TEAMS con múltiples miembros
14. Probar agregar miembro durante ciclo
15. Probar eliminar miembro durante ciclo
16. Verificar cálculo de prorrateamiento
17. Probar toggle de is_billable

---

## 🎓 CONCEPTOS CLAVE

### ¿Qué es Prorrateamiento (Proration)?

**Ejemplo simple**:
- Plan TEAMS: $20/usuario/mes
- Ciclo: 1 Nov - 30 Nov (30 días)
- Inicio: 3 usuarios billables → Cargo inicial: $60

**Evento 1**: 15 Nov - Se agrega 1 usuario
- Días restantes: 16 días (del 15 al 30)
- Cargo proporcional: $20 × (16/30) = $10.67

**Evento 2**: 25 Nov - Se elimina 1 usuario
- Días restantes: 6 días (del 25 al 30)
- Crédito proporcional: -$20 × (6/30) = -$4.00

**Factura del 1 Dic**:
```
Base: 3 usuarios × $20 = $60.00
Ajuste usuario agregado: +$10.67
Ajuste usuario eliminado: -$4.00
TOTAL: $66.67
```

---

### ¿Cómo Funciona `is_billable`?

**Caso de uso**: Admin quiere "regalar" membresías

**Ejemplo**:
- Organización tiene 10 miembros
- 8 miembros tienen `is_billable = true`
- 2 miembros tienen `is_billable = false` (regalados por admin)
- **Factura**: 8 × $20 = $160 (solo se cobran los billables)

**Cuándo cambiar**:
- Admin puede toggle el flag en cualquier momento
- Se registra evento `billable_enabled` o `billable_disabled`
- Afecta prorrateamiento igual que agregar/eliminar

---

## ❓ PREGUNTAS PENDIENTES

1. **¿Querés implementar prorrateamiento en el MVP o lo dejamos para V2?**
   - MVP simple: Cobrar siempre por miembros actuales (sin ajustes)
   - Completo: Implementar todo el sistema de eventos y proration

2. **¿Cómo manejar el primer pago cuando se crea la org?**
   - ¿Cobrar solo por el admin?
   - ¿O por todos los miembros invitados?

3. **¿Los miembros `is_billable=false` pueden seguir usando la plataforma normalmente?**
   - O solo no se cobran pero tienen acceso limitado

4. **¿Necesitás facturación automática o manual?**
   - Automática: Renovación con cargo automático (requiere recurring payments)
   - Manual: Usuario recibe recordatorio y paga manualmente

---

## 🚀 RECOMENDACIÓN

Para **lanzar rápido** (MVP):
1. ✅ Implementar multiplicación por miembros billables en checkout
2. ✅ Agregar endpoint para ver próxima factura (sin proration)
3. ❌ POSPONER prorrateamiento para V2
4. ✅ Permitir toggle de `is_billable` pero que afecte recién en próxima renovación

Para **sistema completo**:
1. ✅ Implementar todas las tablas de eventos
2. ✅ Crear función de cálculo con proration
3. ✅ Dashboard de facturación detallado
4. ✅ Notificaciones de cambios de costo

**Tiempo estimado**:
- MVP: 4-6 horas
- Completo: 8-12 horas
