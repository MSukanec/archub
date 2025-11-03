import { useState, useMemo } from 'react'
import { ComboBox as ComboBoxWriteField } from '@/components/ui-custom/fields/ComboBoxWriteField'
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
import { cn } from '@/lib/utils'

export default function ProductList() {
  const [dataType, setDataType] = useState("todos")
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [groupingType, setGroupingType] = useState('category')  // Por defecto agrupar por categoría
  const [filterByCategory, setFilterByCategory] = useState("all")
  const [filterByMaterial, setFilterByMaterial] = useState("all")
  const [filterByBrand, setFilterByBrand] = useState("all")
  
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const deleteProductMutation = useDeleteProduct()
  const { openModal } = useGlobalModalStore()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { data: userData } = useCurrentUser()
  const { isOpen, currentIndex, openLightbox, closeLightbox } = useImageLightbox(lightboxImages)

  // Filter products (sin búsqueda, solo filtros) and add groupKey for grouping
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Filtro por categoría
      if (filterByCategory !== "all") {
        const hierarchy = product.category_hierarchy || 'Sin categoría';
        const category = hierarchy.split(' > ')[0];
        if (category !== filterByCategory) {
          return false;
        }
      }

      // Filtro por material
      if (filterByMaterial !== "all") {
        if ((product.material || 'Sin material') !== filterByMaterial) {
          return false;
        }
      }

      // Filtro por marca
      if (filterByBrand !== "all") {
        if ((product.brand || 'Sin marca') !== filterByBrand) {
          return false;
        }
      }

      return true;
    });

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
          return a.name.localeCompare(b.name);
      }
    });
  }, [products, groupingType, filterByCategory, filterByMaterial, filterByBrand]);

  // Data type selector options
  const dataTypeOptions = [
    { value: "todos", label: "Todos" }
  ]

  const handleEdit = (product: Product) => {
    openModal('custom-product', { editingProduct: product, isEditing: true })
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
    openModal('custom-product', { editingProduct: duplicateProduct, isDuplicating: true })
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

  // Get unique options for filters
  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      const hierarchy = product.category_hierarchy || 'Sin categoría';
      const category = hierarchy.split(' > ')[0];
      categories.add(category);
    });
    return Array.from(categories).sort();
  }, [products]);

  const materialOptions = useMemo(() => {
    const materials = new Set<string>();
    products.forEach(product => {
      materials.add(product.material || 'Sin material');
    });
    return Array.from(materials).sort();
  }, [products]);

  const brandOptions = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(product => {
      brands.add(product.brand || 'Sin marca');
    });
    return Array.from(brands).sort();
  }, [products]);

  // Clear filters function
  const handleClearFilters = () => {
    setFilterByCategory("all");
    setFilterByMaterial("all");
    setFilterByBrand("all");
  };

  // Check if any filters are active
  const isFilterActive = filterByCategory !== "all" || filterByMaterial !== "all" || filterByBrand !== "all";

  // Filter content component
  const renderFilterContent = () => (
    <>
      <div>
        <label className="text-xs font-medium mb-2 block">Categoría</label>
        <ComboBoxWriteField
          value={filterByCategory}
          onValueChange={setFilterByCategory}
          options={[
            { value: "all", label: "Todas las categorías" },
            ...categoryOptions.map(category => ({ value: category, label: category }))
          ]}
          placeholder="Todas las categorías"
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium mb-2 block">Material</label>
        <ComboBoxWriteField
          value={filterByMaterial}
          onValueChange={setFilterByMaterial}
          options={[
            { value: "all", label: "Todos los materiales" },
            ...materialOptions.map(material => ({ value: material, label: material }))
          ]}
          placeholder="Todos los materiales"
          className="w-full"
        />
      </div>

      <div>
        <label className="text-xs font-medium mb-2 block">Marca</label>
        <ComboBoxWriteField
          value={filterByBrand}
          onValueChange={setFilterByBrand}
          options={[
            { value: "all", label: "Todas las marcas" },
            ...brandOptions.map(brand => ({ value: brand, label: brand }))
          ]}
          placeholder="Todas las marcas"
          className="w-full"
        />
      </div>
    </>
  );

  // Base columns definition
  const baseColumns = [
    {
      key: 'category',
      label: 'Categoría',
      width: '18%',
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
      width: '25%',
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
      width: '7%',
      render: (product: Product) => (
        <div className="flex items-center">
          {product.url ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(product.url, '_blank')}
              className="h-7 px-2"
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
      width: '7%',
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
      width: '16%',
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
      width: '9%',
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
    }
  ]
  
  // Render grouping popover content
  const renderGroupingContent = () => {
    const groupingOptions = [
      { value: 'none', label: 'No Agrupar' },
      { value: 'category', label: 'Agrupar por Categoría' },
      { value: 'material', label: 'Agrupar por Material' }
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
              onClick={() => setGroupingType(option.value as 'none' | 'category' | 'material')}
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
        ) : products.length === 0 ? (
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
            rowActions={(product) => !product.is_system ? [
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
            ] : []}
            topBar={{
              renderFilterContent: renderFilterContent,
              isFilterActive: isFilterActive,
              renderGroupingContent: renderGroupingContent,
              isGroupingActive: groupingType !== 'none',
              onClearFilters: handleClearFilters
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
  )
}