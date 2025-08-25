import React from 'react';
import DataRowCard from '../DataRowCard';
import { Badge } from '@/components/ui/badge';

// Interface para el material (usando la estructura real de la app)
interface Material {
  id: string;
  name: string;
  unit_id: string;
  category_id: string;
  default_unit_presentation_id?: string;
  base_price_override?: number;
  is_completed?: boolean;
  provider?: string;
  organization_id?: string;
  is_system: boolean;
  created_at: string;
  unit?: { name: string };
  category?: { name: string };
  default_unit_presentation?: { name: string };
  organization_material_prices?: Array<{
    id: string;
    unit_price: number;
    currency_id: string;
    currency: {
      symbol: string;
      name: string;
    };
  }>;
}

interface MaterialRowProps {
  material: Material;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para obtener las iniciales del material
const getMaterialInitials = (material: Material): string => {
  const words = material.name.split(' ');
  if (words.length >= 2) {
    return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase();
  }
  return material.name.slice(0, 2).toUpperCase();
};

// Helper para obtener el primer precio disponible
const getMaterialPrice = (material: Material): string => {
  if (material.organization_material_prices && material.organization_material_prices.length > 0) {
    const price = material.organization_material_prices[0];
    return `${price.currency.symbol} ${price.unit_price.toFixed(2)}`;
  }
  return 'Sin precio';
};

// Componente para mostrar precio y estado (IDÉNTICO a AdminMaterialRow)
const PriceAndStatus = ({ material }: { material: Material }) => {
  const price = getMaterialPrice(material);
  const isCompleted = material.is_completed;

  return (
    <div className="text-right space-y-1">
      {/* Precio */}
      <div className="text-xs font-medium">
        {price}
      </div>
      
      {/* Estado */}
      <div className="flex justify-end">
        <Badge 
          variant={isCompleted ? "default" : "secondary"} 
          className={`text-xs ${
            isCompleted 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {isCompleted ? 'Completo' : 'Incompleto'}
        </Badge>
      </div>

      {/* ÚNICA DIFERENCIA: Badge de TIPO (SISTEMA/USUARIO) */}
      <div className="flex justify-end">
        <Badge 
          variant={material.is_system ? "default" : "secondary"} 
          className={`text-xs ${
            material.is_system 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}
        >
          {material.is_system ? 'SISTEMA' : 'USUARIO'}
        </Badge>
      </div>
    </div>
  );
};

export default function MaterialRow({ 
  material, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: MaterialRowProps) {
  
  // Contenido interno del card usando el nuevo sistema (IDÉNTICO a AdminMaterialRow)
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Material */}
        <div className="font-semibold text-sm truncate">
          {material.name}
        </div>

        {/* Segunda fila - Proveedor - Unidad */}
        <div className="text-xs text-muted-foreground truncate">
          {material.provider ? `${material.provider} - ${material.unit?.name || 'Sin unidad'}` : material.unit?.name || 'Sin unidad'}
        </div>

        {/* Tercera fila - Categoría */}
        <div className="text-xs text-muted-foreground truncate">
          {material.category?.name || 'Sin categoría'}
        </div>
      </div>

      {/* Trailing Section - Precio y Estado (con badge adicional de TIPO) */}
      <div className="flex items-center">
        <PriceAndStatus material={material} />
        {/* Espacio mínimo para chevron si existe */}
        {onClick && <div className="w-2" />}
      </div>
    </>
  );

  // Usar el nuevo DataRowCard con avatar de iniciales (IDÉNTICO a AdminMaterialRow)
  return (
    <DataRowCard
      avatarFallback={getMaterialInitials(material)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`material-row-${material.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { Material };