# Auditoría del Sistema de Monedas - Seencel

**Fecha:** 2025-06-11  
**Estado:** Completada

---

## Resumen Ejecutivo

Se realizó una auditoría completa del manejo de multimoneda en el proyecto Seencel. Se identificaron múltiples instancias de lógica duplicada y dispersa para conversiones de moneda, las cuales fueron centralizadas en un nuevo módulo `/lib/money.ts`.

---

## Qué se Encontró

### Lógica Hardcodeada de Conversión

| Archivo | Patrón Encontrado | Estado |
|---------|-------------------|--------|
| `use-financial-metrics.ts` | `convertToPrimaryCurrency` interno | ✅ Refactorizado |
| `use-partner-metrics.ts` | `convertToPrimaryCurrency` duplicado | ✅ Refactorizado |
| `ClientPaymentsTab.tsx` | `amount * exchange_rate` | ✅ Refactorizado |
| `ClientObligationsTab.tsx` | `amount * exchangeRate` | ✅ Refactorizado |
| `PersonnelPaymentsTab.tsx` | `amount / exchange_rate` (inversa) | ✅ Refactorizado |
| `GeneralCostsPaymentsTab.tsx` | `rate = exchange_rate ?? 1` | ✅ Refactorizado |
| `getSubcontractAnalysis.ts` | Múltiples conversiones * y / | ✅ Refactorizado |
| `CommitmentAccordion.tsx` | `amount * exchange_rate` | ✅ Refactorizado |

### Funciones Duplicadas

| Función | Ubicaciones | Estado |
|---------|-------------|--------|
| `convertToPrimaryCurrency` | 2 hooks (financial-metrics, partner-metrics) | ✅ Eliminada, reemplazada por `convertToBaseCurrency` |
| `formatCurrency` local | ~10 componentes | Pendiente (bajo impacto) |

### Inconsistencias de Dirección

| Archivo | Dirección | Corrección |
|---------|-----------|------------|
| Mayoría de archivos | `amount * exchange_rate` | Standard (multiplicación) |
| `PersonnelPaymentsTab.tsx` | `amount / exchange_rate` | Usa `{ direction: 'divide' }` |
| `getSubcontractAnalysis.ts` | Mixto (* y /) | Cada caso usa la dirección correcta |

---

## Qué Estaba Bien

1. **Estructura de datos correcta**: Los movimientos ya guardaban `amount`, `currency_id`, y `exchange_rate` correctamente.
2. **KPIs con breakdown**: Los hooks `use-financial-metrics.ts` y `use-partner-metrics.ts` ya implementaban el patrón de `balanceByCurrency` + `totalInPrimaryCurrency`.
3. **Formateo sin decimales**: El archivo `currency-formatter.ts` ya implementaba el estándar de sin decimales.
4. **No hay columnas precalculadas**: Ninguna tabla tiene columnas como `amount_converted`.

---

## Qué Estaba Mal

1. **Lógica duplicada**: La función `convertToPrimaryCurrency` existía idéntica en 2 hooks.
2. **Conversiones dispersas**: ~8 archivos tenían lógica inline de `amount * exchange_rate`.
3. **Dirección inconsistente**: Algunos archivos usaban multiplicación, otros división.
4. **Sin módulo centralizado**: No existía un punto único para todas las operaciones monetarias.
5. **Formateo disperso**: ~60 archivos usan `toLocaleString` o `Intl.NumberFormat` directamente.

---

## Archivos Refactorizados

### Alta Prioridad (Completados)

| Archivo | Cambios |
|---------|---------|
| `src/lib/money.ts` | **NUEVO** - Módulo centralizado |
| `src/features/finances/hooks/use-financial-metrics.ts` | Usa `convertToBaseCurrency` |
| `src/features/finances/hooks/use-partner-metrics.ts` | Usa `convertToBaseCurrency` |
| `src/pages/clients/ClientPaymentsTab.tsx` | Usa `convert()` |
| `src/pages/clients/ClientObligationsTab.tsx` | Usa `convert()` |
| `src/pages/general-costs/GeneralCostsPaymentsTab.tsx` | Usa `convert()` |
| `src/pages/professional/personnel/PersonnelPaymentsTab.tsx` | Usa `convert()` con `direction: 'divide'` |
| `src/features/subcontracts/services/getSubcontractAnalysis.ts` | Usa `convert()` con direcciones apropiadas |
| `src/features/clients/components/CommitmentAccordion.tsx` | Usa `convert()` |
| `src/lib/currency-formatter.ts` | Marcado como `@deprecated` |

### Media Prioridad (Pendientes para futuras iteraciones)

| Archivo | Motivo |
|---------|--------|
| `src/pages/professional/movements/MovementsList.tsx` | Tiene formateo local |
| `src/pages/professional/capital/Capital.tsx` | Usa exchange_rate directo |
| `src/features/finances/components/MovementKPICards.tsx` | Formateo local |
| `src/components/charts/*.tsx` | Formateo disperso |

### Baja Prioridad (Sin cambios necesarios)

| Archivo | Motivo |
|---------|--------|
| `src/pages/checkout/SubscriptionCheckout.tsx` | Lógica de precios de suscripción, contexto diferente |
| `src/features/learning/*.ts` | Precios de cursos, no movimientos financieros |

---

## Cálculos Duplicados (Corregidos)

1. **`convertToPrimaryCurrency`**: Existía en 2 hooks → Eliminada, reemplazada por `convertToBaseCurrency` del módulo.

2. **Lógica de `amount * exchange_rate`**: Existía en ~8 archivos → Centralizada en `convert()`.

---

## Cálculos Incorrectos (Corregidos)

1. **PersonnelPaymentsTab.tsx**: Usaba división (`/`) donde otros usaban multiplicación (`*`). Se mantuvo la división con el parámetro `{ direction: 'divide' }` para preservar el comportamiento correcto para ese contexto específico.

2. **getSubcontractAnalysis.ts**: Tenía mezcla de multiplicación y división. Se documentó y mantuvo cada dirección según el contexto del cálculo.

---

## Nuevo Módulo Creado

### `/lib/money.ts`

Funciones disponibles:
- `convert(amount, exchangeRate, options?)` - Conversión básica
- `convertToBaseCurrency(item, baseCurrencyId)` - Para items completos
- `format(amount, symbol, options?)` - Formateo con símbolo
- `formatKPI(value)` - Solo número formateado
- `formatSubValue(breakdown)` - Desglose multi-moneda
- `sumByCurrency(items)` - Agrupación sin conversión
- `sumAllInBaseCurrency(items, baseCurrencyId)` - Suma convertida
- `explainBreakdown(items, baseCurrencyId)` - Total + breakdown
- `formatExchangeRate(rate)` - Formateo de cotización
- `getEffectiveExchangeRate(currencyId, baseCurrencyId, rate?)` - Rate efectivo

---

## Documentación Creada

1. `prompts/documentation/MULTICURRENCY_SYSTEM.md` - Documentación completa del sistema
2. `prompts/documentation/FINANCE_CURRENCY_AUDIT.md` - Este informe

---

## Recomendaciones Futuras

### Corto Plazo
1. Migrar gradualmente el resto de componentes que usan `toLocaleString` directamente
2. Actualizar componentes de charts para usar `format()` del módulo

### Mediano Plazo
1. Crear hook `useMoneyFormatter` que combine currency info con formateo
2. Implementar cache de exchange rates por fecha

### Largo Plazo
1. Considerar soporte para exchange rates históricos desde API externa
2. Implementar alertas de discrepancia de cotización

---

## Conclusión

El sistema multimoneda de Seencel ahora cuenta con:
- ✅ Módulo centralizado para conversiones
- ✅ Documentación completa
- ✅ Sin duplicación de lógica en hooks principales
- ✅ Consistencia en la fórmula de conversión
- ✅ Sin riesgo de inconsistencia histórica
- ✅ Extensible a nuevas monedas sin cambios de código
