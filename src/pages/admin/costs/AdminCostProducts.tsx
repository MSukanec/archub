import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'
import { useProducts, Product, useDeleteProduct } from '@/hooks/use-products'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import AdminProductRow from '@/components/ui/data-row/rows/AdminProductRow'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/media/ImageLightbox'
import { cn } from '@/lib/utils'

import { Plus, Edit, Trash2, Package, Tag, Copy, ExternalLink, Image, Box, RefreshCw } from 'lucide-react'

const AdminCostProducts = () => {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterByMaterial, setFilterByMaterial] = useState('')
  const [filterByBrand, setFilterByBrand] = useState('')
  const [groupingType, setGroupingType] = useState('category')  // Por defecto agrupar por categoría
  
  const { openModal } = useGlobalModalStore()
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const { isOpen, currentIndex, openLightbox, closeLightbox } = useImageLightbox(lightboxImages)

  // Fetch products using the hook
  const { data: products = [], isLoading } = useProducts()
  const deleteProductMutation = useDeleteProduct()

  // Get unique materials and brands for filters
  const uniqueMaterials = products
    .filter(p => p.material)
    .reduce((acc: any[], product) => {
      if (!acc.find(m => m.name === product.material)) {
        acc.push({ id: product.material_id, name: product.material })
      }
      return acc
    }, [])

  const uniqueBrands = products
    .filter(p => p.brand)
    .reduce((acc: any[], product) => {
      if (!acc.find(b => b.name === product.brand)) {
        acc.push({ id: product.brand_id, name: product.brand })
      }
      return acc
    }, [])

  // Filter products and add groupKey for grouping
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesSearch = searchValue === '' || 
        product.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.material?.toLowerCase().includes(searchValue.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchValue.toLowerCase())
      
      const matchesMaterial = filterByMaterial === '' || product.material_id === filterByMaterial
      const matchesBrand = filterByBrand === '' || product.brand_id === filterByBrand
      
      return matchesSearch && matchesMaterial && matchesBrand
    })

    const productsWithGroupKey = filtered.map(product => {
      let groupKey = '';
      
      switch (groupingType) {
        case 'material':
          groupKey = product.material || 'Sin material';
          break;
        case 'category':
          const hierarchy = product.category_hierarchy || 'Sin categoría';
          // Extraer solo la primera categoría (antes del primer " > ")
          groupKey = hierarchy.split(' > ')[0];
          break;
        default:
          groupKey = '';
      }
      
      return {
        ...product,
        groupKey
      };
    });

    // Ordenar según el tipo de agrupación
    return productsWithGroupKey.sort((a, b) => {
      switch (groupingType) {
        case 'material':
          const materialA = a.material || 'Sin material';
          const materialB = b.material || 'Sin material';
          return materialA.localeCompare(materialB);
        case 'category':
          const categoryA = a.groupKey;
          const categoryB = b.groupKey;
          return categoryA.localeCompare(categoryB);
        default:
          // Para 'none', ordenar por el sortBy seleccionado
          if (sortBy === 'name') {
            return a.name.localeCompare(b.name)
          } else if (sortBy === 'material') {
            return (a.material || '').localeCompare(b.material || '')
          } else if (sortBy === 'brand') {
            return (a.brand || '').localeCompare(b.brand || '')
          } else {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
      }
    });
  }, [products, searchValue, filterByMaterial, filterByBrand, sortBy, groupingType])

  const handleEdit = (product: Product) => {
    openModal('product-form', { editingProduct: product })
  }

  const handleCreate = () => {
    openModal('product-form', { editingProduct: null })
  }

  const handleDuplicate = (product: Product) => {
    // Create a duplicate object with "Copia" added to the name
    const duplicateProduct = {
      ...product,
      id: undefined, // Remove ID so it creates a new product
      name: `${product.name} - Copia`,
      created_at: undefined, // Remove created_at
      updated_at: undefined  // Remove updated_at
    }
    openModal('product-form', { editingProduct: duplicateProduct, isDuplicating: true })
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

  // Render grouping popover content
  const renderGroupingContent = () => {
    const groupingOptions = [
      { value: 'none', label: 'Sin agrupar' },
      { value: 'category', label: 'Por categorías' },
      { value: 'material', label: 'Por material' }
    ];

    return (
      <>
        <div className="text-xs font-medium mb-2 block">Agrupar por</div>
        <div className="space-y-1">
          {groupingOptions.map((option) => (
            <Button
              key={option.value}
              variant={groupingType === option.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setGroupingType(option.value)}
              className={cn(
                "w-full justify-start text-xs font-normal h-8",
                groupingType === option.value ? "button-secondary-pressed hover:bg-secondary" : ""
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </>
    );
  };

  const baseColumns = [
    {
      key: 'name',
      label: 'Material',
      width: 'minmax(0, 1fr)',
      render: (product: Product) => (
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {product.brand ? `${product.brand} - ${product.name}` : product.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {product.material || 'Sin material'}
          </span>
        </div>
      )
    },
    {
      key: 'unit_id',
      label: 'Unidad',
      width: '8%',
      render: (product: Product) => (
        <div>
          {product.unit ? (
            <Badge variant="secondary" className="text-xs">
              {product.unit}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Sin unidad</span>
          )}
        </div>
      )
    },
    {
      key: 'avg_price',
      label: 'Precio Promedio',
      width: '15%',
      render: (product: Product) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium">
            {product.avg_price !== null && product.avg_price !== undefined ? 
              `ARS ${product.avg_price.toFixed(2)}` : 
              '–'
            }
          </span>
          {product.providers_count && product.providers_count > 0 && (
            <span className="text-xs text-muted-foreground">
              {product.providers_count} proveedor{product.providers_count > 1 ? 'es' : ''}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'url',
      label: 'URL',
      width: '8%',
      render: (product: Product) => (
        <div className="flex items-center">
          {product.url ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(product.url, '_blank')}
              className="h-7 px-2 text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              URL
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      )
    },
    {
      key: 'image',
      label: 'Imagen',
      width: '8%',
      render: (product: Product) => (
        <div className="flex items-center">
          {product.image_url ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLightboxImages([product.image_url!])
                openLightbox(0)
              }}
              className="h-7 w-7 p-0"
            >
              <img
                src={product.image_url}
                alt={product.name}
                className="h-6 w-6 object-cover rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<Image className="h-3 w-3 text-muted-foreground" />';
                  }
                }}
              />
            </Button>
          ) : (
            <div className="flex items-center justify-center h-7 w-7">
              <Image className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      )
    }
  ]
  
  // Dynamic columns based on grouping (using baseColumns which already handles the conditional inclusion)
  const columns = baseColumns;

  return (
    <div className="space-y-6">
      <Table
        data={filteredProducts}
        columns={columns}
        isLoading={isLoading}
        groupBy={groupingType === 'none' ? undefined : 'groupKey'}
        rowActions={(product: Product) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(product)
          },
          {
            icon: Copy,
            label: 'Duplicar',
            onClick: () => handleDuplicate(product)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(product),
            variant: 'destructive' as const
          }
        ]}
        topBar={{
          showSearch: true,
          searchValue: searchValue,
          onSearchChange: setSearchValue,
          showFilter: true,
          isFilterActive: filterByMaterial !== '' || filterByBrand !== '',
          renderFilterContent: () => (
            <>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium mb-2 block">Material</Label>
                  <Select value={filterByMaterial} onValueChange={setFilterByMaterial}>
                    <SelectTrigger className="h-8 text-xs">
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
                <div>
                  <Label className="text-xs font-medium mb-2 block">Marca</Label>
                  <Select value={filterByBrand} onValueChange={setFilterByBrand}>
                    <SelectTrigger className="h-8 text-xs">
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
              </div>
            </>
          ),
          onClearFilters: clearFilters,
          renderGroupingContent: renderGroupingContent,
          isGroupingActive: groupingType !== 'none'
        }}
        renderCard={(product) => (
          <AdminProductRow
            product={product}
            onClick={() => handleEdit(product)}
            density="normal"
          />
        )}
        renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => (
          <div className="col-span-full text-sm font-medium">
            {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Producto' : 'Productos'})
          </div>
        )}
        emptyState={
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No se encontraron productos</p>
            <p className="text-xs">No hay productos que coincidan con los filtros aplicados.</p>
          </div>
        }
      />

      <ImageLightbox
        images={lightboxImages}
        isOpen={isOpen}
        currentIndex={currentIndex}
        onClose={closeLightbox}
      />
    </div>
  )
}

export default AdminCostProducts