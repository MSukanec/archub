import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';

type ConstructionTaskCardProps = {
  task: {
    id: string;
    task?: {
      display_name: string;
      rubro_name: string;
      unit_symbol: string;
    };
    quantity: number;
    phase_name?: string;
  };
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
};

// Utility function to format quantity with thousands separators
const formatQuantity = (quantity: number): string => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(quantity);
};

const ConstructionTaskCard: React.FC<ConstructionTaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    task: taskData,
    quantity,
    phase_name
  } = task;

  const taskName = taskData?.display_name || 'Tarea sin nombre';
  const rubroName = taskData?.rubro_name || 'Sin rubro';
  const unitSymbol = taskData?.unit_symbol || '';
  const formattedQuantity = formatQuantity(quantity);

  return (
    <SwipeableCard
      actions={[
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit?.(task)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => onDelete?.(task)
        }
      ]}
    >
      <div className="flex items-center justify-between gap-3 bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] rounded-lg shadow-sm border border-[var(--card-border)] p-3 mb-2 transition-colors">
        
        {/* Center: Data - Two rows layout */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div 
              className="text-[var(--card-fg)] font-medium text-sm truncate"
              title={taskName}
            >
              {taskName}
            </div>
            <div className="text-[var(--card-fg)] text-sm ml-4">
              {unitSymbol}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div 
              className="text-[var(--muted-fg)] text-sm truncate"
              title={rubroName}
            >
              {rubroName}
            </div>
            <div className="text-[var(--card-fg)] font-medium text-sm ml-4">
              {formattedQuantity}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default ConstructionTaskCard;