# Sistema Multimoneda de Seencel

## Resumen

Este documento describe el sistema centralizado de manejo de multimoneda implementado en Seencel. El módulo principal `/lib/money.ts` proporciona funciones unificadas para conversión, formateo y cálculo de totales multimoneda.

---

## Regla Central del Sistema Multimoneda

> **OBLIGATORIA**: Nunca se guardan columnas precalculadas como `amount_converted`.

Cada movimiento o entidad monetaria SIEMPRE guarda:
- `amount` - Monto original en la moneda del movimiento
- `currency_id` - ID de la moneda original
- `exchange_rate` - Cotización del momento del movimiento
- `created_at` - Para orden histórico

La conversión SIEMPRE se calcula así:

```typescript
amount_in_base = amount * exchange_rate
```

---

## Módulo Central: `/lib/money.ts`

### Importación

```typescript
// Importar funciones específicas
import { convert, format, sumByCurrency, explainBreakdown } from '@/lib/money';

// O importar el namespace completo
import { money } from '@/lib/money';
money.convert(100, 1000);
```

---

## Funciones Disponibles

### 1. `convert(amount, exchangeRate, options?)`

Convierte un monto usando el exchange rate.

```typescript
// Multiplicación (default): amount * exchangeRate
convert(100, 1000) // => 100000

// División: amount / exchangeRate
convert(100000, 1000, { direction: 'divide' }) // => 100

// Con rate por defecto
convert(100, null, { defaultRate: 1 }) // => 100
```

**Parámetros:**
- `amount: number` - Monto a convertir
- `exchangeRate: number | null` - Cotización
- `options.direction?: 'multiply' | 'divide'` - Dirección de conversión
- `options.defaultRate?: number` - Rate por defecto si no hay cotización

---

### 2. `convertToBaseCurrency(item, baseCurrencyCodeOrId, options?)`

Convierte un item monetario a la moneda base de la organización.
**Acepta tanto código de moneda (e.g., "ARS", "USD") como ID de moneda (UUID).**

```typescript
const movement = {
  amount: 100,
  currency: { id: 'uuid-123', code: 'USD' },
  exchange_rate: 1000
};

// Funciona con código de moneda
convertToBaseCurrency(movement, 'ARS') // => 100000

// Funciona con ID de moneda
convertToBaseCurrency(movement, 'uuid-ars') // => 100000

// Si ya está en moneda base (comparación por código O id), no convierte
convertToBaseCurrency({ amount: 50000, currency: { code: 'ARS' } }, 'ARS') // => 50000

// Si no hay moneda base definida - comportamiento configurable:
convertToBaseCurrency(movement, undefined) // => 100 (passthrough, default)
convertToBaseCurrency(movement, undefined, { onMissingBase: 'zero' }) // => 0 (evita mezclar monedas)
```

**Opciones:**
- `onMissingBase: 'passthrough'` (default) - Retorna el amount sin convertir
- `onMissingBase: 'zero'` - Retorna 0 para evitar mezclar monedas

**Uso típico en hooks:**
```typescript
// Para métricas financieras generales (passthrough)
const totalInPrimaryCurrency = movements.reduce((sum, movement) => {
  return sum + convertToBaseCurrency(movement, primaryCurrencyCode);
}, 0);

// Para métricas de partners (evitar mezclar monedas)
const totalInPrimaryCurrency = movements.reduce((sum, movement) => {
  return sum + convertToBaseCurrency(movement, primaryCurrencyCode, { onMissingBase: 'zero' });
}, 0);
```

---

### 3. `format(amount, symbol, options?)`

Formatea un monto como moneda SIN decimales (estándar Seencel).

```typescript
format(150000, 'USD')        // => "USD 150.000"
format(-50000, '$')          // => "$ -50.000"
format(100000, 'ARS', { showSign: true }) // => "ARS +100.000"
```

---

### 4. `formatKPI(value, locale?)`

Formatea un valor numérico para KPIs (solo número, sin símbolo).

```typescript
formatKPI(1500000)  // => "1.500.000"
formatKPI(-50000)   // => "50.000" (sin signo, valor absoluto)
```

---

### 5. `formatSubValue(breakdown, options?)`

Formatea el desglose por moneda para mostrar debajo del KPI principal.

```typescript
formatSubValue([
  { currencySymbol: 'USD', total: 75000 },
  { currencySymbol: 'ARS', total: 150000000 }
])
// => "USD 75.000 + ARS 150.000.000"

formatSubValue(breakdown, { separator: ' | ' })
// => "USD 75.000 | ARS 150.000.000"
```

---

### 6. `sumByCurrency(items)`

Agrupa y suma items por moneda SIN convertir.

```typescript
const items = [
  { amount: 100, currency: { id: 'usd', code: 'USD', symbol: '$' } },
  { amount: 200, currency: { id: 'usd', code: 'USD', symbol: '$' } },
  { amount: 50000, currency: { id: 'ars', code: 'ARS', symbol: '$' } }
];

sumByCurrency(items)
// => [
//   { currencyId: 'usd', currencyCode: 'USD', currencySymbol: '$', total: 300, count: 2 },
//   { currencyId: 'ars', currencyCode: 'ARS', currencySymbol: '$', total: 50000, count: 1 }
// ]
```

---

### 7. `sumAllInBaseCurrency(items, baseCurrencyId)`

Suma todos los items convirtiéndolos a la moneda base.

```typescript
const items = [
  { amount: 100, currency: { id: 'usd' }, exchange_rate: 1000 },
  { amount: 50000, currency: { id: 'ars' }, exchange_rate: 1 }
];

sumAllInBaseCurrency(items, 'ars') 
// => 100000 + 50000 = 150000
```

---

### 8. `explainBreakdown(items, baseCurrencyId)`

Devuelve un objeto completo con el total convertido Y el desglose por moneda.
**Ideal para KPIs**.

```typescript
explainBreakdown(items, 'ars')
// => {
//   baseTotal: 150000,
//   breakdown: [
//     { currencyId: 'usd', currencyCode: 'USD', currencySymbol: '$', total: 100, count: 1 },
//     { currencyId: 'ars', currencyCode: 'ARS', currencySymbol: '$', total: 50000, count: 1 }
//   ],
//   breakdownMap: { USD: 100, ARS: 50000 }
// }
```

---

### 9. `formatExchangeRate(rate, options?)`

Formatea un exchange rate para mostrar en UI.

```typescript
formatExchangeRate(1234.5678) // => "1.234,57"
formatExchangeRate(1000, { minDecimals: 0, maxDecimals: 0 }) // => "1.000"
```

---

### 10. `getEffectiveExchangeRate(currencyId, baseCurrencyId, providedRate?)`

Obtiene el exchange rate efectivo para una moneda.

```typescript
getEffectiveExchangeRate('usd', 'ars', 1000) // => 1000
getEffectiveExchangeRate('ars', 'ars', 1000) // => 1 (es la moneda base)
getEffectiveExchangeRate('usd', 'ars', null) // => 1 (default)
```

---

## Patrones de Uso

### Patrón 1: Hook de Métricas

```typescript
import { convertToBaseCurrency } from '@/lib/money';

export function useFinancialMetrics(movements, primaryCurrencyCode) {
  return useMemo(() => {
    // Total convertido a moneda principal
    const totalInPrimaryCurrency = movements.reduce((sum, movement) => {
      return sum + convertToBaseCurrency(movement, primaryCurrencyCode);
    }, 0);

    // Balance por moneda (sin convertir)
    const currencyMap = new Map();
    movements.forEach(movement => {
      const code = movement.currency?.code || 'N/A';
      // ... agrupar por moneda
    });

    return { totalInPrimaryCurrency, balanceByCurrency };
  }, [movements, primaryCurrencyCode]);
}
```

### Patrón 2: Cálculo de Pagos

```typescript
import { convert } from '@/lib/money';

// Conversión estándar (multiplicación)
const convertedAmount = convert(payment.amount, payment.exchange_rate);

// Conversión inversa (división) - para casos especiales
const originalAmount = convert(
  payment.amount, 
  payment.exchange_rate, 
  { direction: 'divide' }
);
```

### Patrón 3: KPI con Breakdown

```typescript
import { explainBreakdown, formatKPI, formatSubValue } from '@/lib/money';

const { baseTotal, breakdown } = explainBreakdown(movements, orgCurrencyId);

// Mostrar en UI:
// Valor grande: formatKPI(baseTotal) => "1.500.000"
// Valor chico: formatSubValue(breakdown) => "USD 75.000 + ARS 150.000.000"
```

---

## Interfaz MoneyItem

```typescript
interface MoneyItem {
  amount: number;
  currency_id?: string;
  currency?: {
    id?: string;
    code?: string;
    symbol?: string;
    name?: string;
  } | null;
  exchange_rate?: number | null;
}
```

Cualquier objeto que cumpla esta interfaz puede ser usado con las funciones del módulo.

---

## Archivos Refactorizados

Los siguientes archivos fueron migrados para usar el módulo centralizado:

### Hooks de Métricas
- `src/features/finances/hooks/use-financial-metrics.ts`
- `src/features/finances/hooks/use-partner-metrics.ts`

### Páginas de Pagos
- `src/pages/clients/ClientPaymentsTab.tsx`
- `src/pages/clients/ClientObligationsTab.tsx`
- `src/pages/general-costs/GeneralCostsPaymentsTab.tsx`
- `src/pages/professional/personnel/PersonnelPaymentsTab.tsx`

### Servicios
- `src/features/subcontracts/services/getSubcontractAnalysis.ts`

### Componentes
- `src/features/clients/components/CommitmentAccordion.tsx`

---

## Archivos Deprecados

- `src/lib/currency-formatter.ts` - Marcado como @deprecated. Usar `/lib/money.ts` para nuevas implementaciones.

---

## Reglas de Migración

Al migrar código existente al nuevo módulo:

1. **Buscar patrones de conversión:**
   ```typescript
   // ANTES:
   amount * exchange_rate
   amount * (payment.exchange_rate || 1)
   
   // DESPUÉS:
   convert(amount, exchange_rate)
   ```

2. **Buscar conversiones inversas:**
   ```typescript
   // ANTES:
   amount / exchange_rate
   
   // DESPUÉS:
   convert(amount, exchange_rate, { direction: 'divide' })
   ```

3. **Buscar funciones duplicadas de conversión:**
   - `convertToPrimaryCurrency` → Reemplazar por `convertToBaseCurrency`

4. **NO cambiar:**
   - Estructura de datos existentes
   - Nombres de propiedades retornadas
   - Comportamiento funcional

---

## Extensión a Nuevas Monedas

El sistema soporta cualquier moneda. Para agregar una nueva:

1. Agregar la moneda a la tabla `currencies`
2. Vincular a la organización en `organization_currencies`
3. Al crear movimientos, siempre incluir:
   - `currency_id` de la nueva moneda
   - `exchange_rate` respecto a la moneda base de la organización

No se requiere modificar el código del módulo money.ts.

---

## Testing

Para verificar que las conversiones funcionan correctamente:

```typescript
import { convert, sumByCurrency, explainBreakdown } from '@/lib/money';

// Test básico de conversión
console.assert(convert(100, 1000) === 100000, 'Conversión multiplicación');
console.assert(convert(100000, 1000, { direction: 'divide' }) === 100, 'Conversión división');

// Test con null/undefined
console.assert(convert(100, null) === 100, 'Rate null usa default 1');
console.assert(convert(100, undefined) === 100, 'Rate undefined usa default 1');
```

---

## Changelog

### v1.0.0 (2025-06-11)
- Creación inicial del módulo `/lib/money.ts`
- Migración de hooks de métricas financieras
- Migración de páginas de pagos (clientes, personal, costos generales)
- Migración de servicios de subcontratos
- Documentación completa
