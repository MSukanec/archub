import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useMaterials } from '@/hooks/use-materials'
import { useNavigationStore } from '@/stores/navigationStore'
import { BarChart3, Search, Layers, Grid, TableIcon, Users, Package, DollarSign, Edit, Trash2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import { Selector } from '@/components/ui-custom/Selector'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'

export default function ConstructionCostAnalysis() {
  const [searchValue, setSearchValue] = useState("")
  const [activeTab, setActiveTab] = useState("tareas")
  const [dataType, setDataType] = useState("todos")

  
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { data: materials = [], isLoading: materialsLoading } = useMaterials()
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name_rendered.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.code.toLowerCase().includes(searchValue.toLowerCase()) ||
      (task.category_name && task.category_name.toLowerCase().includes(searchValue.toLowerCase()))
    
    return matchesSearch
  })

  // Filter materials by type and search
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = material.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      (material.category?.name && material.category.name.toLowerCase().includes(searchValue.toLowerCase()))
    
    let matchesType = true
    if (dataType === "sistema") {
      matchesType = material.is_system === true
    } else if (dataType === "organizacion") {
      matchesType = material.is_system === false && material.organization_id !== null
    }
    // "todos" shows all materials regardless of type
    
    return matchesSearch && matchesType
  })

  // Data type selector options
  const dataTypeOptions = [
    { value: "todos", label: "Todos" },
    { value: "sistema", label: "Del Sistema" },
    { value: "organizacion", label: "De la Organización" }
  ]



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
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (task: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('parametric-task', { taskId: task.id })}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              showDeleteConfirmation({
                itemName: task.name_rendered || 'esta tarea',
                onConfirm: () => {
                  // TODO: Implementar eliminación de tarea
                  console.log('Eliminar tarea:', task.id)
                }
              })
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  // Materials table columns configuration
  const materialsColumns = [
    {
      key: 'name',
      label: 'Material',
      render: (material: any) => (
        <span className="text-sm font-medium">{material.name}</span>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      width: '20%',
      render: (material: any) => (
        <Badge variant="outline" className="text-xs">
          {material.category?.name || 'Sin categoría'}
        </Badge>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      width: '15%',
      render: (material: any) => (
        <Badge variant="secondary" className="text-xs">
          {material.unit?.name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (material: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('material-form', { editingMaterial: material })}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              showDeleteConfirmation({
                itemName: material.name || 'este material',
                onConfirm: () => {
                  // TODO: Implementar eliminación de material
                  console.log('Eliminar material:', material.id)
                }
              })
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]



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
          showProjectSelector={false}
          customGhostButtons={[
            <div key="data-type-selector" className="flex items-center">
              <Selector
                options={dataTypeOptions}
                value={dataType}
                onValueChange={setDataType}
                className="h-8"
              />
            </div>
          ]}
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
            {filteredMaterials.length === 0 ? (
              <EmptyState
                icon={<Package className="h-16 w-16" />}
                title="No hay materiales que coincidan"
                description="No se encontraron materiales que coincidan con los filtros seleccionados."
              />
            ) : (
              <Table
                data={filteredMaterials}
                columns={materialsColumns}
                isLoading={materialsLoading}
              />
            )}
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