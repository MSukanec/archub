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
import { ImageLightbox, useImageLightbox } from '@/components/ui-custom/ImageLightbox'

import { Plus, Edit, Trash2, Package, Tag, Copy, ExternalLink, Image } from 'lucide-react'

export default function AdminProducts() {
  const [searchValue, setSearchValue] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [filterByMaterial, setFilterByMaterial] = useState('')
  const [filterByBrand, setFilterByBrand] = useState('')
  
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

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '5%',
      render: (product: Product) => (
          {format(new Date(product.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      )
    },
    {
      key: 'categoryHierarchy',
      label: 'Categoría',
      width: '20%',
      render: (product: Product) => (
            {product.categoryHierarchy || 'Sin categoría'}
          </span>
        </div>
      )
    },
    {
      key: 'material',
      label: 'Material',
      render: (product: Product) => (
          {product.material?.name || 'Sin material'}
        </Badge>
      )
    },
    {
      key: 'brand',
      label: 'Marca',
      render: (product: Product) => (
        </div>
      )
    },
    {
      key: 'name',
      label: 'Modelo',
      render: (product: Product) => (
            {product.unit_presentation ? 
              `${product.unit_presentation.name} (${product.unit_presentation.equivalence} ${product.unit_presentation.unit?.name})` : 
              'Sin unidad'
            }
          </span>
        </div>
      )
    },
    {
      key: 'default_price',
      label: 'Precio por Defecto',
      render: (product: Product) => (
            {product.default_price !== null && product.default_price !== undefined ? 
              `S/. ${product.default_price.toFixed(2)}` : 
              '-'
            }
          </span>
        </div>
      )
    },
    {
      key: 'default_provider',
      label: 'Proveedor por Defecto',
      render: (product: Product) => (
          {product.default_provider || '-'}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (product: Product) => (
          {product.description || '-'}
        </span>
      )
    },
    {
      key: 'url',
      label: 'URL',
      width: '8%',
      render: (product: Product) => (
          {product.url ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(product.url, '_blank')}
            >
              URL
            </Button>
          ) : (
          )}
        </div>
      )
    },
    {
      key: 'image',
      label: 'Imagen',
      width: '8%',
      render: (product: Product) => (
          {product.image_url ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLightboxImages([product.image_url!])
                openLightbox(0)
              }}
            >
              <img
                src={product.image_url}
                alt={product.name}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                  }
                }}
              />
            </Button>
          ) : (
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      render: (product: Product) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(product)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDuplicate(product)}
          >
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(product)}
          >
          </Button>
        </div>
      )
    }
  ]

  // Custom filters component
  const customFilters = (
        <Select value={filterByMaterial} onValueChange={setFilterByMaterial}>
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
      
        <Select value={filterByBrand} onValueChange={setFilterByBrand}>
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
      
        <Select value={sortBy} onValueChange={setSortBy}>
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
        {/* Products Table */}
        <Table
          data={sortedProducts}
          columns={columns}
          isLoading={isLoading}
          emptyState={
            </div>
          }
        />
      </div>
      
      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={currentIndex}
        isOpen={isOpen}
        onClose={closeLightbox}
      />
    </Layout>
  )
}