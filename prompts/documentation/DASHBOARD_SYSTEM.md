# Sistema de Dashboards - Documentación Unificada

## Resumen Ejecutivo

Este documento unifica toda la arquitectura de dashboards de Seencel: componentes visuales, cálculos de KPIs, gráficos, insights automáticos y utilidades de analytics. Sirve como guía definitiva para crear o modificar cualquier dashboard de la plataforma.

---

## Arquitectura por Niveles

```
┌─────────────────────────────────────────────────────────────┐
│  Nivel 3: Páginas/Widgets (pages/*, features/*)            │
│  → Consultan datos, orquestan componentes                  │
│  → Conocen el dominio (gastos, materiales, finanzas)       │
├─────────────────────────────────────────────────────────────┤
│  Nivel 2: Dashboard Blocks (components/dashboard/)         │
│  → StatCard, DashboardCard, InsightCard, ActivityCard      │
│  → Bloques visuales reutilizables con Card                 │
├─────────────────────────────────────────────────────────────┤
│  Nivel 1: Charts (components/charts/)                      │
│  → Gráficos puros: MonthlyTrendChart, CategoryBreakdownChart│
│  → SIN contenedor, SIN título, SIN Card                    │
├─────────────────────────────────────────────────────────────┤
│  Nivel 0: UI Primitives (components/ui/)                   │
│  → Card, Button, Badge, etc.                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Dashboard Blocks (Nivel 2)

**Ubicación:** `src/components/dashboard/`

### 1.1 StatCard (KPICard)

Bloque para mostrar métricas/KPIs principales.

**Componentes:**
- `StatCard` - Contenedor base con navegación opcional
- `StatCardTitle` - Título con ícono
- `StatCardValue` - Valor principal grande
- `StatCardMeta` - Texto secundario
- `StatCardSubValue` - Valor secundario (breakdown)
- `StatCardTrend` - Indicador de tendencia (up/down/neutral)
- `StatCardHistoricalComparison` - Comparación vs promedio histórico

```tsx
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardTrend } from '@/components/dashboard';
import { DollarSign } from 'lucide-react';

<StatCard data-testid="kpi-total-gasto">
  <StatCardTitle>
    <DollarSign className="h-4 w-4" />
    Gasto Total
  </StatCardTitle>
  <StatCardValue>$ 150.000</StatCardValue>
  <StatCardTrend direction="up" value="+12% vs período anterior" />
  <StatCardMeta>24 pagos registrados</StatCardMeta>
</StatCard>
```

### 1.2 DashboardCard

Contenedor estándar para gráficos y widgets.

```tsx
import { DashboardCard } from '@/components/dashboard';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { BarChart3 } from 'lucide-react';

<DashboardCard 
  title="Evolución Mensual"
  icon={<BarChart3 />}
  data-testid="chart-monthly-trend"
>
  <MonthlyTrendChart data={chartData} height={280} />
</DashboardCard>
```

### 1.3 InsightCard

Muestra insights automáticos con acciones interactivas.

```tsx
import { InsightCard } from '@/components/dashboard';
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { Lightbulb } from 'lucide-react';

const context = buildInsightContext({ ...data });
const insights = generateInsights(context, 3);

<InsightCard
  title="Insights"
  titleIcon={<Lightbulb />}
  items={toInsightItems(insights)}
  onAction={handleInsightAction}
  data-testid="insights-section"
/>
```

### 1.4 ActivityCard

Lista de actividad reciente.

```tsx
import { ActivityCard, type ActivityItem } from '@/components/dashboard';
import { Clock } from 'lucide-react';

const activities: ActivityItem[] = [
  { id: 1, title: 'Pago Electricidad', subtitle: '12 Dic 2025', rightContent: <span>$15.000</span> }
];

<ActivityCard
  title="Actividad Reciente"
  titleIcon={<Clock />}
  items={activities}
  data-testid="recent-activity-section"
/>
```

---

## 2. Sistema de KPIs (Headless)

**Ubicación:** `src/lib/kpis.ts`

Sistema de cálculo PURO sin UI. Retorna datos estructurados para cualquier componente.

### 2.1 Tipos de KPI

| Función | Uso | Retorno |
|---------|-----|---------|
| `calculateMonetaryKPI` | Valores monetarios multimoneda | `{ value, formatted, breakdown }` |
| `calculateCountKPI` | Conteos simples | `{ value, formatted }` |
| `calculatePercentageKPI` | Ratios y porcentajes | `{ value, formatted }` |
| `calculateTextKPI` | Valores de texto | `{ value: 0, formatted }` |
| `calculateAggregateMonetaryKPI` | Suma de múltiples KPIs | `{ value, formatted, breakdown }` |

### 2.2 KPI Monetaria (El más importante)

```typescript
import { calculateMonetaryKPI } from '@/lib/kpis';

const kpi = calculateMonetaryKPI({
  items: payments.map(p => ({
    amount: p.amount,
    currency_id: p.currency_id,
    currency: p.currency,
    exchange_rate: p.exchange_rate
  })),
  baseCurrencyId: defaultCurrency?.code,
  symbol: defaultCurrency?.symbol,
  quoteCurrency: 'USD'
});

// Resultado:
// { value: 150000, formatted: "150.000", breakdown: [...] }
```

### 2.3 Helpers

```typescript
import { formatBreakdown, hasMultipleCurrencies } from '@/lib/kpis';

// Formatear breakdown como string: "USD 100 + ARS 50.000"
const breakdownText = formatBreakdown(kpi);

// Verificar si tiene múltiples monedas
if (hasMultipleCurrencies(kpi)) {
  // Mostrar breakdown
}
```

---

## 3. Charts (Nivel 1)

**Ubicación:** `src/components/charts/`

Charts PUROS sin contenedor. El consumidor agrega el Card.

### 3.1 Charts Principales

| Componente | Tipo | Props principales |
|------------|------|-------------------|
| `MonthlyTrendChart` | Area Chart | `data: { month, value }[]`, `height` |
| `MultiSeriesTrendChart` | Composed Chart | `data: MultiSeriesData[]`, `series: SeriesConfig[]`, `height` |
| `CategoryBreakdownChart` | Donut Chart | `data: { name, value }[]`, `height` |
| `IncomeExpenseChart` | Bar Chart | `data: { period, income, expense }[]`, `height` |

### 3.2 Uso Correcto

```tsx
// ✅ CORRECTO: DashboardCard envuelve el chart
<DashboardCard title="Tendencia">
  <MonthlyTrendChart data={data} height={280} />
</DashboardCard>

// ❌ INCORRECTO: Chart con Card interno
function BadChart() {
  return (
    <Card>  {/* NO hacer esto */}
      <MonthlyTrendChart data={data} />
    </Card>
  );
}
```

### 3.3 Organización de Charts

```
src/components/charts/
├── MonthlyTrendChart.tsx      # Chart de tendencia (simple o multi-series)
├── CategoryBreakdownChart.tsx # Chart de distribución
├── IncomeExpenseChart.tsx     # Chart de ingresos vs egresos
├── gantt/                     # Charts para Gantt/proyectos
├── courses/                   # Charts para cursos
├── legacy/                    # Charts antiguos (migrar gradualmente)
└── README.md
```

### 3.4 IncomeExpenseChart - Uso

```tsx
import { IncomeExpenseChart } from '@/components/charts/IncomeExpenseChart';

const data = [
  { period: '2025-01', income: 100000, expense: 80000 },
  { period: '2025-02', income: 120000, expense: 90000 },
];

<DashboardCard title="Ingresos vs Egresos">
  <IncomeExpenseChart 
    data={data} 
    height={280}
    clickable
    onBarClick={(period) => handleDrillDown(period)}
  />
</DashboardCard>
```

**Features:**
- Barras agrupadas para ingresos (positivo) y egresos (negativo)
- Tooltip con balance calculado automáticamente
- Colores semánticos: `chart-positive` y `chart-negative`
- Soporte para drill-down al hacer click

---

## 4. Sistema de Insights Automáticos

**Ubicación:** `src/components/dashboard/insights/`

Motor de generación de insights basado en reglas.

### 4.1 Arquitectura

```
types.ts          → Tipos: Insight, InsightAction, InsightContext
insightRules.ts   → Reglas de negocio (5 implementadas)
InsightEngine.ts  → Motor: generateInsights, buildInsightContext
InsightItem.tsx   → Transformador: toInsightItems()
index.ts          → Exportaciones públicas
```

### 4.2 Tipos

```typescript
type InsightActionType = 'navigate' | 'filter' | 'open';

interface InsightAction {
  id: string;
  label: string;
  type: InsightActionType;
  payload: Record<string, unknown>;
}

interface Insight {
  id: string;
  type: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  icon: string;           // Nombre de ícono Lucide
  priority: number;       // Menor = más importante
  context?: string;       // Por qué pasó
  actionHint?: string;    // Qué hacer
  actions?: InsightAction[];  // Acciones interactivas
}
```

### 4.3 Reglas Implementadas

| Regla | Condición | Acción |
|-------|-----------|--------|
| `growthExplained` | Cambio >15% vs período anterior | navigate → concepts con filtro categoría |
| `concentration` | 1-3 categorías = 80%+ del gasto | filter → destacar categoría en gráfico |
| `operationalLoad` | ≥15 pagos/mes o ≥3.5/semana | navigate → payments |
| `repeatedPattern` | Patrón 3+ meses consecutivos | open → monthlyChart |
| `consolidation` | Concepto con muchos pagos pequeños | navigate → concepts con filtro concepto |
| `sustainedTrend` | Tendencia >10% mensual sostenida | open → monthlyChart |
| `yearEndProjection` | Proyección >10% vs baseline anual | open → monthlyChart |
| `spendAcceleration` | Aceleración >10% entre mitades del período | open → monthlyChart |

#### 4.3.1 Reglas Financieras (FINANZAS)

| Regla | Condición | Acción |
|-------|-----------|--------|
| `sustainedNegativeBalance` | Balance negativo 2 meses (warning), 3+ meses (alert) | open → incomeExpenseChart |
| `projectDependency` | Un proyecto concentra >70% ingresos o >70% egresos | open → categoryBreakdown |
| `incomeExpenseRatio` | Egresos >80% o >100% de ingresos | filter → expense categories |

**Uso con `generateFinancialInsights`:**
```typescript
import { generateFinancialInsights, buildInsightContext } from '@/components/dashboard/insights';

const context = buildInsightContext({
  // Campos base
  totalGasto: kpis.totalEgresos.value,
  ...
  // Campos financieros adicionales
  totalIngresos: kpis.totalIngresos.value,
  totalEgresos: kpis.totalEgresos.value,
  balance: kpis.balance,
  monthlyFinancialData: [
    { month: '2025-01', income: 100000, expense: 80000, balance: 20000 },
    ...
  ],
  projectFinancialData: [
    { projectId: 'abc', projectName: 'Obra X', income: 90000, expense: 40000, balance: 50000 },
    ...
  ]
});

const insights = generateFinancialInsights(context, 3);
```

### 4.4 Uso Completo

```typescript
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { type InsightAction } from '@/components/dashboard/insights/types';

// 1. Construir contexto
const context = buildInsightContext({
  totalGasto: kpis.totalGasto.value,
  previousPeriodGasto: kpis.previousPeriodGasto,
  categoryData: allCategoryData,
  previousCategoryData,
  monthlyData: monthlyChartData,
  paymentsCount: confirmedPayments.length,
  monthCount: kpis.monthCount,
  paymentsByConcept,
  isShortPeriod: periodMeta.isShortPeriod,
  daysCount: periodMeta.daysCount
});

// 2. Generar insights (máximo 3)
const insights = generateInsights(context, 3);

// 3. Handler de acciones
const handleInsightAction = useCallback((action: InsightAction) => {
  switch (action.type) {
    case 'navigate':
      if (action.payload.tab === 'concepts') setActiveTab('conceptos');
      else if (action.payload.tab === 'payments') setActiveTab('pagos');
      break;
    case 'filter':
      onFilterCategory?.(action.payload.category as string);
      break;
    case 'open':
      document.querySelector(`[data-testid="chart-monthly-trend"]`)
        ?.scrollIntoView({ behavior: 'smooth' });
      break;
  }
}, []);

// 4. Renderizar
<InsightCard
  items={toInsightItems(insights)}
  onAction={handleInsightAction}
/>
```

### 4.5 Agregar Nueva Regla

```typescript
// En insightRules.ts
export const myNewInsight: InsightRule = (context) => {
  if (!condicion) return null;
  
  return {
    id: 'my-insight-id',
    type: 'info',
    title: 'Título del insight',
    description: 'Descripción clara',
    icon: 'IconName',  // Lucide icon
    priority: 5,
    context: 'Por qué sucedió',
    actionHint: 'Qué hacer',
    actions: [
      {
        id: 'action-id',
        label: 'Etiqueta del botón',
        type: 'navigate',
        payload: { tab: 'target' }
      }
    ]
  };
};

// Agregar al array
export const allInsightRules: InsightRule[] = [
  // ...existentes
  myNewInsight
];
```

---

## 5. Analytics Utilities

**Ubicación:** `src/lib/analytics/`

### 5.1 Comparación Histórica

Compara valor actual vs promedio histórico.

```typescript
import { calculateHistoricalComparison } from '@/lib/analytics';

const comparison = calculateHistoricalComparison(
  currentMonthValue,
  historicalValues,  // Array ordenado cronológicamente
  { windowSize: 6, minDataPoints: 2, stableThresholdPercent: 5 }
);

// Resultado:
// { deltaPercent: 17.6, direction: 'up', comparisonType: 'above_average', historicalAverage: 12750 }
```

**Visualización:**
```tsx
<StatCardHistoricalComparison comparison={comparison} label="vs promedio mensual" />
```

### 5.2 Metadatos de Período

Sistema para ajustar semántica de KPIs según duración del período.

```typescript
import { getPeriodMeta, getKPILabels } from '@/lib/analytics';

const periodMeta = getPeriodMeta(dateFrom, new Date());
// { monthsCount, daysCount, isShortPeriod, periodType }

const labels = getKPILabels(periodMeta);
// { totalTitle, averageTitle, totalHelper, averageHelper }
```

**Semántica dinámica:**

| Período | Total KPI | Promedio KPI |
|---------|-----------|--------------|
| < 2 meses | "Gasto del período" | "Promedio diario" |
| >= 2 meses | "Gasto Total" | "Promedio Mensual" |

### 5.3 Sistema de Proyecciones

**Ubicación:** `src/lib/analytics/projections.ts`

Sistema de proyección de gasto basado en tendencias históricas. **No usa IA**, solo análisis estadístico simple.

#### Funciones Disponibles

| Función | Propósito | Retorno |
|---------|-----------|---------|
| `detectTrendDirection` | Detecta dirección de tendencia | `TrendAnalysis` |
| `projectMonthlySpend` | Proyecta gasto a X meses | `SpendProjection` |
| `projectYearEndSpend` | Proyecta cierre anual | `YearEndProjection` |
| `calculateLinearRegression` | Regresión lineal simple | `{ slope, intercept, rSquared }` |
| `formatProjectionInsight` | Formatea texto de insight | `string` |

#### Uso

```typescript
import { detectTrendDirection, projectYearEndSpend, formatProjectionInsight } from '@/lib/analytics';

// 1. Detectar tendencia
const trend = detectTrendDirection(monthlyValues, { minDataPoints: 3 });
// { direction: 'increasing', monthlyChangePercent: 12.5, confidence: 'high' }

// 2. Proyectar cierre anual
const projection = projectYearEndSpend(monthlyValues, currentMonth);
// { projectedAnnualSpend, changePercent, direction, monthsRemaining, confidence }

// 3. Formatear para insight
const text = formatProjectionInsight(projection, 'yearEnd');
// "Si el gasto continúa a este ritmo, el cierre anual sería mayor en un 18%."
```

#### Niveles de Confianza

| Confianza | Criterio |
|-----------|----------|
| `high` | ≥6 meses de datos, ≥70% consistencia en dirección |
| `medium` | ≥4 meses de datos, ≥50% consistencia |
| `low` | <4 meses o baja consistencia |

#### Insights de Proyección Implementados

| Regla | Condición | Descripción |
|-------|-----------|-------------|
| `sustainedTrendInsight` | Tendencia >10% mensual | "El gasto aumenta/disminuye ~X% mensual" |
| `yearEndProjectionInsight` | Proyección >10% vs baseline | "Si continúa a este ritmo, el cierre anual sería +X%" |
| `spendAccelerationInsight` | Aceleración >10% entre mitades | "El gasto está acelerando/desacelerando" |

#### Limitaciones y Supuestos

1. **Modelo lineal simple**: Las proyecciones asumen continuidad de tendencia. No detecta estacionalidad.
2. **Mínimo 3 meses**: Requiere al menos 3 puntos de datos para proyecciones.
3. **No considera factores externos**: Inflación, cambios de precios, eventos excepcionales.
4. **Confianza variable**: Insights de baja confianza no se muestran al usuario.

---

## 6. Layout del Dashboard

**Ubicación:** `src/layouts/dashboard/DashboardLayout.tsx`

### 6.1 Estructura de Página

```tsx
import { Layout } from "@/layouts/dashboard/DashboardLayout";

const headerProps = {
  title: "Gastos Generales",
  description: "Administra gastos operativos",
  icon: CreditCard,
  organizationId,
  showMembers: true,
  tabs: headerTabs,
  onTabChange: setActiveTab,
  actionButton: { label: "Nuevo", icon: Plus, onClick: handleCreate },
  actions: [/* componentes React adicionales */]
};

return (
  <Layout headerProps={headerProps} wide={false}>
    {activeTab === "dashboard" && <DashboardTab />}
    {activeTab === "conceptos" && <ConceptosTab />}
  </Layout>
);
```

---

## 7. Patrón Completo para Nuevo Dashboard

### 7.1 Estructura de Archivos

```
src/pages/mi-modulo/
├── MiModulo.tsx                    # Página principal con tabs
├── MiModuloDashboardTab.tsx        # Tab de dashboard
├── MiModuloConceptosTab.tsx        # Tab de listado
└── MiModuloSettingsTab.tsx         # Tab de configuración
```

### 7.2 Template de Dashboard Tab

```tsx
import { useMemo, useCallback } from 'react';
import { 
  StatCard, StatCardTitle, StatCardValue, StatCardMeta, StatCardTrend,
  StatCardHistoricalComparison, DashboardCard, InsightCard, ActivityCard 
} from '@/components/dashboard';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';
import { CategoryBreakdownChart } from '@/components/charts/CategoryBreakdownChart';
import { calculateMonetaryKPI, calculateCountKPI } from '@/lib/kpis';
import { calculateHistoricalComparison, getPeriodMeta, getKPILabels } from '@/lib/analytics';
import { generateInsights, buildInsightContext, toInsightItems } from '@/components/dashboard/insights';
import { type InsightAction } from '@/components/dashboard/insights/types';

export default function MiModuloDashboardTab({ selectedPeriod }) {
  // 1. Hooks de datos
  const { data: items = [] } = useMyData();
  const { data: defaultCurrency } = useOrganizationDefaultCurrency();

  // 2. Calcular período
  const periodMeta = useMemo(() => getPeriodMeta(dateFrom, new Date()), [dateFrom]);
  const kpiLabels = useMemo(() => getKPILabels(periodMeta), [periodMeta]);

  // 3. Calcular KPIs
  const kpis = useMemo(() => {
    const total = calculateMonetaryKPI({
      items: items.map(i => ({ amount: i.amount, currency_id: i.currency_id, currency: i.currency, exchange_rate: i.exchange_rate })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol
    });
    
    const count = calculateCountKPI({ count: items.length, label: 'items' });
    
    return { total, count };
  }, [items, defaultCurrency]);

  // 4. Datos para gráficos
  const monthlyChartData = useMemo(() => /* transformar datos */, [items]);
  const categoryChartData = useMemo(() => /* transformar datos */, [items]);

  // 5. Comparación histórica
  const historicalComparison = useMemo(() => {
    if (monthlyChartData.length < 2) return null;
    const values = monthlyChartData.map(m => m.value);
    return calculateHistoricalComparison(values[values.length - 1], values.slice(0, -1));
  }, [monthlyChartData]);

  // 6. Insights automáticos
  const insights = useMemo(() => {
    const context = buildInsightContext({
      totalGasto: kpis.total.value,
      previousPeriodGasto: 0, // Calcular
      categoryData: categoryChartData,
      monthlyData: monthlyChartData,
      paymentsCount: items.length,
      monthCount: periodMeta.monthsCount,
      isShortPeriod: periodMeta.isShortPeriod,
      daysCount: periodMeta.daysCount
    });
    return generateInsights(context, 3);
  }, [kpis, categoryChartData, monthlyChartData, items, periodMeta]);

  // 7. Handler de acciones de insights
  const handleInsightAction = useCallback((action: InsightAction) => {
    switch (action.type) {
      case 'navigate': /* navegar */ break;
      case 'filter': /* filtrar */ break;
      case 'open': /* scroll */ break;
    }
  }, []);

  // 8. Render
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="kpi-total">
          <StatCardTitle><DollarSign className="h-4 w-4" />{kpiLabels.totalTitle}</StatCardTitle>
          <StatCardValue>{defaultCurrency?.symbol} {kpis.total.formatted}</StatCardValue>
          <StatCardHistoricalComparison comparison={historicalComparison} />
        </StatCard>
        {/* Más KPIs... */}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Evolución" icon={<BarChart3 />} data-testid="chart-monthly-trend">
          <MonthlyTrendChart data={monthlyChartData} height={280} />
        </DashboardCard>
        <DashboardCard title="Distribución" icon={<PieChart />} data-testid="chart-category">
          <CategoryBreakdownChart data={categoryChartData} height={280} />
        </DashboardCard>
      </div>

      {/* Insights + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightCard
          title="Insights"
          titleIcon={<Lightbulb />}
          items={toInsightItems(insights)}
          onAction={handleInsightAction}
          data-testid="insights-section"
        />
        <ActivityCard
          title="Actividad Reciente"
          titleIcon={<Clock />}
          items={recentActivity}
          data-testid="activity-section"
        />
      </div>
    </div>
  );
}
```

---

## 8. Especificaciones de Diseño

### 8.1 Headers de Cards

Todos los headers usan las mismas especificaciones:
- **Íconos**: `16px` (h-4 w-4) en `text-muted-foreground`
- **Título**: `text-sm font-medium text-foreground`
- **Descripción**: `text-xs text-muted-foreground`
- **Espaciado**: `pb-3`

### 8.2 Grid Layout

```tsx
// KPIs: 4 columnas en desktop, 2 en mobile
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

// Gráficos: 2 columnas en desktop, 1 en mobile
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

### 8.3 data-testid Pattern

```tsx
// KPIs
data-testid="kpi-total-gasto"
data-testid="kpi-average-monthly"

// Charts
data-testid="chart-monthly-trend"
data-testid="chart-category-breakdown"

// Secciones
data-testid="insights-section"
data-testid="activity-section"
```

---

## 9. Qué Mejorar / Pendientes

### 9.1 Charts Legacy

Los charts en `src/components/charts/legacy/` deben migrarse gradualmente al patrón Nivel 1 (sin Card interno).

### 9.2 Insights por Módulo

Actualmente solo hay reglas para Gastos Generales. Se pueden crear reglas específicas para:
- Finanzas (cobros, mora, flujo de caja)
- Materiales (stock, costos unitarios)
- Personal (pagos, asistencia)

### 9.3 Testing

Agregar tests de integración para:
- Funciones de cálculo de KPIs
- Reglas de insights
- Handler de acciones de insights

---

## 10. Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `src/components/dashboard/README.md` | Documentación de Dashboard Blocks |
| `src/components/dashboard/internal/README.md` | Componentes internos |
| `src/components/dashboard/insights/README.md` | Sistema de insights |
| `src/components/charts/README.md` | Charts Nivel 1 |
| `src/lib/analytics/README.md` | Utilidades de analytics |
| `src/lib/kpis.ts` | Sistema headless de KPIs |
| `prompts/documentation/layout/DashboardLayout.md` | Layout principal |

---

## Última Actualización

**Fecha:** 15 Diciembre 2025  
**Versión:** 1.1  
**Cambios recientes:**
- Sistema de Proyecciones de Gasto implementado (sin IA)
- 3 nuevas reglas de insight: sustainedTrend, yearEndProjection, spendAcceleration
- Funciones: detectTrendDirection, projectMonthlySpend, projectYearEndSpend
- InsightContext extendido con currentMonth
- Sistema de Insights Accionables implementado
- Soporte para períodos cortos en insights
- Comparación histórica en StatCard
- Documentación unificada
