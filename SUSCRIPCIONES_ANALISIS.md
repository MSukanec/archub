# 📋 Análisis del Sistema de Suscripciones - Organizaciones PRO y TEAMS

**Fecha**: 12 de Noviembre, 2025  
**Objetivo**: Lanzar mañana con funcionalidad básica de suscripciones

---

## ✅ LO QUE YA TENEMOS

### 1. **Base de Datos**
- ✅ Tabla `plans` (ya existe en Supabase)
- ✅ Tabla `organizations` con campo `plan` (ya existe)
- ✅ Tabla `payments` con soporte para:
  - `product_type`: 'course' | 'subscription' | 'plan'
  - `organization_id`: Para vincular pagos a organizaciones
  - `product_id`: Para referenciar el plan
- ✅ Tabla `payment_events` para webhooks
- ✅ Tabla `bank_transfer_payments` para transferencias

### 2. **Frontend - UI de Pricing**
✅ **`src/pages/PricingPlan.tsx`** - Página completa de precios con:
- 4 Planes: FREE, PRO, TEAMS, ENTERPRISE
- Selector Mensual/Anual con descuento del 20%
- Cards de planes con features y límites detallados
- Tabla de comparación exhaustiva
- Banner de "Oferta Fundador" para anuales
- **❌ PROBLEMA**: Los botones están DESHABILITADOS
  ```tsx
  disabled={plan.name.toLowerCase() === 'pro' || plan.name.toLowerCase() === 'teams'}
  ```

### 3. **Seguridad y Restricciones**
✅ **`src/hooks/usePlanFeatures.ts`** - Lógica completa de features por plan:
- Función `can(feature)`: Verifica si el plan permite una feature
- Función `limit(feature)`: Devuelve límites numéricos
- Límites ya definidos: `max_projects`, `max_members`, `max_storage_gb`

✅ **`src/components/ui-custom/security/PlanRestricted.tsx`**:
- Componente que bloquea features según el plan
- UI con badges y popovers para upgrade
- Integrado con navegación a `/pricing`

### 4. **Checkout de Cursos (REUTILIZABLE)**
✅ **`src/pages/checkout/CheckoutPage.tsx`** - Checkout completo con:
- Tres métodos de pago:
  1. **MercadoPago** (ARS)
  2. **PayPal** (USD)
  3. **Transferencia Bancaria** (con descuento 5%)
- Cupones con descuentos
- Facturación opcional
- Upload de comprobantes
- Manejo de sesión y usuario

### 5. **Backend - Pagos**
✅ **`server/routes/payments.ts`** con endpoints:
- `POST /api/checkout/mp/create` - MercadoPago
- `POST /api/paypal/create-order` - PayPal
- `POST /api/webhooks/mp` - Webhook MercadoPago
- `POST /api/paypal/webhook` - Webhook PayPal
- `POST /api/checkout/free-enroll` - Inscripciones gratis (100% cupón)
- Funciones helper: `enrollUserInCourse()`, `logPayPalPayment()`, etc.

### 6. **Integración con Proveedores**
✅ Variables de entorno necesarias (ya configuradas):
- `MP_ACCESS_TOKEN` (MercadoPago)
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`
- `PAYPAL_BASE_URL`

---

## ❌ LO QUE FALTA PARA LANZAR

### 1. **Página de Checkout para Suscripciones** 🔴 CRÍTICO
Necesitamos: **`src/pages/checkout/SubscriptionCheckoutPage.tsx`**

**Reutilizar de CheckoutPage.tsx**:
- ✅ Selector de método de pago
- ✅ Formulario de datos básicos
- ✅ Facturación opcional
- ✅ Términos y condiciones
- ✅ Lógica de cupones

**CAMBIOS específicos para suscripciones**:
- Recibir `plan_slug` en query params (ej: `?plan=pro&billing=annual`)
- Cargar precio desde tabla `plans` (no `course_prices`)
- Metadata diferente en los pagos:
  ```js
  {
    organization_id: currentOrganizationId,
    plan_id: plan.id,
    billing_period: 'monthly' | 'annual',
    product_type: 'subscription'
  }
  ```

### 2. **Backend - Endpoints de Suscripciones** 🔴 CRÍTICO

**Nuevos endpoints en `server/routes/payments.ts`**:

```typescript
// MercadoPago para suscripciones
POST /api/checkout/subscription/mp/create
- body: { plan_slug, organization_id, billing_period }
- Crear preference con metadata de suscripción

// PayPal para suscripciones
POST /api/paypal/subscription/create-order
- Similar pero para PayPal

// Transferencia para suscripciones
POST /api/checkout/subscription/transfer/create
- Similar lógica de transferencia

// Webhook handler modificado
- Detectar product_type === 'subscription'
- En lugar de enrollUserInCourse(), llamar upgradeOrganizationPlan()
```

**Nueva función helper**:
```typescript
async function upgradeOrganizationPlan(
  organization_id: string, 
  plan_id: string, 
  billing_period: 'monthly' | 'annual'
) {
  // 1. Actualizar organizations.plan_id
  // 2. Calcular expires_at (1 mes o 12 meses)
  // 3. Guardar en nueva tabla organization_subscriptions
  // 4. Invalidar caché del usuario
}
```

### 3. **Tabla de Base de Datos** 🔴 CRÍTICO

**Nueva tabla**: `organization_subscriptions`
```sql
CREATE TABLE organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
  billing_period TEXT NOT NULL, -- monthly, annual
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  payment_id UUID REFERENCES payments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  UNIQUE(organization_id, status) WHERE status = 'active'
);
```

### 4. **Vincular Botones en PricingPlan.tsx** 🟡 IMPORTANTE

Modificar `/src/pages/PricingPlan.tsx`:

```tsx
<Button
  onClick={() => {
    if (plan.name.toLowerCase() === 'free') {
      // Free plan - solo navegar a dashboard
      navigate('/organization/dashboard');
    } else {
      // Pro/Teams - ir a checkout
      const billing = billingPeriod; // 'monthly' o 'annual'
      navigate(`/checkout/subscription?plan=${plan.name.toLowerCase()}&billing=${billing}`);
    }
  }}
  disabled={false} // QUITAR el disabled!
>
  {billingPeriod === 'annual' ? 'Ser Fundador' : 'Comenzar ahora'}
</Button>
```

### 5. **Flujo de Upgrade desde Organización** 🟡 IMPORTANTE

**Opción 1**: Agregar botón "Upgrade Plan" en `OrganizationPreferences`
**Opción 2**: Detectar límite alcanzado y mostrar modal

Ejemplo:
```tsx
// En cualquier lugar donde se alcance límite
if (currentProjects >= maxProjects) {
  showUpgradeModal({
    title: "Límite de proyectos alcanzado",
    message: `Has alcanzado el límite de ${maxProjects} proyectos del plan ${currentPlan}`,
    requiredPlan: "Pro",
    ctaText: "Upgrade a Pro"
  });
}
```

### 6. **Tabla de Precios de Planes** 🟢 MENOR

Asegurar que existe tabla `plan_prices` o usar directamente `plans.price`:

```sql
-- Verificar que la tabla plans tiene:
SELECT id, name, price, billing_type, currency, is_active, features 
FROM plans 
WHERE is_active = true;
```

Si no existe `currency` en `plans`, agregar:
```sql
ALTER TABLE plans ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE plans ADD COLUMN price_monthly NUMERIC(10,2);
ALTER TABLE plans ADD COLUMN price_annual NUMERIC(10,2);
```

---

## 🎯 PLAN DE ACCIÓN PARA HOY

### Fase 1: Backend (2-3 horas)
1. ✅ Crear tabla `organization_subscriptions`
2. ✅ Implementar función `upgradeOrganizationPlan()`
3. ✅ Crear endpoint `POST /api/checkout/subscription/mp/create`
4. ✅ Crear endpoint `POST /api/paypal/subscription/create-order`
5. ✅ Modificar webhooks para detectar `product_type === 'subscription'`

### Fase 2: Frontend (2-3 horas)
6. ✅ Crear `SubscriptionCheckoutPage.tsx` (copiar y adaptar CheckoutPage)
7. ✅ Modificar botones en `PricingPlan.tsx` para navegación
8. ✅ Agregar ruta en `App.tsx`: `/checkout/subscription`

### Fase 3: Testing (1 hora)
9. ✅ Probar flujo completo con MercadoPago sandbox
10. ✅ Probar flujo completo con PayPal sandbox
11. ✅ Verificar que la organización se upgradea correctamente

### Fase 4: Polish (30 min)
12. ✅ Agregar botón "Upgrade Plan" en OrganizationPreferences
13. ✅ Agregar modal de límite alcanzado
14. ✅ Testing final

---

## 🚀 DECISIONES DE DISEÑO SUGERIDAS

### Simplificaciones para el MVP de mañana:

1. **No renovación automática**: 
   - Por ahora, las suscripciones expiran y el usuario debe renovar manualmente
   - Evita complejidad de recurring payments

2. **Un plan activo por organización**:
   - UNIQUE constraint en `organization_subscriptions` donde `status='active'`
   - Simplifica la lógica

3. **No downgrades automáticos**:
   - Si expira, la org vuelve a FREE pero no pierde datos
   - Se bloquean features pero todo se mantiene

4. **Reutilizar checkout de cursos al 100%**:
   - Misma UI, mismo flujo, solo cambia metadata
   - Ahorra mucho tiempo de desarrollo

---

## 📝 NOTAS ADICIONALES

### Cupones para Suscripciones
- La tabla `coupons` actual está ligada a `course_id`
- Para suscripciones, necesitaríamos `plan_id` nullable
- **DECISIÓN**: Por ahora, NO cupones en suscripciones (simplifica)
- Se puede agregar después

### Facturación
- Ya existe `billing_profiles` para usuarios
- Para organizaciones, podría ser el perfil del admin
- **DECISIÓN**: Usar billing_profile del usuario que paga

### Roles y Permisos
- Solo el admin de la organización puede upgradear
- **DECISIÓN**: Por ahora, cualquier miembro puede ver pricing pero solo admin puede pagar

---

## ✨ EXTRAS (Post-Lanzamiento)

Si sobra tiempo o para futuras iteraciones:
- Dashboard de suscripción en OrganizationPreferences
- Email de confirmación de pago
- Email de recordatorio de expiración
- Renovación automática (recurring)
- Historial de pagos en la organización
- Facturas automáticas (PDF)
- Downgrades con prorata

---

**¿Qué necesitas que empiece a implementar primero?**
