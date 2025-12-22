# Arquitectura de Páginas Agnósticas al Layout

## Objetivo

Separar las páginas en capas claras para que el **contenido sea completamente agnóstico del layout**, permitiendo que el mismo contenido se renderice en diferentes layouts (DashboardLayout, ExperimentalLayout, etc.) sin modificar el código del contenido.

---

## Contexto

### Problema actual
Hoy muchas páginas mezclan:
- Layout (importan y usan `<Layout>` directamente)
- Navegación (tabs en header)
- Tabs internos
- Contenido (tablas, KPIs, formularios)

Esto hace imposible:
- Cambiar layouts dinámicamente (preferencia de usuario)
- Reutilizar el mismo contenido en diferentes contextos
- Testear contenido sin montar layouts completos

### Solución aplicada en Modales
Ya refactorizamos los modales exitosamente:
- **Modal** = contenedor (maneja apertura/cierre, tamaño)
- **Form** = agnóstico y reutilizable (puede vivir en modal, drawer, página)

Ahora aplicamos **el mismo patrón a las páginas**.

---

## Arquitectura de 4 Capas

```
┌─────────────────────────────────────────────────────────────┐
│                         PAGE                                │
│   (Orquestador: elige layout, pasa props, renderiza View)  │
├─────────────────────────────────────────────────────────────┤
│                        LAYOUT                               │
│        (Header, Sidebar, Content Slot - YA EXISTE)         │
├─────────────────────────────────────────────────────────────┤
│                         VIEW                                │
│     (Maneja tabs, navegación interna, orquesta panels)     │
├─────────────────────────────────────────────────────────────┤
│                        PANELS                               │
│   (Contenido real: tablas, KPIs, gráficos, formularios)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. PAGE (Orquestador)

### Responsabilidad
- Elegir qué layout usar (puede ser dinámico por preferencia de usuario)
- Pasar props al layout (headerProps, sidebar level, etc.)
- Renderizar la View dentro del layout

### Reglas
- **NO** contiene lógica de negocio
- **NO** contiene tablas, formularios, KPIs
- **NO** hace fetch de datos
- **SOLO** composición de Layout + View

### Ubicación
```
src/pages/<feature>/
  <Feature>Page.tsx
```

### Ejemplo
```typescript
// src/pages/project-finances/ProjectFinancesPage.tsx
import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { ProjectFinancesView } from '@/features/finances/views/ProjectFinancesView';
import { DollarSign } from 'lucide-react';
import { useLayoutPreference } from '@/hooks/use-layout-preference';

export default function ProjectFinancesPage() {
  const { preferredLayout } = useLayoutPreference();
  
  // Layout puede ser dinámico según preferencia del usuario
  const LayoutComponent = preferredLayout === 'experimental' 
    ? ExperimentalLayout 
    : Layout;

  const headerProps = {
    icon: DollarSign,
    title: "Finanzas del Proyecto",
    description: "Movimientos financieros de este proyecto",
  };

  return (
    <LayoutComponent wide={false} headerProps={headerProps}>
      <ProjectFinancesView />
    </LayoutComponent>
  );
}
```

---

## 2. VIEW (Vista Lógica)

### Responsabilidad
- Manejar tabs internos
- Manejar navegación entre panels
- Hacer fetch de datos
- Orquestar qué panels se muestran
- Manejar estados compartidos (filtros, período, etc.)

### Reglas
- **NO** importa layouts
- **NO** sabe si está en dashboard o experimental
- **PUEDE** vivir en cualquier contenedor
- **RECIBE** callbacks opcionales del Page si necesita comunicarse con el layout

### Ubicación
```
features/<feature>/views/
  <Feature>View.tsx
```

### Ejemplo
```typescript
// features/finances/views/ProjectFinancesView.tsx
import { useState, useMemo } from 'react';
import { DashboardPanel } from '../panels/DashboardPanel';
import { MovementsPanel } from '../panels/MovementsPanel';
import { useUnifiedMovements } from '../hooks/use-unified-movements';
import { useProjectContext } from '@/stores/projectContext';

interface ProjectFinancesViewProps {
  // Props opcionales para comunicación con el layout
  onTabChange?: (tab: string) => void;
}

export function ProjectFinancesView({ onTabChange }: ProjectFinancesViewProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  
  // Fetch centralizado en la View
  const { data: movements = [], isLoading } = useUnifiedMovements(
    currentOrganizationId, 
    selectedProjectId
  );

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab); // Notificar al Page si lo necesita
  };

  // Tabs como data, no como UI
  const tabs = [
    { id: 'dashboard', label: 'Visión General' },
    { id: 'movements', label: 'Movimientos' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab selector - UI simple, la View decide qué mostrar */}
      <Tabs tabs={tabs} value={activeTab} onValueChange={handleTabChange} />
      
      {/* Renderizado condicional de Panels */}
      {activeTab === 'dashboard' && (
        <DashboardPanel
          movements={movements}
          isLoading={isLoading}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      )}
      
      {activeTab === 'movements' && (
        <MovementsPanel
          movements={movements}
          isLoading={isLoading}
          projectId={selectedProjectId}
        />
      )}
    </div>
  );
}
```

---

## 3. PANELS (Contenido Real)

### Responsabilidad
- Mostrar datos (tablas, listas)
- Mostrar KPIs y métricas
- Mostrar gráficos
- Renderizar formularios
- Ejecutar acciones (abrir modales, etc.)

### Reglas
- **100% reutilizables**
- **NO** conocen tabs
- **NO** conocen layout
- **NO** hacen fetch de datos (reciben por props)
- **SOLO** reciben props y renderizan

### Ubicación
```
features/<feature>/panels/
  <Panel>Panel.tsx
```

### Ejemplo
```typescript
// features/finances/panels/DashboardPanel.tsx
import { useMemo } from 'react';
import { StatCard, DashboardCard, InsightCard } from '@/components/dashboard';
import { MultiSeriesTrendChart } from '@/components/charts/MonthlyTrendChart';
import { formatCurrency } from '@/lib/money';

interface DashboardPanelProps {
  movements: Movement[];
  isLoading: boolean;
  selectedPeriod: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
}

export function DashboardPanel({
  movements,
  isLoading,
  selectedPeriod,
  onPeriodChange,
}: DashboardPanelProps) {
  // Cálculos locales basados en props recibidas
  const kpis = useMemo(() => calculateKPIs(movements, selectedPeriod), [movements, selectedPeriod]);
  const chartData = useMemo(() => prepareChartData(movements), [movements]);

  if (isLoading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard>
          <StatCardTitle>Ingresos</StatCardTitle>
          <StatCardValue>{formatCurrency(kpis.ingresos)}</StatCardValue>
        </StatCard>
        {/* ... más KPIs */}
      </div>

      {/* Gráficos */}
      <DashboardCard title="Tendencia Mensual">
        <MultiSeriesTrendChart data={chartData} />
      </DashboardCard>

      {/* Insights */}
      <InsightCard items={kpis.insights} />
    </div>
  );
}
```

---

## 4. LAYOUT (Ya Existe - NO Tocar)

Los layouts ya existen y funcionan bien:
- `DashboardLayout` - Layout principal con sidebar
- `ExperimentalLayout` - Layout alternativo (si existe)

### Responsabilidad
- Header
- Sidebar
- Subheader
- Content Slot

**NO modificar layouts existentes.**

---

## Estructura de Carpetas Final

```
src/
  pages/
    project-finances/
      ProjectFinancesPage.tsx          ← Page (orquestador)
    organization-finances/
      OrganizationFinancesPage.tsx     ← Page (orquestador)
    sitelog/
      SitelogPage.tsx                  ← Page (orquestador)

  features/
    finances/
      views/
        ProjectFinancesView.tsx        ← View (agnóstica al layout)
        OrganizationFinancesView.tsx   ← View (agnóstica al layout)
      panels/
        DashboardPanel.tsx             ← Panel (contenido puro)
        MovementsPanel.tsx             ← Panel (contenido puro)
        KPIsPanel.tsx                  ← Panel (contenido puro)
      hooks/
        use-unified-movements.ts
        use-financial-kpis.ts
      services/
        getMovements.ts
      types/
        index.ts
      index.ts                         ← Barrel export

    sitelog/
      views/
        SitelogView.tsx
      panels/
        TimelinePanel.tsx
        ChartsPanel.tsx
      hooks/
      services/
```

---

## Flujo de Datos

```
Page
  ↓ (elige layout, pasa headerProps)
Layout
  ↓ (renderiza estructura)
View
  ↓ (hace fetch, maneja tabs, pasa datos)
Panels
  ↓ (reciben props, renderizan UI)
```

### Regla de Oro: Top-Down Data Flow
- **View** hace el fetch de datos
- **View** pasa datos a **Panels** via props
- **Panels** NO hacen fetch, solo renderizan

Esto asegura:
1. Un solo punto de fetch
2. Panels verdaderamente reutilizables
3. Fácil de testear (mock de props)

---

## Proceso de Migración (NO ejecutar todavía)

### Paso 1: Identificar contenido
Analizar la página actual y separar:
- ¿Qué es configuración de layout? → Va al Page
- ¿Qué es lógica de tabs/navegación? → Va a la View
- ¿Qué es contenido visual? → Va a los Panels

### Paso 2: Crear Panels
Extraer cada bloque de contenido a su propio Panel:
```typescript
// Antes (en la página)
{activeTab === 'dashboard' && (
  <div className="space-y-6">
    <div className="grid grid-cols-4 gap-4">
      <StatCard>...</StatCard>
      {/* 100 líneas más */}
    </div>
  </div>
)}

// Después (Panel separado)
<DashboardPanel movements={movements} period={period} />
```

### Paso 3: Crear View
Crear la View que orquesta los Panels:
```typescript
export function ProjectFinancesView() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data: movements } = useUnifiedMovements(...);
  
  return (
    <div>
      <Tabs ... />
      {activeTab === 'dashboard' && <DashboardPanel ... />}
      {activeTab === 'movements' && <MovementsPanel ... />}
    </div>
  );
}
```

### Paso 4: Crear Page
Crear el Page que monta View + Layout:
```typescript
export default function ProjectFinancesPage() {
  return (
    <Layout headerProps={...}>
      <ProjectFinancesView />
    </Layout>
  );
}
```

### Paso 5: Verificar
- Navegación funciona igual
- Tabs funcionan igual
- Datos se muestran correctamente
- No hay regresiones

### Paso 6: Limpiar
- Eliminar código viejo
- Actualizar imports
- Actualizar rutas si es necesario

---

## Comparación: Antes vs Después

### Antes (Monolítico)
```typescript
// Una sola página que hace TODO
export default function ProjectFinances() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { data } = useUnifiedMovements(...);
  
  const headerProps = { ... };
  
  return (
    <Layout headerProps={headerProps}>
      <Tabs ... />
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* 500 líneas de KPIs, gráficos, etc */}
        </div>
      )}
      {activeTab === 'movements' && (
        <div>
          {/* 300 líneas de tabla */}
        </div>
      )}
    </Layout>
  );
}
```

### Después (Separado)
```typescript
// Page: 20 líneas
export default function ProjectFinancesPage() {
  return (
    <Layout headerProps={headerProps}>
      <ProjectFinancesView />
    </Layout>
  );
}

// View: 50 líneas
export function ProjectFinancesView() {
  return (
    <>
      <Tabs ... />
      {activeTab === 'dashboard' && <DashboardPanel ... />}
      {activeTab === 'movements' && <MovementsPanel ... />}
    </>
  );
}

// Panels: Cada uno enfocado en su contenido
export function DashboardPanel({ movements }) { /* KPIs, gráficos */ }
export function MovementsPanel({ movements }) { /* Tabla */ }
```

---

## Beneficios

1. **Layouts intercambiables**: Cambiar layout sin tocar contenido
2. **Testing más fácil**: Testear Views y Panels sin Layout
3. **Reutilización**: Mismos Panels en diferentes contextos
4. **Mantenibilidad**: Archivos más pequeños y enfocados
5. **Feature flags**: Probar layouts experimentales fácilmente
6. **Consistencia**: Mismo patrón que modales (Form agnóstico)

---

## Checklist de Migración

Antes de migrar una página, verificar:

- [ ] ¿Identificaste qué va en Page, View, y Panels?
- [ ] ¿Los Panels NO hacen fetch de datos?
- [ ] ¿La View hace el fetch y pasa datos a Panels?
- [ ] ¿El Page solo elige layout y renderiza View?
- [ ] ¿La navegación sigue funcionando?
- [ ] ¿Los tabs funcionan correctamente?
- [ ] ¿No hay regresiones visuales?

---

## Próximos Pasos

1. **Aprobar esta documentación**
2. **Crear ejemplo base mínimo** (1 Page + 1 View + 1 Panel dummy)
3. **Elegir primera página a migrar** (sugerencia: una simple)
4. **Migrar incrementalmente** siguiendo el proceso documentado

---

## IMPORTANTE

- **NO migrar páginas todavía**
- **NO modificar layouts existentes**
- Esta documentación es solo DEFINICIÓN
- Cuando estés listo, decime: "Migrá X página siguiendo PAGE-REFACT.md"
