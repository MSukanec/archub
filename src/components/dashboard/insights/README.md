# Sistema de Insights Narrativos

## ¿Qué es un Insight Narrativo?

Un **Insight Narrativo** es un mensaje inteligente de nivel ejecutivo que no solo describe qué pasó, sino que **explica**:

- **Por qué** está pasando algo
- **Dónde** mirar para actuar
- **Qué acción** considerar

### Diferencia: Insight Descriptivo vs Narrativo

| Tipo | Ejemplo |
|------|---------|
| **Descriptivo** | "El gasto aumentó un 45%" |
| **Narrativo** | "El 68% del aumento proviene de Infraestructura en este período" |

El insight descriptivo te dice *qué* pasó. El narrativo te dice *por qué* y *dónde mirar*.

## Arquitectura

```
src/components/dashboard/insights/
├── types.ts          # Tipos e interfaces extendidos
├── insightRules.ts   # 5 reglas narrativas de nivel ejecutivo
├── InsightEngine.ts  # Motor de ejecución con buildInsightContext extendido
├── InsightItem.tsx   # Adaptador de Insight → InsightItem
├── index.ts          # Exportaciones
└── README.md         # Esta documentación

src/components/dashboard/InsightCard.tsx  # Card contenedora (componente existente)
```

## Los 5 Insights Narrativos de Gastos Generales

| # | Insight | Dispara cuando | Narrativa |
|---|---------|----------------|-----------|
| 1 | **Crecimiento explicado** | Gasto crece/baja >15% | Explica qué categoría explica la mayor parte del cambio |
| 2 | **Alta concentración** | 1-3 categorías >70% del total | Cuántas categorías concentran el gasto |
| 3 | **Carga operativa** | ≥15 pagos/mes | Enfoca en operación, sugiere consolidar |
| 4 | **Patrón repetido** | Mismo patrón ≥3 períodos | Indica que no es evento aislado |
| 5 | **Oportunidad consolidación** | Concepto con ≥6 pagos | Sugiere consolidar pagos frecuentes |

## Cómo funciona

1. **Contexto extendido**: Se construye un `InsightContext` con datos del período actual Y anterior
2. **Reglas inteligentes**: Cada regla analiza, compara y genera texto dinámico
3. **Motor**: Ejecuta todas las reglas, filtra nulls, ordena por prioridad
4. **Adaptador**: `toInsightItems()` convierte al formato de la card contenedora

## Datos del InsightContext

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalGasto` | `number` | Gasto total del período actual |
| `previousPeriodGasto` | `number` | Gasto total del período anterior |
| `categoryData` | `CategoryData[]` | Totales por categoría (período actual) |
| `previousCategoryData` | `CategoryData[]` | Totales por categoría (período anterior) |
| `monthlyData` | `Array<{month, value}>` | Totales mensuales |
| `paymentsCount` | `number` | Cantidad total de pagos |
| `monthCount` | `number` | Cantidad de meses con datos |
| `topCategoryPercentage` | `number` | % de la categoría principal |
| `topCategoryName` | `string` | Nombre de la categoría principal |
| `paymentsByConcept` | `PaymentsByConceptData[]` | Pagos agrupados por concepto |

## Cómo agregar un nuevo insight narrativo

### 1. Definir la regla en `insightRules.ts`

```typescript
export const myNarrativeInsight: InsightRule = (context: InsightContext): Insight | null => {
  // 1. Validar datos mínimos
  if (context.totalGasto === 0) return null;
  
  // 2. Calcular métricas comparativas
  const comparison = calculateSomething(context);
  
  // 3. Determinar si aplica el insight
  if (comparison < THRESHOLD) return null;
  
  // 4. Generar narrativa dinámica (NUNCA hardcodear)
  return {
    id: 'my-narrative-insight',
    type: 'warning',
    title: 'Título orientado a la acción',
    description: `El ${comparison}% del [métrica] proviene de "${context.topCategoryName}".`,
    icon: 'TrendingUp',
    priority: 3
  };
};
```

### 2. Principios de buena narrativa

1. **Explicar el "por qué"**: No solo decir qué pasó, sino por qué
2. **Señalar dónde mirar**: Indicar la categoría, concepto o período específico
3. **Sugerir acción**: Cuando sea apropiado, proponer qué hacer
4. **Datos dinámicos**: Todo el texto debe construirse con datos reales
5. **Retornar null**: Si no hay historia que contar, no mostrar nada

### 3. Agregar al array de reglas

```typescript
export const allInsightRules: InsightRule[] = [
  growthExplainedInsight,
  concentrationNarrativeInsight,
  operationalLoadInsight,
  repeatedPatternInsight,
  consolidationOpportunityInsight,
  myNarrativeInsight, // ← Agregar aquí
];
```

## Por qué estos insights son específicos de Gastos Generales

Los insights de este módulo están diseñados para el contexto de **gastos operativos recurrentes**:

- **Crecimiento explicado**: Importante para entender desviaciones presupuestarias
- **Concentración**: Riesgo de dependencia en pocos proveedores/conceptos
- **Carga operativa**: Eficiencia administrativa en procesar pagos
- **Patrones repetidos**: Identificar tendencias que requieren atención estratégica
- **Consolidación**: Optimización de procesos de pago

Otros módulos (Proyectos, Subcontratos, etc.) necesitarán insights propios adaptados a su contexto.

## Uso en el Dashboard

```tsx
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { InsightCard } from '@/components/dashboard';

const autoInsights = useMemo(() => {
  const context = buildInsightContext({
    totalGasto: kpis.totalGasto.value,
    previousPeriodGasto: kpis.previousPeriodGasto,
    categoryData: allCategoryData,
    previousCategoryData,
    monthlyData: monthlyChartData,
    paymentsCount: confirmedPayments.length,
    monthCount: kpis.monthCount,
    paymentsByConcept
  });
  return generateInsights(context, 3);
}, [/* deps */]);

return (
  <InsightCard
    title="Insights"
    titleIcon={<Lightbulb />}
    items={toInsightItems(autoInsights)}
  />
);
```

## Prioridades y tipos

| Prioridad | Nivel | Tipo sugerido |
|-----------|-------|---------------|
| 1 | Crítico | `alert` |
| 2-3 | Importante | `warning` |
| 4-6 | Informativo | `info` |

| Tipo | Color | Cuándo usar |
|------|-------|-------------|
| `alert` | Rojo | Concentración crítica, anomalías graves |
| `warning` | Amarillo | Requiere atención, tendencias preocupantes |
| `info` | Azul | Oportunidades, patrones identificados |

## Buenas prácticas

1. **Narrativa > Descripción**: Cada insight debe contar una historia
2. **Datos reales**: Todo texto debe incluir números/nombres del contexto
3. **Silencio inteligente**: Si no hay historia, retornar `null`
4. **Complementar KPIs**: El insight explica lo que el KPI no puede
5. **Nivel ejecutivo**: Lenguaje claro, orientado a decisiones
