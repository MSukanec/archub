# Modificaciones de Suscripciones - Análisis y Estrategia

## 🎯 ESTADO: PENDIENTE DE IMPLEMENTACIÓN

**Última actualización:** 1 de Diciembre 2025

Este documento analiza las limitaciones de PayPal y MercadoPago para modificar suscripciones activas, y propone la estrategia de implementación.

---

## 📋 EL PROBLEMA

Tanto PayPal como MercadoPago tienen **limitaciones importantes** para modificar suscripciones activas:

### Casos que requieren modificación:

1. **UPGRADE de plan** (ej: Free → Pro, Pro → Teams)
   - Cambio de monto mensual/anual
   - Posible prorrateo del tiempo restante

2. **TEAMS - Agregar miembro**
   - Incremento del monto de facturación
   - Cobro adicional por el nuevo seat

3. **TEAMS - Remover miembro**
   - Reducción del monto de facturación
   - ¿Crédito para próximo ciclo?

4. **DOWNGRADE de plan** (ej: Teams → Pro)
   - Ya implementado: se programa para fin del ciclo actual
   - No requiere modificación inmediata de la suscripción

---

## ⚠️ LIMITACIONES DE LOS GATEWAYS

### PayPal Subscriptions API

**Documentación:** https://developer.paypal.com/docs/api/subscriptions/v1/

**Limitaciones:**
- ❌ NO se puede cambiar el `plan_id` de una suscripción activa
- ❌ NO se puede cambiar el precio base sin cancelar y recrear
- ✅ Se puede pausar/reactivar la suscripción
- ✅ Se puede cancelar la suscripción

**Para modificar el precio:**
```
PATCH /v1/billing/subscriptions/{id}
[
  {
    "op": "replace",
    "path": "/plan/billing_cycles/@sequence==1/pricing_scheme/fixed_price",
    "value": { "currency_code": "USD", "value": "50.00" }
  }
]
```

**Problema:** Esto cambia el precio para TODOS los ciclos futuros, no solo el próximo.
Si querés aplicar un ajuste único (prorrateo), no funciona bien.

### MercadoPago Preapproval API

**Documentación:** https://www.mercadopago.com.ar/developers/es/reference/subscriptions

**Limitaciones:**
- ❌ NO se puede cambiar el `preapproval_plan_id` de una suscripción activa
- ❌ NO se puede modificar el `auto_recurring.transaction_amount` después de creado
- ✅ Se puede pausar la suscripción (`status: paused`)
- ✅ Se puede cancelar la suscripción (`status: cancelled`)

**Para actualizar:**
```
PUT /preapproval/{id}
{
  "status": "paused" | "cancelled" | "authorized"
}
```

---

## 🔄 ESTRATEGIA RECOMENDADA: CANCELAR Y RECREAR

### Flujo para UPGRADE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO QUIERE HACER UPGRADE (ej: Pro → Teams)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Calcular prorrateo:                                                      │
│    - Días restantes del ciclo actual                                        │
│    - Valor diario del plan actual                                           │
│    - Crédito = días_restantes × valor_diario                                │
│                                                                              │
│ 2. Calcular precio del nuevo plan:                                          │
│    - Precio base del plan nuevo                                             │
│    - Primer pago = precio_nuevo - crédito (si positivo)                    │
│                                                                              │
│ 3. Mostrar breakdown al usuario:                                            │
│    "Plan Teams: $50/mes"                                                    │
│    "Crédito por tiempo restante: -$15"                                      │
│    "Primer pago: $35"                                                       │
│    "Pagos siguientes: $50/mes"                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ USUARIO CONFIRMA Y PAGA                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. CANCELAR suscripción actual en el gateway:                               │
│    - PayPal: POST /v1/billing/subscriptions/{id}/cancel                     │
│    - MercadoPago: PUT /preapproval/{id} { status: "cancelled" }            │
│                                                                              │
│ 2. MARCAR suscripción interna como "upgraded":                              │
│    UPDATE organization_subscriptions                                         │
│    SET status = 'upgraded', cancelled_at = now()                            │
│    WHERE id = current_subscription_id                                        │
│                                                                              │
│ 3. CREAR nueva suscripción con el nuevo plan:                               │
│    - Usar el flujo normal de checkout                                       │
│    - Para primer pago con prorrateo: usar TRIAL cycle                       │
│                                                                              │
│ 4. ACTIVAR nueva suscripción cuando se complete el pago                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementación del Primer Pago con Prorrateo

**PayPal:**
Reconstruir los Billing Plans con estructura TRIAL + REGULAR:
```json
{
  "billing_cycles": [
    {
      "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
      "tenure_type": "TRIAL",
      "sequence": 1,
      "total_cycles": 1,
      "pricing_scheme": {
        "fixed_price": { "value": "35.00", "currency_code": "USD" }
      }
    },
    {
      "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
      "tenure_type": "REGULAR",
      "sequence": 2,
      "total_cycles": 0,
      "pricing_scheme": {
        "fixed_price": { "value": "50.00", "currency_code": "USD" }
      }
    }
  ]
}
```

**MercadoPago:**
Usar `free_trial` en auto_recurring:
```json
{
  "auto_recurring": {
    "frequency": 1,
    "frequency_type": "months",
    "transaction_amount": 50.00,
    "currency_id": "ARS",
    "free_trial": {
      "frequency": 1,
      "frequency_type": "months"
    }
  }
}
```
Y luego crear un pago único por el monto del primer pago prorrateado.

---

## 🧑‍🤝‍🧑 FLUJO PARA TEAMS - AGREGAR MIEMBRO

### Opción A: Cobro inmediato por nuevo seat (Recomendada)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN AGREGA NUEVO MIEMBRO A TEAMS                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Calcular cobro prorrateado del nuevo seat:                               │
│    - Días restantes del ciclo                                               │
│    - Valor diario por seat = precio_mensual / 30                            │
│    - Cobro = días_restantes × valor_diario                                  │
│                                                                              │
│ 2. Crear pago único por el seat adicional:                                  │
│    - PayPal: Crear orden de pago (no suscripción)                           │
│    - MercadoPago: Crear preferencia de pago único                           │
│                                                                              │
│ 3. Una vez pagado:                                                          │
│    - Agregar miembro a la organización                                      │
│    - Actualizar billable_members                                            │
│                                                                              │
│ 4. Al renovar la suscripción:                                               │
│    - El webhook ya cobra el precio base × número de seats                   │
│    - O: cancelar y recrear suscripción con nuevo monto                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Opción B: Agregar gratis, ajustar en renovación

```
1. Agregar miembro inmediatamente (sin cobro)
2. Registrar en organization_member_events
3. Al renovar:
   - Cancelar suscripción actual
   - Crear nueva con monto = precio × seats
```

**Ventajas de Opción B:**
- Más simple de implementar
- Mejor UX (no pide pago inmediato)

**Desventajas:**
- Permite "abuso": agregar muchos miembros antes de renovación
- Requiere recrear suscripción en cada cambio

---

## 🗑️ FLUJO PARA REMOVER MIEMBRO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ADMIN REMUEVE MIEMBRO DE TEAMS                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Marcar miembro como inactivo (no eliminar)                               │
│                                                                              │
│ 2. Registrar en organization_member_events:                                 │
│    event_type: 'left', event_date: now()                                    │
│                                                                              │
│ 3. NO ajustar el pago del ciclo actual                                      │
│    (ya pagaron por ese seat)                                                │
│                                                                              │
│ 4. Al renovar:                                                              │
│    - Contar members activos                                                 │
│    - Cancelar suscripción actual                                            │
│    - Crear nueva con monto = precio × seats_activos                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 ARCHIVOS A MODIFICAR/CREAR

### Nuevos archivos:

```
server/lib/handlers/checkout/shared/modify-subscription.ts
  └─ cancelCurrentSubscription(): Cancela en gateway + marca interna
  └─ calculateUpgradeProration(): Calcula crédito por tiempo restante
  └─ createUpgradedSubscription(): Crea nueva suscripción post-upgrade

server/lib/handlers/checkout/paypal/cancel-subscription.ts
  └─ cancelPayPalSubscription(): POST /v1/billing/subscriptions/{id}/cancel

server/lib/handlers/checkout/mp/cancel-subscription.ts
  └─ cancelMPPreapproval(): PUT /preapproval/{id} { status: cancelled }
```

### Archivos existentes a modificar:

```
server/routes/subscriptions.ts
  └─ Agregar: POST /api/subscriptions/upgrade
  └─ Agregar: POST /api/subscriptions/add-seat (TEAMS)

src/pages/checkout/SubscriptionCheckout.tsx
  └─ Modificar para soportar flujo de upgrade con prorrateo

src/pages/organization/Members.tsx
  └─ Agregar flujo de pago al agregar miembro (TEAMS)
```

---

## ✅ ORDEN DE IMPLEMENTACIÓN SUGERIDO

1. **Fase 1: Cancelación en gateways**
   - [ ] Implementar `cancelPayPalSubscription()`
   - [ ] Implementar `cancelMPPreapproval()`
   - [ ] Probar cancelaciones

2. **Fase 2: Upgrade de plan**
   - [ ] Calcular prorrateo correctamente
   - [ ] Flujo: cancelar → crear nueva suscripción
   - [ ] Reconstruir PayPal plans con TRIAL cycle
   - [ ] Probar upgrade Pro → Teams

3. **Fase 3: TEAMS - Agregar miembro**
   - [ ] Decidir: cobro inmediato vs ajuste en renovación
   - [ ] Implementar flujo elegido
   - [ ] UI para agregar con pago

4. **Fase 4: TEAMS - Remover miembro**
   - [ ] Implementar soft-delete de miembro
   - [ ] Ajustar conteo en renovación

---

## 📝 NOTAS FINALES

- **GPT y Gemini tienen razón**: la forma más limpia es cancelar y recrear
- **No intentar "hackear"** las APIs para modificar precios in-place
- **Siempre guardar el historial** de cambios de suscripción
- **Comunicar claramente** al usuario qué va a pasar con su pago

---

## 🔗 REFERENCIAS

- PayPal Subscriptions API: https://developer.paypal.com/docs/api/subscriptions/v1/
- MercadoPago Preapproval API: https://www.mercadopago.com.ar/developers/es/reference/subscriptions
- Stripe (referencia de buenas prácticas): https://stripe.com/docs/billing/subscriptions/upgrade-downgrade
