# Documentación Técnica: Sistema de Notificaciones por Email (Resend + React Email)

**Proyecto:** Seencel  
**Fecha de última actualización:** 28 de Noviembre, 2025  
**Estado:** Funcional - Emails transaccionales + formulario de contacto con anti-spam  
**Ubicación del código:** `server/routes/email.ts`

---

## 1. Resumen Ejecutivo

Sistema completo de notificaciones por correo usando **Resend** como proveedor SMTP y **React Email** para renderizar plantillas HTML. El sistema incluye:

- ✅ Envío de emails transaccionales (bienvenida, compra)
- ✅ Formulario de contacto público con protección anti-spam
- ✅ Seguridad con tokens firmados HMAC-SHA256
- ✅ Rate limiting por IP
- ✅ Validación Honeypot
- ✅ Notificaciones de administrador

---

## 2. Arquitectura General

```
Frontend (React)
    ↓
Backend Express (Replit)
    ├── /api/email/send         → Envía emails transaccionales
    ├── /api/contact/token      → Genera token de seguridad
    ├── /api/contact            → Procesa formulario de contacto
    └── /api/webhooks/test-email → Prueba conexión
    ↓
Resend API
    ↓
SMTP → Bandeja del Usuario
```

---

## 3. Configuración Inicial

### 3.1. Variables de Entorno (Secrets)

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxx
```

**Ubicación:** Configurar en Settings → Secrets (global)  
**Nota:** Nunca commitear esta clave a Git

### 3.2. Dependencias Instaladas

```bash
npm install resend @react-email/components @react-email/render
```

---

## 4. Componentes Email (React Email Templates)

### 4.1. WelcomeEmail (emails/WelcomeEmail.tsx)

Plantilla para bienvenida de usuarios registrados.

**Props:**
```typescript
{
  userName: string;      // Nombre del usuario
  userEmail: string;     // Email del usuario
  adminName?: string;    // Nombre del administrador (default: "El Equipo de Seencel")
}
```

**Uso:**
```typescript
const emailHtml = await render(
  WelcomeEmail({
    userName: "Jorge",
    userEmail: "jorge@example.com",
  })
);
```

### 4.2. PurchaseEmail (emails/PurchaseEmail.tsx)

Plantilla para confirmación de compra/inscripción a cursos.

**Props:**
```typescript
{
  userName: string;      // Nombre del estudiante
  courseName: string;    // Nombre del curso
  amount: string;        // Monto (ej: "$99.99")
  transactionId: string; // ID de transacción
}
```

### 4.3. ContactEmail (emails/ContactEmail.tsx)

Plantilla para envíos del formulario de contacto público.

**Props:**
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  country: string;       // Código ISO (AR, MX, US, etc.)
  message: string;
}
```

---

## 5. Endpoints Implementados

### 5.1. POST /api/email/send

**Descripción:** Endpoint genérico para enviar emails transaccionales.

**Body (JSON):**
```json
{
  "to": "user@example.com",
  "subject": "Tu Asunto",
  "template": "welcome|purchase|null",
  "userName": "Jorge",
  "courseName": "Curso Avanzado",
  "amount": "$99.99",
  "transactionId": "TXN-123456",
  "html": "<h1>HTML personalizado</h1>",
  "from": "Seencel <sistema@seencel.com>",
  "notifyAdmin": true
}
```

**Parámetros:**
- `to` *(requerido)*: Email del destinatario (string o array)
- `subject` *(requerido)*: Asunto del email
- `template` *(opcional)*: `"welcome"` | `"purchase"` - Si no se especifica, usa `html`
- `html` *(opcional)*: HTML personalizado (si no hay template)
- `from` *(opcional, default)*: `"Seencel <sistema@seencel.com>"`
- `notifyAdmin` *(opcional, default: false)*: Si `true`, envía copia a admin
- `userName`, `courseName`, `amount`, `transactionId`: Datos para templates

**Response (Success):**
```json
{
  "ok": true,
  "userEmail": { "id": "email_123" },
  "adminEmail": { "id": "email_456" } // null si notifyAdmin=false
}
```

**Ejemplo cURL:**
```bash
curl -X POST http://localhost:5000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "student@example.com",
    "subject": "Confirmación de Compra",
    "template": "purchase",
    "userName": "Diego",
    "courseName": "Gestión de Proyectos",
    "amount": "$149.99",
    "transactionId": "TXN-20241128-001",
    "notifyAdmin": true
  }'
```

### 5.2. GET /api/contact/token

**Descripción:** Genera un token HMAC-SHA256 firmado para proteger el formulario de contacto.

**Query Params:** Ninguno (usa IP del cliente)

**Response:**
```json
{
  "token": "eyJpc3N1ZWRBdCI6MTc2NDM0MDkxNzMx...|signature...",
  "expiresIn": 900
}
```

**Flujo:**
1. Frontend hace GET a este endpoint
2. Recibe token firmado + expiración (15 min)
3. Incluye token en el formulario de contacto

### 5.3. POST /api/contact

**Descripción:** Procesa formulario de contacto con protecciones anti-spam.

**Body (JSON):**
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "company": "Constructora XYZ",
  "phone": "+5491112345678",
  "country": "AR",
  "message": "Hola, me interesa conocer sobre...",
  "formStartTime": 1704067200000,
  "submittedAt": 1704067205000,
  "honeypot": "",
  "contactToken": "eyJ....|sig..."
}
```

**Validaciones Anti-Spam:**

1. **Honeypot:** Campo oculto que debe estar vacío
   ```typescript
   if (honeypot.length > 0) → Rechazado (bot detectado)
   ```

2. **Rate Limiting:** 3 intentos por IP por minuto
   ```typescript
   // Resetea cada 60 segundos
   if (recentSubmissions >= 3) → Error 429
   ```

3. **Token HMAC:** Verificación de firma y expiración
   - Vencimiento: 15 minutos
   - Validación de IP (debe ser la misma que generó el token)
   - Nonce de un solo uso (previene replay attacks)

4. **Tiempo de Envío:** Formulario no puede enviarse en menos de 3 segundos
   ```typescript
   if (submittedAt - formStartTime < 3000) → Rechazado
   ```

5. **Validación de Campos:**
   - `firstName`: 2-100 caracteres
   - `lastName`: 2-100 caracteres
   - `email`: Regex validación
   - `phone`: 6-30 caracteres
   - `country`: Códigos ISO permitidos (AR, MX, CO, CL, etc.)
   - `message`: 10-2000 caracteres

**Response (Success):**
```json
{
  "ok": true,
  "message": "Mensaje enviado exitosamente"
}
```

**Errors:**
```json
{ "ok": false, "error": "Validación de seguridad fallida" }
{ "ok": false, "error": "Demasiados intentos. Por favor, espera un momento." }
{ "ok": false, "error": "Token expirado. Por favor, recarga la página" }
```

### 5.4. POST /api/webhooks/test-email

**Descripción:** Endpoint de prueba para verificar conexión con Resend.

**Body:** Vacío

**Response:**
```json
{
  "message": "Test exitoso",
  "data": { "id": "email_123" }
}
```

**Uso:** Testear que RESEND_API_KEY está correctamente configurada.

---

## 6. Email de Administrador

**Dirección Actual:** `contacto@seencel.com`

**Cambiar a otra dirección:**
1. Editar `server/routes/email.ts` línea 154
2. Buscar: `const adminEmail = 'contacto@seencel.com';`
3. Reemplazar con la nueva dirección

**Quién recibe notificaciones de admin:**
- Nuevas compras/inscripciones (si `notifyAdmin: true`)
- Formularios de contacto (siempre)
- Pruebas de conexión (si se ejecuta webhook de test)

---

## 7. Endpoints de Preview (Admin)

### 7.1. POST /api/admin/email-preview/registration

Previsualiza el email de bienvenida.

**Body:**
```json
{
  "userName": "Jorge",
  "userEmail": "jorge@example.com",
  "adminName": "El Equipo de Seencel"
}
```

### 7.2. POST /api/admin/email-preview/purchase

Previsualiza el email de compra.

**Body:**
```json
{
  "userName": "Diego",
  "courseName": "Gestión Avanzada",
  "amount": "$99.99",
  "transactionId": "TXN-20241128-001"
}
```

---

## 8. Seguridad

### 8.1. Token HMAC-SHA256

**Algoritmo:**
```typescript
const payload = JSON.stringify({ issuedAt, nonce, ipHash });
const signature = HMAC-SHA256(payload, RESEND_API_KEY);
const token = `${base64(payload)}|${signature}`;
```

**Validación:**
- ✅ Verifica firma HMAC
- ✅ Valida tiempo de expiración (15 min)
- ✅ Valida IP del cliente (previene ataques desde otra red)
- ✅ Marca nonce como usado (previene replay)

### 8.2. Rate Limiting

```typescript
const RATE_LIMIT_WINDOW = 60000;  // 1 minuto
const RATE_LIMIT_MAX = 3;         // 3 intentos máximo
```

Se limpia cada 60 segundos (reset automático).

### 8.3. Honeypot

Campo HTML oculto en el formulario:
```html
<input type="text" name="honeypot" style="display: none;" />
```

Bots lo llenan automáticamente → Rechazados.

### 8.4. Nonce de Un Solo Uso

Almacenado en memoria (se limpia cada 15 minutos):
```typescript
const usedNonces = new Map<string, number>();
const NONCE_EXPIRY_MS = 15 * 60 * 1000;
```

---

## 9. Ciclo de Vida del Formulario de Contacto

```
1. Usuario abre formulario
   ↓
2. Frontend: GET /api/contact/token
   ← Response: { token, expiresIn }
   ↓
3. Usuario completa formulario + espera 3+ segundos
   ↓
4. Frontend: POST /api/contact
   (Incluye token, honeypot, timestamps)
   ↓
5. Backend valida:
   - Token HMAC ✓
   - IP ✓
   - Nonce único ✓
   - Rate limit ✓
   - Honeypot vacío ✓
   - Campos 2-2000 chars ✓
   ↓
6. Renderiza ContactEmail con @react-email
   ↓
7. Envía a Resend
   ↓
8. Resend entrega a contacto@seencel.com
   ↓
9. Response: { ok: true, message: "..." }
```

---

## 10. Logs y Debugging

### 10.1. Logs en Console

```typescript
console.log('📧 Using WelcomeEmail template');
console.log('✅ User email sent successfully:', userEmailResult.data);
console.log('✅ Admin notification sent:', adminEmailResult.data);
console.log('🔐 Contact token generated for IP:', clientIP);
console.log('🔒 Nonce consumed after validation passed');
console.log('📬 Contact form submission received');
console.log('✅ Contact email sent:', result.data);
```

### 10.2. Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `RESEND_API_KEY not configured` | Secret no existe | Configurar en Secrets → RESEND_API_KEY |
| `Token expirado` | Token > 15 min | Usuario recarga página y genera nuevo token |
| `Validación de seguridad fallida` | IP diferente o token falso | Bot o sesión comprometida |
| `Demasiados intentos` | Rate limit alcanzado | Esperar 1 minuto |
| `Email inválido` | Regex falla | Verificar formato |

---

## 11. Próximos Pasos / Mejoras Potenciales

- [ ] Agregar soporte para BCC (enviar copia a múltiples addresses)
- [ ] Implementar queue de reintentos (fallidas se reenvían después de 5 min)
- [ ] Webhook de eventos desde Resend (bounces, opens, clicks)
- [ ] Dashboard de estadísticas de emails
- [ ] Soporte para attachments en ContactEmail
- [ ] Integración con CRM (guardar contactos en tabla de DB)

---

## 12. Checklist para Solicitar Cambios

Cuando pidas cambios en el sistema de emails, proporciona:

- [ ] ¿Qué email cambio? (variable, dirección, template)
- [ ] ¿Qué cambio hago? (agregar campo, modificar lógica, nueva validación)
- [ ] ¿A cuál endpoint afecta? (/api/email/send, /api/contact, etc.)
- [ ] ¿Es un cambio de seguridad? (rate limit, validación, token)

**Ejemplo de solicitud clara:**
> "Quiero que el email de bienvenida incluya un enlace de confirmación. Modifica WelcomeEmail.tsx para agregar un botón que apunte a /verify?token=xxx"

---

## 13. Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `server/routes/email.ts` | Lógica de endpoints y validación |
| `emails/WelcomeEmail.tsx` | Plantilla de bienvenida |
| `emails/PurchaseEmail.tsx` | Plantilla de compra |
| `emails/ContactEmail.tsx` | Plantilla de contacto |
| `src/pages/Contact.tsx` | Formulario público de contacto (frontend) |
| `prompts/documentation/Resend.md` | Este archivo |

---

**Última Revisión:** 28 de Noviembre, 2025  
**Mantenido por:** Sistema de Generación Automática (Agent)
