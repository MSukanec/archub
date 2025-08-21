import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { TaskMaterialDetailPopover } from '@/components/popovers/TaskMaterialDetailPopover';

// Interface para la tarea de construcción
interface TaskRowProps {
  task: any;
  onEdit?: (task: any) => void;
  onDelete?: (taskId: string) => void;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

export default function TaskRow({
  task,
  onEdit,
  onDelete,
  onClick,
  selected = false,
  density = 'normal',
  className
}: TaskRowProps) {
  
  const rowProps: Omit<DataRowCardProps, 'children'> = {
    columns: 1, // Una sola columna ya que ocupamos todo el ancho
    onClick,
    selected,
    density,
    className
  };

  return (
    <DataRowCard {...rowProps}>
      {/* DIV SUPERIOR - Información completa */}
      <div className="flex flex-col gap-2 w-full">
        {/* DIV SUPERIOR 1: Rubro (Unidad) */}
        <div className="text-xs text-[var(--text-secondary)] font-bold">
          {task.category_name || 'Sin categoría'}{task.task?.unit_symbol && ` (${task.task.unit_symbol})`}
        </div>
        
        {/* DIV SUPERIOR 2: Nombre completo de la tarea */}
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {task.custom_name || task.task?.name || 'Sin nombre'}
        </div>
        
        {/* LÍNEA DIVISORIA */}
        <div className="border-t border-[var(--border)] w-full"></div>
        
        {/* DIV INFERIOR: 2 columnas C.U. SUBT. */}
        <div className="grid grid-cols-2 gap-2 w-full">
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              C.U.
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              $ 0.00
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              SUBT.
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              $ 0.00
            </span>
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}