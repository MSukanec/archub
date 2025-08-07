import { useState, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'

import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useConstructionMaterials } from '@/hooks/use-construction-materials'
import { useNavigationStore } from '@/stores/navigationStore'
import { useEffect } from 'react'
import { Package, ShoppingCart } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CommercialCalculationPopover } from '@/components/construction/CommercialCalculationPopover'

export default function ConstructionMaterials() {
  const [activeTab, setActiveTab] = useState('materials')
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState("category")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedPhase, setSelectedPhase] = useState("")
  const [groupingType, setGroupingType] = useState('categories')
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: materialsResult, isLoading: materialsLoading } = useConstructionMaterials(
    userData?.preferences?.last_project_id || '',
    selectedPhase
  )
  
  const materials = materialsResult?.materials || []
  const phases = materialsResult?.phases || []
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(materials.map(m => m.category_name))).sort()

  // Filter and sort materials with groupKey
  const filteredMaterials = materials
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

  // Header tabs configuration
  const headerTabs = [
    {
      id: "materials",
      label: "Lista de Materiales",
      isActive: activeTab === "materials"
    },
    {
      id: "purchase-orders", 
      label: "Órdenes de Compra",
      isActive: activeTab === "purchase-orders"
    }
  ]

  const headerProps = {
    title: "Materiales de Construcción",
    tabs: headerTabs,
    onTabChange: setActiveTab
  }

  // Columnas dinámicas - ocultar categoría cuando se agrupa por categorías
  const columns = useMemo(() => {
    const baseColumns = [
      {
        key: 'category_name',
        label: 'Categoría',
        width: '15%',
        render: (material: any) => (
        )
      },
      {
        key: 'name',
        label: 'Nombre',
        width: groupingType === 'categories' ? '35%' : '25%', // Más ancho cuando no hay categoría
        render: (material: any) => (
        )
      },
      {
        key: 'brand',
        label: 'Marca',
        width: groupingType === 'categories' ? '13%' : '10%', // Igual que las demás cuando agrupado
        render: (material: any) => (
        )
      },
      {
        key: 'model',
        label: 'Modelo',
        width: groupingType === 'categories' ? '13%' : '10%', // Igual que las demás cuando agrupado
        render: (material: any) => (
        )
      },
      {
        key: 'computed_quantity',
        label: 'Cómputo Técnico',
        width: groupingType === 'categories' ? '20%' : '25%', // Reducido para hacer espacio a la nueva columna
        render: (material: any) => {
          const unit = material.unit_name || 'unidad'
          return (
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
                - {material.unit_name || 'unidad'}
              </span>
            )
          }

          // Mostrar el cómputo comercial calculado con botón de cálculo
          return (
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

  if (isLoading || materialsLoading) {
    return (
      <Layout headerProps={headerProps} wide>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      {/* Tab Content */}
      {activeTab === 'materials' && (
        <>
          {filteredMaterials.length === 0 ? (
            <EmptyState
              description="Los materiales aparecerán aquí cuando agregues tareas de construcción que contengan materiales al proyecto"
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
                    <div>
                      <Select value={selectedPhase} onValueChange={setSelectedPhase}>
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
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                ),
                showClearFilters: true,
                onClearFilters: () => {
                  setSelectedPhase("")
                  setSelectedCategory("")
                }
              }}
              renderGroupHeader={(groupKey: string, groupRows: any[]) => (
                <>
                    {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Material' : 'Materiales'})
                  </div>
                </>
              )}
            />
          )}
        </>
      )}

      {activeTab === 'purchase-orders' && (
          <CustomRestricted reason="coming_soon">
                Esta funcionalidad estará disponible próximamente. Aquí podrás gestionar órdenes de compra, 
                proveedores y hacer seguimiento de tus pedidos de materiales.
              </p>
            </div>
          </CustomRestricted>
        </div>
      )}
    </Layout>
  )
}