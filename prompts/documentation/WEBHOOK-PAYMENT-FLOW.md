# Flujo de Webhooks de Pago - Auditoría del Estado Actual

**Fecha de auditoría:** 2025-12-17  
**Objetivo:** Documentar EXACTAMENTE qué sucede hoy cuando un usuario paga una suscripción y llega el webhook.

---

## A) Endpoints que Reciben los Webhooks

| Gateway | Endpoint | Auth |
|---------|----------|------|
| **MercadoPago** | `POST /api/checkout/mp/webhook` | Query param `?secret=...` (temporalmente deshabilitado) |
| **PayPal** | `POST /api/checkout/paypal/webhook` | Sin auth explícito |

**Archivos:**
- `server/routes/payments.ts` (líneas 511-534) - Registra las rutas
- `server/lib/handlers/checkout/mp/processWebhook.ts` - Handler de MP
- `server/lib/handlers/checkout/paypal/processWebhook.ts` - Handler de PayPal

---

## B) Funciones Ejecutadas (Flujo MercadoPago - Suscripción Nueva)

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     WEBHOOK MERCADOPAGO: NUEVA SUSCRIPCIÓN                  │
└─────────────────────────────────────────────────────────────────────────────┘

  1. POST /api/checkout/mp/webhook
     │
     ▼
  2. processWebhook(req)                    [mp/processWebhook.ts:50]
     ├─► parseBody(req) → { type, data }
     ├─► Validar secret (TEMPORALMENTE SKIP)
     └─► type === "payment" ?
         │
         ▼
  3. getMPPayment(paymentId)                [mp/api.ts]
     └─► Fetch a MP API para obtener detalles del pago
         │
         ▼
  4. extractMetadata(pay)                   [mp/encoding.ts]
     └─► Extrae external_reference, user_id, plan_slug, etc.
         │
         ▼
  5. Buscar preferencia en DB según prefijo:
     ├─► "mpu_" → mp_subscription_preferences (upgrade)
     ├─► "mpr_" → mp_subscription_preferences (recurring)
     ├─► "mps_" → mp_subscription_preferences (seat)
     └─► "mp_"  → mp_course_preferences (curso)
         │
         ▼
  6. Convertir auth_id → public.users.id   [línea 201-218]
     └─► SELECT id FROM users WHERE auth_id = ?
         │
         ▼
  7. logPaymentEvent()                      [shared/events.ts:17]
     └─► INSERT INTO payment_events (...)
         │
         ▼
  8. status === "approved" && productType === "subscription" ?
     │
     ▼
  9. insertPayment()                        [shared/payments.ts:17]
     └─► INSERT INTO payments (...)
     │   └─► Si duplicado (23505), retorna { inserted: false }
     │
     ▼
 10. subPaymentResult.inserted === true ?
     │
     ▼
 11. upgradeOrganizationPlan()              [shared/subscriptions.ts:472]
     ├─► (a) Cancelar suscripciones activas anteriores
     │       UPDATE organization_subscriptions SET status='expired'
     │       WHERE organization_id=? AND status='active'
     │
     ├─► (b) Calcular expires_at según billing_period
     │
     ├─► (c) INSERT INTO organization_subscriptions (...)
     │       ├─► organization_id, plan_id, payment_id
     │       ├─► status='active', billing_period, expires_at
     │       └─► amount, currency
     │
     ├─► (d) Contar billable members
     │       SELECT id FROM organization_members
     │       WHERE organization_id=? AND is_billable=true AND status='active'
     │
     ├─► (e) INSERT INTO organization_billing_cycles (...)
     │       ├─► seats, billed_seats, amount_per_seat
     │       └─► base_amount, total_amount, period_start, period_end
     │
     ├─► (f) UPDATE organizations SET plan_id=? WHERE id=?
     │
     ├─► (g) applyPlanLimits()              [shared/plan-limits.ts:71]
     │       └─► Desbloquea proyectos/miembros que estaban over limit
     │
     ├─► (h) reactivateBonusCourseEnrollments()
     │       └─► Reactiva enrollments suspendidos del curso bonus
     │
     └─► (i) SI billingPeriod === 'annual':
             applyFoundersProgram()         [shared/subscriptions.ts:388]
             ├─► UPDATE organizations.settings.is_founder = true
             │
             ├─► Buscar founder_bonus_course_id en app_settings
             │
             └─► upsertEnrollment()         [shared/enrollments.ts:9]
                 └─► UPSERT INTO course_enrollments (...)
```

---

## C) Tablas Modificadas (En Orden)

### Flujo Exitoso de Suscripción

| # | Tabla | Operación | Descripción |
|---|-------|-----------|-------------|
| 1 | `payment_events` | INSERT | Log del evento crudo recibido del webhook |
| 2 | `payments` | INSERT | Registro del pago completado |
| 3 | `organization_subscriptions` | UPDATE | Marca suscripciones anteriores como `expired` |
| 4 | `organization_subscriptions` | INSERT | Crea nueva suscripción activa |
| 5 | `organization_billing_cycles` | INSERT | Registro del ciclo de facturación |
| 6 | `organizations` | UPDATE | Actualiza `plan_id` al nuevo plan |
| 7 | `projects` | UPDATE (condicional) | Desbloquea proyectos si estaban `is_over_limit` |
| 8 | `organization_members` | UPDATE (condicional) | Desbloquea miembros si estaban `is_over_limit` |
| 9 | `course_enrollments` | UPDATE (condicional) | Reactiva enrollments de curso bonus |
| 10 | `organizations` | UPDATE (annual) | Marca `settings.is_founder = true` |
| 11 | `course_enrollments` | UPSERT (annual) | Inscripción al curso bonus de founders |

### Tablas Leídas (No Modificadas)

| Tabla | Propósito |
|-------|-----------|
| `users` | Convertir auth_id → public.users.id |
| `mp_subscription_preferences` | Obtener metadata del pago |
| `plans` | Obtener límites y precios |
| `app_settings` | Obtener founder_bonus_course_id |

---

## D) Dónde se Aplican los Efectos

### Plan a la Organización

**Función:** `upgradeOrganizationPlan()` línea 597-600  
**Archivo:** `server/lib/handlers/checkout/shared/subscriptions.ts`

```typescript
const { error: orgError } = await supabase
  .from('organizations')
  .update({ plan_id: params.planId })
  .eq('id', params.organizationId);
```

### Flag de Organización Fundadora

**Función:** `applyFoundersProgram()` línea 427-436  
**Archivo:** `server/lib/handlers/checkout/shared/subscriptions.ts`

```typescript
await supabase
  .from('organizations')
  .update({
    settings: {
      ...existingSettings,
      is_founder: true,
      founder_since: new Date().toISOString(),
    }
  })
  .eq('id', organizationId);
```

**Condición:** Solo se aplica si `billingPeriod === 'annual'`

### Inscripción a Cursos (Founders Bonus)

**Función:** `upsertEnrollment()` dentro de `applyFoundersProgram()`  
**Archivo:** `server/lib/handlers/checkout/shared/enrollments.ts`

```typescript
await supabase.from("course_enrollments").upsert({
  user_id: userId,
  course_id: courseId,  // De app_settings.founder_bonus_course_id
  status: "active",
  expires_at: null,  // Lifetime access
});
```

### Roles / Permisos

**NO hay cambios de roles/permisos en el flujo de webhook.**

Los permisos dependen de:
- `organizations.plan_id` → Ya se actualiza
- `organization_members.role_id` → No se modifica

---

## E) Manejo de Fallos

### Patrón Actual: Sin Transacciones, Errores Aislados

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANEJO DE ERRORES ACTUAL                     │
└─────────────────────────────────────────────────────────────────┘

  Cada operación es INDEPENDIENTE:
  
  payment_events ─────► Si falla: console.error, CONTINÚA
                        NO bloquea el flujo
  
  payments ────────────► Si duplicado (23505): { inserted: false }
                        El flujo NO procede con upgradeOrganizationPlan
                        ✅ Idempotencia correcta
  
  organization_subscriptions UPDATE ──► Si falla: console.error
                                        CONTINÚA con el INSERT
  
  organization_subscriptions INSERT ──► Si falla: throw error
                                        ⚠️ Rompe el flujo, payment ya insertado
  
  organization_billing_cycles ────────► Si falla: console.error
                                        CONTINÚA
  
  organizations UPDATE ───────────────► Si falla: throw error
                                        ⚠️ Rompe el flujo, suscripción ya creada
  
  applyPlanLimits ────────────────────► Si falla: console.error
                                        CONTINÚA (logs error)
  
  reactivateBonusCourseEnrollments ───► Si falla: NO afecta flujo
  
  applyFoundersProgram ───────────────► Cada sub-operación tiene try/catch
                                        console.error pero CONTINÚA
```

### Estados Inconsistentes Posibles

| Escenario | Estado Resultante |
|-----------|-------------------|
| Falla INSERT subscription | Payment existe, org sin plan actualizado |
| Falla UPDATE organizations | Subscription existe, org.plan_id desactualizado |
| Falla applyFoundersProgram | Plan aplicado, pero sin is_founder ni curso bonus |

---

## F) ¿Existe una Función Orquestadora?

### Respuesta: SÍ, pero IMPLÍCITA

**No hay una función llamada "orchestrator" o "processSubscriptionPayment".**

El "orquestador" es `processWebhook()` que actúa como dispatcher:

```typescript
// processWebhook.ts - Pseudo-código del orquestador implícito

async function processWebhook(req) {
  // 1. Parse y validación
  const body = parseBody(req);
  
  // 2. Switch por tipo de evento
  if (type === "payment" && status === "approved") {
    
    // 3. Switch por productType
    switch (productType) {
      case 'subscription':
        await insertPayment(...);
        if (inserted) {
          await upgradeOrganizationPlan(...);  // ← Contiene toda la lógica
        }
        break;
        
      case 'subscription_upgrade':
        await insertPayment(...);
        // NO llama upgradeOrganizationPlan - eso pasa en handleUpgradeReturn
        break;
        
      case 'seat':
        await handleSeatPayment(...);
        break;
        
      case 'course':
        await insertPayment(...);
        await upsertEnrollment(...);
        break;
    }
  }
}
```

**La lógica de aplicar plan está 100% en TypeScript**, no hay funciones SQL que orchestren.

---

## G) Puntos Sin Logs ni Alertas

### 🔴 NO hay logging/alertas en:

| Punto | Riesgo |
|-------|--------|
| Fallo silencioso de `applyPlanLimits` | Proyectos/miembros quedan bloqueados incorrectamente |
| Fallo de `reactivateBonusCourseEnrollments` | Enrollments no reactivan, sin evidencia |
| Estado inconsistente subscription vs org.plan_id | No hay check de consistencia post-webhook |
| `applyFoundersProgram` parcialmente exitoso | is_founder puede estar pero sin enrollment |
| Webhook timeout (MP reintenta) | Puede causar duplicados si insertPayment falla silenciosamente |

### 🟡 Hay console.error pero NO alertas:

| Punto | Lo que hace |
|-------|-------------|
| `payment_events` INSERT fail | `console.error` - no alerta |
| `organization_subscriptions` UPDATE fail | `console.error` - no alerta |
| `organization_billing_cycles` INSERT fail | `console.error` - no alerta |
| `applyFoundersProgram` cualquier fallo | `console.error` - no alerta |

### ✅ Sí hay manejo correcto:

| Punto | Lo que hace |
|-------|-------------|
| `insertPayment` duplicado (23505) | Retorna `{ inserted: false }`, flujo idempotente |
| `organization_subscriptions` INSERT fail | `throw error`, rompe flujo (evita estado parcial) |
| `organizations` UPDATE fail | `throw error`, rompe flujo |

---

## H) Flujo PayPal (Diferencias)

### Diferencias Principales

| Aspecto | MercadoPago | PayPal |
|---------|-------------|--------|
| Metadata | external_reference + mp_*_preferences | custom_id + invoice_id (pipe-delimited) |
| Suscripciones recurrentes | Via webhook con preapproval | Via `handleSubscriptionRenewal()` |
| Upgrade/Capture | Separado (handleUpgradeReturn) | Directo en webhook |
| Tipos de evento | `payment`, `merchant_order`, `subscription_preapproval` | `CHECKOUT.ORDER.*`, `BILLING.SUBSCRIPTION.*`, `PAYMENT.SALE.*` |

### Flujo PayPal Simplificado

```
POST /api/checkout/paypal/webhook
  │
  ├─► handleSubscriptionEvent()    [BILLING.SUBSCRIPTION.*]
  │   └─► UPDATE organization_subscriptions (cancelled/suspended)
  │
  ├─► handleSubscriptionRenewal()  [PAYMENT.SALE.COMPLETED]
  │   ├─► insertPayment()
  │   └─► UPDATE organization_subscriptions.expires_at
  │
  └─► handleOrderCapture()         [CHECKOUT.ORDER.*]
      └─► Similar a MP: insertPayment → upgradeOrganizationPlan
```

---

## I) Resumen de Tablas por Módulo

```
┌─────────────────────────────────────────────────────────────────┐
│                      TABLAS INVOLUCRADAS                        │
└─────────────────────────────────────────────────────────────────┘

  PAYMENT TRACKING
  ├── payment_events          ← Log de webhooks crudos
  └── payments                ← Pagos procesados (idempotente)

  SUBSCRIPTION MANAGEMENT
  ├── organization_subscriptions  ← Estado de suscripción
  └── organization_billing_cycles ← Historial de facturación

  ORGANIZATION
  ├── organizations.plan_id       ← Plan actual
  └── organizations.settings      ← is_founder, founder_since

  LIMITS & ACCESS
  ├── projects.is_over_limit      ← Soft-lock
  └── organization_members.is_over_limit

  LEARNING
  └── course_enrollments          ← Curso bonus founders

  PREFERENCES (Read-only en webhook)
  ├── mp_subscription_preferences
  ├── mp_course_preferences
  └── app_settings                ← founder_bonus_course_id
```

---

## J) Conclusiones de la Auditoría

### Lo que funciona bien:
1. **Idempotencia** - `insertPayment` con manejo de duplicados (23505)
2. **Orden de operaciones** - Lógico: payment → subscription → org update
3. **Founders Program** - Estructura clara con fallbacks

### Riesgos identificados (sin proponer solución aún):
1. **No hay transacciones** - Estados inconsistentes posibles
2. **Errores silenciosos** - Muchos `console.error` sin alertas
3. **No hay reconciliación** - Si algo falla, no hay retry automático
4. **Acoplamiento temporal** - Todo depende del orden de operaciones
5. **Metadata dispersa** - Diferentes tablas de preferencias según prefijo

---

*Este documento describe el estado actual del sistema al momento de la auditoría. No propone cambios ni mejoras.*
