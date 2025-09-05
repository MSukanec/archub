import React from 'react';
import DataRowCard from '../DataRowCard';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

// Interface para el producto usando la estructura actual de products_view
interface Product {
  id: string;
  name: string;
  description?: string;
  url?: string;
  image_url?: string;
  created_at: string;
  material_id: string;
  unit_id: string;
  brand_id?: string;
  default_provider?: string;
  default_price?: number;
  material: string;       // Nombre del material (desde products_view)
  brand?: string;         // Nombre de la marca (desde products_view)
  unit: string;           // Nombre de la unidad (desde products_view)
  is_system: boolean;
  categoryHierarchy?: string;
  category_hierarchy: string;
  // Campos de precio promedio
  avg_price?: number;
  providers_count?: number;
}

interface AdminProductRowProps {
  product: Product;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para obtener las iniciales del producto
const getProductInitials = (product: Product): string => {
  const material = product.material || 'P';
  const brand = product.brand || '';
  
  if (brand) {
    return `${material.slice(0, 1)}${brand.slice(0, 1)}`.toUpperCase();
  }
  return material.slice(0, 2).toUpperCase();
};

// Componente para mostrar solo el botón de enlace
const LinkButton = ({ url }: { url?: string }) => {
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!url) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLinkClick}
      className="h-6 px-2 text-xs"
    >
      <ExternalLink className="w-3 h-3 mr-1" />
      LINK
    </Button>
  );
};

export default function AdminProductRow({ 
  product, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminProductRowProps) {
  
  // Los datos ya están funcionando correctamente
  
  // Contenido interno del card usando el nuevo sistema - una sola columna
  const cardContent = (
    <>
      {/* Una sola columna con toda la información */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Categoría */}
        <div className="text-xs text-muted-foreground truncate">
          {(() => {
            const hierarchy = product.category_hierarchy || 'Sin categoría';
            // Extraer solo la primera categoría (antes del primer " > ")
            const firstCategory = hierarchy.split(' > ')[0];
            return firstCategory;
          })()}
        </div>

        {/* Segunda fila - Material */}
        <div className="font-semibold text-xs truncate">
          {product.material || 'Sin material'}
        </div>

        {/* Tercera fila - Marca - Modelo */}
        <div className="font-semibold text-sm truncate">
          {product.brand ? `${product.brand} - ${product.name}` : product.name}
        </div>

        {/* Cuarta fila - Unidad - Precio */}
        <div className="text-xs text-muted-foreground truncate">
          {(() => {
            const unitName = product.unit || 'Sin unidad';
            const price = product.default_price !== null && product.default_price !== undefined 
              ? `$${product.default_price.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
              : 'Sin precio';
            return `${unitName} - ${price}`;
          })()}
        </div>

        {/* Quinta fila - Link */}
        {product.url && (
          <div className="text-xs text-muted-foreground truncate mt-1">
            <LinkButton url={product.url} />
          </div>
        )}
      </div>

      {/* Espacio mínimo para chevron si existe */}
      {onClick && <div className="w-2" />}
    </>
  );

  // Usar el nuevo DataRowCard con avatar
  return (
    <DataRowCard
      avatarUrl={product.image_url}
      avatarFallback={getProductInitials(product)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`product-row-${product.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { Product };