import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useMaterials, useDeleteMaterial } from '@/hooks/use-materials'
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
  const deleteMaterialMutation = useDeleteMaterial()
  const { setSidebarContext } = useNavigationStore()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [setSidebarContext])

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = (task.name_rendered?.toLowerCase() || '').includes(searchValue.toLowerCase()) ||
      (task.code?.toLowerCase() || '').includes(searchValue.toLowerCase()) ||
      (task.category_name?.toLowerCase() || '').includes(searchValue.toLowerCase())
    
    return matchesSearch
  })

  // Filter materials by type and search
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch = (material.name?.toLowerCase() || '').includes(searchValue.toLowerCase()) ||
      (material.category?.name?.toLowerCase() || '').includes(searchValue.toLowerCase())
    
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
      title: "Análisis de Costos por Categoría",
      description: "Visualiza y compara los costos de tareas organizadas por categorías y subcategorías específicas."
    },
    {
      title: "Búsqueda Avanzada de Tareas",
      description: "Encuentra rápidamente tareas específicas usando códigos, nombres, rubros o categorías."
    },
    {
      title: "Filtrado por Rubros",
      description: "Organiza y filtra las tareas por diferentes rubros de construcción para mejor análisis."
    },
    {
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
      )
    },
    {
      key: 'category_name',
      label: 'Rubro',
      width: '10%',
      render: (task: any) => (
          {task.category_name || 'Sin categoría'}
        </Badge>
      )
    },
    {
      key: 'name_rendered',
      label: 'Tarea',
      render: (task: any) => (
      )
    },
    {
      key: 'unit_name',
      label: 'Unidad',
      width: '5%',
      render: (task: any) => (
          {task.unit_name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (task: any) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('parametric-task', { taskId: task.id })}
          >
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
            >
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
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      width: '20%',
      render: (material: any) => (
          {material.category?.name || 'Sin categoría'}
        </Badge>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      width: '12%',
      render: (material: any) => (
          {material.unit?.name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'archub_average_cost',
      label: 'Costo Promedio de Archub',
      width: '18%',
      render: (material: any) => (
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
              {materialPrice.currency.symbol} {formattedPrice}
            </div>
          )
        }
        return (
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal('material-form', { editingMaterial: material })}
          >
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
            >
            </Button>
          )}
        </div>
      )
    }
  ]



  if (tasksLoading) {
    return (
      <Layout wide>
        </div>
      </Layout>
    )
  }

  return (
    <Layout wide>
        {/* ActionBar with Tabs */}
        <ActionBarDesktop
          features={features}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          showProjectSelector={false}
          primaryActionLabel={
            activeTab === 'materiales' ? "Crear Material" : 
            activeTab === 'tareas' ? "Crear Tarea Personalizada" : 
            undefined
          }
          onPrimaryActionClick={
            activeTab === 'materiales' ? () => openModal('material-form', {}) :
            activeTab === 'tareas' ? () => openModal('parametric-task', {}) :
            undefined
          }
          customGhostButtons={[
              <Selector
                options={dataTypeOptions}
                value={dataType}
                onValueChange={setDataType}
              />
            </div>
          ]}
          tabs={[
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        {activeTab === 'tareas' && (
            {filteredTasks.length === 0 ? (
              <EmptyState
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
              <CustomRestricted reason="coming_soon">
                <EmptyState
                  description="Funcionalidad coming soon"
                />
              </CustomRestricted>
            </div>
          </div>
        )}

        {activeTab === 'materiales' && (
            {filteredMaterials.length === 0 ? (
              <EmptyState
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
              <CustomRestricted reason="coming_soon">
                <EmptyState
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