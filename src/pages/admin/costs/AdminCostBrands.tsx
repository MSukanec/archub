import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useBrands, Brand, useDeleteBrand } from '@/hooks/use-brands'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminBrandRow from '@/components/ui/data-row/rows/AdminBrandRow'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'

import { Plus, Edit, Trash2, Tag } from 'lucide-react'

const AdminCostBrands = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  
  const { openModal } = useGlobalModalStore()

  // Fetch brands using the hook
  const { data: brands = [], isLoading } = useBrands()
  const deleteBrandMutation = useDeleteBrand()

  // Apply client-side filtering
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = searchValue === '' || brand.name.toLowerCase().includes(searchValue.toLowerCase())
    return matchesSearch
  })

  // Apply client-side sorting
  const sortedBrands = [...filteredBrands].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleEdit = (brand: Brand) => {
    openModal('brand-form', { editingBrand: brand })
  }

  const handleCreate = () => {
    openModal('brand-form', { editingBrand: null })
  }

  const handleDelete = (brand: Brand) => {
    // Crear lista de marcas disponibles para reemplazo (excluyendo la actual)
    const replacementOptions = brands
      .filter(b => b.id !== brand.id)
      .map(b => ({
        value: b.id,
        label: b.name
      }))

    openModal('delete-confirmation', {
      mode: 'replace',
      title: 'Eliminar Marca',
      description: `¿Estás seguro que deseas eliminar la marca "${brand.name}"? Esta acción no se puede deshacer.`,
      itemName: brand.name,
      destructiveActionText: 'Eliminar Marca',
      onDelete: () => deleteBrandMutation.mutate(brand.id),
      onReplace: (newBrandId: string) => {
        // Aquí puedes implementar la lógica de reemplazo si es necesaria
        console.log('Reemplazar marca', brand.id, 'por', newBrandId)
        // Por ahora solo eliminamos la marca actual
        deleteBrandMutation.mutate(brand.id)
      },
      replacementOptions,
      currentCategoryId: brand.id,
      isLoading: deleteBrandMutation.isPending
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('name')
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      width: '5%',
      render: (brand: Brand) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(brand.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Marca',
      render: (brand: Brand) => (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{brand.name}</span>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <Table
        data={sortedBrands}
        columns={columns}
        isLoading={isLoading}
        rowActions={(brand: Brand) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(brand)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(brand),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(brand) => (
          <AdminBrandRow
            brand={brand}
            onClick={() => handleEdit(brand)}
            density="normal"
          />
        )}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron marcas</p>
            <p className="text-xs">No hay marcas que coincidan con los filtros aplicados.</p>
          </div>
        }
      />
    </div>
  )
}

export default AdminCostBrands