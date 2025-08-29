import { useState, useMemo, useEffect } from 'react'
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
import { Layout } from '@/components/layout/desktop/Layout'
import { useNavigationStore } from '@/stores/navigationStore'

export default function AnalysisMaterials() {
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('library')
  }, [setSidebarContext])
  const [dataType, setDataType] = useState("todos")
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [groupingType, setGroupingType] = useState('category')  // Por defecto agrupar por categoría
  
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const deleteProductMutation = useDeleteProduct()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()
  const { isOpen, currentIndex, openLightbox, closeLightbox } = useImageLightbox(lightboxImages)

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
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, groupingType]);

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

  // Base columns definition
  const baseColumns = [
    {
      key: 'category',
      label: 'Categoría',
      width: '16%',
      render: (product: Product) => (
        <span className="text-sm font-medium">
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
      width: '16%',
      render: (product: Product) => (
        <span className="text-sm font-medium">
          {product.material || 'Sin material'}
        </span>
      )
    },
    {
      key: 'brand',
      label: 'Marca',
      width: '13%',
      render: (product: Product) => (
        <span className="text-sm font-medium">
          {product.brand || 'Sin marca'}
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
          {product.unit || 'N/A'}
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
      key: 'avg_price',
      label: 'Precio Promedio',
      width: '15%',
      render: (product: Product) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-mono">
            {product.avg_price !== null && product.avg_price !== undefined ? 
              `ARS ${product.avg_price.toFixed(2)}` : 
              '-'
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
    <Layout
      headerProps={{
        title: "Análisis de Materiales",
        icon: Package,
        description: "Análisis de costos para materiales de construcción",
      }}
    >
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
            topBar={{
              tabs: ['No Agrupar', 'Agrupar por Categoría', 'Agrupar por Material'],
              activeTab: groupingType === 'none' ? 'No Agrupar' : 
                        groupingType === 'category' ? 'Agrupar por Categoría' : 'Agrupar por Material',
              onTabChange: (tab: string) => {
                if (tab === 'No Agrupar') setGroupingType('none')
                else if (tab === 'Agrupar por Categoría') setGroupingType('category')
                else if (tab === 'Agrupar por Material') setGroupingType('material')
              }
            }}
            renderCard={(product) => (
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
                  price: product.avg_price || product.default_price,
                  image_url: product.image_url,
                  is_system: product.is_system || false,
                  created_at: product.created_at
                }}
                onClick={() => handleEdit(product)}
                density="normal"
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
    </Layout>
  )
}