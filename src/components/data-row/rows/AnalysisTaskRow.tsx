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
    columns: 2,
    onClick,
    selected,
    density,
    className
  };

  return (
    <DataRowCard {...rowProps}>
      {/* Columna 1: Información principal */}
      <div className="flex flex-col gap-1">
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
        
        {task.unit_name && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-[var(--text-secondary)]">
              Unidad:
            </span>
            <Badge variant="secondary" className="text-xs">
              {task.unit_name}
            </Badge>
          </div>
        )}
      </div>

      {/* Columna 2: Acciones */}
      <div className="flex items-center justify-end gap-1">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-[var(--text-secondary)] hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </DataRowCard>
  );
}