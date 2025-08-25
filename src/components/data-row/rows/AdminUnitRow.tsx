import React from 'react';
import DataRowCard from '../DataRowCard';

// Interface para la unidad de presentación (usando la estructura real de la app)
interface UnitPresentation {
  id: string;
  unit_id: string;
  name: string;
  equivalence: number;
  description?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  unit?: {
    id: string;
    name: string;
  };
}

interface AdminUnitRowProps {
  unitPresentation: UnitPresentation;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para obtener las iniciales de la unidad
const getUnitInitials = (unitPresentation: UnitPresentation): string => {
  const presentation = unitPresentation.name;
  const unit = unitPresentation.unit?.name || '';
  
  if (unit) {
    return `${presentation.slice(0, 1)}${unit.slice(0, 1)}`.toUpperCase();
  }
  return presentation.slice(0, 2).toUpperCase();
};

export default function AdminUnitRow({ 
  unitPresentation, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: AdminUnitRowProps) {
  
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) - solo ocupa el espacio disponible */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Unidad de Presentación */}
        <div className="font-semibold text-sm truncate">
          {unitPresentation.name}
        </div>

        {/* Segunda fila - Unidad Base - Equivalencia */}
        <div className="text-xs text-muted-foreground truncate">
          {unitPresentation.unit?.name || 'Sin unidad'} - {unitPresentation.equivalence}
        </div>
      </div>

      {/* Espacio mínimo para chevron si existe */}
      {onClick && <div className="w-2" />}
    </>
  );

  // Usar el nuevo DataRowCard con avatar de iniciales
  return (
    <DataRowCard
      avatarFallback={getUnitInitials(unitPresentation)}
      selected={selected}
      density={density}
      onClick={onClick}
      className={className}
      data-testid={`unit-row-${unitPresentation.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { UnitPresentation };