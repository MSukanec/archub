# Sistema Multimoneda Centralizado - Seencel

## Resumen

Este documento describe el sistema centralizado de multimoneda implementado en Seencel, siguiendo las reglas de producto para una UX óptima tanto para organizaciones monomoneda como multimoneda.

---

## 1. Regla Principal (NO NEGOCIABLE)

```
Una organización es MULTIMONEDA solo si tiene más de una moneda ACTIVA.

- 1 moneda activa → comportamiento MONOMONEDA
- 2+ monedas activas → comportamiento MULTIMONEDA
```

Esta regla se resuelve en **un solo lugar**: `useOrgCurrencyContext()`.

---

## 2. Contexto Global de Moneda

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

---

## 3. Reglas de Visibilidad

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

**SÍ mostrar:**
- Montos simples en la moneda por defecto
- KPIs limpias sin breakdown
- Tablas sin columnas extra

**El usuario NO debe notar que existe multimoneda.**

### 🟡 Organización MULTIMONEDA

**SÍ mostrar:**
- Selector de moneda (donde tenga sentido)
- Campo cotización SOLO cuando `moneda seleccionada ≠ moneda por defecto`
- Breakdown por moneda en KPIs

**⚠️ NUNCA mostrar cotización "porque sí".**

---

## 4. Patrón de Uso en Formularios

### Ejemplo: PartnerContributionFormFields.tsx

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
  
  // En el render:
  const visibility = getCurrencyFieldsVisibility({
    context: orgCurrencyContext,
    selectedCurrencyId: form.watch('currency_id')
  });
  
  // En el submit: forzar exchange_rate a 1 si no se muestra el campo
  const onSubmit = (data) => {
    const shouldUseExchangeRate = orgCurrencyContext.shouldShowExchangeRate(data.currency_id);
    const effectiveExchangeRate = shouldUseExchangeRate ? (data.exchange_rate || 1) : 1;
    // usar effectiveExchangeRate en lugar de data.exchange_rate
  };
  
  return (
    <Form>
      {/* Selector de moneda - solo si multimoneda */}
      {visibility.showCurrencySelector ? (
        <FormField name="currency_id" ... />
      ) : (
        // Hidden input: el valor se establece via useEffect con la moneda por defecto
        <input type="hidden" {...form.register('currency_id')} />
      )}
      
      {/* Cotización - solo si moneda diferente a default */}
      {visibility.showExchangeRate && (
        <FormField name="exchange_rate" ... />
      )}
    </Form>
  );
}
```

### Reglas Críticas para Formularios

1. **Hidden Input para Monomoneda**: Cuando `showCurrencySelector` es false, el `currency_id` 
   debe establecerse automáticamente via `useEffect` con la moneda por defecto.

2. **Exchange Rate Forzado**: En el `onSubmit`, usar `orgCurrencyContext.shouldShowExchangeRate(currency_id)` 
   para determinar si usar el exchange_rate del form o forzarlo a 1.

3. **Nunca dejar currency_id vacío**: La moneda por defecto debe asignarse automáticamente.

---

## 5. Patrón de Uso en KPIs

```typescript
import { calculateMonetaryKPI, formatBreakdown } from '@/lib/kpis';
import { useOrgCurrencyContext } from '@/hooks/use-currencies';

function MyKPIs({ organizationId }) {
  const { defaultCurrencyCode, isMultiCurrency } = useOrgCurrencyContext(organizationId);
  
  const kpi = calculateMonetaryKPI({
    items: transactions,
    baseCurrencyId: defaultCurrencyCode
  });
  
  return (
    <StatCard>
      <StatCardValue>{formatKPI(kpi.value)}</StatCardValue>
      
      {/* Breakdown solo si multimoneda */}
      {isMultiCurrency && kpi.breakdown && (
        <StatCardMeta>{formatBreakdown(kpi)}</StatCardMeta>
      )}
    </StatCard>
  );
}
```

---

## 6. Patrón de Uso en Tablas

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

## 7. Archivos Clave

| Archivo | Descripción |
|---------|-------------|
| `src/hooks/use-currencies.ts` | Hook `useOrgCurrencyContext()` y hooks de moneda |
| `src/lib/currency-visibility.ts` | Helpers de visibilidad condicional |
| `src/lib/money.ts` | Funciones de conversión y formateo |
| `src/lib/kpis.ts` | Sistema headless de KPIs |

---

## 8. Formularios por Refactorizar

Los siguientes formularios aún muestran campos de moneda/cotización siempre:

- `src/features/partners/forms/PartnerWithdrawalFormFields.tsx`
- `src/features/clients/forms/ClientPaymentFormFields.tsx`
- `src/features/clients/forms/ClientCommitmentForm.tsx`
- `src/features/personnel/forms/PersonnelPaymentFormFields.tsx`
- `src/features/materials/forms/MaterialPaymentFormFields.tsx`
- `src/features/general-costs/forms/GeneralCostPaymentForm.tsx`
- `src/features/finances/modals/movements/fields/DefaultFields.tsx`
- `src/features/subcontracts/modals/SubcontractFormModal.tsx`

**Ya refactorizado como ejemplo:**
- ✅ `src/features/partners/forms/PartnerContributionFormFields.tsx`

---

## 9. Checklist de Implementación

Al agregar nuevos formularios/páginas con montos:

- [ ] Importar `useOrgCurrencyContext` de `@/hooks/use-currencies`
- [ ] Importar `getCurrencyFieldsVisibility` de `@/lib/currency-visibility`
- [ ] Usar `visibility.showCurrencySelector` para el selector de moneda
- [ ] Usar `visibility.showExchangeRate` para el campo de cotización
- [ ] Si es monomoneda, usar hidden input para currency_id
- [ ] En KPIs, usar `isMultiCurrency` para mostrar/ocultar breakdown

---

## 10. Restricciones

❌ NO duplicar lógica `isMultiCurrency` en componentes  
❌ NO mostrar cotización si la moneda es igual a la por defecto  
❌ NO refactorizar toda la app a ciegas  
❌ NO tocar pantallas que no usen montos  

✅ Centralizar en `useOrgCurrencyContext`  
✅ Usar helpers de `currency-visibility.ts`  
✅ Refactorizar gradualmente formulario por formulario  

---

**Última actualización:** 2025-12-12
