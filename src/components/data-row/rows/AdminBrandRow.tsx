import React from 'react';
import DataRowCard from '../DataRowCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para la marca (usando la estructura real de la app)
interface Brand {
  id: string;
  name: string;
  created_at: string;
}

interface AdminBrandRowProps {
  brand: Brand;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para obtener las iniciales de la marca
const getBrandInitials = (brand: Brand): string => {
  const words = brand.name.split(' ');
  if (words.length >= 2) {
    return `${words[0].slice(0, 1)}${words[1].slice(0, 1)}`.toUpperCase();
  }
  return brand.name.slice(0, 2).toUpperCase();
};

export default function AdminBrandRow({ 
  brand, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminBrandRowProps) {
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) - solo ocupa el espacio disponible */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Nombre de la marca */}
        <div className="font-semibold text-sm truncate">
          {brand.name}
        </div>

        {/* Segunda fila - Fecha de creación */}
        <div className="text-xs text-muted-foreground truncate">
          {format(new Date(brand.created_at), 'dd/MM/yyyy', { locale: es })}
        </div>
      </div>

      {/* Espacio mínimo para chevron si existe */}
      {onClick && <div className="w-2" />}
    </>
  );

  // Usar el nuevo DataRowCard con avatar de iniciales
  return (
    <DataRowCard
      avatarFallback={getBrandInitials(brand)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`brand-row-${brand.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { Brand };