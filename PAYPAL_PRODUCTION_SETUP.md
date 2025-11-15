# 🔐 Configuración de PayPal en PRODUCCIÓN

## ❌ Problema Actual
Estás recibiendo este error:
```
PayPal token error: 401 - {"error":"invalid_client","error_description":"Client Authentication failed"}
```

**Causa**: Las credenciales de PayPal PRODUCTION están mal configuradas o son credenciales de SANDBOX.

---

## ✅ Solución: Obtener Credenciales LIVE de PayPal

### 📋 Paso 1: Acceder al Dashboard de PayPal Developer

1. Ve a: **https://developer.paypal.com/dashboard**
2. Inicia sesión con tu cuenta de PayPal **Business**
3. En la esquina **superior derecha**, verás un toggle que dice `Sandbox` o `Live`
4. **MUY IMPORTANTE**: Cambia a **`Live`** (NO Sandbox)

![PayPal Toggle](https://i.imgur.com/example.png)

---

### 📋 Paso 2: Crear o Acceder a tu App LIVE

1. Una vez en modo **Live**, haz clic en **"Apps & Credentials"**
2. Asegúrate de estar en la pestaña **"Live"** (no Sandbox)
3. Si ya tienes una app, haz clic en ella
4. Si NO tienes app, haz clic en **"Create App"**:
   - **App Name**: Elige un nombre (ej: "Seencel Production")
   - **App Type**: Merchant
   - Haz clic en **"Create App"**

---

### 📋 Paso 3: Copiar las Credenciales LIVE

En la página de tu app LIVE, verás:

```
Client ID:  AeA1QIZXiflr1_-r0U3VhoLxNv-LIVE-EXAMPLE-ID
Secret:     [Show] ← Haz clic aquí
```

**Importante**:
- Las credenciales LIVE empiezan con caracteres diferentes a las de SANDBOX
- Las credenciales de SANDBOX NO funcionan en producción
- NO compartas estas credenciales públicamente

**Copia**:
1. ✅ **Client ID** (completo, sin espacios)
2. ✅ **Secret** (haz clic en "Show" y copia completo)

---

### 📋 Paso 4: Configurar en Vercel

Ve a tu proyecto en Vercel:

1. **Vercel Dashboard** → Tu proyecto **Seencel**
2. **Settings** → **Environment Variables**
3. **Actualiza** estas variables:

| Variable Name | Value |
|---------------|-------|
| `PAYPAL_CLIENT_ID` | `AeA1QIZXi...` (tu Client ID LIVE) |
| `PAYPAL_CLIENT_SECRET` | `ECR7XSp3...` (tu Secret LIVE) |
| `PAYPAL_ENV` | `production` |

**⚠️ IMPORTANTE**:
- Asegúrate de que NO haya espacios al inicio o final
- Copia y pega directamente desde PayPal
- NO uses credenciales de SANDBOX

4. **Redeploy** tu aplicación después de cambiar las variables

---

### 📋 Paso 5: Verificar tu Cuenta PayPal

Para usar credenciales LIVE, tu cuenta debe ser:

✅ **Tipo de cuenta**: Business (no Personal)  
✅ **Estado**: Verificada (email confirmado)  
✅ **Banco/Tarjeta**: Agregada y confirmada  

**Verificar**:
1. Ve a **https://www.paypal.com**
2. **Account Settings** → **Business Information**
3. Verifica que dice **"Business Account"** y **"Verified"**

Si tu cuenta NO es Business o NO está verificada, las credenciales LIVE no funcionarán.

---

## 🧪 Cómo Saber Si Estás Usando Credenciales Correctas

### Credenciales SANDBOX (❌ NO usar en producción):
```
Client ID: AeA1QIZXiflr1_-SB1234567890abcdefghijk... (nota el patrón "SB")
Endpoint: https://api-m.sandbox.paypal.com
```

### Credenciales LIVE (✅ usar en producción):
```
Client ID: AeA1QIZXiflr1_-LIVE1234567890abcdefgh... (diferente patrón)
Endpoint: https://api-m.paypal.com (sin "sandbox")
```

---

## 🧪 Test Rápido (opcional)

Puedes probar tus credenciales LIVE con este comando cURL:

```bash
curl -v POST https://api-m.paypal.com/v1/oauth2/token \
  -u "TU_CLIENT_ID:TU_CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials"
```

**Respuesta correcta**:
```json
{
  "access_token": "A21AA...",
  "token_type": "Bearer",
  "expires_in": 32400
}
```

**Respuesta incorrecta** (401):
```json
{
  "error": "invalid_client",
  "error_description": "Client Authentication failed"
}
```

---

## 🔍 Verificar en los Logs

Con las mejoras que agregué, ahora verás en los logs de Vercel:

```
[PayPal Auth] Requesting token from: https://api-m.paypal.com
[PayPal Auth] Mode: PRODUCTION
[PayPal Auth] Client ID starts with: AeA1QIZXif...
[PayPal Auth] Secret configured: YES
```

**Verifica**:
1. ✅ El endpoint es `https://api-m.paypal.com` (sin "sandbox")
2. ✅ Mode dice "PRODUCTION"
3. ✅ Los primeros 10 caracteres del Client ID coinciden con lo que copiaste de PayPal

---

## ⚠️ Notas Importantes

### Platform/Marketplace APIs
Si usas **PayPal Commerce Platform** o **Marketplace APIs**, necesitas **aprobación de PayPal** antes de usar credenciales LIVE. Esto puede tomar días o semanas.

**Para este proyecto (Seencel)**: 
- Estamos usando **PayPal Standard Checkout** (NO Platform/Marketplace)
- **NO necesitas aprobación especial**
- Las credenciales LIVE funcionarán inmediatamente

### Variables de Entorno Actuales
```
✅ PAYPAL_CLIENT_ID (existe)
✅ PAYPAL_CLIENT_SECRET (existe)
✅ PAYPAL_ENV (existe)
❌ PAYPAL_CLIENT_ID_SANDBOX (no necesario)
❌ PAYPAL_CLIENT_SECRET_SANDBOX (no necesario)
```

---

## 🚀 Próximos Pasos

1. ✅ Obtén credenciales LIVE del dashboard de PayPal (modo Live)
2. ✅ Actualiza `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` en Vercel
3. ✅ Redeploy la aplicación
4. ✅ Intenta comprar un curso nuevamente
5. ✅ Revisa los logs para confirmar que dice "✅ Token obtained successfully"

---

## 🆘 ¿Aún tienes problemas?

Si después de seguir estos pasos aún recibes error 401:

1. **Verifica**: Las credenciales son de la pestaña **Live** (no Sandbox)
2. **Confirma**: Tu cuenta PayPal es **Business** y está **verificada**
3. **Revisa**: No hay espacios al inicio/final al copiar las credenciales
4. **Prueba**: El comando cURL funciona con tus credenciales
5. **Espera**: Después de cambiar variables en Vercel, espera 1-2 minutos y redeploy

---

**Última actualización**: 13 de noviembre de 2025
