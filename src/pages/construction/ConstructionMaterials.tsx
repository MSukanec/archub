import { useState } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'
import { EmptySpace } from '@/components/ui-custom/EmptySpace'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useConstructionMaterials } from '@/hooks/use-construction-materials'
import { Package, Search, Calculator, Boxes, BarChart3, Layers } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function ConstructionMaterials() {
  const [searchValue, setSearchValue] = useState("")
  const [sortBy, setSortBy] = useState("category")
  
  const { data: userData, isLoading } = useCurrentUser()
  const { data: materials = [], isLoading: materialsLoading } = useConstructionMaterials(
    userData?.preferences?.last_project_id || ''
  )

  // Filter and sort materials
  const filteredMaterials = materials
    .filter((material) =>
      material.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      material.category_name.toLowerCase().includes(searchValue.toLowerCase())
    )
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
    title: "Materiales",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: handleClearFilters
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
          <EmptySpace
            icon={<Package className="w-8 h-8 text-muted-foreground" />}
            title="No hay materiales disponibles"
            description="Los materiales aparecerán aquí cuando agregues tareas con materiales a los presupuestos del proyecto"
          />
        ) : (
          <Table
            data={filteredMaterials}
            columns={columns}
            isLoading={materialsLoading}
          />
        )}
      </div>
    </Layout>
  )
}