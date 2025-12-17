# Seencel Ops Center - Documentación Técnica Completa

> Última actualización: 2024-12-17

## Resumen Ejecutivo

El **Ops Center** es el centro de operaciones y monitoreo de Seencel. Es un sistema enterprise-grade para:
- Detectar proactivamente problemas en pagos, webhooks, suscripciones e integridad del sistema
- Bloquear flujos críticos (registro, checkout) cuando hay errores graves
- Guiar al admin a través de acciones de reparación con confirmación
- Auditar todas las acciones tomadas

---

## Ubicación de Archivos

### Backend

| Archivo | Descripción |
|---------|-------------|
| `server/controllers/admin/ops.controller.ts` | Controller principal (~970 líneas). Health checks, alertas, stats, repair actions |
| `server/lib/services/ops-repair.service.ts` | Servicio de ejecución de acciones de reparación. Registry de handlers, logging, validación |
| `server/routes/admin.ts` | Rutas admin que incluyen `/api/admin/ops/*` |
| `server/routes.ts` | Ruta pública `/api/ops/flow-status` para flow blocking |

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `src/pages/admin/ops/AdminOps.tsx` | Página principal del Ops Center con tabs |
| `src/pages/admin/ops/AdminOpsAlertsTab.tsx` | Tab de alertas (~515 líneas). Lista alertas, acciones de reparación, evidencia |
| `src/pages/admin/ops/AdminOpsHistoryTab.tsx` | Tab de historial de ejecuciones de checks |
| `src/pages/admin/ops/AdminOpsRunbooksTab.tsx` | Tab de runbooks (guías de resolución) |

### Hooks

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/use-ops-alerts-count.ts` | Cuenta alertas críticas/altas para badge de admin |
| `src/hooks/use-flow-blocking.ts` | Hook + helpers para verificar si un flujo está bloqueado |

### Componentes Shared

| Archivo | Descripción |
|---------|-------------|
| `src/components/shared/FlowBlockedBanner.tsx` | Banner y Overlay para flujos bloqueados |

### Integración en UI

| Archivo | Uso |
|---------|-----|
| `src/layouts/dashboard/components/Sidebar/LeftSidebar.tsx` | Badge en botón Administración con count de alertas |
| `src/pages/public/Register.tsx` | Usa `useFlowBlocking('user_signup')` |
| `src/pages/checkout/SubscriptionCheckout.tsx` | Usa `useFlowBlocking('billing_checkout')` |

---

## Tablas en Supabase

### `ops_alerts`
Almacena todas las alertas generadas por los health checks.

```sql
CREATE TABLE ops_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Clasificación
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'ack', 'resolved', 'dismissed')),
  alert_type TEXT NOT NULL,
  
  -- Contenido
  title TEXT NOT NULL,
  description TEXT,
  
  -- Referencias
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  payment_id UUID REFERENCES payments(id),
  event_id UUID REFERENCES payment_events(id),
  provider TEXT,
  provider_payment_id TEXT,
  
  -- Deduplicación
  fingerprint TEXT UNIQUE,
  
  -- Evidencia (JSON con datos relevantes)
  evidence JSONB DEFAULT '{}',
  
  -- Lifecycle
  ack_by UUID REFERENCES users(id),
  ack_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_ops_alerts_status ON ops_alerts(status);
CREATE INDEX idx_ops_alerts_severity ON ops_alerts(severity);
CREATE INDEX idx_ops_alerts_fingerprint ON ops_alerts(fingerprint);
```

### `ops_repair_actions`
Define las acciones de reparación disponibles por tipo de alerta.

```sql
CREATE TABLE ops_repair_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  alert_type TEXT NOT NULL,
  action_id TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  
  is_dangerous BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  required_evidence TEXT[],
  execution_order INT DEFAULT 0,
  
  UNIQUE(alert_type, action_id)
);
```

### `ops_repair_logs`
Auditoría de todas las acciones de reparación ejecutadas.

```sql
CREATE TABLE ops_repair_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  alert_id UUID NOT NULL REFERENCES ops_alerts(id),
  action_id TEXT NOT NULL,
  executed_by UUID NOT NULL REFERENCES users(id),
  
  result TEXT NOT NULL CHECK (result IN ('success', 'error')),
  details JSONB DEFAULT '{}'
);

CREATE INDEX idx_ops_repair_logs_alert ON ops_repair_logs(alert_id);
CREATE INDEX idx_ops_repair_logs_executed_by ON ops_repair_logs(executed_by);
```

### `ops_check_runs`
Historial de ejecuciones de health checks.

```sql
CREATE TABLE ops_check_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  duration_ms INT,
  stats JSONB DEFAULT '{}'
);
```

---

## Arquitectura del Flujo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           OPS CENTER PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────┘

  1. HEALTH CHECKS (On-demand o Scheduled)
     │
     ├─► checkPaymentPlanMismatch()     → Pagos aprobados sin plan aplicado
     ├─► checkStuckPaymentEvents()      → Webhooks stuck/failed
     ├─► checkFailedSystemJobs()        → Jobs del sistema fallidos
     └─► checkSystemIntegrity()         → Errores críticos no resueltos
     │
     ▼
  2. ALERTAS (ops_alerts)
     │
     ├─► Deduplicación via fingerprint (no duplica si ya existe abierta)
     ├─► Severidad: critical | high | medium | low
     └─► Estado: open → ack → resolved | dismissed
     │
     ▼
  3. FLOW BLOCKING (Preventivo)
     │
     ├─► Si hay alertas critical/high abiertas de ciertos tipos
     │   └─► /api/ops/flow-status?flow=user_signup → { blocked: true }
     │   └─► /api/ops/flow-status?flow=billing_checkout → { blocked: true }
     │
     └─► Frontend usa useFlowBlocking() para mostrar FlowBlockedBanner/Overlay
     │
     ▼
  4. GUIDED REPAIR (Reparación Guiada)
     │
     ├─► Admin ve alerta en Ops Center UI
     ├─► Hace clic en "Acciones de reparación" (Wrench icon)
     ├─► Ve lista de acciones disponibles para ese alert_type
     ├─► Selecciona acción → Confirmación (especialmente si is_dangerous)
     ├─► executeOpsRepairAction(alertId, actionId, userId)
     │   ├─► Valida alerta (existe, estado open/ack)
     │   ├─► Valida acción (existe, activa, match alert_type)
     │   ├─► Valida evidencia requerida
     │   ├─► Ejecuta handler correspondiente
     │   ├─► Registra en ops_repair_logs (siempre)
     │   └─► Si exitoso, marca alerta como resolved
     │
     ▼
  5. AUDITORÍA (ops_repair_logs)
     │
     └─► Cada acción queda registrada con:
         - alert_id, action_id, executed_by
         - result: 'success' | 'error'
         - details: { message, data, error, duration_ms, timestamps }
```

---

## Tipos de Alertas Implementados

| alert_type | Descripción | Severidad |
|------------|-------------|-----------|
| `payment.approved_but_not_applied` | Pago aprobado pero plan no aplicado a org | high |
| `webhook.stuck_processing` | Webhook stuck en PROCESSING > 30 min | high |
| `webhook.failed_processing` | Webhook con status FAILED | critical |
| `system.job_failed` | Job del sistema falló | high |
| `system.integrity_error` | Error crítico no resuelto en system_errors | critical |

---

## Acciones de Reparación Implementadas

| action_id | Descripción | Tipo de Alerta |
|-----------|-------------|----------------|
| `acknowledge_alert` | Marca como reconocida (el equipo está al tanto) | Universal |
| `mark_resolved` | Cierra la alerta manualmente | Universal |
| `test_signup_flow` | Dry-run del flujo de registro | `system.integrity_error` |
| `apply_plan_to_org` | Aplica el plan comprado a la organización | `payment.approved_but_not_applied` |
| `create_missing_subscription` | Crea suscripción faltante basada en pago | `payment.approved_but_not_applied` |
| `retry_webhook_processing` | Marca webhook para reprocesamiento | `webhook.*` |

---

## API Endpoints

### Admin Endpoints (requieren admin auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/ops/stats` | Stats: open, ack, resolved, critical, high, last_run |
| GET | `/api/admin/ops/alerts` | Lista todas las alertas con joins |
| POST | `/api/admin/ops/run-checks` | Ejecuta todos los health checks manualmente |
| PATCH | `/api/admin/ops/alerts/:id` | Actualiza status de alerta (ack, resolve, dismiss, reopen) |
| GET | `/api/admin/ops/repair-actions/:alertType` | Lista acciones disponibles para tipo de alerta |
| POST | `/api/admin/ops/alerts/:id/execute-repair` | Ejecuta acción de reparación |
| GET | `/api/admin/ops/repair-logs` | Lista logs de reparación (filtrable por alertId) |
| GET | `/api/admin/ops/check-runs` | Historial de ejecuciones de checks |

### Public Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ops/flow-status?flow=<flowKey>` | Verifica si un flujo está bloqueado |

---

## Flow Blocking

### Flujos Soportados

| flowKey | Componente | Descripción |
|---------|------------|-------------|
| `user_signup` | `Register.tsx` | Registro de nuevos usuarios |
| `billing_checkout` | `SubscriptionCheckout.tsx` | Checkout de suscripciones |

### Lógica de Bloqueo

Un flujo se bloquea cuando:
1. Existe al menos una alerta con `status IN ('open', 'ack')`
2. Con `severity IN ('critical', 'high')`
3. Con `alert_type` relacionado al flujo:
   - `user_signup`: tipos que empiezan con `system.` o `auth.`
   - `billing_checkout`: tipos que empiezan con `payment.` o `webhook.`

### Uso en Frontend

```tsx
import { useFlowBlocking } from '@/hooks/use-flow-blocking';
import { FlowBlockedBanner, FlowBlockedOverlay } from '@/components/shared/FlowBlockedBanner';

function RegisterPage() {
  const { isBlocked, message } = useFlowBlocking('user_signup');
  
  if (isBlocked) {
    return <FlowBlockedBanner flowKey="user_signup" />;
  }
  
  return <RegisterForm />;
}
```

---

## Badge de Notificación

El botón de "Administración" (corona) en el sidebar muestra un badge con:
- Mensajes de soporte no leídos
- Alertas críticas/altas abiertas del Ops Center

**Archivo:** `src/layouts/dashboard/components/Sidebar/LeftSidebar.tsx`
**Hook:** `src/hooks/use-ops-alerts-count.ts`

---

## Servicio de Reparación

### Ubicación
`server/lib/services/ops-repair.service.ts`

### Funciones Exportadas

```typescript
// Ejecuta una acción de reparación
executeOpsRepairAction(
  alertId: string, 
  actionId: string, 
  executedBy: string
): Promise<RepairActionResult>

// Obtiene acciones disponibles para un tipo de alerta
getAvailableRepairActions(
  alertType: string
): Promise<OpsRepairAction[]>
```

### Registry de Handlers

```typescript
const ACTION_HANDLERS: Record<string, ActionHandler> = {
  "acknowledge_alert": handleAcknowledgeAlert,
  "mark_resolved": handleMarkResolved,
  "test_signup_flow": handleTestSignupFlow,
  "apply_plan_to_org": handleApplyPlanToOrg,
  "create_missing_subscription": handleCreateMissingSubscription,
  "retry_webhook_processing": handleRetryWebhookProcessing,
};
```

### Agregar Nueva Acción

1. Añadir handler en `ACTION_HANDLERS`
2. Implementar función `async handleMyAction(ctx: RepairActionContext): Promise<RepairActionResult>`
3. (Opcional) Insertar en tabla `ops_repair_actions` para definir metadata (label, description, required_evidence)

---

## Lo Que Está Implementado ✅

### Backend
- [x] Health checks: payment mismatch, stuck webhooks, failed jobs, system integrity
- [x] Generación de alertas con deduplicación via fingerprint
- [x] API completa: stats, alerts, run-checks, repair-actions, execute-repair, repair-logs
- [x] Servicio de reparación con registry extensible
- [x] Logging de todas las acciones en ops_repair_logs
- [x] Flow blocking API

### Frontend
- [x] Página Ops Center con 3 tabs (Alertas, Historial, Runbooks)
- [x] Lista de alertas con severity/status badges
- [x] Acciones rápidas: ack, resolve, dismiss, reopen
- [x] Panel de acciones de reparación con confirmación
- [x] Visualización de evidencia expandible
- [x] Badge en sidebar de admin con count de alertas críticas

### Hooks
- [x] useOpsAlertsCount - cuenta alertas para badge
- [x] useFlowBlocking - verifica bloqueo de flujos

### Componentes
- [x] FlowBlockedBanner - banner de alerta
- [x] FlowBlockedOverlay - overlay que bloquea contenido

---

## Lo Que Falta Implementar 🔴

### Prioridad Alta
- [ ] **Migración SQL de `ops_repair_logs`** - La tabla puede no existir en Supabase, logging falla silenciosamente
- [ ] **Tests E2E** - Para repair actions y flow blocking API

### Prioridad Media
- [ ] **Dashboard de métricas** - Gráficos de volumen de alertas, tiempos de resolución
- [ ] **Auto-resolución** - Cerrar alertas automáticamente cuando condición se corrige
- [ ] **Notificaciones** - Email/Slack cuando hay alertas críticas
- [ ] **Más flujos en flow blocking** - Extender a otros flujos críticos

### Prioridad Baja
- [ ] **Runbooks completos** - Guías detalladas de resolución por tipo de alerta
- [ ] **Historial mejorado** - Filtros, búsqueda, exportación
- [ ] **Scheduled checks via cron** - Actualmente solo on-demand

---

## Notas de Seguridad

1. **Todas las rutas admin requieren verificación** via `verifyAdminUser()`
2. **No se ejecuta SQL destructivo** sin validación previa
3. **Todas las acciones quedan auditadas** en `ops_repair_logs`
4. **Fingerprinting previene duplicados** para no saturar con alertas repetidas
5. **Acciones peligrosas** requieren confirmación explícita en UI

---

## Troubleshooting

### "ops_repair_logs no existe"
Ejecutar migración SQL (ver sección de tablas arriba).

### Alertas no se generan
1. Verificar que las tablas referenciadas existen (payments, payment_events, system_errors)
2. Los checks manejan errores de schema gracefully, revisar logs del servidor

### Flow blocking no funciona
1. Verificar que `/api/ops/flow-status` está registrado en routes.ts
2. Verificar que hay alertas critical/high abiertas del tipo correcto

### Badge no se actualiza
El hook tiene `refetchInterval: 60000` (1 minuto). Para testing, reducir temporalmente.
