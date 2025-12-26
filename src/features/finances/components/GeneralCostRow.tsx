import React from 'react';
import DataRowCard from '@/components/shared/DataRowCard';
import { SwipeableCard } from '@/layouts';
import { Edit, Trash2 } from 'lucide-react';
import type { GeneralCost } from '@/features/general-costs/types';
interface GeneralCostRowProps {
  generalCost: GeneralCost;
  onClick?: (generalCost: GeneralCost) => void;
  onEdit?: (generalCost: GeneralCost) => void;
  onDelete?: (generalCost: GeneralCost) => void;
  selected?: boolean;
  density?: 'compact'| 'normal'| 'comfortable';
  showChevron?: boolean;
  enableSwipe?: boolean;
}
// Utility function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return "GG";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
export default function GeneralCostRow({ 
  generalCost, 
  onClick, 
  onEdit,
  onDelete,
  selected, 
  density = 'normal',
  showChevron = false,
  enableSwipe = true
}: GeneralCostRowProps) {
  const {
    name,
    description,
  } = generalCost;
  // Get initials for avatar fallback
  const avatarFallback = getInitials(name);
  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <div className="font-semibold text-sm truncate">
          {name}
        </div>
        {/* Description */}
        {description && (
          <div className="text-muted-foreground text-sm truncate mt-1">
            {description}
          </div>
        )}
      </div>
      {/* Trailing section - Solo espacio para chevron si es necesario */}
      {(showChevron || onClick) && (
        <div className="flex items-center">
          <div className="w-2" />
        </div>
      )}
    </>
  );
  // Usar el nuevo DataRowCard
  const generalCostCard = (
    <DataRowCard
      avatarFallback={avatarFallback}
      selected={selected}
      density={density}
      onClick={onClick ? () => onClick(generalCost) : undefined}
    >
      {cardContent}
    </DataRowCard>
  );
  // If swipe is enabled and we have edit/delete handlers, wrap in SwipeableCard
  if (enableSwipe && (onEdit || onDelete)) {
    const swipeActions = [];
    
    if (onEdit) {
      swipeActions.push({
        label: "Editar",
        icon: <Edit className="w-4 h-4" />,
        variant: "default" as const,
        onClick: () => onEdit(generalCost),
      });
    }
    
    if (onDelete) {
      swipeActions.push({
        label: "Eliminar",
        icon: <Trash2 className="w-4 h-4" />,
        variant: "destructive" as const,
        onClick: () => onDelete(generalCost),
      });
    }
    return (
      <SwipeableCard actions={swipeActions}>
        {generalCostCard}
      </SwipeableCard>
    );
  }
  return generalCostCard;
}
