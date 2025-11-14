# Testing Per-Seat Billing System for TEAMS Plan

Este documento describe cómo probar el sistema completo de facturación per-seat para el plan TEAMS en Seencel.

## Arquitectura Implementada

### 1. Decisiones de Diseño

- **Primer pago TEAMS**: Siempre cobra 1 seat (solo el admin que compra)
- **Agregar/Eliminar miembros**: NO cobra extra inmediatamente, registra evento y aplica en próxima renovación
- **Toggle is_billable**: Cambia el flag inmediatamente, aplica en facturación en próxima renovación
- **Renovación mensual**: Cuenta billable members actuales y cobra: seats × price_per_seat

### 2. Componentes Implementados

#### Backend:
- ✅ `api/lib/handlers/checkout/mp/createSubscriptionPreference.ts` - Cuenta billable seats en checkout MercadoPago
- ✅ `api/lib/handlers/checkout/paypal/createSubscriptionOrder.ts` - Cuenta billable seats en checkout PayPal
- ✅ `api/lib/handlers/checkout/shared/subscriptions.ts` - Crea billing_cycle snapshots
- ✅ `api/lib/billing/events.ts` - Helper para registrar eventos de miembros
- ✅ `api/lib/handlers/organization/acceptInvitation.ts` - Registra member_added events
- ✅ `server/routes/billing.ts` - Endpoints para próxima factura y ciclos de facturación
- ✅ `scripts/create_proration_function.sql` - Función PostgreSQL para calcular prorrateo

#### Frontend:
- ✅ `src/pages/settings/PricingPlan.tsx` - Muestra estimación de costo para plan TEAMS
- ✅ `src/pages/settings/Billing.tsx` - Muestra próxima factura y ciclos de facturación

## Escenarios de Prueba

### Escenario 1: Primera Compra de Plan TEAMS

**Objetivo**: Verificar que el primer pago de TEAMS solo cobra 1 seat.

**Pasos**:
1. Iniciar sesión como usuario con plan FREE
2. Navegar a `/settings/pricing-plan`
3. Seleccionar plan TEAMS (mensual o anual)
4. Completar el proceso de checkout
5. Verificar el pago en la base de datos

**Verificaciones**:
```sql
-- 1. Verificar que el billing cycle tiene seats = 1
SELECT seats, amount_per_seat, total_amount 
FROM organization_billing_cycles 
WHERE organization_id = '<org_id>' 
ORDER BY created_at DESC LIMIT 1;

-- Esperado: seats = 1, amount_per_seat = precio_plan, total_amount = precio_plan

-- 2. Verificar que no hay eventos de miembros registrados (es el primer member)
SELECT * 
FROM organization_member_events 
WHERE organization_id = '<org_id>';

-- Esperado: 0 rows (el admin no genera evento al convertirse a TEAMS)
```

**Resultado Esperado**:
- Precio cobrado = precio del plan TEAMS × 1 seat
- Billing cycle creado con seats = 1
- No eventos de miembros registrados

---

### Escenario 2: Invitar Miembro a Organización TEAMS

**Objetivo**: Verificar que al invitar un miembro, se registra el evento pero NO se cobra inmediatamente.

**Pasos**:
1. Iniciar sesión como admin de organización TEAMS
2. Navegar a la sección de miembros
3. Invitar a un nuevo miembro (usar API `/api/invite-member`)
4. El miembro acepta la invitación
5. Verificar el evento en la base de datos

**Verificaciones**:
```sql
-- 1. Verificar que el miembro fue creado con is_billable = true
SELECT id, user_id, is_billable, is_active 
FROM organization_members 
WHERE organization_id = '<org_id>' 
AND user_id = '<new_user_id>';

-- Esperado: is_billable = true, is_active = true

-- 2. Verificar que se registró el evento member_added
SELECT event_type, is_billable, event_date 
FROM organization_member_events 
WHERE organization_id = '<org_id>' 
AND user_id = '<new_user_id>';

-- Esperado: event_type = 'member_added', is_billable = true

-- 3. Verificar que NO se creó un nuevo billing cycle inmediatamente
SELECT COUNT(*) 
FROM organization_billing_cycles 
WHERE organization_id = '<org_id>' 
AND created_at > NOW() - INTERVAL '1 minute';

-- Esperado: COUNT = 0 (no se cobra mid-cycle)
```

**Resultado Esperado**:
- Miembro agregado con `is_billable = true`
- Evento `member_added` registrado en `organization_member_events`
- NO se cobra inmediatamente
- El cambio se aplicará en la próxima renovación mensual

---

### Escenario 3: Ver Próxima Factura Estimada (Frontend)

**Objetivo**: Verificar que el frontend muestra correctamente la estimación de la próxima factura.

**Pasos**:
1. Iniciar sesión como admin de organización TEAMS con múltiples miembros
2. Navegar a `/settings/billing`
3. Verificar la sección "Próxima Factura Estimada"

**Verificaciones en UI**:
- ✅ Se muestra el número correcto de "Miembros facturables"
- ✅ Se muestra "Precio por asiento" correcto
- ✅ Se muestra "Monto base" = miembros × precio
- ✅ Se muestra "Ajuste de prorrateo" (0 si no hay eventos mid-cycle)
- ✅ Se muestra "Total" correcto
- ✅ Se muestra "Próxima fecha de facturación"

**API Request**:
```bash
GET /api/billing/next-invoice/<organization_id>
```

**Respuesta Esperada**:
```json
{
  "seats": 3,
  "pricePerSeat": 20,
  "baseAmount": 60,
  "prorationAdjustment": 0,
  "totalAmount": 60,
  "currency": "USD",
  "nextBillingDate": "2025-12-14T00:00:00.000Z"
}
```

---

### Escenario 4: Ver Historial de Ciclos de Facturación

**Objetivo**: Verificar que el frontend muestra correctamente el historial de billing cycles.

**Pasos**:
1. Iniciar sesión como admin de organización TEAMS
2. Navegar a `/settings/billing`
3. Scroll hacia abajo a "Historial de Ciclos de Facturación"

**Verificaciones en UI**:
- ✅ Se muestra tabla con columnas: Período, Asientos, Monto, Estado
- ✅ Cada fila muestra:
  - Período: fecha inicio - fecha fin
  - Asientos: número de seats en ese ciclo
  - Monto: total cobrado
  - Estado: Pagado/Pendiente/Cancelado

**API Request**:
```bash
GET /api/billing/cycles/<organization_id>
```

**Respuesta Esperada**:
```json
[
  {
    "id": "uuid",
    "organization_id": "uuid",
    "subscription_id": "uuid",
    "plan_id": "uuid",
    "seats": 2,
    "amount_per_seat": "20.00",
    "base_amount": "40.00",
    "proration_adjustment": "0.00",
    "total_amount": "40.00",
    "billing_period": "monthly",
    "period_start": "2025-11-14T00:00:00.000Z",
    "period_end": "2025-12-14T00:00:00.000Z",
    "paid": true,
    "status": "paid",
    "currency_code": "USD",
    "created_at": "2025-11-14T00:00:00.000Z"
  }
]
```

---

### Escenario 5: Cambiar is_billable de un Miembro (Pendiente)

**Nota**: Este endpoint aún NO está implementado. Necesita ser creado.

**Objetivo**: Verificar que al cambiar `is_billable` de un miembro, se registra el evento.

**Endpoint a Crear**:
```typescript
PATCH /api/organizations/:organizationId/members/:memberId
Body: { is_billable: false }
```

**Pasos Futuros**:
1. Crear endpoint PATCH para actualizar `is_billable`
2. Llamar a `registerMemberEvent` con `event_type: 'billable_disabled'` o `'billable_enabled'`
3. Probar que el evento se registra correctamente

---

### Escenario 6: Calcular Proration para Mid-Cycle Changes

**Objetivo**: Verificar que la función PostgreSQL calcula correctamente el prorrateo.

**Setup**:
```sql
-- Ejecutar la función de prorrateo (ya creada en scripts/create_proration_function.sql)
-- Primero ejecutar el script para crear la función si no existe

-- Crear SQL para ejecutar:
CREATE OR REPLACE FUNCTION calculate_member_proration(
  org_id UUID,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
)
RETURNS NUMERIC AS $$
...
$$ LANGUAGE plpgsql;
```

**Prueba**:
```sql
-- Llamar a la función con parámetros de ejemplo
SELECT calculate_member_proration(
  '<organization_id>'::UUID,
  '2025-11-14T00:00:00Z'::TIMESTAMPTZ,
  '2025-12-14T00:00:00Z'::TIMESTAMPTZ
);

-- Resultado esperado: ajuste de prorrateo basado en eventos mid-cycle
```

**Casos de Prueba**:
1. **Sin eventos mid-cycle**: Resultado = 0
2. **Agregar 1 miembro a mitad de mes**: Resultado = (price_per_seat / días_totales) × días_restantes
3. **Eliminar 1 miembro a mitad de mes**: Resultado negativo (crédito)

---

### Escenario 7: Ver Estimación de Costo en Pricing Plan (Frontend)

**Objetivo**: Verificar que en la página de pricing, el plan TEAMS muestra el costo estimado.

**Pasos**:
1. Iniciar sesión como admin de organización con miembros
2. Navegar a `/settings/pricing-plan`
3. Ver el card del plan TEAMS

**Verificaciones en UI**:
- ✅ Se muestra "Por usuario/asiento"
- ✅ Si la organización tiene miembros billables:
  - ✅ Se muestra "Costo estimado: USD XX.XX/mes"
  - ✅ Se muestra "(N miembros × $XX)"
- ✅ El costo estimado es correcto: miembros billables × precio por seat

**Query de Frontend**:
```javascript
// El componente ya hace esta query:
const { data: billableMembersData } = useQuery({
  queryKey: ['/api/billing/next-invoice', organizationId],
  enabled: isAuthenticated && !!organizationId
});

// Y muestra:
Costo estimado: USD {billableMembersData.seats * monthlyPrice}/mes
({billableMembersData.seats} miembro(s) × ${monthlyPrice})
```

---

## Endpoints API Creados

### 1. GET /api/billing/next-invoice/:organizationId

**Descripción**: Calcula la próxima factura estimada para una organización TEAMS.

**Response**:
```typescript
{
  seats: number;              // Número de miembros facturables
  pricePerSeat: number;       // Precio por seat del plan
  baseAmount: number;         // seats × pricePerSeat
  prorationAdjustment: number; // Ajuste de prorrateo (mid-cycle changes)
  totalAmount: number;        // baseAmount + prorationAdjustment
  currency: string;           // USD o ARS
  nextBillingDate: string;    // Fecha de próxima facturación
}
```

### 2. GET /api/billing/cycles/:organizationId

**Descripción**: Obtiene los últimos 12 ciclos de facturación para una organización.

**Response**:
```typescript
Array<{
  id: string;
  organization_id: string;
  subscription_id: string;
  plan_id: string;
  seats: number;
  amount_per_seat: string;
  base_amount: string;
  proration_adjustment: string;
  total_amount: string;
  billing_period: 'monthly' | 'annual';
  period_start: string;
  period_end: string;
  paid: boolean;
  status: 'paid' | 'pending' | 'cancelled';
  currency_code: string;
  created_at: string;
}>
```

---

## Tareas Pendientes (Futuro)

### 1. Crear Endpoint para Eliminar Miembros

**Ruta**: `DELETE /api/organizations/:organizationId/members/:memberId`

**Funcionalidad**:
- Marcar miembro como `is_active = false`
- Registrar evento `member_removed` con `registerMemberEvent`

### 2. Crear Endpoint para Cambiar is_billable

**Ruta**: `PATCH /api/organizations/:organizationId/members/:memberId`

**Body**: `{ is_billable: boolean }`

**Funcionalidad**:
- Actualizar `is_billable` del miembro
- Registrar evento `billable_enabled` o `billable_disabled`

### 3. Implementar Cron Job para Renovaciones Mensuales

**Objetivo**: Crear un job que ejecute mensualmente para:
1. Contar billable members actuales
2. Calcular monto a cobrar (seats × price_per_seat)
3. Llamar al proveedor de pago (MercadoPago/PayPal) para cobrar
4. Crear billing_cycle snapshot
5. Calcular y mostrar proration_adjustment

---

## Verificación de Integridad

### Queries de Verificación:

```sql
-- 1. Verificar que todos los billing cycles tienen seats > 0
SELECT id, seats, total_amount 
FROM organization_billing_cycles 
WHERE seats = 0 OR seats IS NULL;
-- Esperado: 0 rows

-- 2. Verificar que todos los eventos de miembros están asociados a una subscription
SELECT id, event_type, subscription_id 
FROM organization_member_events 
WHERE subscription_id IS NULL;
-- Esperado: 0 rows (o solo eventos antes de tener subscription activa)

-- 3. Verificar consistencia entre billable members y próxima factura
SELECT 
  om.organization_id,
  COUNT(*) as billable_count,
  obc.seats as last_cycle_seats
FROM organization_members om
LEFT JOIN organization_billing_cycles obc 
  ON obc.organization_id = om.organization_id 
  AND obc.created_at = (
    SELECT MAX(created_at) 
    FROM organization_billing_cycles 
    WHERE organization_id = om.organization_id
  )
WHERE om.is_billable = true 
  AND om.is_active = true
GROUP BY om.organization_id, obc.seats;
-- Nota: billable_count puede diferir de last_cycle_seats si hubo cambios mid-cycle
```

---

## Resumen de Implementación

### ✅ Completado:
1. Checkout cuenta billable seats (MercadoPago y PayPal)
2. Creación de billing_cycle snapshots en upgradeOrganizationPlan
3. Helper de eventos de miembros (registerMemberEvent)
4. Función PostgreSQL para calcular prorrateo
5. Registro de eventos member_added en acceptInvitation
6. Endpoints de billing (/next-invoice y /cycles)
7. UI en PricingPlan para mostrar estimación de costo
8. UI en Billing.tsx para mostrar próxima factura y ciclos

### ⏳ Pendiente (Futuro):
1. Endpoint DELETE para eliminar miembros
2. Endpoint PATCH para cambiar is_billable
3. Cron job para renovaciones mensuales automáticas
4. Tests automatizados (unit + integration)
5. Webhooks para eventos de pago de MercadoPago/PayPal

---

## Notas Importantes

1. **Primer Pago**: Siempre cobra 1 seat porque el usuario no puede invitar a nadie antes de ser TEAMS
2. **Mid-Cycle Changes**: NO se cobra inmediatamente, solo se registra el evento
3. **Proration**: Se calcula y muestra en UI, pero NO se cobra automáticamente (requiere cron job futuro)
4. **is_billable**: Por defecto TRUE para nuevos miembros, puede ser modificado por admin
5. **Status**: Los miembros tienen `is_active` para soft-delete (no se eliminan físicamente)
