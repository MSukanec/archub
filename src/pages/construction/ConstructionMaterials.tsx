import { useState, useMemo } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { ActionBarDesktopRow } from '@/components/layout/desktop/ActionBarDesktopRow'
import { CustomRestricted } from '@/components/ui-custom/CustomRestricted'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useConstructionMaterials } from '@/hooks/use-construction-materials'
import { useNavigationStore } from '@/stores/navigationStore'
import { useEffect } from 'react'
import { Package, Search, Filter, ShoppingCart } from 'lucide-react'

export default function ConstructionMaterials() {
  const [activeTab, setActiveTab] = useState('materials')
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState("category")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [groupingType, setGroupingType] = useState('none')
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: materials = [], isLoading: materialsLoading } = useConstructionMaterials(
    userData?.preferences?.last_project_id || ''
  )
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
          <span className="text-sm font-medium">{material.category_name}</span>
        )
      },
      {
        key: 'name',
        label: 'Nombre',
        width: '30%',
        render: (material: any) => (
          <span className="text-sm">{material.name}</span>
        )
      },
      {
        key: 'unit',
        label: 'Unidad',
        width: '10%',
        render: (material: any) => (
          <span className="text-sm text-muted-foreground">{material.unit || 'unidad'}</span>
        )
      },
      {
        key: 'computed_quantity',
        label: 'Cantidad Computada',
        width: '15%',
        render: (material: any) => (
          <span className="text-sm font-medium">{material.computed_quantity.toFixed(2)}</span>
        )
      },
      {
        key: 'purchased_quantity',
        label: 'Cantidad Comprada',
        width: '15%',
        render: (material: any) => (
          <span className="text-sm text-muted-foreground">
            {material.purchased_quantity.toFixed(2)}
          </span>
        )
      },
      {
        key: 'to_purchase_quantity',
        label: 'Cantidad A Comprar',
        width: '15%',
        render: (material: any) => (
          <span className="text-sm text-muted-foreground">
            {material.to_purchase_quantity.toFixed(2)}
          </span>
        )
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
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-muted-foreground">Cargando materiales...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps} wide>
      {/* Tab Content */}
      {activeTab === 'materials' && (
        <>
          {/* ActionBar */}
          <ActionBarDesktopRow
            filters={[
              {
                key: 'category',
                label: 'Categoría',
                icon: Filter,
                value: selectedCategory,
                setValue: (value) => {
                  setSelectedCategory(value || '')
                },
                options: uniqueCategories,
                defaultLabel: 'Todas las categorías'
              },
              {
                key: 'grouping',
                label: 'Agrupación',
                icon: Filter,
                value: groupingType === 'categories' ? 'Agrupar por Categorías' : '',
                setValue: (value) => {
                  if (value === 'Agrupar por Categorías') setGroupingType('categories')
                  else setGroupingType('none')
                },
                options: ['Agrupar por Categorías'],
                defaultLabel: 'Sin Agrupación'
              }
            ]}
            actions={[]}
          />

          {filteredMaterials.length === 0 ? (
            <EmptyState
              icon={<Package className="w-8 h-8 text-muted-foreground" />}
              title="No hay materiales disponibles"
              description="Los materiales aparecerán aquí cuando agregues tareas de construcción que contengan materiales al proyecto"
            />
          ) : (
            <Table
              data={filteredMaterials}
              columns={columns}
              isLoading={materialsLoading}
              mode="construction"
              groupBy={groupingType === 'none' ? undefined : 'groupKey'}
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
      )}

      {activeTab === 'purchase-orders' && (
        <div className="space-y-6">
          <CustomRestricted reason="coming_soon">
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Órdenes de Compra</h3>
              <p className="text-muted-foreground text-center max-w-md">
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