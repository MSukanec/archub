# Sistema de Insights Automáticos

## ¿Qué es un Insight?

Un **Insight** es un mensaje informativo generado automáticamente a partir del análisis de datos. Cada insight tiene:

- **id**: Identificador único (ej: `growth-increase`)
- **type**: Tipo visual (`info` | `warning` | `alert`)
- **title**: Título corto y descriptivo
- **description**: Descripción detallada con datos específicos
- **icon**: Nombre del icono de `lucide-react`
- **priority**: Número para ordenar (menor = más importante)

## Arquitectura

```
src/components/dashboard/insights/
├── types.ts          # Tipos e interfaces
├── insightRules.ts   # Reglas de negocio
├── InsightEngine.ts  # Motor de ejecución
├── InsightItem.tsx   # Adaptador de Insight → InsightItem
├── index.ts          # Exportaciones
└── README.md         # Esta documentación

src/components/dashboard/InsightCard.tsx  # Card contenedora (componente existente)
```

## Cómo funciona

1. **Contexto**: Se construye un `InsightContext` con datos agregados
2. **Reglas**: Cada regla analiza el contexto y retorna `Insight | null`
3. **Motor**: Ejecuta todas las reglas, filtra nulls, ordena por prioridad
4. **Adaptador**: `toInsightItems()` convierte `Insight[]` a `InsightItem[]`
5. **Renderizado**: `InsightCard` (componente existente) muestra los items

## Reglas Actuales

| Regla | Detecta | Tipo |
|-------|---------|------|
| `growthInsight` | Crecimiento interanual >20% o reducción <-20% | warning/info |
| `concentrationInsight` | Categoría con >50% del gasto total | warning |
| `frequencyInsight` | Alta (≥15/mes) o baja (≤2/mes) frecuencia de pagos | info |
| `volatilityInsight` | Coeficiente de variación mensual >50% | warning |
| `recurrenceInsight` | Categoría predominante (25-50% del gasto) | info |

## Cómo agregar una nueva regla

### 1. Definir la regla en `insightRules.ts`

```typescript
export const myNewInsight: InsightRule = (context) => {
  // 1. Validar si hay datos suficientes
  if (context.totalGasto === 0) return null;
  
  // 2. Calcular la métrica
  const myMetric = calculateSomething(context);
  
  // 3. Decidir si aplica
  if (myMetric < THRESHOLD) return null;
  
  // 4. Retornar el insight con textos dinámicos
  return {
    id: 'my-new-insight',
    type: 'info', // 'info' | 'warning' | 'alert'
    title: `Título con ${myMetric}% incluido`,
    description: `Descripción detallada basada en ${context.someData}`,
    icon: 'TrendingUp', // Nombre exacto de lucide-react
    priority: 50 // Menor = más importante
  };
};
```

### 2. Agregar al array de reglas

```typescript
// En insightRules.ts
export const allInsightRules: InsightRule[] = [
  growthInsight,
  concentrationInsight,
  frequencyInsight,
  volatilityInsight,
  recurrenceInsight,
  myNewInsight, // ← Agregar aquí
];
```

### 3. Extender el contexto si necesitas nuevos datos

```typescript
// En types.ts - agregar al InsightContext
export interface InsightContext {
  // ... campos existentes
  myNewField: number; // ← Nuevo campo
}
```

```typescript
// En el dashboard - agregar al buildInsightContext
const context = buildInsightContext({
  // ... campos existentes
  myNewField: calculatedValue,
});
```

## Datos que necesita el sistema

El `InsightContext` requiere:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalGasto` | `number` | Gasto total del período actual |
| `previousPeriodGasto` | `number` | Gasto total del período anterior |
| `categoryData` | `Array<{name, value}>` | Totales por categoría |
| `monthlyData` | `Array<{month, value}>` | Totales mensuales |
| `paymentsCount` | `number` | Cantidad total de pagos |
| `monthCount` | `number` | Cantidad de meses con datos |
| `topCategoryPercentage` | `number` | % de la categoría principal |
| `topCategoryName` | `string` | Nombre de la categoría principal |

## Reutilización en otros dashboards

### Ejemplo: Dashboard de Proyectos

```tsx
import { 
  generateInsights, 
  buildInsightContext, 
  toInsightItems 
} from '@/components/dashboard/insights';
import { InsightCard } from '@/components/dashboard';

function ProjectDashboard() {
  const autoInsights = useMemo(() => {
    const context = buildInsightContext({
      totalGasto: projectBudgetUsed,
      previousPeriodGasto: lastMonthBudget,
      categoryData: costByCategory,
      monthlyData: monthlySpending,
      paymentsCount: transactions.length,
      monthCount: activeMonths,
      topCategoryPercentage: topCostPercent,
      topCategoryName: topCostName,
    });
    return generateInsights(context, 3);
  }, [/* deps */]);

  return (
    <InsightCard
      title="Insights"
      titleIcon={<Lightbulb />}
      items={toInsightItems(autoInsights)}
      data-testid="insights-section"
    />
  );
}
```

### Reglas personalizadas por dashboard

Puedes crear reglas específicas para un dashboard:

```typescript
// En tu dashboard
import { InsightRule, InsightContext, Insight } from '@/components/dashboard/insights';

const projectDeadlineInsight: InsightRule = (context) => {
  // Lógica específica del proyecto
  return null;
};

// Usar generateInsights con reglas custom
import { runInsightRules } from '@/components/dashboard/insights';

const insights = runInsightRules(context, [
  ...allInsightRules,
  projectDeadlineInsight,
], 3);
```

## Estilos de los tipos

Los tipos de `Insight` se mapean a variantes de `InsightItem`:

| Tipo Insight | Variante InsightItem | Color |
|--------------|---------------------|-------|
| `info` | `info` | Azul |
| `warning` | `warning` | Amarillo |
| `alert` | `danger` | Rojo |

## Buenas prácticas

1. **No hardcodear textos**: Siempre incluir datos en título y descripción
2. **Retornar null cuando no aplica**: Evita insights vacíos o irrelevantes
3. **Prioridad coherente**: Usar rangos (1-30 crítico, 31-60 importante, 61-100 informativo)
4. **Iconos semánticos**: Elegir iconos que representen la métrica
5. **Descripciones accionables**: Explicar qué significa y qué puede hacer el usuario
