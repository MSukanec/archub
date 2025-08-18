import { useState } from 'react'
import { Table } from '@/components/ui-custom/Table'
import { useMaterials, useDeleteMaterial } from '@/hooks/use-materials'
import { Package, Edit, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Selector } from '@/components/ui-custom/Selector'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useCurrentUser } from '@/hooks/use-current-user'

export default function AnalysisMaterials() {
  const [dataType, setDataType] = useState("todos")
  
  const { data: materials = [], isLoading: materialsLoading } = useMaterials()
  const deleteMaterialMutation = useDeleteMaterial()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()

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

  return (
    <div>
      {/* Data type selector for materials tab */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Tipo de material:</span>
        <Selector
          options={dataTypeOptions}
          value={dataType}
          onValueChange={setDataType}
          className="h-8"
        />
      </div>

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
    </div>
  )
}