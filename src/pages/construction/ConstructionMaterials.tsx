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
  const [groupBy, setGroupBy] = useState("none")
  
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

  // Filter and sort materials
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

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue("")
    setSortBy("category")
    setSelectedCategory("")
  }

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

  // Detect active filters
  const hasActiveFilters = searchValue.trim() !== "" || selectedCategory !== ""



  const headerProps = {
    title: "Materiales"
  }

  // Table columns configuration
  const columns = [
    {
      key: 'category_name',
      label: 'Categoría',
      render: (material: any) => (
        <span className="text-sm font-medium">{material.category_name}</span>
      )
    },
    {
      key: 'name',
      label: 'Nombre',
      render: (material: any) => (
        <span className="text-sm">{material.name}</span>
      )
    },
    {
      key: 'computed_quantity',
      label: 'Cantidad Computada',
      render: (material: any) => (
        <span className="text-sm font-medium">{material.computed_quantity.toFixed(2)}</span>
      )
    },
    {
      key: 'purchased_quantity',
      label: 'Cantidad Comprada',
      render: (material: any) => (
        <span className="text-sm text-muted-foreground">
          {material.purchased_quantity.toFixed(2)}
        </span>
      )
    },
    {
      key: 'to_purchase_quantity',
      label: 'Cantidad A Comprar',
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
      <div className="space-y-6">
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Gestión de Materiales"
          icon={<Package className="w-6 h-6" />}
          features={[
            {
              icon: <Calculator className="w-4 h-4" />,
              title: "Cálculo Automático",
              description: "Cantidades de materiales calculadas automáticamente basadas en las tareas del presupuesto."
            },
            {
              icon: <Boxes className="w-4 h-4" />,
              title: "Control de Inventario",
              description: "Seguimiento de cantidades compradas vs. cantidades requeridas para cada material."
            },
            {
              icon: <BarChart3 className="w-4 h-4" />,
              title: "Análisis por Categoría",
              description: "Organización de materiales por categorías para mejor gestión y análisis de costos."
            },
            {
              icon: <Layers className="w-4 h-4" />,
              title: "Planificación de Compras",
              description: "Identificación clara de materiales faltantes y cantidades a comprar para el proyecto."
            }
          ]}
        />

        {filteredMaterials.length === 0 ? (
          <EmptyState
            icon={<Package className="w-8 h-8 text-muted-foreground" />}
            title="No hay materiales disponibles"
            description="Los materiales aparecerán aquí cuando agregues tareas de construcción que contengan materiales al proyecto"
          />
        ) : (
          <>
            {/* Action Bar Desktop - Only visible when data exists */}
            <ActionBarDesktop
              title="Materiales de Construcción"
              icon={<Package className="w-6 h-6" />}
              expandableDescription="Esta página muestra todos los materiales necesarios calculados automáticamente desde las tareas de construcción del proyecto."
              expandableContent={
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    <span className="text-sm">Cálculo automático de cantidades basado en tareas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4" />
                    <span className="text-sm">Organización por categoría y rubro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Control de materiales por comprar vs necesarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span className="text-sm">Filtros por categoría y agrupación flexible</span>
                  </div>
                </div>
              }
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              customFilters={customFilters}
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters}
              showGrouping={true}
              groupingType={groupBy}
              onGroupingChange={setGroupBy}
              customActions={[]}
            />
            
            <Table
              data={filteredMaterials}
              columns={columns}
              isLoading={materialsLoading}
            />
          </>
        )}
      </div>
    </Layout>
  )
}