🧱 Layout Base

Todas las páginas deben usar <CustomPageLayout /> como wrapper principal.

Este layout recibe props clave como:

icon: ícono de Lucide React (ej: DollarSign, FileText, etc.)

title: título de la página (string)

actions: botones a la derecha del título

showSearch: booleano para mostrar campo de búsqueda

searchValue y onSearchChange: controlan el input

customFilters: filtros dinámicos en dropdown

onClearFilters: botón separado que limpia todos los filtros

🔍 Filtros dinámicos

El filtro debe ser un DropdownMenu que incluya:

Select para ordenar por algún campo

Select para dirección (asc, desc)

Select para filtrar por tipo (si aplica)

Switch para flags como “Solo favoritos” o “Solo conversiones”

Los valores de estos filtros deben guardarse con useState

📄 Contenido principal

El contenido debe ir dentro de <CustomPageLayout>...</CustomPageLayout>

Si es una lista, debe renderizarse con <CustomTable />

Si isLoading es true, el CustomTable debe mostrar skeletons

Si data.length === 0, debe mostrarse el emptyState que viene por prop

📦 CustomTable

Recibe columns, data, isLoading, emptyState

Cada columna puede tener render(item) para personalizar la celda

En mobile, el layout cambia automáticamente a “cards”

📁 Estructura mínima del archivo de página

export default function NombrePagina() {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('fecha')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filtroX, setFiltroX] = useState('')

  const { data = [], isLoading } = useQuery(...)

  const filteredData = aplicarFiltros(data)

  const customFilters = (
    <div className="space-y-4 w-[288px]">
      {/* Selects, Switch, etc */}
    </div>
  )

  const columns = [
    { key: 'nombre', label: 'Nombre', render: item => <span>{item.nombre}</span> },
    ...
  ]

  const emptyState = (
    <div className="text-center py-12">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-2 text-muted-foreground">No hay resultados</p>
      <Button className="mt-4">Crear nuevo</Button>
    </div>
  )

  return (
    <CustomPageLayout
      icon={Icono}
      title="Título de Página"
      actions={[<Button key="nuevo">Nuevo</Button>]}
      showSearch
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      customFilters={customFilters}
      onClearFilters={() => { ... }}
    >
      <CustomTable columns={columns} data={filteredData} isLoading={isLoading} emptyState={emptyState} />
    </CustomPageLayout>
  )
}

✅ Buenas prácticas

Usar componentes de ShadCN (Select, Switch, Badge, Avatar, etc.)

Separar los modales en archivos propios (ej: NewMovementModal.tsx)

Mantener los textos pequeños (text-xs, text-sm) y bien alineados

Agregar íconos a los botones si aplica (<Plus className="mr-2" />)

Evitar lógicas de render dentro del JSX principal: usar funciones auxiliares