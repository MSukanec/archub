# Arquitectura de Páginas Agnósticas al Layout (3 Capas)

## Objetivo

Separar las páginas en 3 capas claras para que el **contenido sea completamente agnóstico del layout**, permitiendo que el mismo contenido se renderice en diferentes layouts (DashboardLayout, LabLayout, etc.) sin modificar el código del contenido.

---

## Arquitectura de 3 Capas

```
┌─────────────────────────────────────────────────────────────┐
│                        PAGE                                 │
│ (Orquestador: elige layout, estado, renderiza view correcta)│
├─────────────────────────────────────────────────────────────┤
│                       LAYOUT                                │
│           (Header, Sidebar, Toolbar - YA EXISTE)           │
├─────────────────────────────────────────────────────────────┤
│                        VIEW                                 │
│  (El contenido real: tablas, KPIs, gráficos, formularios)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. PAGE (Orquestador)

### Responsabilidad
- Elegir qué layout usar (dinámico por preferencia de usuario)
- Manejar state simple: `activeTab`, `activeSection`
- Renderizar la View correcta según el estado
- Pasar props al layout

### Reglas
- **NO** contiene lógica de negocio compleja
- **NO** hace fetch de datos
- **SOLO** orquestación: layout selection + state + View rendering

### Ubicación
```
src/pages/<feature>/
  <Feature>Page.tsx  (o índice si es default export)
```

### Ejemplo
```typescript
// src/pages/projects/Projects.tsx
import { useState } from 'react';
import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { LabLayout } from '@/layouts/lab/LabLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ProjectActivesView } from '@/features/projects/views/ProjectActivesView';
import { ProjectListView } from '@/features/projects/views/ProjectListView';
import { ProjectSettingsView } from '@/features/projects/views/ProjectSettingsView';

const PROJECTS_TABS = [
  { id: 'actives', label: 'Proyectos Activos' },
  { id: 'list', label: 'Lista de Proyectos' },
  { id: 'settings', label: 'Ajustes' },
];

export default function Projects() {
  const [activeTab, setActiveTab] = useState('actives');
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  
  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const headerProps = { ... };

  // Orquestación: renderizar view según activeTab
  const renderView = () => {
    switch (activeTab) {
      case 'actives':
        return <ProjectActivesView />;
      case 'list':
        return <ProjectListView />;
      case 'settings':
        return <ProjectSettingsView />;
      default:
        return <ProjectActivesView />;
    }
  };

  // Lab Layout con tabs en toolbar
  if (isLabLayout) {
    return (
      <LabLayout 
        tabs={PROJECTS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderView()}
      </LabLayout>
    );
  }

  // Dashboard Layout con tabs inline
  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        <div className="flex gap-1">
          {PROJECTS_TABS.map(tab => (
            <button onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        {renderView()}
      </div>
    </Layout>
  );
}
```

---

## 2. VIEW (Contenido Real)

### Responsabilidad
- Renderizar el contenido visual (tablas, KPIs, gráficos, formularios)
- Hacer fetch de datos si es necesario
- Manejar filtros locales, búsqueda
- Ejecutar acciones (abrir modales, navegar)

### Reglas
- **NO** importa layouts
- **NO** sabe qué layout la contiene
- **NO** maneja tabs (el Page maneja eso)
- **PUEDE** vivir en cualquier contenedor (Page, Modal, Drawer, etc.)

### Ubicación
```
src/features/<feature>/views/
  <Feature>View.tsx
  <OtherFeature>View.tsx
```

### Ejemplo
```typescript
// src/features/projects/views/ProjectActivesView.tsx
import { useState, useMemo } from 'react';
import { useProjects, useProjectsCount } from '@/features/projects';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { ProjectItemCard } from '@/features/projects/components/ProjectItemCard';
import { EmptyState } from '@/components/shared/EmptyState';

export function ProjectActivesView() {
  // State local: filtros, búsqueda
  const [searchValue, setSearchValue] = useState('');
  
  // Fetch datos
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjects(userData?.organization?.id);
  
  // Lógica: filtrado, sorting
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [projects, searchValue]);

  const { openModal } = useGlobalModalStore();

  return (
    <div className="space-y-6">
      <input
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        placeholder="Buscar proyectos..."
      />
      
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectItemCard
              key={project.id}
              project={project}
              onClick={() => selectProject(project.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No hay proyectos" />
      )}
    </div>
  );
}
```

---

## 3. LAYOUT (Ya Existe - NO Tocar)

Los layouts ya existen:
- `DashboardLayout` - Layout principal con sidebar
- `LabLayout` - Layout experimental con mega-menus

### Responsabilidad
- Header / Toolbar
- Sidebar
- Navigation
- Content Slot

**NO modificar layouts existentes sin cause importante.**

---

## Flujo de Datos

```
Page (estado + orquestación)
  ├─ elige Layout
  ├─ define renderView()
  └─ renderiza View según activeTab
      │
      View (contenido + lógica)
        ├─ fetch datos
        ├─ maneja filtros
        └─ renderiza UI
```

### Regla de Oro: Top-Down Data Flow
1. **Page** maneja: layout selection, tab state, View routing
2. **View** maneja: data fetching, filtering, content rendering

---

## Estructura de Carpetas Final

```
src/
  pages/
    projects/
      Projects.tsx                    ← Page (orquestador)
    organization/
      Organization.tsx               ← Page
    project-finances/
      ProjectFinancesPage.tsx         ← Page

  features/
    projects/
      views/
        ProjectActivesView.tsx        ← View (contenido)
        ProjectListView.tsx           ← View (contenido)
        ProjectSettingsView.tsx       ← View (contenido)
      components/
        ProjectItemCard.tsx
        ProjectRow.tsx
      hooks/
        use-projects.ts
        use-projects-count.ts
      services/
        getProjects.ts

    finances/
      views/
        ProjectFinancesView.tsx       ← View
        OrganizationFinancesView.tsx  ← View
      components/
        DashboardCard.tsx
        MovementsTable.tsx
      hooks/
        use-unified-movements.ts
      services/
        getMovements.ts
```

---

## Comparación: Antes vs Después

### Antes (Sin separación clara)
```typescript
// Una sola página que hace TODO
export default function Projects() {
  const [activeTab, setActiveTab] = useState('...');
  const { data } = useProjects(...);
  
  return (
    <Layout>
      <Tabs ... />
      {activeTab === 'actives' && (
        // 500 líneas de componentes
      )}
      {activeTab === 'list' && (
        // 300 líneas de tabla
      )}
    </Layout>
  );
}
```

### Después (3 Capas claras)
```typescript
// PAGE: 30 líneas
export default function Projects() {
  const [activeTab, setActiveTab] = useState('actives');
  
  const renderView = () => {
    switch (activeTab) {
      case 'actives': return <ProjectActivesView />;
      case 'list': return <ProjectListView />;
      case 'settings': return <ProjectSettingsView />;
    }
  };

  return isLabLayout 
    ? <LabLayout tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>{renderView()}</LabLayout>
    : <Layout><Tabs />{renderView()}</Layout>;
}

// VIEW: 100-200 líneas c/u
export function ProjectActivesView() { 
  // fetch, render, lógica
}

export function ProjectListView() {
  // fetch, render, lógica
}

export function ProjectSettingsView() {
  // fetch, render, lógica
}
```

---

## Beneficios

1. **Layouts intercambiables**: Cambiar layout sin tocar Views
2. **Views reutilizables**: Misma View en múltiples contextos
3. **Archivos enfocados**: Cada archivo tiene una responsabilidad clara
4. **Testing más fácil**: Testear Views sin layouts
5. **Escalabilidad**: Agregar nuevos layouts o views es trivial

---

## Proceso de Refactorización

### Paso 1: Identificar Views
Analizar la página y separar:
```typescript
// Antes: TODO en una Page
Pages.tsx (1000+ líneas)

// Después: Separar en Views
ProjectActivesView.tsx
ProjectListView.tsx
ProjectSettingsView.tsx
```

### Paso 2: Crear Views
Cada View es independiente:
```typescript
// Una View por concepto
export function ProjectActivesView() {
  // Self-contained: fetch, filter, render
  const { data: projects } = useProjects(...);
  return <div>...</div>;
}
```

### Paso 3: Crear Page Orquestador
Page que decide qué View renderizar:
```typescript
export default function Projects() {
  const [activeTab, setActiveTab] = useState('actives');
  
  const renderView = () => {
    switch (activeTab) {
      case 'actives': return <ProjectActivesView />;
      case 'list': return <ProjectListView />;
      // ...
    }
  };

  return <Layout>{renderView()}</Layout>;
}
```

### Paso 4: Verificar
- ✅ Navegación funciona
- ✅ Datos se cargan correctamente
- ✅ No hay regresiones visuales
- ✅ Views son independientes

---

## Checklist de Refactorización

Antes de refactorizar una página:

- [ ] ¿Identificaste los diferentes "views" (tabs/sections)?
- [ ] ¿Cada View es una unidad lógica independiente?
- [ ] ¿La Page solo orquesta (no contiene lógica)?
- [ ] ¿Las Views hacen su propio fetch de datos?
- [ ] ¿La navegación sigue funcionando?
- [ ] ¿No hay regresiones?

---

## IMPORTANTE

- **Patrón**: PAGE (orquestación) → VIEW (contenido)
- **Objetivo**: Layouts agnósticos, Views reutilizables
- **Simplicity**: 3 capas, no más, no menos
- **Cuando dudes**: La View debe poderse renderizar en cualquier contexto

---

## Botones de Acción y Barra Secundaria (Lab Layout)

### Regla Fundamental
**Los botones de acción de la página (crear, agregar, filtrar por período, etc.) NUNCA van en el contenido de la View. SIEMPRE van en la barra secundaria del toolbar.**

### Implementación

En el **PAGE** (orquestador), definir los botones según el tab activo y pasarlos via `toolbarProps.secondaryRightSlot`:

```typescript
export default function MyPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { openModal } = useGlobalModalStore();

  // Botones de acción según tab activo
  const actionButtons = (
    <div className="flex items-center gap-3">
      {activeTab === "dashboard" && (
        <PeriodSelector ... />
      )}
      {activeTab === "list" && (
        <Button size="sm" onClick={() => openModal('create-item', {})}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Item
        </Button>
      )}
    </div>
  );

  if (isLabLayout) {
    return (
      <LabLayout 
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: actionButtons, // <-- Botones aquí
        }}
      >
        {renderView()}
      </LabLayout>
    );
  }

  return (
    <Layout headerProps={{ ...headerProps, actionButton: ... }}>
      {renderView()}
    </Layout>
  );
}
```

### Ubicación Visual

```
┌─────────────────────────────────────────────────────────────────────┐
│ CONTEXTO ▼ │ PÁGINA ▼ │ VISTA ▼ │         │ [Avatar] │ [User Menu] │
├─────────────────────────────────────────────────────────────────────┤
│ 🔍 Buscar...                              │ [Período ▼] [+ Agregar] │  <-- Barra secundaria
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                        CONTENIDO (VIEW)                             │
│                    (Sin botones de acción)                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Checklist de Botones

- [ ] ¿Los botones de acción están en `toolbarProps.secondaryRightSlot`?
- [ ] ¿La View NO contiene botones de crear/agregar en su contenido?
- [ ] ¿El selector de período (si existe) está en la barra secundaria?
- [ ] ¿Los botones cambian según el `activeTab`?

---

## Próximos Pasos

Cuando necesites refactorizar una página:

1. Identifica las Views independientes
2. Crea archivos para cada View en `src/features/<feature>/views/`
3. Extrae lógica y fetch a cada View
4. Simplifica la Page a solo orquestación
5. Verifica que todo funcione igual
