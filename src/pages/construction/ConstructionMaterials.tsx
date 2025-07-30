import { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useConstructionMaterials } from '@/hooks/use-construction-materials'
import { useNavigationStore } from '@/stores/navigationStore'
import { useEffect } from 'react'
import { Package, Search, Calculator, Boxes, BarChart3, Layers, Filter, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function ConstructionMaterials() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState("category")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [groupingType, setGroupingType] = useState('categories')
  
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

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue("")
    setSortBy("category")
    setSelectedCategory("")
  }

  // Detect active filters
  const hasActiveFilters = searchValue.trim() !== "" || selectedCategory !== ""

  // Custom filters for ActionBar (like in movements page)
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

  const headerProps = {
    title: "Materiales"
  }

  // Table columns configuration
  const columns = [
    {
      key: 'category_name',
      label: 'Categoría',
      width: '20%',
      render: (material: any) => (
        <span className="text-sm font-medium">{material.category_name}</span>
      )
    },
    {
      key: 'name',
      label: 'Nombre',
      width: '35%',
      render: (material: any) => (
        <span className="text-sm">{material.name}</span>
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
  ]

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
      {/* Action Bar Desktop - siempre visible */}
      <ActionBarDesktop
        title="Materiales de Construcción"
        icon={<Package className="w-6 h-6" />}
        features={[
          {
            icon: <Calculator className="w-4 h-4" />,
            title: "Cálculo Automático",
            description: "Las cantidades se calculan automáticamente basándose en las tareas de construcción del proyecto."
          },
          {
            icon: <Boxes className="w-4 h-4" />,
            title: "Organización por Categoría",
            description: "Los materiales se organizan por categoría y rubro para una mejor gestión."
          },
          {
            icon: <BarChart3 className="w-4 h-4" />,
            title: "Control de Compras",
            description: "Seguimiento de materiales por comprar versus materiales necesarios del proyecto."
          },
          {
            icon: <Layers className="w-4 h-4" />,
            title: "Filtros Flexibles",
            description: "Sistema de filtros por categoría y agrupación para encontrar materiales específicos."
          }
        ]}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        customFilters={customFilters}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        showGrouping={true}
        groupingType={groupingType}
        onGroupingChange={setGroupingType}
        groupingOptions={[
          { value: 'categories', label: 'Agrupar por Categorías' },
          { value: 'materials', label: 'Agrupar por Materiales' },
          { value: 'none', label: 'Sin Agrupación' }
        ]}
        customActions={[]}
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
    </Layout>
  )
}