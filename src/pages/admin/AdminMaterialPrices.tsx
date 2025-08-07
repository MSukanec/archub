import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useMaterialPrices, MaterialPrice, useDeleteMaterialPrice } from '@/hooks/use-material-prices'
import { useMaterials } from '@/hooks/use-materials'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'

import { Plus, Edit, Trash2, Package, DollarSign } from 'lucide-react'

export default function AdminMaterialPrices() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('updated_at')
  const [filterByMaterial, setFilterByMaterial] = useState('')
  const [filterByCurrency, setFilterByCurrency] = useState('')
  
  const { openModal } = useGlobalModalStore()

  // Fetch material prices using the hook
  const { data: materialPrices = [], isLoading } = useMaterialPrices()
  const { data: materials = [] } = useMaterials()
  const deleteMaterialPriceMutation = useDeleteMaterialPrice()

  // Get unique materials and currencies for filters
  const uniqueMaterials = materialPrices
    .filter(p => p.material)
    .reduce((acc: any[], price) => {
      if (!acc.find(m => m.id === price.material?.id)) {
        acc.push(price.material)
      }
      return acc
    }, [])

  const uniqueCurrencies = materialPrices
    .filter(p => p.currency)
    .reduce((acc: any[], price) => {
      if (!acc.find(c => c.id === price.currency?.id)) {
        acc.push(price.currency)
      }
      return acc
    }, [])

  // Build category hierarchy path for a material
  const buildCategoryPath = (materialId: string): string => {
    const material = materials.find(m => m.id === materialId)
    if (!material?.category?.name) return 'Sin categoría'
    return material.category.name
  }

  // Apply client-side filtering
  const filteredPrices = materialPrices.filter(price => {
    const matchesSearch = searchValue === '' || 
      price.material?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      buildCategoryPath(price.material_id).toLowerCase().includes(searchValue.toLowerCase())
    
    const matchesMaterial = filterByMaterial === '' || price.material_id === filterByMaterial
    const matchesCurrency = filterByCurrency === '' || price.currency_id === filterByCurrency
    
    return matchesSearch && matchesMaterial && matchesCurrency
  })

  // Apply client-side sorting
  const sortedPrices = [...filteredPrices].sort((a, b) => {
    if (sortBy === 'material') {
      return (a.material?.name || '').localeCompare(b.material?.name || '')
    } else if (sortBy === 'price') {
      return b.unit_price - a.unit_price
    } else if (sortBy === 'updated_at') {
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleEdit = (price: MaterialPrice) => {
    // TODO: Crear modal de edición de precios
    console.log('Editar precio:', price)
  }

  const handleCreate = () => {
    // TODO: Crear modal de creación de precios
    console.log('Crear nuevo precio')
  }

  const handleDelete = (price: MaterialPrice) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Precio de Material',
      description: `¿Estás seguro que deseas eliminar el precio de "${price.material?.name}"? Esta acción no se puede deshacer.`,
      itemName: price.material?.name || 'Material',
      destructiveActionText: 'Eliminar Precio',
      onDelete: () => deleteMaterialPriceMutation.mutate(price.id),
      isLoading: deleteMaterialPriceMutation.isPending
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('updated_at')
    setFilterByMaterial('')
    setFilterByCurrency('')
  }

  const columns = [
    {
      key: 'updated_at',
      label: 'Fecha de Actualización',
      width: '8%',
      render: (price: MaterialPrice) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(price.updated_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      width: '15%',
      render: (price: MaterialPrice) => (
        <span className="text-xs text-muted-foreground">
          {buildCategoryPath(price.material_id)}
        </span>
      )
    },
    {
      key: 'material',
      label: 'Material',
      width: '25%',
      render: (price: MaterialPrice) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{price.material?.name || 'Material sin nombre'}</span>
        </div>
      )
    },
    {
      key: 'brand',
      label: 'Marca',
      width: '15%',
      render: (price: MaterialPrice) => (
        <span className="text-sm text-muted-foreground">
          {/* TODO: Conectar con brands cuando esté disponible */}
          Sin marca
        </span>
      )
    },
    {
      key: 'model',
      label: 'Modelo',
      width: '15%',
      render: (price: MaterialPrice) => (
        <span className="text-sm text-muted-foreground">
          {/* TODO: Conectar con product models cuando esté disponible */}
          Genérico
        </span>
      )
    },
    {
      key: 'unit_price',
      label: 'Precio',
      width: '10%',
      render: (price: MaterialPrice) => (
        <div className="flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-sm">
            {price.currency?.symbol || '$'}{price.unit_price.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {price.material?.unit?.name || 'ud'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '7%',
      render: (price: MaterialPrice) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-[var(--button-ghost-hover-bg)]"
            onClick={() => handleEdit(price)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-[var(--button-ghost-hover-bg)]"
            onClick={() => handleDelete(price)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ]

  const customFilters = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at">Fecha de actualización</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="price">Precio</SelectItem>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs font-medium">Material</Label>
        <Select value={filterByMaterial} onValueChange={setFilterByMaterial}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Todos los materiales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los materiales</SelectItem>
            {uniqueMaterials.map((material) => (
              <SelectItem key={material.id} value={material.id}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">Moneda</Label>
        <Select value={filterByCurrency} onValueChange={setFilterByCurrency}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Todas las monedas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las monedas</SelectItem>
            {uniqueCurrencies.map((currency) => (
              <SelectItem key={currency.id} value={currency.id}>
                {currency.symbol} - {currency.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Precios de Materiales',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    searchPlaceholder: 'Buscar por material o categoría...',
    customFilters,
    onClearFilters: clearFilters,
    actionButton: {
      label: 'Nuevo Precio',
      icon: Plus,
      onClick: handleCreate
    }
  }

  return (
    <Layout 
      headerProps={headerProps}
    >
      <div className="space-y-6">
        {/* Material Prices Table */}
        <Table
          data={sortedPrices}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay precios de materiales</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay precios que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>
    </Layout>
  )
}