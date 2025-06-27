# Page Template Standard – Archub

## Estructura general

Todas las nuevas páginas deben:

1. Estar ubicadas en `src/pages/`.
2. Utilizar el componente `Layout` como wrapper general.
3. Usar la prop `headerProps` para configurar el `Header`.
4. En el caso de usar una tabla, usar src/components/ui-custom/misc/CustomTable.tsx.
5. En el caso de usuar un modal, usar la guia de src/prompts/ai-modal-template.md.

## Ejemplo base de una página

```tsx
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function Ejemplo() {
  const [searchValue, setSearchValue] = useState("")

  const headerProps = {
    title: "Nombre de la Página",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    filters: [
      { label: "Filtro A", onClick: () => {} },
      { label: "Filtro B", onClick: () => {} }
    ],
    onClearFilters: () => setSearchValue(""),
    actions: (
      <Button className="h-8 px-3 text-sm">
        Acción
      </Button>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      {/* contenido principal de la página */}
      <div className="p-4">Contenido</div>
    </Layout>
  )
}
Notas importantes:

El contenido no necesita tener padding adicional, ya que el <main> lo incluye automáticamente (px-4 py-6).

Las acciones, filtros y búsqueda deben estar en headerProps, no dentro del contenido.

El título debe ser parte del header, no dentro del contenido.