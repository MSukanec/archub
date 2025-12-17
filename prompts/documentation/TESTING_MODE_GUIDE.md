# Guía de Modo Testing para Pagos

Este documento explica cómo poner la aplicación en modo de prueba para testear el flujo de pagos sin afectar usuarios reales.

## Resumen Rápido

| Paso | Acción | Valor TEST | Valor PRODUCCIÓN |
|------|--------|------------|------------------|
| 1 | `MP_MODE` (Secrets) | `test` | `production` |
| 2 | `PAYPAL_ENV` (Secrets) | `sandbox` | `production` |
| 3 | Bloquear cards en código | Ver sección abajo | Desbloquear |
| 4 | Deploy | Hacer deploy | Hacer deploy |

---

## Paso 1: Cambiar Variables de Entorno

En la pestaña **Secrets** de Replit, cambiar:

### MercadoPago
- **`MP_MODE`** → `test`
- Esto usa automáticamente `MP_ACCESS_TOKEN_TEST` en lugar de `MP_ACCESS_TOKEN`

### PayPal
- **`PAYPAL_ENV`** → `sandbox`
- Esto usa automáticamente `PAYPAL_CLIENT_ID_SANDBOX` y `PAYPAL_CLIENT_SECRET_SANDBOX`

---

## Paso 2: Bloquear Cards de Planes

Para que usuarios normales no puedan acceder a los planes mientras testeas:

### Archivo: `src/features/shared-content/pricing/components/PlanCard.tsx`

**Línea ~37** - Cambiar el status de los planes:

```typescript
// MODO TEST: Bloquear Pro y Teams
const isPro = plan.name.toLowerCase() === 'pro';
const status = (isTeams || isPro) ? (plan.status || 'coming_soon') : 'available';

// MODO PRODUCCIÓN: Solo Teams bloqueado
// const status = isTeams ? (plan.status || 'coming_soon') : 'available';
```

**IMPORTANTE:** Los admins (`isAdmin`) siempre pueden ver y usar los planes bloqueados.

---

## Paso 3: Hacer Deploy

Después de cambiar las variables y el código, hacer deploy para que los cambios se apliquen en producción.

---

## Paso 4: Realizar Pruebas

### Tarjetas de Prueba MercadoPago (Argentina)

| Tipo | Número | CVV | Vencimiento |
|------|--------|-----|-------------|
| Visa ✅ | 4509 9535 6623 3704 | 123 | 11/25 |
| Mastercard ✅ | 5031 7557 3453 0604 | 123 | 11/25 |
| Visa ❌ Rechazada | 4000 0000 0000 0036 | 123 | 11/25 |

### Cuentas de Prueba PayPal

Usar las cuentas sandbox configuradas en el dashboard de PayPal Developer.

---

## Volver a Producción

1. **Secrets:**
   - `MP_MODE` → `production`
   - `PAYPAL_ENV` → `production`

2. **Código** (`PlanCard.tsx` línea ~37):
```typescript
// Solo Teams bloqueado (producción normal)
const status = isTeams ? (plan.status || 'coming_soon') : 'available';
```

3. **Deploy** nuevamente

---

## Prefijos de External Reference (Webhooks MP)

Para debugging de webhooks:

| Prefijo | Tipo de Pago | Archivo Handler |
|---------|--------------|-----------------|
| `mpr_` | Suscripción recurrente (FREE→PRO) | `createRecurringSubscription.ts` |
| `mpu_` | Upgrade (PRO→TEAMS) | `handleUpgradeReturn.ts` |
| `mps_` | Seat payment (agregar miembro) | `createSeatPreference.ts` |
| `mp_` | Compra de curso | `createCoursePreference.ts` |

---

## Checklist Modo Test

- [ ] `MP_MODE` = `test`
- [ ] `PAYPAL_ENV` = `sandbox`
- [ ] Cards PRO/Teams bloqueadas en `PlanCard.tsx`
- [ ] Deploy realizado
- [ ] Probar como admin (puedes ver cards bloqueadas)
- [ ] Usar tarjetas de prueba

## Checklist Volver a Producción

- [ ] `MP_MODE` = `production`
- [ ] `PAYPAL_ENV` = `production`
- [ ] Desbloquear cards en `PlanCard.tsx` (solo Teams bloqueado)
- [ ] Deploy realizado
- [ ] Verificar que usuarios pueden comprar PRO
