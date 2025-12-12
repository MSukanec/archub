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

La conversión SIEMPRE se calcula usando la función correcta:

```typescript
// NUEVA FORMA (explícita, recomendada para conversiones)
convertToBaseCurrency(fromCurrencyId, toCurrencyId, amount, exchangeRate)

// FORMA ANTIGUA (implícita, para compatibilidad)
convertToBaseCurrency(item, baseCurrencyId)
```

---

## Módulo Central: `/lib/money.ts`

### Importación

```typescript
// Importar funciones específicas
import { convertToBaseCurrency, convert, format, sumByCurrency, explainBreakdown } from '@/lib/money';

// O importar el namespace completo
import { money } from '@/lib/money';
money.convertToBaseCurrency('USD', 'ARS', 100, 1000);
```

---

## Funciones Disponibles

### 1. `convertToBaseCurrency(fromCurrencyId, toCurrencyId, amount, exchangeRate, options?)`

**Signatura explícita (NUEVA - RECOMENDADA)**

Convierte un monto entre dos monedas especificadas explícitamente. Esta es la forma correcta de hacer conversiones bidireccionales.

```typescript
// USD a ARS: 100 USD * 1000 = 100,000 ARS
convertToBaseCurrency('USD', 'ARS', 100, 1000)
// => 100000

// ARS a USD: 100,000 ARS / 1000 = 100 USD
convertToBaseCurrency('ARS', 'USD', 100000, 1000)
// => 100

// Monedas iguales: sin conversión
convertToBaseCurrency('ARS', 'ARS', 50000, 1000)
// => 50000
```

**Parámetros:**
- `fromCurrencyId: string` - ID o código de la moneda origen (e.g., 'USD', 'uuid-123')
- `toCurrencyId: string` - ID o código de la moneda destino (e.g., 'ARS', 'uuid-456')
- `amount: number` - Monto a convertir
- `exchangeRate: number | null` - Cotización (significa "1 [quoteCurrency] = X [otra moneda]")
- `options?` - Opciones de conversión

**Opciones:**
- `quoteCurrency?: string` - Moneda de referencia en el exchange_rate (default: 'USD')
- `defaultRate?: number` - Rate por defecto si exchangeRate es null (default: 1)

**Lógica interna:**
1. Si `fromCurrencyId === toCurrencyId` → retorna `amount` sin convertir
2. Si `toCurrencyId === quoteCurrency` → divide: `amount / exchangeRate`
3. En caso contrario → multiplica: `amount * exchangeRate`

---

### 2. `convertToBaseCurrency(item, baseCurrencyCodeOrId, options?)`

**Signatura implícita (ANTIGUA - Compatibilidad hacia atrás)**

Convierte un item monetario a la moneda base, inferiendo los IDs del item.

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
- `quoteCurrency?: string` - Moneda de referencia (default: 'USD')

---

### 3. `convert(amount, exchangeRate, options?)`

Convierte un monto usando el exchange rate con dirección explícita.

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

### 4. `format(amount, symbol, options?)`

Formatea un monto como moneda SIN decimales (estándar Seencel).

```typescript
format(150000, 'USD')        // => "USD 150.000"
format(-50000, '$')          // => "$ -50.000"
format(100000, 'ARS', { showSign: true }) // => "ARS +100.000"
```

---

### 5. `formatKPI(value, locale?)`

Formatea un valor numérico para KPIs (solo número, sin símbolo).

```typescript
formatKPI(1500000)  // => "1.500.000"
formatKPI(-50000)   // => "50.000" (sin signo, valor absoluto)
```

---

### 6. `formatSubValue(breakdown, options?)`

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

### 7. `sumByCurrency(items)`

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

### 8. `sumAllInBaseCurrency(items, baseCurrencyId)`

Suma todos los items convirtiéndolos a la moneda base usando la función explícita.

```typescript
const items = [
  { amount: 100, currency: { id: 'usd', code: 'USD' }, exchange_rate: 1000 },
  { amount: 50000, currency: { id: 'ars', code: 'ARS' }, exchange_rate: 1 }
];

sumAllInBaseCurrency(items, 'ars') 
// => 100000 + 50000 = 150000
```

---

### 9. `explainBreakdown(items, baseCurrencyId)`

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

### 10. `formatExchangeRate(rate, options?)`

Formatea un exchange rate para mostrar en UI.

```typescript
formatExchangeRate(1234.5678) // => "1.234,57"
formatExchangeRate(1000, { minDecimals: 0, maxDecimals: 0 }) // => "1.000"
```

---

### 11. `getEffectiveExchangeRate(currencyId, baseCurrencyId, providedRate?)`

Obtiene el exchange rate efectivo para una moneda.

```typescript
getEffectiveExchangeRate('usd', 'ars', 1000) // => 1000
getEffectiveExchangeRate('ars', 'ars', 1000) // => 1 (es la moneda base)
getEffectiveExchangeRate('usd', 'ars', null) // => 1 (default)
```

---

## Patrones de Uso

### Patrón 1: Hook de Métricas (Explícito)

```typescript
import { convertToBaseCurrency } from '@/lib/money';

export function useFinancialMetrics(movements, primaryCurrencyCode) {
  return useMemo(() => {
    // Total convertido a moneda principal USANDO SIGNATURA EXPLÍCITA
    const totalInPrimaryCurrency = movements.reduce((sum, movement) => {
      const currencyCode = movement.currency?.code;
      const currencyId = movement.currency?.id;
      
      return sum + convertToBaseCurrency(
        currencyCode || currencyId,
        primaryCurrencyCode,
        movement.amount,
        movement.exchange_rate
      );
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
import { convertToBaseCurrency } from '@/lib/money';

// Usar la signatura explícita para precisión
const convertedAmount = convertToBaseCurrency(
  payment.currency?.code || payment.currency_id,
  orgCurrencyId,
  payment.amount,
  payment.exchange_rate
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

## Definición de Exchange Rate

### Regla Universal

```
El exchange_rate SIEMPRE significa: "1 [quoteCurrency] = X [otra moneda]"
```

Por defecto `quoteCurrency='USD'`, entonces:
```
1 USD = X [otra moneda]
```

### Ejemplos

Con `quoteCurrency='USD'` y `exchange_rate=1000`:

| Conversión | Fórmula | Resultado |
|---|---|---|
| 100 USD → ARS | 100 * 1000 | 100,000 ARS |
| 100,000 ARS → USD | 100,000 / 1000 | 100 USD |
| 50 USD → ARS | 50 * 1000 | 50,000 ARS |
| 1,500,000 ARS → USD | 1,500,000 / 1000 | 1,500 USD |

---

## Archivos Refactorizados

Los siguientes archivos usan el módulo centralizado:

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

1. **Para conversiones bidireccionales (RECOMENDADO):**
   ```typescript
   // USAR ESTA FORMA (signatura explícita)
   convertToBaseCurrency(fromCurrencyId, toCurrencyId, amount, exchangeRate)
   ```

2. **Para compatibilidad hacia atrás:**
   ```typescript
   // USAR ESTA FORMA (signatura implícita)
   convertToBaseCurrency(item, baseCurrencyId)
   ```

3. **NO cambiar:**
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
import { convertToBaseCurrency, convert, sumByCurrency, explainBreakdown } from '@/lib/money';

// Test básico de conversión (signatura explícita)
console.assert(convertToBaseCurrency('USD', 'ARS', 100, 1000) === 100000, 'USD → ARS');
console.assert(convertToBaseCurrency('ARS', 'USD', 100000, 1000) === 100, 'ARS → USD');

// Test con signatura implícita
const item = { amount: 100, currency: { code: 'USD' }, exchange_rate: 1000 };
console.assert(convertToBaseCurrency(item, 'ARS') === 100000, 'Item USD → ARS');

// Test con null/undefined
console.assert(convertToBaseCurrency('USD', 'ARS', 100, null) === 100, 'Rate null usa default 1');
```

---

## Changelog

### v2.0.0 (2025-12-12)
- **BREAKING**: Agregada signatura explícita a `convertToBaseCurrency(fromCurrencyId, toCurrencyId, amount, exchangeRate)`
- Refactorización de lógica de conversión en `convertExplicit()`
- Ambas signaturas funcionan gracias a overloads de TypeScript
- Actualización de `sumAllInBaseCurrency()` para usar signatura explícita
- Documentación completa de nuevas signaturas

### v1.0.0 (2025-06-11)
- Creación inicial del módulo `/lib/money.ts`
- Migración de hooks de métricas financieras
- Migración de páginas de pagos
- Migración de servicios de subcontratos
- Documentación completa
