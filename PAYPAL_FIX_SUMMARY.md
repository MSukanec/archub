# Solución al Problema de PayPal - Tablas Vacías

## 🔍 Problema Identificado

El flujo de pago de PayPal funcionaba (usuario pagaba, veía "Pago Exitoso", accedía al curso) PERO las tablas de la base de datos quedaban vacías:
- `paypal_events` - vacía ❌
- `course_enrollments` - vacía ❌  
- `payment_logs` - vacía ❌

## 🎯 Causa Raíz

El archivo `/api/paypal/capture-and-redirect.ts` (el return_url de PayPal) **SOLO mostraba un HTML de éxito** pero NO:
- Capturaba la orden en PayPal
- Guardaba datos en la base de datos
- Creaba el enrollment del usuario

Era básicamente una página "fake" que decía "Pago Exitoso" sin hacer nada.

## ✅ Solución Implementada

### 1. Reescritura Completa de `capture-and-redirect.ts`

Ahora el endpoint:

**a) Captura la orden en PayPal:**
```typescript
const captureResponse = await fetch(`${base}/v2/checkout/orders/${token}/capture`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` }
});
```

**b) Extrae datos del pago:**
- Order ID
- Status (COMPLETED, PENDING, etc.)
- Invoice ID (contiene `user:UUID;course:UUID`)
- Amount y Currency

**c) Guarda en `paypal_events`:**
```typescript
await supabase.from('paypal_events').insert({
  provider_event_id: orderId,
  provider_event_type: 'PAYMENT.CAPTURE.COMPLETED',
  status: 'PROCESSED',
  raw_payload: captureData,
  order_id: orderId,
  custom_id: invoiceId,
  user_hint: userId,
  course_hint: courseId,
});
```

**d) Guarda en `payment_logs` (si existe):**
```typescript
await supabase.from('payment_logs').insert({
  user_id: userId,
  course_id: courseId,
  provider: 'paypal',
  provider_payment_id: orderId,
  amount: parseFloat(amount),
  currency: currency || 'USD',
  status: status === 'COMPLETED' ? 'completed' : 'pending',
  raw_payload: captureData,
});
```

**e) Crea enrollment en `course_enrollments`:**
```typescript
await supabase.from('course_enrollments').upsert({
  user_id: userId,
  course_id: courseId,
  status: 'active',
  started_at: new Date().toISOString(),
  expires_at: expiresAt.toISOString(), // +365 días
}, { onConflict: 'user_id,course_id' });
```

**f) Logs detallados:**
- Console.log en cada paso
- Manejo de errores específicos por tabla
- Información de debugging para troubleshooting

### 2. Actualización de `create-order.ts`

Cambié el `return_url` para que apunte al nuevo endpoint con el course_slug:

**ANTES:**
```typescript
return_url: `${returnBase}/checkout/paypal/return`
```

**AHORA:**
```typescript
return_url: `${returnBase}/api/paypal/capture-and-redirect?course_slug=${course_slug}`
```

Esto permite que después del pago exitoso, el usuario sea redirigido al curso correcto.

### 3. Configuración de `vercel.json`

Agregué las rutas faltantes:
```json
{ "source": "/api/paypal/capture-and-redirect", "destination": "/api/paypal/capture-and-redirect" },
{ "source": "/api/paypal/webhook", "destination": "/api/paypal/webhook" }
```

## 📊 Flujo Completo Actualizado

```
1. Usuario hace click en "Continuar" con PayPal
   ↓
2. Frontend llama /api/paypal/create-order
   ↓
3. create-order crea orden en PayPal con:
   - invoice_id: "user:UUID;course:UUID"
   - return_url: /api/paypal/capture-and-redirect?course_slug=X
   ↓
4. Usuario redirigido a PayPal
   ↓
5. Usuario paga con cuenta demo
   ↓
6. PayPal redirige a /api/paypal/capture-and-redirect?token=ORDER_ID
   ↓
7. capture-and-redirect:
   ✅ Captura la orden en PayPal
   ✅ Parsea invoice_id para obtener user_id y course_id
   ✅ INSERT en paypal_events
   ✅ INSERT en payment_logs (si existe)
   ✅ UPSERT en course_enrollments
   ✅ Muestra "Pago Exitoso"
   ✅ Redirige a /learning/courses/{course_slug}
```

## 🧪 Testing

Para verificar que funciona:

1. **Hacer un pago de prueba con PayPal**
2. **Revisar logs de Vercel**:
   - Buscar `[PayPal capture-and-redirect]`
   - Verificar que NO haya errores de Supabase
3. **Verificar tablas en Supabase**:
   ```sql
   SELECT * FROM paypal_events ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM course_enrollments ORDER BY started_at DESC LIMIT 5;
   SELECT * FROM payment_logs ORDER BY created_at DESC LIMIT 5;
   ```

## ⚠️ Importante

**Esto SOLO funciona después de hacer deploy a Vercel**, porque:
- Los cambios en `/api/paypal/capture-and-redirect.ts` son serverless functions
- La configuración de `vercel.json` solo aplica en producción
- Replit Preview no puede ejecutar estas funciones

**Próximo paso**: Deploy a Vercel para probar en producción.

## 🔧 Webhook Redundante

El archivo `/api/paypal/webhook.ts` también insertaría en las tablas si PayPal lo llamara, pero:
- Requiere configurar la URL del webhook en PayPal Dashboard
- Es un proceso asíncrono (no inmediato)
- Con `capture-and-redirect` ya tenemos todo cubierto

El webhook es útil como respaldo o para eventos que PayPal envía después (refunds, disputes, etc.).

## 📝 Variables de Entorno Requeridas

Asegurate de tener configuradas en Vercel:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_BASE_URL` (opcional, default: sandbox)
- `CHECKOUT_RETURN_URL_BASE` (opcional, default: https://sukanec.vercel.app)
