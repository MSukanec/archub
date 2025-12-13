# Dashboard Building Blocks (Nivel 2)

## ¿Qué es el Nivel 2?

El Nivel 2 contiene **componentes reutilizables de dashboard** que:
- Combinan componentes de UI primitivos (Nivel 1) para crear bloques visuales
- Renderizan información visual (cards, métricas, gráficos)
- **NO saben nada del dominio** (gastos, materiales, proyectos)
- **NO consultan datos** (reciben todo por props)
- **NO hacen cálculos de negocio**

Este patrón es el estándar internacional usado en dashboards modernos (Linear, Notion, Vercel, Stripe).

## Arquitectura de Niveles

```
┌─────────────────────────────────────────────────────────┐
│  Nivel 3: Widgets Semánticos (features/*)               │
│  → Componentes específicos de dominio                   │
│  → Consultan datos con hooks                            │
│  → Ej: GeneralCostsDashboardTab, ProjectFinancesWidget  │
├─────────────────────────────────────────────────────────┤
│  Nivel 2: Dashboard Building Blocks (components/dashboard) │  ← ESTA CARPETA
│  → Componentes visuales reutilizables                   │
│  → Reciben datos por props                              │
│  → Ej: StatCard, MonthlyTrendChart                      │
├─────────────────────────────────────────────────────────┤
│  Nivel 1: UI Primitivos (components/ui, components/charts) │
│  → Componentes atómicos base                            │
│  → Ej: Button, Card, Input, Tooltip                     │
└─────────────────────────────────────────────────────────┘
```

## Componentes en esta carpeta

| Componente | Descripción | Props principales |
|------------|-------------|-------------------|
| `StatCard` | Card para KPIs y métricas | `href`, `onCardClick`, variantes |
| `StatCardTitle` | Título con ícono para StatCard | `children`, `showArrow` |
| `StatCardValue` | Valor principal grande | `children` |
| `StatCardMeta` | Texto secundario/breakdown | `children` |
| `MonthlyTrendChart` | Gráfico de línea/área mensual | `data`, `height`, `valueFormatter` |
| `CategoryBreakdownChart` | Gráfico de torta por categoría | `data`, `height`, `showLegend` |

## ¿Qué SÍ va en esta carpeta?

- KPI cards
- Metric cards  
- Trend charts genéricos
- Summary cards
- Progress indicators visuales
- Contenedores de dashboard genéricos

## ¿Qué NO va en esta carpeta?

- Componentes con lógica de negocio
- Componentes que consultan datos (usan hooks de fetch)
- Componentes específicos de una feature (GanttChart, CourseProgress)
- Componentes que conocen el dominio (FinancialCards con CurrencyBalance)

## Ejemplo de uso

```tsx
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard/KPICard';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';

// En un widget de Nivel 3:
function MyFeatureDashboard() {
  const { data } = useMyFeatureData(); // El widget consulta datos
  
  const kpi = calculateKPI(data); // El widget hace cálculos
  
  return (
    <StatCard>
      <StatCardTitle>
        <DollarSign className="h-4 w-4" />
        Mi Métrica
      </StatCardTitle>
      <StatCardValue>{kpi.formatted}</StatCardValue>
      <StatCardMeta>{kpi.breakdown}</StatCardMeta>
    </StatCard>
  );
}
```

## Cómo agregar un nuevo componente

1. Verificar que cumple TODOS los criterios de Nivel 2
2. El componente debe recibir datos por props, no consultarlos
3. No debe tener tipos específicos del dominio
4. Colocarlo en esta carpeta
5. Exportarlo desde `index.ts`
6. Actualizar esta documentación
