import React from 'react';
import DataRowCard from '../DataRowCard';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

// Interface para el producto (usando la estructura real de la app)
interface Product {
  id: string;
  material_id: string;
  brand_id?: string;
  unit_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  url?: string;
  default_price?: number;
  default_provider?: string;
  is_system?: boolean;
  created_at: string;
  categoryHierarchy?: string;
  material?: {
    id: string;
    name: string;
    category_id: string;
    category?: {
      id: string;
      name: string;
      parent_id: string | null;
    };
  };
  brand?: {
    id: string;
    name: string;
  };
  unit_presentation?: {
    id: string;
    name: string;
    equivalence: number;
    unit?: {
      id: string;
      name: string;
    };
  };
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
  const material = product.material?.name || 'P';
  const brand = product.brand?.name || '';
  
  if (brand) {
    return `${material.slice(0, 1)}${brand.slice(0, 1)}`.toUpperCase();
  }
  return material.slice(0, 2).toUpperCase();
};

// Componente para mostrar precio y botón de enlace
const PriceAndLink = ({ price, url }: { price?: number; url?: string }) => {
  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="text-right space-y-1">
      {/* Precio */}
      <div className="text-xs font-medium">
        {price !== null && price !== undefined ? 
          `S/. ${price.toFixed(2)}` : 
          'Sin precio'
        }
      </div>
      
      {/* Botón LINK */}
      {url && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLinkClick}
          className="h-6 px-2 text-xs"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          LINK
        </Button>
      )}
    </div>
  );
};

export default function AdminProductRow({ 
  product, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminProductRowProps) {
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Material */}
        <div className="font-semibold text-sm truncate">
          {product.material?.name || 'Sin material'}
        </div>

        {/* Segunda fila - Marca - Modelo */}
        <div className="text-xs text-muted-foreground truncate">
          {product.brand?.name ? `${product.brand.name} - ${product.name}` : product.name}
        </div>

        {/* Tercera fila - Categoría */}
        <div className="text-xs text-muted-foreground truncate">
          {product.categoryHierarchy || 'Sin categoría'}
        </div>
      </div>

      {/* Trailing Section - Precio y Link */}
      <div className="flex items-center">
        <PriceAndLink 
          price={product.default_price} 
          url={product.url} 
        />
        {/* Espacio mínimo para chevron si existe */}
        {onClick && <div className="w-2" />}
      </div>
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