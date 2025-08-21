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
      {/* Columna 1: Información completa */}
      <div className="flex flex-col gap-2 col-span-2">
        {/* Título de la tarea */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
            {task.name_rendered}
          </span>
          {task.category_name && (
            <Badge variant="outline" className="text-xs w-fit">
              {task.category_name}
            </Badge>
          )}
        </div>
        
        {/* Línea divisoria */}
        <div className="border-t border-[var(--border)]"></div>
        
        {/* Costos en 3 columnas ocupando todo el ancho */}
        <div className="grid grid-cols-3 gap-0 w-full">
          <div className="flex flex-col pr-2">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              MO:
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              $ 0.00
            </span>
          </div>
          <div className="flex flex-col px-2">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              MAT:
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              $ 0.00
            </span>
          </div>
          <div className="flex flex-col pl-2">
            <span className="text-xs font-medium text-[var(--text-primary)]">
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