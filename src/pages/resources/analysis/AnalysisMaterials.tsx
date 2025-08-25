import { useState } from 'react'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'
import { useProducts, Product, useDeleteProduct } from '@/hooks/use-products'
import MaterialRow from '@/components/data-row/rows/MaterialRow'
import { Package, Edit, Trash2, Copy, ExternalLink, Image } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Selector } from '@/components/ui-custom/Selector'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useCurrentUser } from '@/hooks/use-current-user'
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/ImageLightbox'

export default function AnalysisMaterials() {
  const [dataType, setDataType] = useState("todos")
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const deleteProductMutation = useDeleteProduct()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()
  const { isOpen, currentIndex, openLightbox, closeLightbox } = useImageLightbox(lightboxImages)

  // Filter products by type (no search filtering since it's analysis view)
  const filteredProducts = products

  // Data type selector options
  const dataTypeOptions = [
    { value: "todos", label: "Todos" }
  ]

  const handleEdit = (product: Product) => {
    openModal('product-form', { editingProduct: product })
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

  // Products table columns configuration
  const productsColumns = [
    {
      key: 'material',
      label: 'Material',
      width: '16%',
      render: (product: Product) => (
        <span className="text-sm font-medium">
          {product.material?.name || 'Sin material'}
        </span>
      )
    },
    {
      key: 'brand',
      label: 'Marca',
      width: '13%',
      render: (product: Product) => (
        <span className="text-sm font-medium">
          {product.brand?.name || 'Sin marca'}
        </span>
      )
    },
    {
      key: 'name',
      label: 'Modelo',
      width: '18%',
      render: (product: Product) => (
        <span className="text-sm font-medium">{product.name}</span>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      width: '12%',
      render: (product: Product) => (
        <Badge variant="secondary" className="text-xs">
          {product.unit_presentation?.name || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'url',
      label: 'Link',
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
              Link
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
    },
    {
      key: 'default_price',
      label: 'Precio',
      width: '12%',
      render: (product: Product) => (
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono">
            {product.default_price !== null && product.default_price !== undefined ? 
              `ARS ${product.default_price.toFixed(2)}` : 
              '-'
            }
          </span>
        </div>
      )
    },
    {
      key: 'is_system',
      label: 'Tipo',
      width: '8%',
      render: (product: Product) => (
        <Badge 
          variant={product.is_system ? "default" : "secondary"}
          className={`text-xs ${product.is_system 
            ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90' 
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300'
          }`}
        >
          {product.is_system ? 'Sistema' : 'Organización'}
        </Badge>
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
            onClick={() => handleDuplicate(product)}
            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
          >
            <Copy className="h-3 w-3" />
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
            renderCard={(product) => (
              <MaterialRow
                material={{
                  id: product.id,
                  name: product.material?.name || product.name,
                  brand: product.brand?.name,
                  category: (() => {
                    const hierarchy = product.categoryHierarchy || 'Sin categoría';
                    // Extraer solo la primera categoría (antes del primer " > ")
                    return hierarchy.split(' > ')[0];
                  })(),
                  unit: product.unit_presentation?.name,
                  price: product.default_price,
                  image_url: product.image_url,
                  is_system: product.is_system || false,
                  created_at: product.created_at
                }}
                onClick={() => handleEdit(product)}
                density="normal"
              />
            )}
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