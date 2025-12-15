# Analytics Module

Sistema de análisis reutilizable para comparaciones históricas y cálculos estadísticos.

## Comparación Histórica

El helper `calculateHistoricalComparison` compara un valor actual contra el promedio histórico de una serie de datos.

### Cuándo Usar

**Usar cuando:**
- Quieras mostrar cómo se compara el período actual vs el promedio histórico
- Tengas una serie temporal de valores numéricos (gastos mensuales, cantidad de transacciones, etc.)
- Necesites proporcionar contexto adicional en un KPI sin saturar la UI

**No usar cuando:**
- Comparas dos períodos específicos (usa comparación período vs período)
- Tienes menos de 2 puntos de datos históricos
- El valor no tiene una serie temporal asociada

### Uso Básico

```typescript
import { calculateHistoricalComparison } from '@/lib/analytics';

const currentValue = 15000;
const historicalValues = [12000, 13500, 11000, 14000, 12500, 13000];

const result = calculateHistoricalComparison(currentValue, historicalValues, {
  windowSize: 6,        // Últimos N valores a considerar
  minDataPoints: 3,     // Mínimo de datos para calcular
  stableThresholdPercent: 5  // Umbral para considerar "estable"
});
```

### Ejemplos por Dominio

#### Gastos Generales
```typescript
// Comparar gasto del mes actual vs promedio de últimos 6 meses
const monthlyExpenses = [12000, 13500, 11000, 14000, 12500, 13000];
const currentMonthExpense = 15000;

const comparison = calculateHistoricalComparison(
  currentMonthExpense, 
  monthlyExpenses,
  { windowSize: 6, minDataPoints: 2 }
);
// Result: { deltaPercent: 17.6, direction: 'up', comparisonType: 'above_average' }
```

#### Materiales
```typescript
// Comparar costo unitario actual vs promedio histórico
const historicalUnitCosts = [120, 115, 125, 118, 122];
const currentUnitCost = 135;

const comparison = calculateHistoricalComparison(
  currentUnitCost,
  historicalUnitCosts,
  { windowSize: 5, minDataPoints: 3 }
);
// Result: { deltaPercent: 12.5, direction: 'up', comparisonType: 'above_average' }
```

#### Finanzas
```typescript
// Comparar cobros del mes vs promedio histórico
const monthlyCollections = [50000, 45000, 55000, 48000];
const currentMonthCollections = 42000;

const comparison = calculateHistoricalComparison(
  currentMonthCollections,
  monthlyCollections,
  { windowSize: 4, minDataPoints: 2, stableThresholdPercent: 10 }
);
// Result: { deltaPercent: -15.2, direction: 'down', comparisonType: 'below_average' }
```

### Resultado

```typescript
interface HistoricalComparisonResult {
  deltaPercent: number;        // +17.6
  direction: 'up' | 'down' | 'stable';
  comparisonType: 'above_average' | 'below_average' | 'at_average';
  historicalAverage: number;   // 12750
  currentValue: number;        // 15000
  dataPoints: number;          // 6
}
```

### Opciones

| Opción | Default | Descripción |
|--------|---------|-------------|
| `windowSize` | 6 | Cantidad de valores históricos a considerar |
| `minDataPoints` | 3 | Mínimo de datos requeridos (retorna `null` si no hay suficientes) |
| `stableThresholdPercent` | 5 | Umbral de variación para considerar el valor como "estable" |

### Retorno

- Retorna `null` si no hay suficientes datos históricos
- Retorna `HistoricalComparisonResult` con la comparación calculada

## Componente de Visualización

```tsx
import { StatCardHistoricalComparison } from '@/components/dashboard';

<StatCardHistoricalComparison 
  comparison={result} 
  label="vs promedio mensual"
/>
```

El componente:
- Muestra nada si `comparison` es `null`
- Usa colores semánticos (ámbar para arriba, azul para abajo, gris para estable)
- Incluye icono de tendencia y porcentaje formateado

## Principios de Diseño

1. **Agnóstico de dominio**: No usa nombres específicos como "gastos"
2. **Configurable**: Ventanas y umbrales se pasan como opciones
3. **Separación de responsabilidades**: El cálculo está en analytics, la visualización en componentes
4. **Null-safe**: Retorna `null` cuando no hay datos suficientes
5. **Orden cronológico**: Asegurarse de pasar los valores históricos en orden cronológico (más antiguo primero)
