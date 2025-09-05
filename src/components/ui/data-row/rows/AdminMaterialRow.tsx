import React from 'react';
import DataRowCard from '../DataRowCard';
import { Badge } from '@/components/ui/badge';

// Interface para el material usando la estructura actual de materials_view
interface Material {
  id: string;
  name: string;
  category_name?: string;
  unit_id: string;
  unit_of_computation?: string;
  unit_description?: string;
  default_unit_presentation_id?: string;
  default_unit_presentation?: string;
  unit_equivalence?: number;
  is_system: boolean;
  is_completed?: boolean;
  created_at: string;
  updated_at?: string;
  min_price?: number;
  max_price?: number;
  avg_price?: number;
  product_count?: number;
  provider_product_count?: number;
  price_count?: number;
  // Legacy fields for backward compatibility
  unit?: { name: string };
  category?: { name: string };
}

interface AdminMaterialRowProps {
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

// Helper para obtener el precio promedio
const getMaterialPrice = (material: Material): string => {
  if (material.avg_price !== null && material.avg_price !== undefined) {
    return `ARS ${material.avg_price.toFixed(2)}`;
  }
  return 'Sin precio';
};

// Componente para mostrar precio y estado
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
    </div>
  );
};

export default function AdminMaterialRow({ 
  material, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminMaterialRowProps) {
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Material */}
        <div className="font-semibold text-sm truncate">
          {material.name}
        </div>

        {/* Segunda fila - Unidad de Cómputo */}
        <div className="text-xs text-muted-foreground truncate">
          {material.unit_of_computation || material.unit?.name || 'Sin unidad'}
        </div>

        {/* Tercera fila - Categoría */}
        <div className="text-xs text-muted-foreground truncate">
          {material.category_name || material.category?.name || 'Sin categoría'}
        </div>
      </div>

      {/* Trailing Section - Precio y Estado */}
      <div className="flex items-center">
        <PriceAndStatus material={material} />
        {/* Espacio mínimo para chevron si existe */}
        {onClick && <div className="w-2" />}
      </div>
    </>
  );

  // Usar el nuevo DataRowCard con avatar de iniciales
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