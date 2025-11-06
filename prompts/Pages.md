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
  actionButton?: {                  // Botón de acción (opcional)
    label: string;
    icon: React.ComponentType<any>;
    onClick: () => void;
  };
}
```

---

## 6. Importaciones Comunes

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

## 7. Checklist de Creación de Página

Antes de crear una página, verifica:

- [ ] ¿Usas `Layout` con `headerProps`?
- [ ] ¿Usas `Tabs` de `@/components/ui-custom/Tabs` para filtros/tabs?
- [ ] ¿Tienes `wide` prop en Layout si necesitas ancho completo?
- [ ] ¿Defines `headerProps` con título, icono y descripción?
- [ ] ¿Usas componentes de shadcn/ui existentes?
- [ ] ¿Agregaste `data-testid` a elementos interactivos?
- [ ] ¿La página sigue el patrón de páginas existentes?

---

## 8. Patrones de Diseño

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

## 9. ERRORES COMUNES A EVITAR

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

### ❌ ERROR 4: No seguir el patrón de páginas existentes
**SIEMPRE mira páginas similares existentes antes de crear una nueva**

---

## 10. Proceso de Creación Recomendado

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

## 11. Referencias Rápidas

| Componente | Uso | Ubicación |
|------------|-----|-----------|
| Layout | Estructura de página | `@/components/layout/desktop/Layout` |
| Tabs | Tabs/filtros personalizados | `@/components/ui-custom/Tabs` |
| StatCard | Cards de KPIs | `@/components/ui/stat-card` |
| Card | Cards genéricas | `@/components/ui/card` |
| Skeleton | Loading states | `@/components/ui/skeleton` |

---

## Resumen

**REGLA DE ORO:** Siempre mira una página similar existente antes de crear una nueva. Si es admin, usa AdminAdmin, AdminSupport o AdminDashboard como referencia. Usa `Layout` con `headerProps` y el componente `Tabs` personalizado.

**NUNCA:**
- ❌ Usar PageLayout directamente
- ❌ Usar Button genérico para tabs/filtros
- ❌ Crear página sin Layout correcto

**SIEMPRE:**
- ✅ Usar Layout con headerProps
- ✅ Usar Tabs de ui-custom para filtros
- ✅ Seguir patrones de páginas existentes
