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
import { Package, Search, Calculator, Boxes, BarChart3, Layers, Filter } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export default function ConstructionMaterials() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState("category")
  const [selectedCategory, setSelectedCategory] = useState("")
  
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
  const uniqueCategories = [...new Set(materials.map(m => m.category_name))].sort()

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

  // Custom filters for the header
  const customFilters = (
    <div className="flex gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Categoría</SelectItem>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="quantity">Cantidad</SelectItem>
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
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              showGrouping={false}
              customActions={[
                <Popover key="category-filter">
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    align="start" 
                    className="w-48 p-0 rounded-lg shadow-button-normal border"
                    style={{ 
                      backgroundColor: 'var(--card-bg)',
                      borderColor: 'var(--card-border)'
                    }}
                  >
                    <div className="py-1">
                      <button
                        onClick={() => setSelectedCategory('')}
                        className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] ${!selectedCategory ? 'bg-[var(--button-ghost-hover-bg)]' : ''}`}
                      >
                        Todas las categorías
                      </button>
                      {uniqueCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] ${selectedCategory === category ? 'bg-[var(--button-ghost-hover-bg)]' : ''}`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              ]}
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