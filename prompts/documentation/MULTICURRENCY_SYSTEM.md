# Sistema Multimoneda de Seencel - Documentación Completa

## Resumen Ejecutivo

Seencel implementa un sistema **centralizado y headless** de multimoneda que:
- ✅ Convierte montos entre cualquier par de monedas usando exchange rates
- ✅ Muestra totales convertidos a la moneda base + desglose por moneda
- ✅ Soporta KPIs monetarias, de conteo, porcentaje y texto
- ✅ Se actualiza automáticamente cuando cambia la moneda por defecto de la organización
- ✅ Formatea valores con símbolos de moneda (e.g., `$ 150.000`, `USD 75.000`)

---

## Arquitectura del Sistema

### Capas Implementadas

```
┌─────────────────────────────────────────────────────────┐
│  UI Components (StatCard, Table, etc.)                  │
├─────────────────────────────────────────────────────────┤
│  KPI System (/lib/kpis.ts)                              │
│  - calculateMonetaryKPI()                               │
│  - calculateCountKPI()                                  │
│  - calculatePercentageKPI()                             │
│  - calculateTextKPI()                                   │
│  - formatBreakdown()                                    │
├─────────────────────────────────────────────────────────┤
│  Money Module (/lib/money.ts)                           │
│  - convertToBaseCurrency() (explícita e implícita)      │
│  - format(), formatKPI(), formatSubValue()              │
│  - sumByCurrency(), sumAllInBaseCurrency()              │
│  - explainBreakdown()                                   │
├─────────────────────────────────────────────────────────┤
│  useOrganizationDefaultCurrency() Hook                  │
│  (se refetcha automáticamente cuando cambia)            │
├─────────────────────────────────────────────────────────┤
│  Database: currencies, organization_currencies, etc.    │
└─────────────────────────────────────────────────────────┘
```

---

## Regla Central del Sistema

### OBLIGATORIA: Nunca precalcular conversiones

```typescript
// ❌ INCORRECTO - Guardar amount_converted
{
  amount: 100,
  currency_id: 'uuid-usd',
  amount_converted: 100000,  // ❌ PROHIBIDO
  exchange_rate: 1000
}

// ✅ CORRECTO - Guardar solo el monto original
{
  amount: 100,
  currency_id: 'uuid-usd',
  exchange_rate: 1000,       // Cotización del momento
  created_at: '2025-12-12'   // Para auditoria histórica
}
```

Las conversiones **siempre** se calculan al renderizar usando `convertToBaseCurrency()`.

---

## 1. Módulo Central: `/lib/money.ts`

Centraliza TODA la lógica de conversión y formateo.

### 1.1 Función Principal: `convertToBaseCurrency()`

Esta función tiene **DOS signaturas** (overloads) que funcionan simultáneamente:

#### Signatura 1: EXPLÍCITA (RECOMENDADA)

```typescript
convertToBaseCurrency(
  fromCurrencyId: string,
  toCurrencyId: string | undefined,
  amount: number,
  exchangeRate: number | null,
  options?: ConvertToBaseOptions
): number
```

**Uso:** Conversión directa y explícita entre dos monedas.

```typescript
// USD a ARS: 100 USD * 1000 = 100,000 ARS
convertToBaseCurrency('USD', 'ARS', 100, 1000)
// => 100000

// ARS a USD: 100,000 ARS / 1000 = 100 USD
convertToBaseCurrency('ARS', 'USD', 100000, 1000)
// => 100

// Misma moneda: sin conversión
convertToBaseCurrency('ARS', 'ARS', 50000, 1000)
// => 50000

// Sin moneda destino: devuelve el monto sin convertir
convertToBaseCurrency('USD', undefined, 100, 1000)
// => 100
```

**Lógica interna:**
1. Si `fromCurrencyId === toCurrencyId` → retorna `amount` sin convertir
2. Si `toCurrencyId === quoteCurrency` → **divide**: `amount / exchangeRate`
3. Si `fromCurrencyId === quoteCurrency` → **multiplica**: `amount * exchangeRate`
4. En caso contrario → **multiplica** (comportamiento por defecto)

#### Signatura 2: IMPLÍCITA (Compatibilidad hacia atrás)

```typescript
convertToBaseCurrency(
  item: MoneyItem,
  baseCurrencyCodeOrId?: string,
  options?: ConvertToBaseOptions
): number
```

**Uso:** Convertir un item/objeto a la moneda base, infiriendo IDs del objeto.

```typescript
const payment = {
  amount: 100,
  currency: { id: 'uuid-usd', code: 'USD' },
  exchange_rate: 1000
};

// Funciona con código de moneda
convertToBaseCurrency(payment, 'ARS') 
// => 100000

// Funciona con ID de moneda
convertToBaseCurrency(payment, 'uuid-ars') 
// => 100000

// Si ya está en moneda base (por código O id)
convertToBaseCurrency({ amount: 50000, currency: { code: 'ARS' } }, 'ARS') 
// => 50000

// Sin moneda base definida
convertToBaseCurrency(payment, undefined) 
// => 100 (passthrough - retorna amount sin convertir)

convertToBaseCurrency(payment, undefined, { onMissingBase: 'zero' }) 
// => 0 (evita mezclar monedas)
```

### 1.2 Definición de Exchange Rate (CRÍTICO)

```
El exchange_rate SIEMPRE significa: "1 [quoteCurrency] = X [otra moneda]"
```

Por defecto `quoteCurrency='USD'`, entonces:

```
1 USD = X [otra moneda]

Ejemplo: exchange_rate = 1000 significa 1 USD = 1000 ARS
```

**Tabla de conversiones:**

| Conversión | Fórmula | Resultado |
|---|---|---|
| 100 USD → ARS | 100 × 1000 | 100,000 ARS |
| 100,000 ARS → USD | 100,000 ÷ 1000 | 100 USD |
| 50 USD → ARS | 50 × 1000 | 50,000 ARS |

### 1.3 Otras Funciones de `/lib/money.ts`

#### `convert(amount, exchangeRate, options?): number`

Convierte usando dirección explícita.

```typescript
// Multiplicación (default)
convert(100, 1000) // => 100000

// División
convert(100000, 1000, { direction: 'divide' }) // => 100

// Con rate por defecto
convert(100, null, { defaultRate: 1 }) // => 100
```

#### `format(amount, symbol, options?): string`

Formatea como moneda CON símbolo y separadores de miles.

```typescript
format(150000, 'USD')        // => "USD 150.000"
format(150000, '$')          // => "$ 150.000"
format(-50000, '$')          // => "$ -50.000"
format(100000, 'ARS', { showSign: true }) // => "ARS +100.000"
```

#### `formatKPI(value, locale?): string`

Formatea solo el NÚMERO (sin símbolo). Ideal para valores grandes en KPIs.

```typescript
formatKPI(1500000)  // => "1.500.000"
formatKPI(-50000)   // => "50.000" (valor absoluto)
```

#### `formatSubValue(breakdown, options?): string`

Formatea desglose por moneda para mostrar debajo del KPI.

```typescript
formatSubValue([
  { currencySymbol: 'USD', total: 75000 },
  { currencySymbol: 'ARS', total: 150000000 }
])
// => "USD 75.000 + ARS 150.000.000"

formatSubValue(breakdown, { separator: ' | ' })
// => "USD 75.000 | ARS 150.000.000"
```

#### `sumByCurrency(items): CurrencyBreakdown[]`

Agrupa y suma items por moneda SIN convertir.

```typescript
sumByCurrency([
  { amount: 100, currency: { code: 'USD', symbol: '$' } },
  { amount: 200, currency: { code: 'USD', symbol: '$' } },
  { amount: 50000, currency: { code: 'ARS', symbol: '$' } }
])
// => [
//   { currencyId: 'usd', currencyCode: 'USD', currencySymbol: '$', total: 300, count: 2 },
//   { currencyId: 'ars', currencyCode: 'ARS', currencySymbol: '$', total: 50000, count: 1 }
// ]
```

#### `sumAllInBaseCurrency(items, baseCurrencyId): number`

Suma todos convertidos a moneda base (usa signatura explícita).

```typescript
sumAllInBaseCurrency([
  { amount: 100, currency: { code: 'USD' }, exchange_rate: 1000 },
  { amount: 50000, currency: { code: 'ARS' }, exchange_rate: 1 }
], 'ARS')
// => 100000 + 50000 = 150000
```

#### `explainBreakdown(items, baseCurrencyId): BreakdownResult`

Retorna total convertido Y desglose por moneda. **Ideal para KPIs**.

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

## 2. Sistema Headless de KPIs: `/lib/kpis.ts`

Las KPIs son **funciones puras** sin componentes visuales. Retornan `{ value, formatted, breakdown?, meta? }`.

### 2.1 Interfaz KPIResult

```typescript
export interface KPIResult {
  value: number;                    // Valor numérico crudo
  formatted: string;                // Valor formateado para mostrar
  meta?: Record<string, any>;       // Metadata adicional
  breakdown?: Array<{               // Desglose por moneda (solo monetarias)
    currencyCode: string;
    currencySymbol: string;
    total: number;
  }>;
}
```

### 2.2 `calculateMonetaryKPI(config): KPIResult`

**LA FUNCIÓN MÁS IMPORTANTE.** Calcula total convertido a moneda base + desglose.

```typescript
const kpi = calculateMonetaryKPI({
  items: [
    { amount: 100, currency: { code: 'USD', symbol: '$' }, exchange_rate: 1000 },
    { amount: 50000, currency: { code: 'ARS', symbol: '$' }, exchange_rate: 1 }
  ],
  baseCurrencyId: 'ARS'  // Código o ID de la moneda base
});

// Retorna:
// {
//   value: 150000,        // Total convertido a ARS
//   formatted: "150.000", // Formateado (sin símbolo)
//   breakdown: [
//     { currencyCode: 'USD', currencySymbol: '$', total: 100 },
//     { currencyCode: 'ARS', currencySymbol: '$', total: 50000 }
//   ]
// }
```

### 2.3 `calculateCountKPI(config): KPIResult`

Para contar items simples (pagos, transacciones, etc.)

```typescript
const kpi = calculateCountKPI({
  count: 5,
  label: 'Cantidad de pagos'
});

// {
//   value: 5,
//   formatted: "5",
//   meta: { unit: 'Cantidad de pagos' }
// }
```

### 2.4 `calculatePercentageKPI(config): KPIResult`

Para ratios y variaciones.

```typescript
const kpi = calculatePercentageKPI({
  numerator: 10,
  denominator: 30,
  decimals: 2
});

// {
//   value: 33.33,
//   formatted: "33,33%",
//   meta: { unit: '%' }
// }
```

### 2.5 `calculateTextKPI(config): KPIResult`

Para valores no-numéricos.

```typescript
const kpi = calculateTextKPI({
  text: "En progreso",
  icon: "clock"
});

// {
//   value: 0,
//   formatted: "En progreso",
//   meta: { icon: 'clock' }
// }
```

### 2.6 `calculateAggregateMonetaryKPI(config): KPIResult`

Suma múltiples KPIs monetarias en una sola cifra.

```typescript
const combined = calculateAggregateMonetaryKPI({
  kpis: [contributionsKPI, withdrawalsKPI]
});

// Suma los values y combina los breakdowns
```

### 2.7 Helper Functions

#### `formatBreakdown(kpi, locale?): string`

Convierte un KPI a string formateado.

```typescript
formatBreakdown(kpi)
// => "USD 100 + ARS 50.000"
```

#### `hasMultipleCurrencies(kpi): boolean`

Verifica si un KPI tiene múltiples monedas.

#### `getDominantCurrency(kpi): string | null`

Obtiene la moneda con mayor valor.

---

## 3. Integración en Componentes

### 3.1 Obtener la moneda por defecto

```typescript
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';

export function MyComponent() {
  const organizationId = userData?.organization?.id;
  
  // Se refetcha automáticamente cuando cambia
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
  
  // defaultCurrency = { id: '...', code: 'ARS', symbol: '$', name: 'Peso Argentino' }
}
```

### 3.2 Patrón Completo: GeneralCostsPaymentsTab

```typescript
import { calculateCountKPI, calculateMonetaryKPI, formatBreakdown } from '@/lib/kpis';
import { formatKPI, format as formatMoneyAmount } from '@/lib/money';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';

export default function GeneralCostsPaymentsTab() {
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
  
  const metricsData = useMemo(() => {
    // KPI 1: Total Pagos (conteo)
    const totalPagosKPI = calculateCountKPI({
      count: allPayments.length,
      label: 'Cantidad de pagos'
    });

    // KPI 2: Pagos a la Fecha (monetaria)
    const confirmedPayments = allPayments.filter(p => p.status === 'confirmed');
    const pagosALaFechaKPI = calculateMonetaryKPI({
      items: confirmedPayments.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code  // ← SE REFETCHA AUTOMÁTICAMENTE
    });

    return {
      total_count_kpi: totalPagosKPI,
      total_confirmed_kpi: pagosALaFechaKPI,
    };
  }, [allPayments, defaultCurrency]);  // ← Dependencia crítica

  return (
    <>
      {/* Mostrar el número grande CON SÍMBOLO */}
      <StatCardValue>
        {metricsData?.total_confirmed_kpi?.breakdown && 
         metricsData.total_confirmed_kpi.breakdown.length > 0
          ? formatMoneyAmount(
              metricsData.total_confirmed_kpi.value,
              metricsData.total_confirmed_kpi.breakdown[0].currencySymbol
            )
          : formatKPI(metricsData?.total_confirmed_kpi?.value ?? 0)
        }
      </StatCardValue>
      
      {/* Mostrar el breakdown debajo */}
      <StatCardMeta>
        {metricsData?.total_confirmed_kpi?.breakdown && 
         metricsData.total_confirmed_kpi.breakdown.length > 0
          ? formatBreakdown(metricsData.total_confirmed_kpi)
          : `Total de pagos confirmados`
        }
      </StatCardMeta>
    </>
  );
}
```

### 3.3 Patrón Completo: PartnerTransactionsTab

```typescript
import { calculateMonetaryKPI, formatBreakdown } from '@/lib/kpis';
import { formatKPI, format as formatMoneyAmount } from '@/lib/money';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';

export function PartnerTransactionsTab() {
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);

  const metrics = useMemo(() => {
    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    
    // KPI: Total Aportes
    const contributionsKPI = calculateMonetaryKPI({
      items: confirmedTransactions
        .filter(t => t.type === 'contribution')
        .map(t => ({
          amount: t.amount,
          currency_id: t.currency_id,
          currency: { code: t.currency_id, symbol: t.currency_symbol },
          exchange_rate: t.exchange_rate
        })),
      baseCurrencyId: defaultCurrency?.code  // ← SE REFETCHA AUTOMÁTICAMENTE
    });

    // KPI: Total Retiros
    const withdrawalsKPI = calculateMonetaryKPI({
      items: confirmedTransactions.filter(t => t.type === 'withdrawal').map(...),
      baseCurrencyId: defaultCurrency?.code
    });

    // KPI: Saldo Neto (cálculo derivado)
    const netBalance = contributionsKPI.value - withdrawalsKPI.value;
    const netBalanceKPI = {
      ...contributionsKPI,
      value: netBalance,
      formatted: formatKPI(netBalance)
    };

    return { contributions_kpi: contributionsKPI, withdrawals_kpi: withdrawalsKPI, net_balance_kpi: netBalanceKPI };
  }, [transactions, defaultCurrency]);  // ← Dependencia crítica

  return (
    <>
      {/* Total Aportes CON SÍMBOLO */}
      <StatCardValue className="text-green-600">
        {metrics.contributions_kpi.breakdown && metrics.contributions_kpi.breakdown.length > 0
          ? formatMoneyAmount(metrics.contributions_kpi.value, metrics.contributions_kpi.breakdown[0].currencySymbol)
          : formatKPI(metrics.contributions_kpi.value)
        }
      </StatCardValue>
      <StatCardMeta>
        {metrics.contributions_kpi.breakdown && metrics.contributions_kpi.breakdown.length > 0
          ? formatBreakdown(metrics.contributions_kpi)
          : 'Sin aportes confirmados'
        }
      </StatCardMeta>
    </>
  );
}
```

---

## 4. Flujo de Actualización Automática

Cuando el usuario cambia la moneda por defecto de la organización:

```
1. Usuario cambia moneda por defecto en preferencias
   ↓
2. Backend actualiza organization_preferences
   ↓
3. useOrganizationDefaultCurrency() se refetcha automáticamente (React Query)
   ↓
4. `defaultCurrency` en el componente se actualiza
   ↓
5. useMemo() se re-ejecuta (porque `defaultCurrency` está en dependencias)
   ↓
6. KPIs se recalculan con la nueva moneda base
   ↓
7. UI se actualiza con los nuevos valores
```

**CRÍTICO:** `defaultCurrency` debe estar **SIEMPRE** en las dependencias del `useMemo()` que calcula KPIs.

```typescript
const metrics = useMemo(() => {
  // ... cálculos usando defaultCurrency?.code
}, [transactions, defaultCurrency]);  // ← OBLIGATORIO
```

---

## 5. Casos de Uso Reales

### Caso 1: Mostrar un pago en múltiples monedas

```typescript
const payment = {
  amount: 100,
  currency: { code: 'USD', symbol: 'USD' },
  exchange_rate: 1000,
  status: 'confirmed'
};

const kpi = calculateMonetaryKPI({
  items: [payment],
  baseCurrencyId: 'ARS'
});

// UI:
// Valor grande:  "USD 100.000"       (usando format())
// Breakdown:     "USD 100"             (cantidad en USD)
```

### Caso 2: Sumar múltiples pagos en diferentes monedas

```typescript
const payments = [
  { amount: 100, currency: { code: 'USD', symbol: 'USD' }, exchange_rate: 1000 },
  { amount: 50000, currency: { code: 'ARS', symbol: '$' }, exchange_rate: 1 },
  { amount: 200, currency: { code: 'USD', symbol: 'USD' }, exchange_rate: 1000 }
];

const kpi = calculateMonetaryKPI({
  items: payments,
  baseCurrencyId: 'ARS'
});

// value = (100 * 1000) + 50000 + (200 * 1000) = 350000 ARS
// breakdown = [
//   { currencyCode: 'USD', total: 300 },    // 100 + 200
//   { currencyCode: 'ARS', total: 50000 }
// ]

// UI:
// Valor grande:  "$ 350.000"            (total convertido a ARS)
// Breakdown:     "USD 300 + ARS 50.000" (original de cada moneda)
```

### Caso 3: Cambiar moneda por defecto dinámicamente

```typescript
// Usuario cambia de ARS a USD como moneda por defecto

// ANTES (ARS base):
// Valor: "$ 350.000" (350,000 ARS)
// Breakdown: "USD 300 + ARS 50.000"

// DESPUÉS (USD base, automáticamente):
// Valor: "USD 350" (350 USD)
// Breakdown: "USD 300 + ARS 50"
```

---

## 6. Checklist de Implementación

Al agregar nuevas KPIs monetarias a una página:

- [ ] Importar `useOrganizationDefaultCurrency` de `@/hooks/use-currencies`
- [ ] Importar `calculateMonetaryKPI` de `@/lib/kpis`
- [ ] Importar `format`, `formatKPI` de `@/lib/money`
- [ ] Llamar a `useOrganizationDefaultCurrency(organizationId)`
- [ ] Usar `calculateMonetaryKPI()` para cada KPI monetaria
- [ ] Agregar `defaultCurrency` a las dependencias del `useMemo()`
- [ ] Mostrar el número grande con símbolo: `format(kpi.value, kpi.breakdown[0].currencySymbol)`
- [ ] Mostrar el breakdown debajo: `formatBreakdown(kpi)`
- [ ] Testear que se actualiza al cambiar la moneda por defecto

---

## 7. Archivos Modificados Recientemente (2025-12-12)

### Componentes con KPIs refactorizadas:
- `src/pages/general-costs/GeneralCostsPaymentsTab.tsx` - KPIs "Total Pagos" y "Pagos a la Fecha"
- `src/pages/partners/tabs/PartnerTransactionsTab.tsx` - KPIs "Total Aportes", "Total Retiros", "Saldo Neto"

### Cambios principales:
1. Agregada importación de `useOrganizationDefaultCurrency` para refetch automático
2. Refactorizado `useMemo()` para usar `calculateMonetaryKPI()` 
3. Agregado `defaultCurrency` a dependencias de useMemo
4. Mostrar símbolo en el número grande usando `format()` en lugar de `formatKPI()`
5. Mostrar breakdown con `formatBreakdown()` en el meta

---

## 8. Debugging

### Problema: Las KPIs no se actualizan cuando cambio la moneda

**Causa probable:** `defaultCurrency` no está en las dependencias del `useMemo()`.

```typescript
// ❌ INCORRECTO
const metrics = useMemo(() => {
  const kpi = calculateMonetaryKPI({
    items,
    baseCurrencyId: defaultCurrency?.code  // Usa defaultCurrency
  });
  return { kpi };
}, [items]);  // ❌ Falta defaultCurrency en dependencias

// ✅ CORRECTO
const metrics = useMemo(() => {
  const kpi = calculateMonetaryKPI({
    items,
    baseCurrencyId: defaultCurrency?.code
  });
  return { kpi };
}, [items, defaultCurrency]);  // ✅ Incluye defaultCurrency
```

### Problema: Los valores se muestran incorrectamente en la conversión

**Causa probable:** Interpretación incorrecta del `exchange_rate`.

```
Regla: 1 USD = exchange_rate [otra moneda]

Si exchange_rate = 1000:
- USD → ARS:  amount * 1000
- ARS → USD:  amount / 1000
```

### Problema: El símbolo no aparece en el KPI

```typescript
// ❌ INCORRECTO - No muestra símbolo
<StatCardValue>{formatKPI(kpi.value)}</StatCardValue>

// ✅ CORRECTO - Muestra símbolo
<StatCardValue>
  {kpi.breakdown && kpi.breakdown.length > 0
    ? format(kpi.value, kpi.breakdown[0].currencySymbol)
    : formatKPI(kpi.value)
  }
</StatCardValue>
```

---

## 9. Roadmap Futuro

- [ ] Soporte para múltiples monedas base (por proyecto)
- [ ] Caché de exchange rates con validación de antigüedad
- [ ] Funciones de análisis de variación de monedas
- [ ] Exportación de datos con desglose por moneda
- [ ] Gráficos de tendencia de conversión

---

## 10. Referencias

- Directorio principal: `/lib/money.ts`, `/lib/kpis.ts`
- Hook para moneda: `/hooks/use-currencies.ts`
- Ejemplos de uso: `src/pages/general-costs/GeneralCostsPaymentsTab.tsx`, `src/pages/partners/tabs/PartnerTransactionsTab.tsx`
- Tipos e interfaces: Ver docstrings en los archivos fuente

---

**Última actualización:** 2025-12-12 (Turno 3 - Documentación Completa)
