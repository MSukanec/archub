import { useState, useMemo } from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Button } from '@/components/ui/button'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useConstructionMaterials } from '@/hooks/use-construction-materials'
import { useBudgetItems } from '@/hooks/use-budget-items'
import { Package, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CommercialCalculationPopover } from '@/components/construction/CommercialCalculationPopover'

interface BudgetMaterialsTabProps {
  budget: any
  onNavigateToTasks?: () => void
}

export function BudgetMaterialsTab({ budget, onNavigateToTasks }: BudgetMaterialsTabProps) {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState("category")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedPhase, setSelectedPhase] = useState("")
  const [groupingType, setGroupingType] = useState('categories')
  
  const { data: userData, isLoading } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { data: budgetItems = [], isLoading: budgetItemsLoading } = useBudgetItems(budget?.id)
  
  // Extract budget task IDs (filter out null values)
  const budgetTaskIds = useMemo(() => {
    if (!budgetItems || budgetItems.length === 0) {
      return []
    }
    return budgetItems
      .map(item => item.task_id)
      .filter((taskId): taskId is string => taskId !== null && taskId !== undefined)
  }, [budgetItems])

  const { data: materialsResult, isLoading: materialsLoading } = useConstructionMaterials(
    selectedProjectId || '',
    selectedPhase,
    budgetTaskIds.length > 0 ? budgetTaskIds : undefined // Only filter if we have task IDs
  )
  
  const materials = materialsResult?.materials || []
  const phases = materialsResult?.phases || []

  // Los materiales ya vienen filtrados por task_ids específicos del presupuesto desde useConstructionMaterials
  const budgetSpecificMaterials = materials || []

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(budgetSpecificMaterials.map(m => m.category_name))).sort()

  // Filter and sort materials with groupKey
  const filteredMaterials = budgetSpecificMaterials
    .filter((material) => {
      const matchesSearch = material.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        material.category_name.toLowerCase().includes(searchValue.toLowerCase())
      const matchesCategory = !selectedCategory || material.category_name === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'category') return a.category_name.localeCompare(b.category_name)
      if (sortBy === 'quantity') return b.computed_quantity - a.computed_quantity
      return a.category_name.localeCompare(b.category_name)
    })
    .map(material => {
      // Agregar groupKey según el tipo de agrupación
      let groupKey = 'Sin grupo';
      
      switch (groupingType) {
        case 'categories':
          groupKey = material.category_name || 'Sin categoría';
          break;
        case 'materials':
          groupKey = material.name || 'Sin nombre';
          break;
        default:
          groupKey = 'Sin grupo';
      }
      
      return { ...material, groupKey };
    })


  // Columnas dinámicas - ocultar categoría cuando se agrupa por categorías
  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: 'category_name',
        label: 'Categoría',
        width: '15%',
        render: (material: any) => (
          <span className="text-sm font-medium">{material.category_name}</span>
        )
      },
      {
        key: 'name',
        label: 'Nombre',
        width: groupingType === 'categories' ? '35%' : '25%', // Más ancho cuando no hay categoría
        render: (material: any) => (
          <span className="text-sm">{material.name}</span>
        )
      },
      {
        key: 'brand',
        label: 'Marca',
        width: groupingType === 'categories' ? '13%' : '10%', // Igual que las demás cuando agrupado
        render: (material: any) => (
          <span className="text-sm text-muted-foreground">Indefinido</span>
        )
      },
      {
        key: 'model',
        label: 'Modelo',
        width: groupingType === 'categories' ? '13%' : '10%', // Igual que las demás cuando agrupado
        render: (material: any) => (
          <span className="text-sm text-muted-foreground">Indefinido</span>
        )
      },
      {
        key: 'computed_quantity',
        label: 'Cómputo Técnico',
        width: groupingType === 'categories' ? '20%' : '25%', // Reducido para hacer espacio a la nueva columna
        render: (material: any) => {
          const unit = material.unit_name || 'unidad'
          return (
            <span className="text-sm font-medium">
              {material.computed_quantity.toFixed(2)} {unit}
            </span>
          )
        }
      },
      {
        key: 'commercial_quantity',
        label: 'Cómputo Comercial',
        width: groupingType === 'categories' ? '20%' : '25%', // Mismo ancho que Cómputo Técnico
        render: (material: any) => {
          // Si no hay unidad comercial definida, mostrar guión
          if (!material.commercial_unit_name || !material.commercial_quantity) {
            return (
              <span className="text-sm text-muted-foreground">
                - {material.unit_name || 'unidad'}
              </span>
            )
          }

          // Mostrar el cómputo comercial calculado con botón de cálculo
          return (
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm font-medium">
                {material.commercial_quantity} {material.commercial_unit_name}
              </span>
              <CommercialCalculationPopover material={material} />
            </div>
          )
        }
      }
    ];

    // Ocultar columna de categoría cuando se agrupa por categorías
    if (groupingType === 'categories') {
      return baseColumns.filter(col => col.key !== 'category_name');
    }

    return baseColumns;
  }, [groupingType])

  if (isLoading || materialsLoading || budgetItemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Cargando materiales...</div>
      </div>
    )
  }

  return (
    <>
      {budgetTaskIds.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-muted-foreground" />}
          title="No hay tareas en este presupuesto"
          description={`Para ver materiales, primero agrega tareas de construcción al presupuesto "${budget?.name || 'este presupuesto'}". Los materiales se calcularán automáticamente basándose en las tareas incluidas.`}
          action={onNavigateToTasks && (
            <Button 
              onClick={onNavigateToTasks}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Tareas
            </Button>
          )}
        />
      ) : filteredMaterials.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-muted-foreground" />}
          title="No hay materiales para las tareas seleccionadas"
          description={`Las tareas en este presupuesto no requieren materiales, o los filtros aplicados no coinciden con ningún material.`}
        />
      ) : (
        <Table
          data={filteredMaterials}
          columns={columns}
          isLoading={materialsLoading}
          mode="construction"
          groupBy={groupingType === 'none' ? undefined : 'groupKey'}
          topBar={{
            tabs: ['Sin Agrupar', 'Por Categorías'],
            activeTab: groupingType === 'none' ? 'Sin Agrupar' : 'Por Categorías',
            onTabChange: (tab: string) => {
              if (tab === 'Sin Agrupar') setGroupingType('none')
              else setGroupingType('categories')
            },
            showFilter: true,
            isFilterActive: selectedPhase !== '' || selectedCategory !== '',
            renderFilterContent: () => (
              <>
                <div>
                  <Label className="text-xs font-medium mb-2 block">Fase</Label>
                  <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas las fases" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas las fases</SelectItem>
                      {phases.map((phase) => (
                        <SelectItem key={phase} value={phase}>
                          {phase}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-2 block">Categoría</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-8 text-xs">
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
              </>
            ),
            onClearFilters: () => {
              setSelectedPhase("")
              setSelectedCategory("")
            }
          }}
          renderGroupHeader={(groupKey: string, groupRows: any[]) => (
            <>
              <div className="col-span-full text-sm font-medium">
                {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Material' : 'Materiales'})
              </div>
            </>
          )}
        />
      )}
    </>
  )
}