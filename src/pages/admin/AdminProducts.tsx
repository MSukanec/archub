import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useProducts, Product, useDeleteProduct } from '@/hooks/use-products'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { Layout } from '@/components/layout/desktop/Layout'
import { Table } from '@/components/ui-custom/Table'

import { Plus, Edit, Trash2, Package, Tag } from 'lucide-react'

export default function AdminProducts() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterByMaterial, setFilterByMaterial] = useState('')
  const [filterByBrand, setFilterByBrand] = useState('')
  
  const { openModal } = useGlobalModalStore()

  // Fetch products using the hook
  const { data: products = [], isLoading } = useProducts()
  const deleteProductMutation = useDeleteProduct()

  // Get unique materials and brands for filters
  const uniqueMaterials = products
    .filter(p => p.material)
    .reduce((acc: any[], product) => {
      if (!acc.find(m => m.id === product.material?.id)) {
        acc.push(product.material)
      }
      return acc
    }, [])

  const uniqueBrands = products
    .filter(p => p.brand)
    .reduce((acc: any[], product) => {
      if (!acc.find(b => b.id === product.brand?.id)) {
        acc.push(product.brand)
      }
      return acc
    }, [])

  // Apply client-side filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchValue === '' || 
      product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.material?.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      product.brand?.name?.toLowerCase().includes(searchValue.toLowerCase())
    
    const matchesMaterial = filterByMaterial === '' || product.material_id === filterByMaterial
    const matchesBrand = filterByBrand === '' || product.brand_id === filterByBrand
    
    return matchesSearch && matchesMaterial && matchesBrand
  })

  // Apply client-side sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'material') {
      return (a.material?.name || '').localeCompare(b.material?.name || '')
    } else if (sortBy === 'brand') {
      return (a.brand?.name || '').localeCompare(b.brand?.name || '')
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const handleEdit = (product: Product) => {
    openModal('product-form', { editingProduct: product })
  }

  const handleCreate = () => {
    openModal('product-form', { editingProduct: null })
  }

  const handleDelete = (product: Product) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Producto',
      description: `¿Estás seguro que deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
      itemName: product.name,
      destructiveActionText: 'Eliminar Producto',
      onDelete: () => deleteProductMutation.mutate(product.id),
      isLoading: deleteProductMutation.isPending
    })
  }

  const clearFilters = () => {
    setSearchValue('')
    setSortBy('name')
    setFilterByMaterial('')
    setFilterByBrand('')
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '5%',
      render: (product: Product) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(product.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Producto',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-sm">{product.name}</span>
            <span className="text-xs text-muted-foreground">
              {product.unit_presentation ? 
                `${product.unit_presentation.name} (${product.unit_presentation.equivalence} ${product.unit_presentation.unit?.name})` : 
                'Sin unidad'
              }
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'material',
      label: 'Material',
      render: (product: Product) => (
        <Badge variant="secondary" className="text-xs">
          {product.material?.name || 'Sin material'}
        </Badge>
      )
    },
    {
      key: 'brand',
      label: 'Marca',
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{product.brand?.name || 'Sin marca'}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (product: Product) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {product.description || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(product)}
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product)}
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
        <Label className="text-xs font-medium">Material</Label>
        <Select value={filterByMaterial} onValueChange={setFilterByMaterial}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Todos los materiales" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los materiales</SelectItem>
            {uniqueMaterials.map((material: any) => (
              <SelectItem key={material.id} value={material.id}>
                {material.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs font-medium">Marca</Label>
        <Select value={filterByBrand} onValueChange={setFilterByBrand}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Todas las marcas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas las marcas</SelectItem>
            {uniqueBrands.map((brand: any) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label className="text-xs font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nombre</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="brand">Marca</SelectItem>
            <SelectItem value="created_at">Fecha de creación</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const headerProps = {
    title: 'Productos',
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters,
    onClearFilters: clearFilters,
    actionButton: {
      label: "Nuevo Producto",
      icon: Plus,
      onClick: handleCreate
    }
  }

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Products Table */}
        <Table
          data={sortedProducts}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-muted-foreground">No hay productos</h3>
              <p className="text-sm text-muted-foreground mt-1">No hay productos que coincidan con los filtros seleccionados.</p>
            </div>
          }
        />
      </div>
    </Layout>
  )
}