import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useBrands, Brand, useDeleteBrand } from '@/hooks/use-brands'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'

import { Plus, Edit, Trash2, Tag } from 'lucide-react'

export default function AdminBrands() {
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
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (brand: Brand) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(brand)}
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(brand)}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  // Custom filters component
  const customFilters = (
    <div className="grid grid-cols-1 gap-3">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Marcas',
    icon: Tag,
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actionButton: {
      label: "Nueva Marca",
      icon: Plus,
      onClick: handleCreate
    }
  }

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* KPI Cards removed as requested */}

        {/* Brands Table */}
        <Table
          data={sortedBrands}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay marcas</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay marcas que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>
    </Layout>
  )
}