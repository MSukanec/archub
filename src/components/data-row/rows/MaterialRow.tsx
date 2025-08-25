import React from 'react';
import DataRowCard from '../DataRowCard';
import { Badge } from '@/components/ui/badge';

// Interface para el material (usando la estructura real de la app)
interface Material {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  unit?: string;
  price?: number;
  image_url?: string;
  is_system: boolean;
  created_at: string;
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

export default function MaterialRow({ 
  material, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: MaterialRowProps) {
  
  // Contenido interno del card usando el nuevo sistema (IDÉNTICO a AdminProductRow)
  const cardContent = (
    <>
      {/* Columna de contenido (principal) - single column layout como AdminProductRow */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Primera fila - Categoría */}
        <div className="text-xs text-muted-foreground truncate">
          {material.category || 'Sin categoría'}
        </div>

        {/* Segunda fila - Material (bold) */}
        <div className="font-bold text-sm truncate">
          {material.name}
        </div>

        {/* Tercera fila - Marca - Modelo */}
        <div className="font-bold text-sm truncate">
          {material.brand ? `${material.brand} - ${material.name}` : material.name}
        </div>

        {/* Cuarta fila - Unit-Price */}
        <div className="text-xs text-muted-foreground truncate">
          {material.unit || 'Sin unidad'} - ${material.price?.toFixed(2) || '0.00'}
        </div>

        {/* ÚNICA DIFERENCIA: Badge de TIPO (SISTEMA/USUARIO) debajo de todo */}
        <div className="flex justify-start">
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

      {/* Espacio mínimo para chevron si existe */}
      {onClick && <div className="w-2" />}
    </>
  );

  // Usar el nuevo DataRowCard con avatar (IDÉNTICO a AdminProductRow)
  return (
    <DataRowCard
      avatarUrl={material.image_url}
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