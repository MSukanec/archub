# Dashboard Building Blocks (Nivel 2)

## ¿Qué es el nivel Dashboard?

Los Dashboard Blocks son **componentes reutilizables de dashboard** que:
- **SÍ usan Card** y otros contenedores de UI
- **SÍ combinan UI + layout + estructura**
- **SÍ definen layout interno y jerarquía visual**
- **NO conocen el dominio** (no "gastos", no "materiales")
- **NO consultan datos** (reciben todo por props)
- **NO hacen cálculos de negocio**

## Componentes disponibles

| Componente | Propósito | Usa Card |
|------------|-----------|----------|
| `StatCard` (KPICard) | Métricas principales con valor grande | ✅ |
| `DashboardCard` | Contenedor estándar para gráficos/widgets | ✅ |
| `InsightCard` | Insights automáticos, alertas, mensajes | ✅ |
| `ActivityCard` | Actividad reciente (lista simple) | ✅ |
| `EmptyDashboardState` | Estado vacío cuando no hay datos | ❌ |
| `DashboardCardHeader` | Header compartido para unificar estilos | - |

---

## DashboardCardHeader (Header Unificado)

Componente interno que unifica el estilo visual de todos los headers de cards.

**Especificaciones de diseño:**
- Íconos: `16px` (h-4 w-4) en `text-muted-foreground`
- Título: `text-sm font-medium text-foreground`
- Descripción: `text-xs text-muted-foreground`
- Espaciado: `pb-3`

Este componente es usado internamente por `DashboardCard`, `InsightCard` y `ActivityCard` para garantizar consistencia visual.

```tsx
import { DashboardCardHeader } from '@/components/dashboard';
import { BarChart3 } from 'lucide-react';

<DashboardCardHeader
  icon={<BarChart3 />}
  title="Evolución Mensual"
  description="Últimos 12 meses"
/>
```

---

## StatCard (KPICard)

Bloque para mostrar métricas/KPIs con:
- Título con ícono
- Valor principal grande
- Meta/breakdown secundario
- Navegación opcional (href, onClick)

```tsx
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
import { DollarSign } from 'lucide-react';

<StatCard href="/finanzas">
  <StatCardTitle>
    <DollarSign className="h-4 w-4" />
    Gasto Total
  </StatCardTitle>
  <StatCardValue>$ 150.000</StatCardValue>
  <StatCardMeta>+12% vs mes anterior</StatCardMeta>
</StatCard>
```

---

## DashboardCard

Contenedor estándar para bloques del dashboard (gráficos, tablas, widgets).

**Props:**
- `title?: string` - Título del card
- `description?: string` - Descripción opcional
- `icon?: ReactNode` - Ícono junto al título
- `actions?: ReactNode` - Botones/acciones en el header
- `children: ReactNode` - Contenido principal

```tsx
import { DashboardCard } from '@/components/dashboard';
import { MonthlyTrendChart } from '@/components/charts/MonthlyTrendChart';

<DashboardCard title="Evolución Mensual">
  <MonthlyTrendChart data={chartData} height={280} />
</DashboardCard>
```

**Diferencia con Card UI directo:**
- `DashboardCard` estandariza el layout (header + content)
- Provee estructura consistente para todo el dashboard
- La página no decide estilos, solo orquesta

---

## InsightCard

Muestra insights automáticos, alertas o mensajes interpretativos.

**Props:**
- `title?: string` - Título de la sección
- `titleIcon?: ReactNode` - Ícono del título
- `items: InsightItem[]` - Lista de insights
- `className?: string`

**InsightItem:**
```ts
interface InsightItem {
  icon?: ReactNode;
  title: string;
  description?: string;
  variant?: 'info' | 'warning' | 'success' | 'danger';
}
```

```tsx
import { InsightCard, type InsightItem } from '@/components/dashboard';
import { Lightbulb } from 'lucide-react';

const insights: InsightItem[] = [
  { title: 'Categoría X representa 60% del gasto', variant: 'info' },
  { title: 'Gasto aumentó 25% este mes', variant: 'danger' },
];

<InsightCard
  title="Insights"
  titleIcon={<Lightbulb className="h-4 w-4" />}
  items={insights}
/>
```

---

## ActivityCard

Muestra actividad reciente (pagos, eventos, cambios).

**Props:**
- `title?: string` - Título de la sección
- `titleIcon?: ReactNode` - Ícono del título
- `items: ActivityItem[]` - Lista de actividades
- `emptyText?: string` - Mensaje cuando no hay items

**ActivityItem:**
```ts
interface ActivityItem {
  id: string | number;
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  badge?: ReactNode;
}
```

```tsx
import { ActivityCard, type ActivityItem } from '@/components/dashboard';
import { Clock } from 'lucide-react';

const activities: ActivityItem[] = [
  { 
    id: 1, 
    title: 'Pago Electricidad', 
    subtitle: '12 Dic 2025',
    rightContent: <span>$15.000</span>
  },
];

<ActivityCard
  title="Actividad Reciente"
  titleIcon={<Clock className="h-4 w-4" />}
  items={activities}
/>
```

---

## EmptyDashboardState

Empty state cuando no hay datos suficientes para mostrar el dashboard.

**Props:**
- `icon?: ReactNode` - Ícono decorativo
- `title: string` - Mensaje principal
- `description?: string` - Descripción secundaria
- `action?: ReactNode` - Botón de acción

```tsx
import { EmptyDashboardState } from '@/components/dashboard';
import { CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

<EmptyDashboardState
  icon={<CreditCard className="w-12 h-12" />}
  title="No hay gastos registrados"
  description="Comienza creando tu primer concepto."
  action={
    <Button onClick={handleCreate}>
      <Plus className="w-4 h-4 mr-2" />
      Crear Concepto
    </Button>
  }
/>
```

---

## Diferencia entre componentes

```
┌─────────────────────────────────────────────────────────────┐
│  StatCard (KPICard)                                         │
│  → Métrica con valor grande + meta                          │
│  → Para KPIs principales del dashboard                      │
├─────────────────────────────────────────────────────────────┤
│  DashboardCard                                              │
│  → Contenedor genérico con header                           │
│  → Para envolver charts, tablas, widgets                    │
├─────────────────────────────────────────────────────────────┤
│  InsightCard                                                │
│  → Lista de mensajes interpretativos                        │
│  → Con variantes de color (info/warning/success/danger)     │
├─────────────────────────────────────────────────────────────┤
│  ActivityCard                                               │
│  → Lista de actividad reciente                              │
│  → Para pagos, eventos, cambios recientes                   │
├─────────────────────────────────────────────────────────────┤
│  EmptyDashboardState                                        │
│  → Estado vacío del dashboard                               │
│  → Con CTA para crear primer item                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Charts puros vs Dashboard Blocks

| Característica | Charts (Nivel 1) | Dashboard Blocks (Nivel 2) |
|----------------|------------------|----------------------------|
| Usa Card | ❌ No | ✅ Sí |
| Tiene header/título | ❌ No | ✅ Sí |
| Define layout externo | ❌ No | ✅ Sí |
| Ejemplo | `MonthlyTrendChart` | `DashboardCard` con chart |

**Uso correcto:**
```tsx
// El DashboardCard envuelve el chart puro
<DashboardCard title="Tendencia Mensual">
  <MonthlyTrendChart data={data} />
</DashboardCard>
```

---

## Qué NO debe colocarse en esta carpeta

❌ **Widgets semánticos** (Nivel 3) que consultan datos:
```tsx
// ❌ INCORRECTO - conoce el dominio
<GastosTotalesCard organizationId={id} />
```

❌ **Charts puros** (Nivel 1) sin contenedor:
```tsx
// ❌ INCORRECTO - va en components/charts/
<MonthlyTrendChart data={data} />
```

❌ **UI Primitives** (Nivel 0):
```tsx
// ❌ INCORRECTO - va en components/ui/
<Button>Click</Button>
```

---

## Relación con otros niveles

```
┌─────────────────────────────────────────────────────────────┐
│  Nivel 3: Widgets Semánticos (pages/*, features/*)         │
│  → Consultan datos, hacen cálculos                         │
│  → Conocen el dominio (gastos, materiales, etc.)           │
├─────────────────────────────────────────────────────────────┤
│  Nivel 2: Dashboard Blocks (components/dashboard/)         │  ← ESTA CARPETA
│  → Bloques visuales reutilizables                          │
│  → StatCard, DashboardCard, InsightCard, ActivityCard      │
├─────────────────────────────────────────────────────────────┤
│  Nivel 1: Charts (components/charts/)                      │
│  → Gráficos puros sin contenedor                           │
├─────────────────────────────────────────────────────────────┤
│  Nivel 0: UI Primitives (components/ui/)                   │
│  → Card, Button, Badge, etc.                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Principios de diseño

1. **Un componente = una responsabilidad clara**
2. **Los tamaños de texto los define el componente**, no la página
3. **La página solo orquesta**, no diseña
4. **Recibe datos por props**, no consulta
5. **Agnóstico al dominio**: "valor" en vez de "gasto total"
