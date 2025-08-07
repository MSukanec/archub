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
          onClick: () => onEdit?.(task)
        },
        {
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => onDelete?.(task)
        }
      ]}
    >
        
        {/* Center: Data - Two rows layout */}
            <div 
              title={taskName}
            >
              {taskName}
            </div>
              {unitSymbol}
            </div>
          </div>
          
            <div 
              title={rubroName}
            >
              {rubroName}
            </div>
              {formattedQuantity}
            </div>
          </div>
        </div>
      </div>
    </SwipeableCard>
  );
};

export default ConstructionTaskCard;