# Instrucciones de Diagnóstico - Modal de Pago

## Problema SOLUCIONADO ✅
El botón "Continuar" en el modal de pago se quedaba en "Cargando..." sin redirigir.

### Causa Raíz
Los endpoints `/api/mp/create-preference` y `/api/paypal/create-order` existían en el código pero **NO estaban configurados en `vercel.json`**, por lo que Vercel no los servía.

### Solución Aplicada
Se agregaron las rutas faltantes a `vercel.json`:
- `/api/mp/create-preference`
- `/api/paypal/create-order`
- `/api/paypal/capture-order`
- `/api/diag/ping` (diagnóstico)
- `/api/diag/fake-mp` (diagnóstico)

**IMPORTANTE**: Los cambios en `vercel.json` solo toman efecto en producción después de hacer deploy a Vercel. En Replit Preview los endpoints seguirán sin funcionar hasta que se deployee.

---

## Problema Original (para referencia)

## Endpoints de Diagnóstico Creados

### 1. `/api/diag/ping`
- **Propósito**: Verificar conectividad básica con los endpoints de Vercel
- **Método**: GET
- **URL de prueba**: https://sukanec.vercel.app/api/diag/ping?from=browser
- **Respuesta esperada**: `{ok: true, path: "/api/diag/ping?from=browser", method: "GET", now: "..."}`

### 2. `/api/diag/fake-mp`
- **Propósito**: Simular la respuesta de Mercado Pago sin llamar a la API real
- **Método**: POST
- **Respuesta**: `{init_point: "https://www.mercadopago.com/"}`
- **Uso**: Para aislar si el problema está en el frontend o en el backend

## Cómo Diagnosticar

### Paso 1: Verificar VITE_API_BASE
1. Abrí la consola del navegador (F12)
2. Intentá hacer una compra (click en Continuar)
3. Buscá en los logs de consola:
   ```
   [MP] API_BASE: ...
   [MP] VITE_API_BASE: ...
   [MP] URL completa: ...
   ```
4. **Verificar que VITE_API_BASE apunte a**: `https://sukanec.vercel.app`

### Paso 2: Probar con endpoint fake
1. Abrí `src/components/modal/modals/PaymentMethodModal.tsx`
2. En la línea ~274, descomentar:
   ```typescript
   const mpUrl = `${API_BASE}/api/diag/fake-mp`;
   // const mpUrl = `${API_BASE}/api/mp/create-preference`;
   ```
3. Guardá el archivo
4. Intentá hacer una compra nuevamente
5. **Resultado esperado**: Debería redirigir a `https://www.mercadopago.com/`

### Paso 3: Revisar Network Tab
1. Abrí DevTools > Network
2. Filtrá por "create-preference" o "fake-mp"
3. Intentá hacer una compra
4. Verificá:
   - ✅ La request se envía
   - ✅ Recibe respuesta 200
   - ✅ La respuesta tiene `init_point`
   - ⚠️ Si no aparece la request = El fetch no se dispara
   - ⚠️ Si hay error 404 = El endpoint no existe
   - ⚠️ Si hay timeout = El endpoint tarda más de 15s

### Paso 4: Analizar según resultado

#### Si fake-mp FUNCIONA pero create-preference NO:
- ✅ El frontend está OK
- ❌ El problema está en `/api/mp/create-preference`
- Acción: Revisar logs de Vercel del endpoint real

#### Si fake-mp NO funciona:
- ❌ El problema está en el frontend
- Revisar:
  - ¿Se ejecuta `handleMercadoPagoPayment()`?
  - ¿`fetchWithTimeout` lanza error?
  - ¿Hay error de CORS?

#### Si nada aparece en Network:
- ❌ El click no dispara el handler
- Revisar:
  - ¿El botón tiene `disabled`?
  - ¿`selectedMethod` está seteado?
  - ¿Hay error en consola antes del fetch?

## Logs Agregados

El modal ahora imprime:
- `[MP] Creando preferencia…` + request body
- `[MP] API_BASE: ...`
- `[MP] VITE_API_BASE: ...`
- `[MP] URL completa: ...`
- `[MP] Respuesta create-preference: ...`
- `[MP] Error al crear preferencia: ...` (si falla)
- `[MP] Error fatal: ...` (si falla el catch)

Lo mismo para `[PayPal]`.

## Próximos Pasos

1. Probar endpoint de ping desde el navegador
2. Intentar compra y revisar logs de consola
3. Si no funciona, probar con fake-mp
4. Reportar resultados para continuar diagnóstico
