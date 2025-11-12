# Guía de Creación de Páginas en Archub

## IMPORTANTE: Lee esto ANTES de crear cualquier página

Esta guía documenta cómo crear páginas correctamente en Archub, siguiendo los patrones establecidos y usando los componentes adecuados.

---

## 1. Estructura Base de una Página

### ✅ CORRECTO: Usar Layout con headerProps

```typescript
import { Layout } from '@/components/layout/desktop/Layout';
import { IconComponent } from 'lucide-react';

export default function MyPage() {
  const headerProps = {
    title: "Título de la Página",
    icon: IconComponent,
    description: "Descripción breve",
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout wide headerProps={headerProps}>
      {/* Contenido de la página */}
    </Layout>
  );
}
```

### ❌ INCORRECTO: NO usar PageLayout directamente para páginas admin

```typescript
// ❌ NO HACER ESTO en páginas admin
return (
  <PageLayout title="..." icon={...}>
    {/* contenido */}
  </PageLayout>
);
```

**Razón:** `PageLayout` es un componente interno usado por `Layout`. Las páginas deben usar `Layout` que incluye sidebar, header, y toda la estructura.

---

## 2. Páginas con Tabs

### ✅ CORRECTO: Usar el componente Tabs personalizado

```typescript
import { Layout } from '@/components/layout/desktop/Layout';
import { Tabs } from '@/components/ui-custom/Tabs';
import { useState } from 'react';

export default function MyPageWithTabs() {
  const [activeTab, setActiveTab] = useState('tab1');

  const headerProps = {
    title: "Título",
    icon: IconComponent,
    showSearch: false,
    showFilters: false,
  };

  const tabs = [
    { value: 'tab1', label: 'Primera Tab' },
    { value: 'tab2', label: 'Segunda Tab' },
    { value: 'tab3', label: 'Tercera Tab' },
  ];

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Tabs personalizados de Archub */}
        <Tabs 
          tabs={tabs}
          value={activeTab}
          onValueChange={setActiveTab}
        />
        
        {/* Contenido condicional según tab */}
        {activeTab === 'tab1' && <TabContent1 />}
        {activeTab === 'tab2' && <TabContent2 />}
        {activeTab === 'tab3' && <TabContent3 />}
      </div>
    </Layout>
  );
}
```

### ❌ INCORRECTO: NO usar Button genérico para tabs/filtros

```typescript
// ❌ NO HACER ESTO
<Button variant={active ? 'default' : 'outline'}>...</Button>
```

**Razón:** Archub tiene un componente Tabs personalizado (`src/components/ui-custom/Tabs.tsx`) con estilo específico que usa `var(--accent)` y sigue el design system.

---

## 3. Páginas Admin con Tabs en Header

Algunas páginas admin tienen tabs en el header (AdminAdmin, AdminSupport). Patrón:

```typescript
import { Layout } from '@/components/layout/desktop/Layout';
import { useState } from 'react';

export default function AdminPageWithHeaderTabs() {
  const [activeTab, setActiveTab] = useState('tab1');

  const tabs = [
    { id: 'tab1', label: 'Tab 1', isActive: activeTab === 'tab1' },
    { id: 'tab2', label: 'Tab 2', isActive: activeTab === 'tab2' },
    { id: 'tab3', label: 'Tab 3', isActive: activeTab === 'tab3' },
  ];

  const headerProps = {
    title: "Título",
    icon: IconComponent,
    showSearch: false,
    showFilters: false,
    tabs,  // ← Tabs en el header
    onTabChange: setActiveTab,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tab1': return <Tab1Content />;
      case 'tab2': return <Tab2Content />;
      case 'tab3': return <Tab3Content />;
      default: return <Tab1Content />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
}
```

---

## 4. Ejemplos de Páginas de Referencia

### Páginas Admin

1. **AdminAdmin.tsx** (`/admin/administration`)
   - Tabs en header (Resumen, Organizaciones, Usuarios)
   - Botón de acción dinámico según tab
   - Layout wide

2. **AdminSupport.tsx** (`/admin/support`)
   - Tabs en header (Anuncios, Notificaciones, Cambios, Soporte)
   - Layout wide

3. **AdminDashboard.tsx** (`/admin/dashboard`)
   - Tabs en contenido (Hoy, 7 días, 30 días) usando componente Tabs
   - Sin tabs en header
   - Layout wide

### Referencia de archivos:
```
src/pages/admin/administration/AdminAdmin.tsx
src/pages/admin/support/AdminSupport.tsx
src/pages/admin/AdminDashboard.tsx
```

---

## 5. Props Comunes del headerProps

```typescript
interface HeaderProps {
  title: string;                    // Título de la página
  icon?: React.ComponentType<any>;  // Icono (de lucide-react)
  description?: string;             // Descripción (opcional)
  showSearch?: boolean;             // Mostrar buscador (default: false)
  showFilters?: boolean;            // Mostrar filtros (default: false)
  tabs?: Tab[];                     // Tabs en el header (opcional)
  onTabChange?: (tabId: string) => void;  // Handler de cambio de tab
  actions?: React.ReactElement[];   // Botones de acción en el header (opcional)
  actionButton?: {                  // Botón de acción (DEPRECATED - usar actions)
    label: string;
    icon: React.ComponentType<any>;
    onClick: () => void;
  };
}
```

---

## 6. Botones de Acción en el Header

### ✅ CORRECTO: Usar la prop `actions` en headerProps

Los botones de acción (crear, agregar, etc.) **SIEMPRE** deben ir en el header usando la prop `actions`, NO en el contenido de la página.

```typescript
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('tab1');
  const { openModal } = useGlobalModalStore();

  const handleCreateItem = () => {
    openModal('my-modal', {});
  };

  const headerProps = {
    title: "Título",
    icon: IconComponent,
    tabs: [
      { id: 'tab1', label: 'Tab 1', isActive: activeTab === 'tab1' },
      { id: 'tab2', label: 'Tab 2', isActive: activeTab === 'tab2' },
    ],
    onTabChange: setActiveTab,
    actions: [
      // Botón condicional según tab activa
      activeTab === 'tab1' && (
        <Button
          key="create-item"
          onClick={handleCreateItem}
          className="h-8 px-3 text-xs"
          data-testid="button-create-item"
        >
          <Plus className="w-4 h-4 mr-1" />
          Crear Elemento
        </Button>
      ),
      // Puedes agregar más botones
      activeTab === 'tab2' && (
        <Button
          key="another-action"
          onClick={() => console.log('Another action')}
          className="h-8 px-3 text-xs"
        >
          Otra Acción
        </Button>
      ),
    ].filter(Boolean) // Filtrar los elementos false/undefined
  };

  return (
    <Layout wide headerProps={headerProps}>
      {/* Contenido de la página */}
      {activeTab === 'tab1' && <Tab1Content />}
      {activeTab === 'tab2' && <Tab2Content />}
    </Layout>
  );
}
```

### ❌ INCORRECTO: Poner botones en el contenido de la página

```typescript
// ❌ NO HACER ESTO
export default function MyPage() {
  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* ❌ MAL: Botón en el contenido */}
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Crear Elemento
          </Button>
        </div>
        
        {/* Contenido */}
      </div>
    </Layout>
  );
}
```

### Ejemplos de Referencia:

- **AdminPayments.tsx** - Botones condicionales según tab (Crear Pago Manual, Nuevo Cupón)
- **AdminCourseView.tsx** - Múltiples botones (Agregar Módulo, Agregar Lección)
- **Projects.tsx** - Botón con PlanRestricted (Nuevo Proyecto)

### Reglas importantes:

1. ✅ **SIEMPRE** usa `actions` en headerProps para botones de acción
2. ✅ Usa condicionales para mostrar botones según el tab activo
3. ✅ Usa `.filter(Boolean)` para limpiar elementos undefined/false del array
4. ✅ Cada botón debe tener una `key` única
5. ✅ Usa `className="h-8 px-3 text-xs"` para el tamaño estándar de botones del header
6. ✅ Agrega `data-testid` a cada botón para testing
7. ❌ **NUNCA** pongas botones de acción dentro del contenido de la página/tab

---

## 6.1. Botones de Acción en Empty States

### 🔘 REGLA CRÍTICA: Consistencia entre Header y Empty State

**SIEMPRE** que una página tenga un botón de acción en el header (crear, agregar, nuevo), el empty state de la tabla DEBE tener el mismo botón de acción.

### ✅ CORRECTO: actionButton en emptyStateConfig

```typescript
const handleCreateItem = () => {
  openModal('item', {});
};

const headerProps = {
  title: "Items",
  icon: Package,
  actions: [
    <Button 
      key="create-item"
      onClick={handleCreateItem}
      className="h-8 px-3 text-xs"
    >
      <Plus className="w-4 h-4 mr-1" />
      Nuevo Item
    </Button>
  ]
};

// En el componente Tab/Tabla
<Table
  columns={columns}
  data={items}
  onRowClick={handleRowClick}
  emptyStateConfig={{
    icon: <Inbox />,
    title: 'No hay items',
    description: 'No se han creado items todavía',
    actionButton: {
      label: 'Nuevo Item',
      onClick: handleCreateItem  // ← MISMA función que el header
    }
  }}
/>
```

### ❌ INCORRECTO: Empty state sin actionButton

```typescript
// ❌ MAL - Header tiene botón pero empty state no lo tiene
const headerProps = {
  actions: [
    <Button onClick={handleCreateItem}>Nuevo Item</Button>
  ]
};

<Table
  emptyStateConfig={{
    icon: <Inbox />,
    title: 'No hay items',
    description: 'No se han creado items todavía'
    // ❌ Falta actionButton!
  }}
/>
```

### Reglas importantes:

1. ✅ **SIEMPRE** usa la **MISMA función** en el header y en el empty state
2. ✅ El `label` del actionButton debe coincidir con el texto del botón del header
3. ✅ Si el header tiene botón de acción, el empty state también debe tenerlo
4. ❌ **NUNCA** dejes el empty state sin actionButton si existe un botón crear/agregar en el header

### Ejemplos de Referencia:

- **AdminPlanPricesTab.tsx** - Usa actionButton con la misma función que el header
- **AdminPaymentsTab.tsx** - actionButton en empty state del tab de pagos

---

## 7. Importaciones Comunes

```typescript
// Layout principal
import { Layout } from '@/components/layout/desktop/Layout';

// Tabs personalizado (para filtros/tabs en contenido)
import { Tabs } from '@/components/ui-custom/Tabs';

// Componentes de UI
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// Iconos
import { IconName } from 'lucide-react';

// React Query
import { useQuery } from '@tanstack/react-query';

// Estado
import { useState } from 'react';
```

---

## 8. Checklist de Creación de Página

Antes de crear una página, verifica:

- [ ] ¿Usas `Layout` con `headerProps`?
- [ ] ¿Usas `Tabs` de `@/components/ui-custom/Tabs` para filtros/tabs?
- [ ] ¿Tienes `wide` prop en Layout si necesitas ancho completo?
- [ ] ¿Defines `headerProps` con título, icono y descripción?
- [ ] ¿Usas componentes de shadcn/ui existentes?
- [ ] ¿Agregaste `data-testid` a elementos interactivos?
- [ ] ¿La página sigue el patrón de páginas existentes?

---

## 9. Patrones de Diseño

### Grid Responsive
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards o StatCards */}
</div>
```

### Spacing Vertical
```typescript
<div className="space-y-6">
  {/* Secciones con espacio vertical */}
</div>
```

### Loading States
```typescript
{loading ? (
  <Skeleton className="h-32" />
) : (
  <ActualContent />
)}
```

---

## 10. ERRORES COMUNES A EVITAR

### ❌ ERROR 1: Usar PageLayout directamente
```typescript
// ❌ MAL
return <PageLayout title="...">...</PageLayout>
```

```typescript
// ✅ BIEN
return <Layout wide headerProps={...}>...</Layout>
```

### ❌ ERROR 2: Usar Button para tabs
```typescript
// ❌ MAL
<Button variant={active ? 'default' : 'outline'}>Tab</Button>
```

```typescript
// ✅ BIEN
<Tabs tabs={...} value={...} onValueChange={...} />
```

### ❌ ERROR 3: Olvidar headerProps
```typescript
// ❌ MAL
<Layout wide>...</Layout>
```

```typescript
// ✅ BIEN
<Layout wide headerProps={{ title: "...", icon: ... }}>...</Layout>
```

### ❌ ERROR 4: Poner botones de acción en el contenido de la página
```typescript
// ❌ MAL - Botón en el contenido
<Layout wide headerProps={headerProps}>
  <div className="flex justify-end">
    <Button onClick={...}>Crear</Button>
  </div>
</Layout>
```

```typescript
// ✅ BIEN - Botón en headerProps.actions
const headerProps = {
  // ...
  actions: [
    <Button key="create" onClick={...}>Crear</Button>
  ]
};
```

### ❌ ERROR 5: No seguir el patrón de páginas existentes
**SIEMPRE mira páginas similares existentes antes de crear una nueva**

### ❌ ERROR 6: Wrapper extra en página principal
Las páginas admin NO deben tener un wrapper `<div className="space-y-6">` adicional. Solo el componente tab debe tener el wrapper.

```typescript
// ❌ MAL - Wrapper extra
<Layout wide headerProps={headerProps}>
  <div className="space-y-6">
    {activeTab === 'tab1' && <Tab1Component />}
  </div>
</Layout>

// ✅ BIEN - Sin wrapper extra
<Layout wide headerProps={headerProps}>
  {activeTab === 'tab1' && <Tab1Component />}
</Layout>
```

---

## 11. Proceso de Creación Recomendado

1. **Buscar página similar existente** para usarla como referencia
2. **Copiar estructura base** de esa página
3. **Definir headerProps** con título, icono, descripción
4. **Decidir si necesitas tabs**:
   - En header → usar `tabs` en headerProps
   - En contenido → usar componente `<Tabs />`
5. **Implementar contenido** siguiendo patrones de grid, cards, etc.
6. **Verificar con checklist** antes de completar
7. **Probar en navegador** que se vea correctamente

---

## 12. Referencias Rápidas

| Componente | Uso | Ubicación |
|------------|-----|-----------|
| Layout | Estructura de página | `@/components/layout/desktop/Layout` |
| Tabs | Tabs/filtros personalizados | `@/components/ui-custom/Tabs` |
| StatCard | Cards de KPIs | `@/components/ui/stat-card` |
| Card | Cards genéricas | `@/components/ui/card` |
| Skeleton | Loading states | `@/components/ui/skeleton` |

---

## 13. Navegación Admin

### Estructura de navegación de admin

**Sidebar Principal:**
- Home
- Organización
- Proyecto
- Capacitaciones
- **Administración** ← Solo este botón en sidebar principal (si es admin)

**Sidebar Específico de Admin** (cuando haces click en "Administración"):
- **Analytics** ← Primer botón del sidebar específico
- Administración
- Soporte

### Reglas importantes:
- ❌ NO agregar "Analytics" en el sidebar principal
- ✅ "Analytics" solo aparece en el sidebar específico de admin
- ✅ En el sidebar principal solo va "Administración" (con icono Crown)
- ✅ Cuando entras a admin level, aparecen Analytics, Administración, Soporte

---

## Resumen

**REGLA DE ORO:** Siempre mira una página similar existente antes de crear una nueva. Si es admin, usa AdminAdmin, AdminSupport o AdminDashboard como referencia. Usa `Layout` con `headerProps` y el componente `Tabs` personalizado.

**NUNCA:**
- ❌ Usar PageLayout directamente
- ❌ Usar Button genérico para tabs/filtros
- ❌ Crear página sin Layout correcto
- ❌ Agregar "Analytics" en el sidebar principal
- ❌ Poner botones de acción en el contenido de la página

**SIEMPRE:**
- ✅ Usar Layout con headerProps
- ✅ Usar Tabs de ui-custom para filtros
- ✅ Seguir patrones de páginas existentes
- ✅ Analytics solo en sidebar específico de admin
- ✅ Botones de acción en `headerProps.actions`, NO en el contenido
