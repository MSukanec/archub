import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useMaterials, useDeleteMaterial } from '@/hooks/use-materials'
import { useNavigationStore } from '@/stores/navigationStore'
import { BarChart3, TableIcon, Users, Package, DollarSign, Edit, Trash2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import { Selector } from '@/components/ui-custom/Selector'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'

export default function ConstructionCostAnalysis() {
  const [activeTab, setActiveTab] = useState("tareas")
  const [dataType, setDataType] = useState("todos")

  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks()
  const { data: materials = [], isLoading: materialsLoading } = useMaterials()
  const deleteMaterialMutation = useDeleteMaterial()
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  // Filter tasks (no search filtering since search is removed)
  const filteredTasks = tasks

  // Filter materials by type only (no search filtering)
  const filteredMaterials = materials.filter((material) => {
    let matchesType = true
    if (dataType === "sistema") {
      matchesType = material.is_system === true
    } else if (dataType === "organizacion") {
      matchesType = material.is_system === false && material.organization_id !== null
    }
    // "todos" shows all materials regardless of type
    
    return matchesType
  })

  // Data type selector options
  const dataTypeOptions = [
    { value: "todos", label: "Todos" },
    { value: "sistema", label: "Del Sistema" },
    { value: "organizacion", label: "De la Organización" }
  ]

  // Header tabs configuration
  const headerTabs = [
    {
      id: "tareas",
      label: "Tareas",
      icon: <TableIcon className="h-4 w-4" />,
      isActive: activeTab === "tareas"
    },
    {
      id: "mano-obra",
      label: "Mano de Obra",
      icon: <Users className="h-4 w-4" />,
      isActive: activeTab === "mano-obra"
    },
    {
      id: "materiales",
      label: "Materiales",
      icon: <Package className="h-4 w-4" />,
      isActive: activeTab === "materiales"
    },
    {
      id: "indirectos",
      label: "Indirectos",
      icon: <DollarSign className="h-4 w-4" />,
      isActive: activeTab === "indirectos"
    }
  ]

  // Header configuration
  const headerProps = {
    title: "Análisis de Costos",
    icon: BarChart3,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
    // Add action button based on active tab
    ...(activeTab === 'materiales' && {
      actionButton: {
        label: "Crear Material",
        icon: Plus,
        onClick: () => openModal('material-form', {}),
        variant: "default" as const
      }
    }),
    ...(activeTab === 'tareas' && {
      actionButton: {
        label: "Crear Tarea Personalizada",
        icon: Plus,
        onClick: () => openModal('parametric-task', {}),
        variant: "default" as const
      }
    })
  }



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
          {/* Solo mostrar botón eliminar si NO es del sistema y pertenece a la organización */}
          {!task.is_system && task.organization_id === userData?.organization?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                showDeleteConfirmation({
                  title: "Eliminar tarea",
                  description: `¿Estás seguro de que quieres eliminar "${task.name_rendered || 'esta tarea'}"?`,
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
          )}
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
      width: '12%',
      render: (material: any) => (
        <Badge variant="secondary" className="text-xs">
          {material.unit?.name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'archub_average_cost',
      label: 'Costo Promedio de Archub',
      width: '18%',
      render: (material: any) => (
        <div className="text-xs text-muted-foreground italic">
          Próximamente
        </div>
      )
    },
    {
      key: 'own_cost',
      label: 'Costo Propio',
      width: '15%',
      render: (material: any) => {
        // Buscar el precio del material en organization_material_prices
        const materialPrice = material.organization_material_prices?.[0]
        if (materialPrice?.unit_price && materialPrice?.currency) {
          const formattedPrice = Number(materialPrice.unit_price).toFixed(2)
          return (
            <div className="text-sm font-medium">
              {materialPrice.currency.symbol} {formattedPrice}
            </div>
          )
        }
        return (
          <div className="text-xs text-muted-foreground">
            Sin precio
          </div>
        )
      }
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
          {/* Solo mostrar botón eliminar si NO es del sistema y pertenece a la organización */}
          {!material.is_system && material.organization_id === userData?.organization?.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                showDeleteConfirmation({
                  title: "Eliminar material",
                  description: `¿Estás seguro de que quieres eliminar "${material.name || 'este material'}"?`,
                  itemName: material.name || 'este material',
                  onConfirm: () => {
                    deleteMaterialMutation.mutate(material.id)
                  }
                })
              }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )
    }
  ]



  if (tasksLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando análisis de costos...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Data type selector for materials tab */}
        {activeTab === 'materiales' && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Tipo de material:</span>
            <Selector
              options={dataTypeOptions}
              value={dataType}
              onValueChange={setDataType}
              className="h-8"
            />
          </div>
        )}

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
            <div className="min-h-[400px] flex items-center justify-center">
              <CustomRestricted reason="coming_soon">
                <EmptyState
                  icon={<Users className="h-16 w-16" />}
                  title="Análisis de Mano de Obra"
                  description="Funcionalidad coming soon"
                />
              </CustomRestricted>
            </div>
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
            <div className="min-h-[400px] flex items-center justify-center">
              <CustomRestricted reason="coming_soon">
                <EmptyState
                  icon={<DollarSign className="h-16 w-16" />}
                  title="Análisis de Costos Indirectos"
                  description="Funcionalidad coming soon"
                />
              </CustomRestricted>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}