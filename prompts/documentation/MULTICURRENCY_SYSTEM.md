# Sistema Multimoneda de Seencel - Documentación Completa

## Resumen Ejecutivo

Seencel implementa un sistema **centralizado y headless** de multimoneda que:
- ✅ Convierte montos entre cualquier par de monedas usando exchange rates
- ✅ Muestra totales convertidos a la moneda base + desglose por moneda
- ✅ Soporta KPIs monetarias, de conteo, porcentaje y texto
- ✅ Se actualiza automáticamente cuando cambia la moneda por defecto de la organización
- ✅ Formatea valores con símbolos de moneda (e.g., `$ 150.000`, `USD 75.000`)

---

## 📋 Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Regla Central](#regla-central-del-sistema)
3. [Módulo `/lib/money.ts`](#1-módulo-central-libmoneyts)
4. [Sistema Headless de KPIs](#2-sistema-headless-de-kpis-libkpists)
5. [Integración en Componentes](#3-integración-en-componentes)
6. [Flujo de Actualización Automática](#4-flujo-de-actualización-automática)
7. [Casos de Uso Reales](#5-casos-de-uso-reales)
8. [Checklist de Implementación](#6-checklist-de-implementación)
9. [Auditoría y Refactorización](#7-auditoría-y-refactorización)
10. [Debugging](#8-debugging)
11. [Roadmap Futuro](#9-roadmap-futuro)

---

## Arquitectura del Sistema

### Capas Implementadas

```
┌─────────────────────────────────────────────────────────┐
│  UI Components (StatCard, Table, etc.)                  │
├─────────────────────────────────────────────────────────┤
│  KPI System (/lib/kpis.ts)                              │
│  - calculateMonetaryKPI()       (Total + breakdown)     │
│  - calculateCountKPI()          (Conteos simples)       │
│  - calculatePercentageKPI()     (Ratios)                │
│  - calculateTextKPI()           (Valores de texto)      │
│  - calculateAggregateMonetaryKPI() (Suma de KPIs)       │
│  - formatBreakdown()            (String formateado)     │
├─────────────────────────────────────────────────────────┤
│  Money Module (/lib/money.ts)                           │
│  - convertToBaseCurrency() (explícita e implícita)      │
│  - convert()                (Conversión básica)         │
│  - format()                 (Con símbolo)               │
│  - formatKPI()              (Solo número)               │
│  - formatSubValue()         (Desglose)                  │
│  - sumByCurrency()          (Sin convertir)             │
│  - sumAllInBaseCurrency()   (Suma convertida)           │
│  - explainBreakdown()       (Total + breakdown)         │
├─────────────────────────────────────────────────────────┤
│  useOrganizationDefaultCurrency() Hook                  │
│  (se refetcha automáticamente cuando cambia)            │
├─────────────────────────────────────────────────────────┤
│  Database: currencies, organization_currencies, etc.    │
└─────────────────────────────────────────────────────────┘
```

---

## Regla Central del Sistema

### 🚨 OBLIGATORIA: Nunca precalcular conversiones

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

**Las conversiones SIEMPRE se calculan al renderizar** usando `convertToBaseCurrency()`.

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
```

### 1.2 Definición de Exchange Rate (CRÍTICO)

```
El exchange_rate SIEMPRE significa: "1 [quoteCurrency] = X [otra moneda]"
```

Por defecto `quoteCurrency='USD'`, entonces: `1 USD = X [otra moneda]`

**Tabla de conversiones:**

| Conversión | Fórmula | Resultado |
|---|---|---|
| 100 USD → ARS | 100 × 1000 | 100,000 ARS |
| 100,000 ARS → USD | 100,000 ÷ 1000 | 100 USD |

### 1.3 Otras Funciones de `/lib/money.ts`

#### `convert(amount, exchangeRate, options?): number`
Convierte usando dirección explícita.

#### `format(amount, symbol, options?): string`
Formatea como moneda CON símbolo y separadores de miles.
```typescript
format(150000, 'USD')        // => "USD 150.000"
format(150000, '$')          // => "$ 150.000"
```

#### `formatKPI(value, locale?): string`
Formatea solo el NÚMERO (sin símbolo). Ideal para valores grandes en KPIs.
```typescript
formatKPI(1500000)  // => "1.500.000"
```

#### `formatSubValue(breakdown, options?): string`
Formatea desglose por moneda para mostrar debajo del KPI.
```typescript
formatSubValue([
  { currencySymbol: 'USD', total: 75000 },
  { currencySymbol: 'ARS', total: 150000000 }
])
// => "USD 75.000 + ARS 150.000.000"
```

#### `sumByCurrency(items): CurrencyBreakdown[]`
Agrupa y suma items por moneda SIN convertir.

#### `sumAllInBaseCurrency(items, baseCurrencyId): number`
Suma todos convertidos a moneda base.

#### `explainBreakdown(items, baseCurrencyId): BreakdownResult`
Retorna total convertido Y desglose por moneda. **Ideal para KPIs**.

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

// { value: 5, formatted: "5", meta: { unit: 'Cantidad de pagos' } }
```

### 2.4 `calculatePercentageKPI(config): KPIResult`

Para ratios y variaciones.

### 2.5 `calculateTextKPI(config): KPIResult`

Para valores no-numéricos.

### 2.6 `calculateAggregateMonetaryKPI(config): KPIResult`

Suma múltiples KPIs monetarias en una sola cifra.

### 2.7 Helper Functions

#### `formatBreakdown(kpi, locale?): string`

Convierte un KPI a string formateado. Usa `formatSubValue()` internamente.

```typescript
formatBreakdown(kpi)
// => "USD 100 + ARS 50.000"
```

---

## 3. Integración en Componentes

### 3.1 Obtener la moneda por defecto

```typescript
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';

export function MyComponent() {
  const organizationId = userData?.organization?.id;
  
  // Se refetcha automáticamente cuando cambia
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
}
```

### 3.2 Patrón Completo: GeneralCostsPaymentsTab ✅

```typescript
import { calculateCountKPI, calculateMonetaryKPI, formatBreakdown } from '@/lib/kpis';
import { formatKPI, format as formatMoneyAmount } from '@/lib/money';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';

export default function GeneralCostsPaymentsTab() {
  const { data: defaultCurrency = null } = useOrganizationDefaultCurrency(organizationId);
  
  const metricsData = useMemo(() => {
    // KPI 1: Total Pagos (conteo simple)
    const totalPagosKPI = calculateCountKPI({
      count: allPayments.length,
      label: 'Cantidad de pagos'
    });

    // KPI 2: Pagos a la Fecha (monetaria, solo confirmados)
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
      {/* KPI 1: Total Pagos */}
      <StatCard>
        <StatCardTitle>Total Pagos</StatCardTitle>
        <StatCardValue>
          {metricsData?.total_count_kpi?.formatted ?? '0'}
        </StatCardValue>
        <StatCardMeta>{metricsData?.total_count_kpi?.meta?.unit}</StatCardMeta>
      </StatCard>

      {/* KPI 2: Pagos a la Fecha */}
      <StatCard>
        <StatCardTitle>Pagos a la Fecha</StatCardTitle>
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
        <StatCardMeta>
          {metricsData?.total_confirmed_kpi?.breakdown && 
           metricsData.total_confirmed_kpi.breakdown.length > 0
            ? formatBreakdown(metricsData.total_confirmed_kpi)
            : `Total de pagos confirmados`
          }
        </StatCardMeta>
      </StatCard>
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

**🚨 CRÍTICO:** `defaultCurrency` debe estar **SIEMPRE** en las dependencias del `useMemo()` que calcula KPIs.

---

## 5. Casos de Uso Reales

### Caso 1: Una sola moneda
Si todos los pagos son en USD y la moneda base es USD:
- Valor mostrado: "$ 300" (sin símbolo adicional)
- Breakdown: "USD 300"

### Caso 2: Múltiples monedas
Pagos en USD y ARS con moneda base ARS:
- Valor mostrado: "$ 350.000" (total convertido a ARS)
- Breakdown: "USD 300 + ARS 50.000" (cantidades originales)

### Caso 3: Cambiar moneda dinámicamente
Si el usuario cambia de ARS a USD como moneda base:
- **ANTES**: Valor "$ 350.000", Breakdown "USD 300 + ARS 50.000"
- **DESPUÉS** (automáticamente): Valor "USD 350", Breakdown "USD 300 + ARS 50"

---

## 6. Checklist de Implementación

Al agregar nuevas KPIs monetarias a una página:

- [ ] Importar `useOrganizationDefaultCurrency` de `@/hooks/use-currencies`
- [ ] Importar `calculateMonetaryKPI` y `formatBreakdown` de `@/lib/kpis`
- [ ] Importar `format` y `formatKPI` de `@/lib/money`
- [ ] Llamar a `useOrganizationDefaultCurrency(organizationId)`
- [ ] Usar `calculateMonetaryKPI()` para cada KPI monetaria
- [ ] Agregar `defaultCurrency` a las dependencias del `useMemo()`
- [ ] Mostrar el número grande con símbolo: `format(kpi.value, kpi.breakdown[0].currencySymbol)` o `formatMoneyAmount()`
- [ ] Mostrar el breakdown debajo: `formatBreakdown(kpi)`
- [ ] Testear que se actualiza al cambiar la moneda por defecto

---

## 7. Auditoría y Refactorización

### 7.1 Qué se encontró

Se realizó una auditoría completa del manejo de multimoneda. Se identificaron múltiples instancias de lógica duplicada y dispersa para conversiones de moneda, las cuales fueron centralizadas en `/lib/money.ts`.

| Archivo | Patrón Encontrado | Estado |
|---------|-------------------|--------|
| `use-financial-metrics.ts` | `convertToPrimaryCurrency` interno | ✅ Refactorizado |
| `use-partner-metrics.ts` | `convertToPrimaryCurrency` duplicado | ✅ Refactorizado |
| `ClientPaymentsTab.tsx` | `amount * exchange_rate` | ✅ Refactorizado |
| `GeneralCostsPaymentsTab.tsx` | Lógica dispersa | ✅ Refactorizado |

### 7.2 Qué estaba bien

1. **Estructura de datos correcta**: Los movimientos guardaban `amount`, `currency_id`, y `exchange_rate`.
2. **KPIs con breakdown**: Los hooks ya implementaban el patrón de `balanceByCurrency` + `totalInPrimaryCurrency`.
3. **No hay columnas precalculadas**: Ninguna tabla tiene columnas como `amount_converted`.

### 7.3 Archivos refactorizados recientemente (2025-12-12)

#### Componentes con KPIs actualizadas:

- `src/pages/general-costs/GeneralCostsPaymentsTab.tsx` - KPIs "Total Pagos" (conteo) y "Pagos a la Fecha" (monetaria)
- `src/pages/partners/tabs/PartnerTransactionsTab.tsx` - KPIs "Total Aportes", "Total Retiros", "Saldo Neto"
- `src/pages/clients/ClientDashboardTab.tsx` - KPIs de clientes y pagos
- `src/pages/clients/ClientPaymentsTab.tsx` - KPIs de confirmación de pagos
- `src/pages/clients/ClientObligationsTab.tsx` - KPIs de compromisos

#### Cambios principales:

1. Agregada importación de `useOrganizationDefaultCurrency`
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

### Problema: El desglose se ve confuso

Si `formatBreakdown()` no devuelve el formato esperado, verifica:
1. Que el KPI tenga un `breakdown` array no vacío
2. Que cada item en `breakdown` tenga `currencyCode`, `currencySymbol`, y `total`
3. Que `formatSubValue()` esté formateando correctamente (usa `toLocaleString('es-AR')`)

---

## 9. Roadmap Futuro

### Corto Plazo
1. Migrar gradualmente el resto de componentes que usan `toLocaleString` directamente
2. Actualizar componentes de charts para usar `format()` del módulo
3. Crear hook `useMoneyFormatter` que combine currency info con formateo

### Mediano Plazo
1. Implementar cache de exchange rates por fecha
2. Soporte para exchange rates históricos desde API externa

### Largo Plazo
1. Considerar alertas de discrepancia de cotización
2. Integración con servicios de datos de monedas en tiempo real

---

## 📞 Resumen

Este documento consolida **TODO** sobre el sistema multimoneda de Seencel:

- **Regla central**: Nunca precalcular, siempre convertir al renderizar
- **Módulo centralizado**: `/lib/money.ts` para conversiones
- **KPIs headless**: `/lib/kpis.ts` sin UI, retorna datos estructurados
- **Patrón de uso**: `calculateMonetaryKPI()` + `formatBreakdown()` en componentes
- **Actualización automática**: `useOrganizationDefaultCurrency()` con React Query
- **Desglose claro**: Mostrar símbolo en valor grande, breakdown en meta

¡Todo funciona automáticamente cuando la moneda por defecto cambia!
