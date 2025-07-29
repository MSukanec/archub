import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useNavigationStore } from '@/stores/navigationStore'
import { BarChart3, Search, Layers, Grid, TableIcon, Users, Package, DollarSign } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'

export default function ConstructionCostAnalysis() {
  const [searchValue, setSearchValue] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [activeTab, setActiveTab] = useState("tareas")

  
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  // Get unique categories for filters (use category_name field)
  const uniqueCategories = Array.from(new Set(tasks.map(t => t.category_name).filter(Boolean))).sort()

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name_rendered.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.code.toLowerCase().includes(searchValue.toLowerCase()) ||
      (task.category_name && task.category_name.toLowerCase().includes(searchValue.toLowerCase()))
    
    const matchesCategory = !selectedCategory || task.category_name === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue("")
    setSelectedCategory("")
  }

  const hasActiveFilters = searchValue.trim() !== "" || selectedCategory !== ""

  const features = [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "Análisis de Costos por Categoría",
      description: "Visualiza y compara los costos de tareas organizadas por categorías y subcategorías específicas."
    },
    {
      icon: <Search className="w-4 h-4" />,
      title: "Búsqueda Avanzada de Tareas",
      description: "Encuentra rápidamente tareas específicas usando códigos, nombres, rubros o categorías."
    },
    {
      icon: <Layers className="w-4 h-4" />,
      title: "Filtrado por Rubros",
      description: "Organiza y filtra las tareas por diferentes rubros de construcción para mejor análisis."
    },
    {
      icon: <Grid className="w-4 h-4" />,
      title: "Vista Comparativa de Costos",
      description: "Compara costos unitarios y cantidades entre diferentes tareas del mismo tipo."
    }
  ]



  // Table columns configuration - similar to AdminGeneratedTasks
  const columns = [
    {
      key: 'code',
      label: 'Código',
      width: '5%',
      render: (task: any) => (
        <span className="text-xs font-mono text-muted-foreground">{task.code}</span>
      )
    },
    {
      key: 'category_name',
      label: 'Rubro',
      width: '10%',
      render: (task: any) => (
        <Badge variant="outline" className="text-xs">
          {task.category_name || 'Sin categoría'}
        </Badge>
      )
    },
    {
      key: 'name_rendered',
      label: 'Tarea',
      render: (task: any) => (
        <span className="text-sm">{task.name_rendered}</span>
      )
    },
    {
      key: 'unit_name',
      label: 'Unidad',
      width: '5%',
      render: (task: any) => (
        <Badge variant="secondary" className="text-xs">
          {task.unit_name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha',
      width: '10%',
      render: (task: any) => (
        <span className="text-xs text-muted-foreground">
          {new Date(task.created_at).toLocaleDateString('es-ES')}
        </span>
      )
    }
  ]

  // Custom filters for ActionBar (similar to AdminGeneratedTasks)
  const customFilters = (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium text-muted-foreground">
          Filtrar por categoría
        </Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las categorías</SelectItem>
            {uniqueCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  if (tasksLoading) {
    return (
      <Layout wide>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando análisis de costos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide>
      <div className="space-y-6">
        {/* ActionBar with Tabs */}
        <ActionBarDesktop
          title="Análisis de Costos"
          icon={<BarChart3 className="w-6 h-6" />}
          features={features}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          customFilters={customFilters}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          showProjectSelector={false}
          tabs={[
            { value: 'tareas', label: 'Tareas', icon: <TableIcon className="h-4 w-4" /> },
            { value: 'mano-obra', label: 'Mano de Obra', icon: <Users className="h-4 w-4" /> },
            { value: 'materiales', label: 'Materiales', icon: <Package className="h-4 w-4" /> },
            { value: 'indirectos', label: 'Indirectos', icon: <DollarSign className="h-4 w-4" /> }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        {activeTab === 'tareas' && (
          <div className="space-y-6">
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={<TableIcon className="h-16 w-16" />}
                title="No hay tareas para analizar"
                description="Las tareas parametrizadas aparecerán aquí para análisis de costos."
              />
            ) : (
              <Table
                data={filteredTasks}
                columns={columns}
                isLoading={tasksLoading}
              />
            )}
          </div>
        )}

        {activeTab === 'mano-obra' && (
          <div className="space-y-6">
            <CustomRestricted
              reason="coming_soon"
              className="min-h-[400px] flex items-center justify-center"
            >
              <EmptyState
                icon={<Users className="h-16 w-16" />}
                title="Análisis de Mano de Obra"
                description="Funcionalidad coming soon"
              />
            </CustomRestricted>
          </div>
        )}

        {activeTab === 'materiales' && (
          <div className="space-y-6">
            <CustomRestricted
              reason="coming_soon"
              className="min-h-[400px] flex items-center justify-center"
            >
              <EmptyState
                icon={<Package className="h-16 w-16" />}
                title="Análisis de Materiales"
                description="Funcionalidad coming soon"
              />
            </CustomRestricted>
          </div>
        )}

        {activeTab === 'indirectos' && (
          <div className="space-y-6">
            <CustomRestricted
              reason="coming_soon"
              className="min-h-[400px] flex items-center justify-center"
            >
              <EmptyState
                icon={<DollarSign className="h-16 w-16" />}
                title="Análisis de Costos Indirectos"
                description="Funcionalidad coming soon"
              />
            </CustomRestricted>
          </div>
        )}
      </div>
    </Layout>
  )
}