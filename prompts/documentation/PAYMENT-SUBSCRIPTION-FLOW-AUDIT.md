# Auditoría: Flujo de Pagos y Suscripciones

**Fecha:** 2025-12-17  
**Objetivo:** Entender exactamente qué pasa cuando un usuario paga una suscripción o un curso.  
**Nota:** Esta auditoría documenta el estado ACTUAL del sistema, sin proponer rediseños.

---

## 1. ENDPOINTS DE WEBHOOK

| Gateway | Endpoint | Archivo Handler | Función |
|---------|----------|-----------------|---------|
| **MercadoPago** | `POST /api/checkout/mp/webhook` | `server/lib/handlers/checkout/mp/processWebhook.ts` | `processWebhook()` |
| **PayPal** | `POST /api/checkout/paypal/webhook` | `server/lib/handlers/checkout/paypal/processWebhook.ts` | `processWebhook()` |

---

## 2. FLUJO PASO A PASO (MercadoPago - Suscripción)

```
MP webhook (payment approved)
│
├─ 1. Validar secret (query param) [DESHABILITADO PARA DEBUG]
│
├─ 2. Parse body + extract metadata
│      └─ Busca en: mp_subscription_preferences, mp_course_preferences
│
├─ 3. logPaymentEvent() → INSERT en payment_events
│      └─ [SIN TRANSACCIÓN] - Si falla, solo console.error
│
├─ 4. Si status === 'approved':
│   │
│   ├─ productType === 'subscription':
│   │   ├─ getPlanIdBySlug() → READ plans
│   │   ├─ insertPayment() → INSERT en payments
│   │   │     └─ Si duplicado (23505), return { inserted: false }
│   │   │
│   │   └─ Si inserted === true:
│   │       └─ upgradeOrganizationPlan() → ORQUESTADOR PRINCIPAL
│   │
│   ├─ productType === 'subscription_upgrade':
│   │   └─ insertPayment() → INSERT en payments (NO llama upgradeOrganizationPlan aquí)
│   │
│   ├─ productType === 'seat':
│   │   ├─ Check duplicado en payments
│   │   ├─ INSERT payments
│   │   └─ UPDATE organization_subscriptions (add seat)
│   │
│   └─ productType === 'course':
│       ├─ insertPayment() → INSERT payments
│       ├─ markCouponAsUsed() (si aplica)
│       └─ upsertEnrollment() → UPSERT course_enrollments
│
└─ 5. Return { success: true, processed: "..." }
```

---

## 3. FUNCIÓN ORQUESTADORA: `upgradeOrganizationPlan()`

**Archivo:** `server/lib/handlers/checkout/shared/subscriptions.ts` (línea 472)

### Secuencia de operaciones:

```
upgradeOrganizationPlan()
│
├─ 1. UPDATE organization_subscriptions 
│      SET status='expired', cancelled_at=now()
│      WHERE org_id = X AND status = 'active'
│      └─ [SIN TRANSACCIÓN] - Error solo logueado
│
├─ 2. INSERT organization_subscriptions (nueva activa)
│      └─ Si error → THROW (aborta)
│
├─ 3. INSERT organization_billing_cycles
│      └─ [SIN TRANSACCIÓN] - Error solo logueado
│
├─ 4. UPDATE organizations SET plan_id = X
│      └─ Si error → THROW (aborta)
│
├─ 5. applyPlanLimits() → Marca is_over_limit en projects/members
│      └─ [SIN TRANSACCIÓN] - Error solo logueado
│
├─ 6. reactivateBonusCourseEnrollments() (si aplica)
│      └─ [SIN TRANSACCIÓN] - Error solo logueado
│
└─ 7. applyFoundersProgram() (si annual)
        ├─ UPDATE organizations.settings (is_founder: true)
        └─ upsertEnrollment() → UPSERT course_enrollments
        └─ [SIN TRANSACCIÓN] - Error solo logueado
```

---

## 4. TABLAS AFECTADAS

| Operación | Tabla | Tipo |
|-----------|-------|------|
| Log evento | `payment_events` | INSERT |
| Registro pago | `payments` | INSERT |
| Suscripción anterior | `organization_subscriptions` | UPDATE (expire) |
| Suscripción nueva | `organization_subscriptions` | INSERT |
| Ciclo facturación | `organization_billing_cycles` | INSERT |
| Plan org | `organizations` | UPDATE |
| Límites | `projects`, `organization_members` | UPDATE (is_over_limit) |
| Founders | `organizations` | UPDATE (settings) |
| Bonus course | `course_enrollments` | UPSERT |

---

## 5. TRIGGERS DE BASE DE DATOS (enforce_*_user_id)

Hay **8 triggers** que validan `auth.uid()` en INSERT:

| Tabla | Trigger | ¿Afecta flujo de pagos? |
|-------|---------|-------------------------|
| `mp_subscription_preferences` | `trg_enforce_mp_subscription_preferences_user_id` | **SÍ** - Insertado al crear preferencia de checkout |
| `support_messages` | `trg_enforce_support_messages_user_id` | No |
| `testimonials` | `trg_enforce_testimonials_user_id` | No |
| `user_notifications` | `trg_enforce_user_notifications_user_id` | No |
| `user_organization_preferences` | `trg_enforce_user_org_prefs_user_id` | Posible (al cambiar org) |
| `user_preferences` | `trg_enforce_user_preferences_user_id` | Posible |
| `user_presence` | `trg_enforce_user_presence_user_id` | No |
| `user_view_history` | `trg_enforce_user_view_history_user_id` | No |

**CRÍTICO:** Estos triggers probablemente usan `auth.uid()` que devuelve NULL cuando se usa `service_role`. Si la función del trigger hace `RAISE EXCEPTION` cuando `auth.uid() IS NULL`, bloquearía el INSERT.

### Análisis del impacto:

- `mp_subscription_preferences` → Se inserta cuando usuario inicia checkout (desde frontend, NO service_role)
- El webhook LEE de esta tabla pero NO inserta

**Conclusión:** Los triggers `enforce_*` probablemente NO bloquean el flujo de webhook porque el webhook NO inserta en esas tablas. PERO si algún paso secundario (como crear `user_preferences` o similar) se ejecutara, podría fallar.

---

## 6. PUNTOS DE FALLO IDENTIFICADOS

| # | Ubicación | Problema | Consecuencia |
|---|-----------|----------|--------------|
| 1 | Todo el flujo | **NO HAY TRANSACCIÓN SQL** | Estado parcialmente aplicado si falla a mitad |
| 2 | `upgradeOrganizationPlan` línea 522 | Si INSERT subscription falla → THROW | Pago registrado pero sin suscripción |
| 3 | `upgradeOrganizationPlan` línea 602 | Si UPDATE organizations falla → THROW | Suscripción creada pero org sin plan |
| 4 | `applyPlanLimits()` | Error solo logueado | Proyectos/miembros pueden quedar bloqueados erróneamente |
| 5 | `applyFoundersProgram()` | Error solo logueado (try/catch interno) | Usuario paga anual pero no recibe beneficios |
| 6 | `logPaymentEvent()` línea 40 | Error solo logueado | Sin registro de auditoría |
| 7 | `organization_billing_cycles` INSERT | Error solo logueado | Sin historial de facturación |
| 8 | Triggers `enforce_*_user_id` | Si validan `auth.uid() IS NULL` | Podrían abortar INSERT en tablas afectadas |

---

## 7. ¿EXISTE UNA FUNCIÓN ORQUESTADORA CENTRAL?

**SÍ**, pero **parcial y distribuida**:

- `upgradeOrganizationPlan()` es el orquestador para suscripciones
- `upsertEnrollment()` para cursos
- NO hay transacción SQL que envuelva todo
- Los errores en pasos secundarios (limits, founders, billing_cycle) NO abortan el flujo
- El webhook SIEMPRE devuelve `{ success: true }` excepto errores catastróficos

---

## 8. EVALUACIÓN DE TRIGGERS "ENFORCE"

### Riesgo potencial

Si los triggers `enforce_*_user_id` hacen algo como:

```sql
CREATE FUNCTION enforce_mp_subscription_preferences_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'user_id required'; -- BLOQUEA service_role
  END IF;
  RETURN NEW;
END;
$$;
```

Entonces **bloquearían** cualquier INSERT desde el backend (service_role).

### Tablas en flujo de pagos afectadas:

- `mp_subscription_preferences` → Se inserta cuando usuario inicia checkout (desde frontend, NO service_role)
- El webhook LEE de esta tabla pero NO inserta

---

## 9. RESUMEN EJECUTIVO

| Aspecto | Estado |
|---------|--------|
| Orquestación | Función central `upgradeOrganizationPlan()` pero SIN transacción |
| Atomicidad | **NO** - Operaciones individuales sin rollback |
| Logging de errores | Solo console.error - SIN tabla de ops_alerts |
| Idempotencia | SÍ - Check de duplicados en `payments` |
| Triggers enforce | **NO afectan webhook** (no inserta en tablas con triggers) |
| Punto de rotura más probable | THROW en líneas 522/604 sin rollback de pasos anteriores |

---

## 10. ARCHIVOS RELEVANTES

### Handlers de Webhook:
- `server/lib/handlers/checkout/mp/processWebhook.ts`
- `server/lib/handlers/checkout/paypal/processWebhook.ts`

### Funciones compartidas:
- `server/lib/handlers/checkout/shared/subscriptions.ts` → `upgradeOrganizationPlan()`
- `server/lib/handlers/checkout/shared/payments.ts` → `insertPayment()`
- `server/lib/handlers/checkout/shared/events.ts` → `logPaymentEvent()`
- `server/lib/handlers/checkout/shared/plan-limits.ts` → `applyPlanLimits()`
- `server/lib/handlers/checkout/shared/enrollments.ts` → `upsertEnrollment()`

### Rutas:
- `server/routes/payments.ts` → Registro de endpoints

---

## 11. DIAGRAMA DE FLUJO SIMPLIFICADO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WEBHOOK RECIBIDO                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. logPaymentEvent()              →  payment_events (INSERT)               │
│     └─ Sin transacción, error ignorado                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. insertPayment()                →  payments (INSERT)                     │
│     └─ Idempotente: Si duplicado, return { inserted: false }               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │  inserted === true? │
                         └──────────┬──────────┘
                                    │ SÍ
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. upgradeOrganizationPlan()      ORQUESTADOR PRINCIPAL                    │
│     ├─ 3.1 Expire old subscriptions (UPDATE - error ignorado)               │
│     ├─ 3.2 Create new subscription (INSERT - THROW si error)               │
│     ├─ 3.3 Create billing cycle (INSERT - error ignorado)                   │
│     ├─ 3.4 Update organization plan (UPDATE - THROW si error)              │
│     ├─ 3.5 Apply plan limits (UPDATE - error ignorado)                      │
│     ├─ 3.6 Reactivate bonus enrollments (UPDATE - error ignorado)           │
│     └─ 3.7 Apply founders program (UPSERT - error ignorado)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. Return { success: true }                                                │
│     └─ SIEMPRE devuelve success (excepto errores catastróficos)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. PRÓXIMOS PASOS SUGERIDOS (NO IMPLEMENTADOS)

1. Envolver `upgradeOrganizationPlan()` en una transacción SQL
2. Crear alertas en `ops_alerts` cuando pasos secundarios fallen
3. Implementar rollback si pasos críticos fallan
4. Agregar `processed_at` a `payment_events` para tracking
5. Validar que triggers `enforce_*` no bloqueen service_role
