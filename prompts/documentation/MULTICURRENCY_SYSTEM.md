# Sistema Multimoneda de Seencel - Documentación Completa y Actualizada

## Resumen Ejecutivo

Seencel implementa un sistema **centralizado y headless** de multimoneda que:
- ✅ Convierte montos entre cualquier par de monedas usando exchange rates
- ✅ Muestra totales convertidos a la moneda base + desglose por moneda
- ✅ Soporta KPIs monetarias, de conteo, porcentaje y texto
- ✅ Se actualiza automáticamente cuando cambia la moneda por defecto de la organización
- ✅ Formatea valores con símbolos de moneda (e.g., `$ 150.000`, `USD 75.000`)
- ✅ Determina visibilidad de campos según si es mono o multimoneda

---

## 📋 Índice

1. [Regla Principal (NO NEGOCIABLE)](#regla-principal-no-negociable)
2. [Contexto Global de Moneda](#contexto-global-de-moneda)
3. [Módulo `/lib/money.ts`](#módulo-libmoneyts)
4. [Sistema Headless de KPIs](#sistema-headless-de-kpis-libkpists)
5. [Reglas de Visibilidad](#reglas-de-visibilidad)
6. [Patrones de Uso](#patrones-de-uso)
7. [Flujo de Actualización Automática](#flujo-de-actualización-automática)
8. [Casos de Uso Reales](#casos-de-uso-reales)
9. [Checklist de Implementación](#checklist-de-implementación)
10. [Debugging](#debugging)
11. [Roadmap Futuro](#roadmap-futuro)

---

## Regla Principal (NO NEGOCIABLE)

```
Una organización es MULTIMONEDA solo si tiene más de una moneda ACTIVA.

- 1 moneda activa → comportamiento MONOMONEDA
- 2+ monedas activas → comportamiento MULTIMONEDA
```

Esta regla se resuelve en **un solo lugar**: `useOrgCurrencyContext()`.

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

## Contexto Global de Moneda

### Hook: `useOrgCurrencyContext(organizationId)`

Ubicación: `src/hooks/use-currencies.ts`

```typescript
import { useOrgCurrencyContext } from '@/hooks/use-currencies';

const {
  isMultiCurrency,        // boolean - TRUE si >1 moneda activa
  defaultCurrency,        // Currency | null
  defaultCurrencyId,      // string | null
  defaultCurrencyCode,    // string | null (para KPIs)
  defaultCurrencySymbol,  // string (default '$')
  activeCurrencies,       // OrganizationCurrency[]
  activeCurrencyCount,    // number
  isLoading,              // boolean
  error,                  // Error | null
  shouldShowExchangeRate, // (currencyId) => boolean
  isDefaultCurrency,      // (currencyId) => boolean
} = useOrgCurrencyContext(organizationId);
```

### Hook Legacy: `useOrganizationDefaultCurrency()`

Para backward compatibility también existe:
```typescript
const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
```

---

## Módulo `/lib/money.ts`

Centraliza TODA la lógica de conversión y formateo.

### Función Principal: `convertToBaseCurrency()`

```typescript
convertToBaseCurrency(
  fromCurrencyId: string,
  toCurrencyId: string | undefined,
  amount: number,
  exchangeRate: number | null,
  options?: ConvertToBaseOptions
): number
```

**Lógica interna:**
1. Si `fromCurrencyId === toCurrencyId` → retorna `amount` sin convertir
2. Si `toCurrencyId === quoteCurrency` (USD por defecto) → **divide**: `amount / exchangeRate`
3. Si `fromCurrencyId === quoteCurrency` → **multiplica**: `amount * exchangeRate`
4. En caso contrario → **multiplica** (comportamiento por defecto)

### Otras Funciones Clave

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

#### `sumAllInBaseCurrency(items, baseCurrencyId): number`
Suma todos convertidos a moneda base.

---

## Sistema Headless de KPIs: `/lib/kpis.ts`

Las KPIs son **funciones puras** sin componentes visuales. Retornan `{ value, formatted, breakdown?, meta? }`.

### `calculateMonetaryKPI(config): KPIResult`

**LA FUNCIÓN MÁS IMPORTANTE.** Calcula total convertido a moneda base + desglose.

```typescript
const kpi = calculateMonetaryKPI({
  items: [
    { amount: 100, currency: { code: 'USD', symbol: '$' }, exchange_rate: 1000 },
    { amount: 50000, currency: { code: 'ARS', symbol: '$' }, exchange_rate: 1 }
  ],
  baseCurrencyId: 'ARS'  // SOLO ESTO! No pases symbol ni quoteCurrency
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

### `calculateCountKPI(config): KPIResult`

Para contar items simples.

---

## Reglas de Visibilidad

### Helpers de Visibilidad

Ubicación: `src/lib/currency-visibility.ts`

```typescript
import { getCurrencyFieldsVisibility } from '@/lib/currency-visibility';

const visibility = getCurrencyFieldsVisibility({
  context: orgCurrencyContext,
  selectedCurrencyId: form.watch('currency_id')
});

// Propiedades disponibles:
visibility.isMultiCurrency      // Si la org es multimoneda
visibility.showCurrencySelector // Si mostrar selector de moneda
visibility.showExchangeRate     // Si mostrar campo de cotización
visibility.showCurrencyColumn   // Si mostrar columna de moneda en tablas
visibility.showExchangeRateColumn // Si mostrar columna de cotización
visibility.showKPIBreakdown     // Si mostrar breakdown en KPIs
```

### 🟢 Organización MONOMONEDA

**NO mostrar:**
- Selectores de moneda
- Campos de cotización
- Columnas de moneda/cotización en tablas
- Breakdowns por moneda en KPIs

**El usuario NO debe notar que existe multimoneda.**

### 🟡 Organización MULTIMONEDA

**SÍ mostrar:**
- Selector de moneda (donde tenga sentido)
- Campo cotización SOLO cuando `moneda seleccionada ≠ moneda por defecto`
- Breakdown por moneda en KPIs

---

## Patrones de Uso

### En Formularios

```typescript
import { useOrgCurrencyContext } from '@/hooks/use-currencies';
import { getCurrencyFieldsVisibility } from '@/lib/currency-visibility';

function MyForm({ organizationId }) {
  const orgCurrencyContext = useOrgCurrencyContext(organizationId);
  
  // IMPORTANTE: Establecer moneda por defecto automáticamente en modo create
  useEffect(() => {
    if (mode === 'create' && orgCurrencyContext.defaultCurrencyId) {
      form.setValue('currency_id', orgCurrencyContext.defaultCurrencyId);
    }
  }, [orgCurrencyContext.defaultCurrencyId]);
  
  const visibility = getCurrencyFieldsVisibility({
    context: orgCurrencyContext,
    selectedCurrencyId: form.watch('currency_id')
  });
  
  return (
    <Form>
      {visibility.showCurrencySelector ? (
        <FormField name="currency_id" ... />
      ) : (
        <input type="hidden" {...form.register('currency_id')} />
      )}
      
      {visibility.showExchangeRate && (
        <FormField name="exchange_rate" ... />
      )}
    </Form>
  );
}
```

### En KPIs (CORRECTO)

```typescript
import { calculateMonetaryKPI, formatBreakdown } from '@/lib/kpis';
import { useOrgCurrencyContext } from '@/hooks/use-currencies';
import { format } from '@/lib/money';

function MyKPIs({ organizationId }) {
  const { defaultCurrencyCode, isMultiCurrency } = useOrgCurrencyContext(organizationId);
  
  // ✅ CORRECTO: SOLO baseCurrencyId, nada más
  const kpi = calculateMonetaryKPI({
    items: transactions,
    baseCurrencyId: defaultCurrencyCode
  });
  
  return (
    <StatCard>
      <StatCardValue style={{ color: 'var(--positive)' }}>
        {kpi.breakdown && kpi.breakdown.length > 0
          ? format(kpi.value, kpi.breakdown[0].currencySymbol)
          : formatKPI(kpi.value)
        }
      </StatCardValue>
      
      {isMultiCurrency && kpi.breakdown && (
        <StatCardMeta>{formatBreakdown(kpi)}</StatCardMeta>
      )}
    </StatCard>
  );
}
```

### En Tablas

```typescript
function MyTable({ organizationId }) {
  const orgCurrencyContext = useOrgCurrencyContext(organizationId);
  const visibility = getCurrencyFieldsVisibility({ context: orgCurrencyContext });
  
  const columns = [
    { header: 'Fecha', accessor: 'date' },
    { header: 'Monto', accessor: 'amount' },
    visibility.showCurrencyColumn && { header: 'Moneda', accessor: 'currency' },
    visibility.showExchangeRateColumn && { header: 'Cotización', accessor: 'exchange_rate' },
  ].filter(Boolean);
  
  return <Table columns={columns} data={data} />;
}
```

---

## Flujo de Actualización Automática

Cuando el usuario cambia la moneda por defecto de la organización:

```
1. Usuario cambia moneda por defecto en preferencias
   ↓
2. Backend actualiza organization_preferences
   ↓
3. useOrgCurrencyContext() se refetcha automáticamente (React Query)
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

## Casos de Uso Reales

### Caso 1: Una sola moneda
Si todos los pagos son en USD y la moneda base es USD:
- Valor mostrado: "$ 300" (sin símbolo adicional)
- Breakdown: NO se muestra (monomoneda)

### Caso 2: Múltiples monedas
Pagos en USD y ARS con moneda base ARS:
- Valor mostrado: "$ 350.000" (total convertido a ARS)
- Breakdown: "USD 300 + ARS 50.000" (cantidades originales)

### Caso 3: Cambiar moneda dinámicamente
Si el usuario cambia de ARS a USD como moneda base:
- **ANTES**: Valor "$ 350.000", Breakdown "USD 300 + ARS 50.000"
- **DESPUÉS** (automáticamente): Valor "USD 350", Breakdown "USD 300 + ARS 50"

---

## Checklist de Implementación

Al agregar nuevas KPIs monetarias a una página:

- [ ] Importar `useOrgCurrencyContext` de `@/hooks/use-currencies`
- [ ] Importar `calculateMonetaryKPI` y `formatBreakdown` de `@/lib/kpis`
- [ ] Importar `format` y `formatKPI` de `@/lib/money`
- [ ] Llamar a `useOrgCurrencyContext(organizationId)`
- [ ] Usar `calculateMonetaryKPI()` con SOLO `items` y `baseCurrencyId`
- [ ] ⚠️ NO pasar `symbol`, `quoteCurrency`, u otros parámetros extra
- [ ] Agregar `defaultCurrency` a las dependencias del `useMemo()`
- [ ] Usar CSS variables para colores: `style={{ color: 'var(--positive)' }}` o `style={{ color: 'var(--negative)' }}`
- [ ] Mostrar el número grande con símbolo: `format(kpi.value, kpi.breakdown[0].currencySymbol)`
- [ ] Mostrar el breakdown debajo: `formatBreakdown(kpi)`
- [ ] Testear que se actualiza al cambiar la moneda por defecto

---

## Debugging

### Problema: Las KPIs muestran valores gigantes (millones)

**Causa probable:** Parámetros extra en `calculateMonetaryKPI()` como `symbol` o `quoteCurrency`.

```typescript
// ❌ INCORRECTO - Valores enormes
const kpi = calculateMonetaryKPI({
  items,
  baseCurrencyId: defaultCurrency?.code,
  symbol: defaultCurrency?.symbol,      // ❌ Causas conversión doble
  quoteCurrency: 'USD'                   // ❌ Parámetro extra innecesario
});

// ✅ CORRECTO
const kpi = calculateMonetaryKPI({
  items,
  baseCurrencyId: defaultCurrency?.code
});
```

### Problema: Las KPIs no se actualizan cuando cambio la moneda

**Causa probable:** `defaultCurrency` no está en las dependencias del `useMemo()`.

```typescript
// ✅ CORRECTO
const metrics = useMemo(() => {
  const kpi = calculateMonetaryKPI({
    items,
    baseCurrencyId: defaultCurrency?.code
  });
  return { kpi };
}, [items, defaultCurrency]);  // ✅ Incluye defaultCurrency
```

### Problema: El color no es el correcto

Asegúrate de usar variables CSS, no Tailwind hardcodeado:

```typescript
// ❌ INCORRECTO
<StatCardValue className="text-chart-positive">

// ✅ CORRECTO
<StatCardValue style={{ color: isPositive ? 'var(--positive)' : 'var(--negative)' }}>
```

---

## Roadmap Futuro

### Corto Plazo
1. Migrar gradualmente componentes que usan `toLocaleString` directamente
2. Actualizar componentes de charts para usar `format()` del módulo
3. Crear hook `useMoneyFormatter` que combine currency info con formateo

### Mediano Plazo
1. Implementar cache de exchange rates por fecha
2. Soporte para exchange rates históricos desde API externa

### Largo Plazo
1. Considerar alertas de discrepancia de cotización
2. Integración con servicios de datos de monedas en tiempo real

---

## Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/use-currencies.ts` | Hook `useOrgCurrencyContext()` y hooks de moneda |
| `src/lib/currency-visibility.ts` | Helpers de visibilidad condicional |
| `src/lib/money.ts` | Funciones de conversión y formateo |
| `src/lib/kpis.ts` | Sistema headless de KPIs |

---

**Última actualización:** 2025-12-19 (Unificado y actualizado con correcciones de KPI)
