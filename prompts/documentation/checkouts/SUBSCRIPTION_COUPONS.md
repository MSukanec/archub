# Sistema de Cupones para Suscripciones

## Descripción

Extensión del sistema de cupones existente (diseñado para cursos) para soportar también suscripciones de planes.

## Migración de Base de Datos

El usuario debe ejecutar este SQL en Supabase:

```sql
-- ============================================================
-- MIGRACIÓN: Cupones para Suscripciones
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar campo applies_to a la tabla coupons
-- Valores: 'courses' (default), 'subscriptions', 'all'
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS applies_to text DEFAULT 'courses';

-- Agregar CHECK constraint (si falla, ignorar)
-- ALTER TABLE coupons ADD CONSTRAINT coupons_applies_to_check 
-- CHECK (applies_to IN ('courses', 'subscriptions', 'all'));

-- 2. Crear tabla coupon_plans (asocia cupones a planes específicos)
CREATE TABLE IF NOT EXISTS coupon_plans (
  coupon_id uuid NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, plan_id)
);

-- 3. Modificar coupon_redemptions para soportar suscripciones
-- (course_id ya no es obligatorio)
ALTER TABLE coupon_redemptions 
ALTER COLUMN course_id DROP NOT NULL;

ALTER TABLE coupon_redemptions 
ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES organization_subscriptions(id);

ALTER TABLE coupon_redemptions 
ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES plans(id);

-- 4. Agregar columnas de cupón a organization_subscriptions
ALTER TABLE organization_subscriptions
ADD COLUMN IF NOT EXISTS coupon_id uuid REFERENCES coupons(id);

ALTER TABLE organization_subscriptions
ADD COLUMN IF NOT EXISTS coupon_code text;

-- 5. Agregar índices para performance
CREATE INDEX IF NOT EXISTS idx_coupon_plans_plan_id ON coupon_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_subscription_id ON coupon_redemptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_org_subscriptions_coupon ON organization_subscriptions(coupon_id);

-- 6. RPC para validar cupones de suscripción
CREATE OR REPLACE FUNCTION validate_subscription_coupon(
  p_code text,
  p_plan_id uuid,
  p_price numeric,
  p_currency text
) RETURNS jsonb AS $$
DECLARE
  v_coupon record;
  v_redemption_count integer;
  v_plan_allowed boolean;
  v_final_price numeric;
  v_discount numeric;
BEGIN
  -- Buscar cupón activo
  SELECT * INTO v_coupon
  FROM coupons
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND (applies_to IN ('subscriptions', 'all'))
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'COUPON_NOT_FOUND');
  END IF;

  -- Verificar si el cupón aplica a este plan
  IF NOT v_coupon.applies_to_all THEN
    SELECT EXISTS(
      SELECT 1 FROM coupon_plans 
      WHERE coupon_id = v_coupon.id AND plan_id = p_plan_id
    ) INTO v_plan_allowed;
    
    IF NOT v_plan_allowed THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'PLAN_NOT_ELIGIBLE');
    END IF;
  END IF;

  -- Verificar límite total de redempciones
  IF v_coupon.max_redemptions IS NOT NULL THEN
    SELECT COUNT(*) INTO v_redemption_count
    FROM coupon_redemptions
    WHERE coupon_id = v_coupon.id;
    
    IF v_redemption_count >= v_coupon.max_redemptions THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'MAX_REDEMPTIONS_REACHED');
    END IF;
  END IF;

  -- Verificar moneda si el cupón la especifica
  IF v_coupon.currency IS NOT NULL AND v_coupon.currency != p_currency THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'CURRENCY_MISMATCH');
  END IF;

  -- Verificar mínimo de orden
  IF v_coupon.min_order_total IS NOT NULL AND p_price < v_coupon.min_order_total THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'MIN_ORDER_NOT_MET');
  END IF;

  -- Calcular descuento
  IF v_coupon.type = 'percent' THEN
    v_discount := p_price * (v_coupon.amount / 100);
  ELSE
    v_discount := v_coupon.amount;
  END IF;

  v_final_price := GREATEST(p_price - v_discount, 0);

  RETURN jsonb_build_object(
    'ok', true,
    'coupon_id', v_coupon.id,
    'coupon_code', v_coupon.code,
    'type', v_coupon.type,
    'amount', v_coupon.amount,
    'discount', v_discount,
    'final_price', v_final_price,
    'is_free', v_final_price = 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permisos
GRANT EXECUTE ON FUNCTION validate_subscription_coupon(text, uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_subscription_coupon(text, uuid, numeric, text) TO service_role;
```

## Flujos de Implementación

### Flujo Normal (con pago)
1. Usuario elige plan → ingresa cupón opcional
2. Backend valida cupón con `validate_subscription_coupon`
3. Si descuento < 100%, ajusta precio y continúa con MP/PayPal
4. Después del pago, registra `coupon_redemptions`

### Flujo Gratuito (cupón 100%)
1. Usuario elige plan → ingresa cupón 100%
2. Backend valida cupón, `is_free = true`
3. **NO pasa por MP/PayPal**
4. Crea suscripción directamente con `provider_subscription_id = null`
5. Marca al owner como `is_billable = false`
6. Registra `coupon_redemptions`

### Caso Borde: Primer Seat Pagado
Cuando una org creada con cupón 100% quiere agregar su primer miembro pagado:

1. Detecta que no hay `provider_subscription_id`
2. **CREA** nueva suscripción en MP (en vez de actualizar)
3. Sincroniza fecha de renovación con la suscripción base
4. Guarda el nuevo `provider_subscription_id` en la suscripción existente

## Archivos Modificados

- `server/lib/handlers/checkout/shared/subscription-coupons.ts` - Validación de cupones
- `server/lib/handlers/checkout/mp/createRecurringSubscription.ts` - Soporte para cupón
- `server/lib/handlers/checkout/mp/updateSeatSubscription.ts` - Caso borde
- `server/lib/handlers/checkout/mp/createSeatSubscription.ts` - Crear nueva suscripción MP
- `server/lib/handlers/admin/coupons.ts` - Admin para gestionar cupones de planes
