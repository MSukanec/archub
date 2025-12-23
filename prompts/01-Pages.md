# Guía de Creación de Páginas en Seencel

## IMPORTANTE: Lee esto ANTES de crear cualquier página

Esta guía documenta cómo crear páginas correctamente en Seencel, siguiendo la **arquitectura 3-capas (PAGE → LAYOUT → VIEW)** y los patrones establecidos.

---

## ARQUITECTURA 3-CAPAS (Fundamental)

### Objetivo

Separar las páginas en 3 capas claras para que el **contenido sea completamente agnóstico del layout**, permitiendo que el mismo contenido se renderice en diferentes layouts (DashboardLayout, LabLayout, etc.) sin modificar el código del contenido.

### Estructura

```
┌─────────────────────────────────────────────────────────────┐
│                        PAGE                                 │
│ (Orquestador: elige layout, estado, renderiza view correcta)│
├─────────────────────────────────────────────────────────────┤
│                       LAYOUT                                │
│  (Header, Sidebar, Toolbar - DashboardLayout o LabLayout)  │
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
  <Feature>.tsx  (o <Feature>Page.tsx)
```

### Ejemplo Completo

```typescript
// src/pages/projects/Projects.tsx
import { useState } from 'react';
import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { LabLayout } from '@/layouts/lab/LabLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ProjectActivesView } from '@/features/projects/views/ProjectActivesView';
import { ProjectListView } from '@/features/projects/views/ProjectListView';
import { ProjectSettingsView } from '@/features/projects/views/ProjectSettingsView';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PROJECTS_TABS = [
  { id: 'actives', label: 'Proyectos Activos' },
  { id: 'list', label: 'Lista de Proyectos' },
  { id: 'settings', label: 'Ajustes' },
];

export default function Projects() {
  const [activeTab, setActiveTab] = useState('actives');
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { openModal } = useGlobalModalStore();
  
  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  // Botones de acción según tab activo
  const actionButtons = (
    <div className="flex items-center gap-3">
      {activeTab === 'list' && (
        <Button 
          size="sm" 
          onClick={() => openModal('project', {})}
          data-testid="button-create-project"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proyecto
        </Button>
      )}
    </div>
  );

  // Orquestación: renderizar view según activeTab
  const renderView = () => {
    switch (activeTab) {
      case 'actives':
        return <ProjectActivesView organizationId={organizationId} />;
      case 'list':
        return <ProjectListView organizationId={organizationId} />;
      case 'settings':
        return <ProjectSettingsView organizationId={organizationId} />;
      default:
        return <ProjectActivesView organizationId={organizationId} />;
    }
  };

  const headerProps = {
    title: "Proyectos",
    icon: Briefcase,
    description: "Gestiona tus proyectos de construcción",
  };

  // Lab Layout con tabs en toolbar
  if (isLabLayout) {
    return (
      <LabLayout 
        tabs={PROJECTS_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        toolbarProps={{
          secondaryRightSlot: actionButtons,
        }}
      >
        {renderView()}
      </LabLayout>
    );
  }

  // Dashboard Layout con tabs inline
  return (
    <Layout headerProps={{ ...headerProps, actions: [actionButtons] }}>
      <div className="space-y-6">
        <div className="flex gap-1 border-b">
          {PROJECTS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-accent'
                  : 'border-b-2 border-transparent'
              }`}
            >
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
- Ejecutar acciones (abrir modales, drawers, navegar)

### Reglas
- **NO** importa layouts
- **NO** sabe qué layout la contiene
- **NO** maneja tabs (el Page maneja eso)
- **PUEDE** vivir en cualquier contenedor (Page, Modal, Drawer, etc.)
- **AUTOCONTENDIDA**: fetch, render, lógica

### Ubicación
```
src/features/<feature>/views/
  <Feature>View.tsx
  <OtherFeature>View.tsx
```

### Ejemplo Completo

```typescript
// src/features/projects/views/ProjectActivesView.tsx
import { useState, useMemo } from 'react';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useGlobalModalStore } from '@/components/modal';
import { ProjectItemCard } from '@/features/projects/components/ProjectItemCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

interface ProjectActivesViewProps {
  organizationId: string;
}

export function ProjectActivesView({ organizationId }: ProjectActivesViewProps) {
  // State local: filtros, búsqueda
  const [searchValue, setSearchValue] = useState('');
  
  // Fetch datos
  const { data: projects = [], isLoading } = useProjects(organizationId);
  const { openDrawer } = useGlobalModalStore();

  // Lógica: filtrado, sorting
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchValue.toLowerCase()) &&
      !p.is_deleted
    );
  }, [projects, searchValue]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input
        value={searchValue}
        onChange={e => setSearchValue(e.target.value)}
        placeholder="Buscar proyectos..."
        className="px-3 py-2 border rounded"
        data-testid="input-search-projects"
      />
      
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <ProjectItemCard
              key={project.id}
              project={project}
              onClick={() => openDrawer({
                title: project.name,
                content: <ProjectDetailContent projectId={project.id} />,
                width: 'lg'
              })}
              data-testid={`card-project-${project.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          title="No hay proyectos activos" 
          description="Crea un nuevo proyecto para comenzar"
        />
      )}
    </div>
  );
}
```

---

## 3. LAYOUT (Ya Existe - NO Tocar)

Los layouts ya existen y son el "contenedor" que envuelve las Views:

### DashboardLayout
- Layout principal con sidebar
- Header con headerProps
- Para usuarios con preferencia 'experimental' (default)

### LabLayout
- Layout experimental con mega-menus
- Toolbar con tabs
- Para usuarios con preferencia 'lab'

**NO modificar layouts existentes sin causa importante.**

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
      ProjectFinances.tsx            ← Page

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
        useProjects.ts
      services/
        getProjects.ts
      forms/
        ProjectFormFields.tsx         ← FormFields agnóstico
      modals/
        ProjectModal.tsx              ← Envase (DashboardLayout)
      drawers/
        ProjectDetailDrawer.tsx       ← Envase (LabLayout)

    finances/
      views/
        ProjectFinancesView.tsx       ← View
        OrganizationFinancesView.tsx  ← View
      components/
        DashboardCard.tsx
        MovementsTable.tsx
      hooks/
        useUnifiedMovements.ts
      services/
        getMovements.ts
```

---

## Flujo de Datos

```
Page (estado + orquestación)
  ├─ elige Layout (DashboardLayout o LabLayout)
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

## Botones de Acción (CRÍTICO)

### Regla Fundamental
**Los botones de acción de la página (crear, agregar, filtrar por período, etc.) NUNCA van en el contenido de la View. SIEMPRE van en el header (DashboardLayout) o en la barra secundaria del toolbar (LabLayout).**

### Para DashboardLayout

```typescript
const headerProps = {
  title: "Proyectos",
  icon: Plus,
  actions: [
    <Button key="create" onClick={handleCreate}>
      <Plus className="w-4 h-4 mr-1" />
      Nuevo Proyecto
    </Button>
  ]
};

return <Layout headerProps={headerProps}>{renderView()}</Layout>;
```

### Para LabLayout

```typescript
const actionButtons = (
  <div className="flex items-center gap-3">
    {activeTab === 'list' && (
      <Button size="sm" onClick={handleCreate}>
        <Plus className="w-4 h-4 mr-2" />
        Nuevo Proyecto
      </Button>
    )}
  </div>
);

return (
  <LabLayout 
    tabs={TABS}
    activeTab={activeTab}
    onTabChange={setActiveTab}
    toolbarProps={{
      secondaryRightSlot: actionButtons,
    }}
  >
    {renderView()}
  </LabLayout>
);
```

### Ubicación Visual (LabLayout)

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

---

## Checklist de Creación de Página (3 Capas)

Antes de crear una página, verifica:

### PAGE
- [ ] ¿Solo orquesta? (NO lógica de negocio)
- [ ] ¿Elige layout dinámicamente?
- [ ] ¿Maneja tab state?
- [ ] ¿Usa `renderView()` para renderizar Views?
- [ ] ¿Para LabLayout, botones van en `toolbarProps.secondaryRightSlot`?
- [ ] ¿Para DashboardLayout, botones van en `headerProps.actions`?

### VIEW
- [ ] ¿Es autocontendida? (fetch, filter, render)
- [ ] ¿NO importa layouts?
- [ ] ¿NO maneja tabs?
- [ ] ¿Puede vivir en cualquier contexto?
- [ ] ¿Tiene LoadingSpinner para estados de carga?
- [ ] ¿Tiene EmptyState cuando no hay datos?

### LAYOUT
- [ ] ¿Usa DashboardLayout o LabLayout?
- [ ] ¿NO está modificando el Layout?

### General
- [ ] ¿Agregaste `data-testid` a elementos interactivos?
- [ ] ¿Seguiste patrones de páginas existentes?
- [ ] ¿Las Views están en `src/features/{feature}/views/`?

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
// PAGE: 30-50 líneas
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
    ? <LabLayout tabs={TABS} {...props}>{renderView()}</LabLayout>
    : <Layout {...props}>{renderView()}</Layout>;
}

// VIEWS: 100-200 líneas c/u
export function ProjectActivesView() { 
  // fetch, render, lógica
}
```

---

## Beneficios de la Arquitectura 3-Capas

1. **Layouts intercambiables**: Cambiar layout sin tocar Views
2. **Views reutilizables**: Misma View en múltiples contextos (Page, Modal, Drawer)
3. **Archivos enfocados**: Cada archivo tiene una responsabilidad clara
4. **Testing más fácil**: Testear Views sin layouts
5. **Escalabilidad**: Agregar nuevos layouts o views es trivial

---

## Importaciones Comunes

```typescript
// Layouts
import { Layout } from '@/layouts/dashboard/DashboardLayout';
import { LabLayout } from '@/layouts/lab/LabLayout';

// Componentes de UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';

// Iconos
import { Plus, Edit2, Trash2 } from 'lucide-react';

// React
import { useState, useMemo } from 'react';
```

---

## Loading States (CRÍTICO)

**REGLA:** SIEMPRE usar el componente `LoadingSpinner` para estados de carga de páginas completas. NUNCA usar texto "Cargando..." ni spinners genéricos.

### ✅ CORRECTO

```typescript
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

// Página completa cargando
if (isLoading) {
  return (
    <Layout headerProps={headerProps}>
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    </Layout>
  );
}

// Sección dentro de una página
{isLoading ? (
  <div className="flex items-center justify-center h-32">
    <LoadingSpinner size="md" />
  </div>
) : (
  <ActualContent />
)}
```

### ❌ INCORRECTO

```typescript
// ❌ MAL - Texto plano
<div className="text-muted-foreground">Cargando datos...</div>

// ❌ MAL - Spinner genérico
<div className="animate-spin rounded-full h-12 w-12 border-b-2"></div>

// ❌ MAL - Skeleton para páginas completas
{isLoading && <Skeleton className="h-32" />}
```

**Props de LoadingSpinner:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `fullScreen`: boolean (default: false)

---

## Empty States (CRÍTICO)

**REGLA:** Si una View tiene un botón de crear/agregar en el Page, la View TAMBIÉN debe tener un `actionButton` en el empty state.

### ✅ CORRECTO

```typescript
// En la Page
const actionButtons = (
  <Button onClick={handleCreate}>
    <Plus className="w-4 h-4 mr-2" />
    Nuevo Item
  </Button>
);

// En la View
{items.length > 0 ? (
  <ItemsList items={items} />
) : (
  <EmptyState 
    title="No hay items"
    description="Crea uno nuevo para comenzar"
    actionButton={{
      label: "Nuevo Item",
      onClick: handleCreate  // ← MISMA función
    }}
  />
)}
```

### ❌ INCORRECTO

```typescript
// Page tiene botón pero View no lo ofrece en empty state
<EmptyState 
  title="No hay items"
  description="Crea uno nuevo para comenzar"
  // ❌ Falta actionButton!
/>
```

---

## Errores Comunes a Evitar

### ❌ ERROR 1: Toda la lógica en la Page
```typescript
// ❌ MAL - Page está haciendo todo
export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  // ... 500 líneas de lógica ...
}
```

```typescript
// ✅ BIEN - Page solo orquesta
export default function Projects() {
  const [activeTab, setActiveTab] = useState('actives');
  return isLabLayout ? <LabLayout>{renderView()}</LabLayout> : <Layout>{renderView()}</Layout>;
}
```

### ❌ ERROR 2: View que importa Layout
```typescript
// ❌ MAL - View no debería saber del layout
export function ProjectListView() {
  return <Layout>...</Layout>;
}
```

```typescript
// ✅ BIEN - View es agnóstica
export function ProjectListView() {
  return <div>...</div>;
}
```

### ❌ ERROR 3: View que maneja tabs
```typescript
// ❌ MAL - View está manejando tabs
export function ProjectListView() {
  const [activeTab, setActiveTab] = useState('...');
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      ...
    </Tabs>
  );
}
```

```typescript
// ✅ BIEN - Page maneja tabs
export default function Projects() {
  const [activeTab, setActiveTab] = useState('...');
  const renderView = () => { ... };
  return <Layout>{renderView()}</Layout>;
}
```

### ❌ ERROR 4: Botones de acción en el contenido de la View
```typescript
// ❌ MAL - Botón en el contenido
<View>
  <div className="flex justify-end">
    <Button onClick={handleCreate}>Crear</Button>
  </div>
</View>
```

```typescript
// ✅ BIEN - Botón en el header o toolbar
const actionButtons = <Button onClick={handleCreate}>Crear</Button>;
return <LabLayout toolbarProps={{ secondaryRightSlot: actionButtons }}>...</LabLayout>;
```

---

## Autenticación en Endpoints (CRÍTICO)

### ⚠️ IMPORTANTE: auth.user.id vs userId

**Hay DOS IDs de usuario diferentes:**

1. **`auth.user.id`** - ID del JWT/Supabase Auth (en `auth.users`)
2. **`userId`** - ID de la tabla `users` en la DB (referencia a `auth.users.id`)

**Las tablas como `organization_members` usan `user_id` que referencia la tabla `users`, NO `auth.users`.**

### ✅ CORRECTO

```typescript
import { extractToken, requireUser } from '../../lib/auth/helpers';

export async function handleMyEndpoint(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    const { userId, supabase } = await requireUser(token);
    
    // userId es el ID correcto para queries
    const { data: member } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)  // ← Usar userId, NO auth.user.id
      .single();

    return res.json({ member });
  } catch (error: any) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}
```

### ❌ INCORRECTO

```typescript
// ❌ MAL - auth.user.id causará 403 Forbidden
const { data: { user } } = await supabase.auth.getUser();
const { data: member } = await supabase
  .from('organization_members')
  .eq('user_id', user.id)  // ❌ INCORRECTO - Mismatched IDs!
  .single();
```

---

## Resumen

**ARQUITECTURA 3-CAPAS:**
```
PAGE       → Elige layout, maneja tabs, renderiza views
   ↓
LAYOUT     → DashboardLayout o LabLayout (contenedor)
   ↓
VIEW       → Contenido visual agnóstico (fetch, filter, render)
```

**REGLA DE ORO:**
- Page: Orquestación (layout selection, tab state)
- View: Contenido (fetch, filter, render)
- Layout: Contenedor (NO modificar)

**SIEMPRE:**
- ✅ Separar en 3 capas claras
- ✅ Views autocontendidas
- ✅ Botones de acción en header/toolbar, NO en contenido
- ✅ LoadingSpinner para carga, EmptyState para vacío
- ✅ Usar `userId` (de `requireUser`), NO `auth.user.id`

**NUNCA:**
- ❌ Toda la lógica en Page
- ❌ View que importa Layout
- ❌ View que maneja tabs
- ❌ Botones de acción en el contenido
- ❌ Usar `auth.user.id` directamente en queries
