import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

// Interface para la tarea de análisis
interface AnalysisTask {
  id: string;
  name_rendered: string;
  category_name?: string;
  unit_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface AnalysisTaskRowProps {
  task: AnalysisTask;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

export default function AnalysisTaskRow({
  task,
  onEdit,
  onDelete,
  onClick,
  selected = false,
  density = 'normal',
  className
}: AnalysisTaskRowProps) {
  
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
        {task.category_name && (
          <div className="text-xs text-[var(--text-secondary)] font-medium">
            {task.category_name}{task.unit_name && ` (${task.unit_name})`}
          </div>
        )}
        
        {/* DIV SUPERIOR 2: Nombre completo de la tarea */}
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {task.name_rendered}
        </div>
        
        {/* LÍNEA DIVISORIA */}
        <div className="border-t border-[var(--border)] w-full"></div>
        
        {/* DIV INFERIOR: 3 columnas MAT MO TOT */}
        <div className="grid grid-cols-3 gap-2 w-full">
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              MO:
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              $ 0.00
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              MAT:
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              $ 0.00
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              TOT:
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