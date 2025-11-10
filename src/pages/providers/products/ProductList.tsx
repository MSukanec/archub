import { useState, useMemo } from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { useProducts, Product, useDeleteProduct } from '@/hooks/use-products'
import MaterialRow from '@/components/ui/data-row/rows/MaterialRow'
import { Package, Edit, Trash2, Copy, ExternalLink, Image } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/media/ImageLightbox'
import { Checkbox } from '@/components/ui/checkbox'
import { useProviderProducts, useToggleProviderProduct } from '@/hooks/use-provider-products'

export default function ProductList() {
  const [dataType, setDataType] = useState("todos")
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [groupingType, setGroupingType] = useState('category')  // Por defecto agrupar por categoría
  
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const { data: providerProducts = [] } = useProviderProducts()
  const toggleProviderProduct = useToggleProviderProduct()
  const deleteProductMutation = useDeleteProduct()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()
  const { isOpen, currentIndex, openLightbox, closeLightbox } = useImageLightbox(lightboxImages)

  // Función para verificar si un producto está seleccionado
  const isProductSelected = (productId: string) => {
    const providerProduct = providerProducts.find(pp => pp.product_id === productId)
    return providerProduct?.is_active || false
  }

  // Función para manejar el toggle del checkbox
  const handleToggleProduct = async (productId: string, currentState: boolean) => {
    try {
      // Solo enviar los campos necesarios para el toggle
      const payload: any = {
        productId,
        isActive: !currentState
      }
      
      await toggleProviderProduct.mutateAsync(payload)
    } catch (error) {
      console.error('Error toggling product:', error)
    }
  }

  // Filter products and add groupKey for grouping
  const filteredProducts = useMemo(() => {
    const productsWithGroupKey = products.map(product => {
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
      
      const isSelected = isProductSelected(product.id)
      const providerProduct = providerProducts.find(pp => pp.product_id === product.id)
      const currentPrice = providerProduct?.product_prices?.[0]
      
      return {
        ...product,
        groupKey,
        isSelected,
        providerCode: providerProduct?.provider_code,
        providerPrice: currentPrice?.price,
        providerCurrency: currentPrice?.currencies?.symbol
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
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, groupingType, providerProducts]);

  // Data type selector options
  const dataTypeOptions = [
    { value: "todos", label: "Todos" }
  ]

  const handleEdit = (product: Product) => {
    openModal('provider-product', { product: product })
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


  // Base columns definition
  const baseColumns = [
    {
      key: 'selected',
      label: '',
      width: '3%',
      render: (product: Product & { isSelected?: boolean }) => {
        const isSelected = product.isSelected || false
        return (
          <div className="flex justify-center">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handleToggleProduct(product.id, isSelected)}
              disabled={toggleProviderProduct.isPending}
            />
          </div>
        )
      }
    },
    {
      key: 'provider_code',
      label: 'Código',
      width: '8%',
      render: (product: Product & { providerCode?: string }) => (
        <span className="text-xs font-mono text-muted-foreground">
          {product.providerCode || '-'}
        </span>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      width: '14%',
      render: (product: Product) => (
        <span className="text-xs font-medium">
          {(() => {
            const hierarchy = product.category_hierarchy || 'Sin categoría';
            // Extraer solo la primera categoría (antes del primer " > ")
            return hierarchy.split(' > ')[0];
          })()}
        </span>
      )
    },
    {
      key: 'material',
      label: 'Material',
      width: '14%',
      render: (product: Product) => (
        <span className="text-xs font-medium">
          {product.material || 'Sin material'}
        </span>
      )
    },
    {
      key: 'brand',
      label: 'Marca',
      width: '10%',
      render: (product: Product) => (
        <span className="text-xs font-medium">
          {product.brand || 'Sin marca'}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Modelo',
      width: '20%',
      render: (product: Product) => (
        <span className="text-xs font-medium">{product.name}</span>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      width: '9%',
      render: (product: Product) => (
        <Badge variant="secondary" className="text-xs">
          {product.unit || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'url',
      label: 'Link',
      width: '3%',
      render: (product: Product) => (
        <div className="flex items-center">
          {product.url ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(product.url, '_blank')}
              className="h-7 px-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </div>
      )
    },
    {
      key: 'image',
      label: 'Img',
      width: '3%',
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
    },
    {
      key: 'price',
      label: 'Precio',
      width: '10%',
      render: (product: Product & { providerPrice?: number; providerCurrency?: string; isSelected?: boolean }) => {
        // Solo mostrar el precio específico del proveedor, nunca el precio global
        const displayPrice = product.providerPrice
        const displayCurrency = product.providerCurrency || '$'
        
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono">
              {displayPrice !== null && displayPrice !== undefined ? 
                `${displayCurrency}${displayPrice.toFixed(2)}` : 
                '-'
              }
            </span>
          </div>
        )
      }
    }
  ]
  
  // Select columns based on grouping type
  const productsColumns = useMemo(() => {
    // For no grouping, use all base columns
    if (groupingType === 'none') {
      return baseColumns;
    }
    
    // Filter columns for grouping - hide the grouped column
    return baseColumns.filter(column => {
      if (groupingType === 'material' && column.key === 'material') return false;
      if (groupingType === 'category' && column.key === 'category') return false;
      return true;
    });
  }, [groupingType]);

  return (
    <div className="space-y-6">
      {/* Products Table */}
      <div className="w-full">
        {productsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--accent)]" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No hay productos registrados"
            description="Comienza agregando productos al catálogo desde el panel de administración."
          />
        ) : (
          <Table
            data={filteredProducts}
            columns={productsColumns}
            groupBy={groupingType === 'none' ? undefined : 'groupKey'}
            getRowClassName={(product: any) => !product.isSelected ? 'opacity-40' : 'opacity-100'}
            rowActions={(product: any) => !product.isSelected ? [] : [
              {
                icon: Edit,
                label: 'Editar',
                onClick: () => handleEdit(product)
              }
            ]}
            topBar={{
              // 🆕 NUEVA FORMA SIMPLIFICADA - Solo props, sin función personalizada
              groupingOptions: [
                { value: 'none', label: 'No Agrupar' },
                { value: 'category', label: 'Agrupar por Categoría' },
                { value: 'material', label: 'Agrupar por Material' }
              ],
              currentGrouping: groupingType,
              onGroupingChange: (value: string) => setGroupingType(value as 'none' | 'category' | 'material'),
              isGroupingActive: groupingType !== 'none'
            }}
            renderCard={(product: any) => (
              <MaterialRow
                material={{
                id: product.id,
                name: product.name, // MODELO
                material_name: product.material, // MATERIAL
                brand: product.brand,
                category: (() => {
                  const hierarchy = product.category_hierarchy || 'Sin categoría';
                  // Extraer solo la primera categoría (antes del primer " > ")
                  return hierarchy.split(' > ')[0];
                })(),
                unit: product.unit,
                price: product.default_price,
                image_url: product.image_url,
                is_system: product.is_system || false,
                created_at: product.created_at
              }}
              onClick={() => handleEdit(product)}
              density="normal"
              className={!product.isSelected ? 'opacity-40' : 'opacity-100'}
              />
            )}
            renderGroupHeader={groupingType === 'none' ? undefined : (groupKey: string, groupRows: any[]) => {
              return (
                <>
                  <div className="col-span-full text-sm font-medium">
                    {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'Producto' : 'Productos'})
                  </div>
                </>
              );
            }}
            emptyState={
              <EmptyState
                icon={<Package />}
                title="No se encontraron productos"
                description="Intenta ajustar los filtros de búsqueda."
              />
            }
            className="bg-[var(--card-bg)] border-[var(--card-border)]"
          />
        )}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={isOpen}
        images={lightboxImages}
        currentIndex={currentIndex}
        onClose={closeLightbox}
      />
    </div>
  )
}