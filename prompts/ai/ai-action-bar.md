# Puesta a punto de páginas - ActionBar Migration

## IMPORTANTE: Este archivo explica EXACTAMENTE cómo migrar páginas del ActionBarDesktop obsoleto al nuevo ActionBarDesktopRow

## Pasos específicos a seguir:

### 1. ELIMINAR ActionBarDesktop completamente
```typescript
// ELIMINAR esta importación:
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'

// ELIMINAR todo el JSX del ActionBarDesktop (normalmente una sección grande con props como title, icon, features, etc.)

// ELIMINAR también las configuraciones headerProps que usaba ActionBarDesktop
```

### 2. AGREGAR las nuevas importaciones
```typescript
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow'
import { SelectableGhostButton } from '@/components/ui-custom/SelectableGhostButton'
import { FILTER_ICONS } from '@/constants/actionBarConstants'
```

### 3. IMPLEMENTAR ActionBarDesktopRow con esta estructura EXACTA:
```typescript
{/* ActionBar Desktop */}
<div className="hidden md:block">
  <ActionBarDesktopRow
    leftContent={
      <div className="flex items-center gap-2">
        <SelectableGhostButton
          title="Filtro1"
          icon={<FILTER_ICONS.FILTER className="w-4 h-4" />}
          defaultLabel="Todos"
          selectedValue={filtroValue}
          options={[
            { value: 'all', label: 'Todos' },
            { value: 'option1', label: 'Opción 1' }
          ]}
          onSelect={(value) => setFiltroValue(value)}
        />
        
        <SelectableGhostButton
          title="Ordenar"
          icon={<FILTER_ICONS.FILTER className="w-4 h-4" />}
          defaultLabel="Más Recientes"
          selectedValue={sortBy}
          options={[
            { value: 'date_desc', label: 'Más Recientes' },
            { value: 'date_asc', label: 'Más Antiguos' }
          ]}
          onSelect={(value) => setSortBy(value)}
        />
      </div>
    }
    rightContent={
      <Button onClick={() => openModal('tipo', {})}>
        <Plus className="w-4 h-4 mr-2" />
        Crear Nuevo
      </Button>
    }
  />
</div>
```

### 4. IMPORTANTE: La prop es `leftContent` y `rightContent`, NO `children`

### 5. MANTENER Layout simple sin headerProps:
```typescript
return (
  <Layout>
    <div className="space-y-6">
      {/* ActionBar aquí */}
      {/* Resto del contenido */}
    </div>
  </Layout>
)
```

### 6. Header con selector de proyectos
El header ya está configurado en HeaderDesktop.tsx para mostrar el selector de proyectos en TODAS las páginas (organization, design, construction, finances).

### 7. Páginas de referencia a revisar:
- src/pages/construction/ConstructionMaterials.tsx - Ejemplo perfecto de implementación
- src/pages/organization/OrganizationProjects.tsx - Ejemplo con filtros específicos

## Errores comunes a evitar:
- NO usar props como `children` en ActionBarDesktopRow
- NO mantener código de ActionBarDesktop
- NO mantener headerProps en Layout
- SIEMPRE usar SelectableGhostButton para filtros
- SIEMPRE envolver en `<div className="hidden md:block">`