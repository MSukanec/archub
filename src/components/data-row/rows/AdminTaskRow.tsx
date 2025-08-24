import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { TaskMaterialDetailPopover } from '@/components/popovers/TaskMaterialDetailPopover';
import TaskLaborCost from '@/components/construction/TaskLaborCost';
import TaskMaterialsSubtotal from '@/components/construction/TaskMaterialsSubtotal';
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal';

// Interface para la tarea administrativa
interface AdminTaskRowProps {
  task: any;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

export default function AdminTaskRow({
  task,
  onClick,
  selected = false,
  density = 'normal',
  className
}: AdminTaskRowProps) {
  
  const rowProps: Omit<DataRowCardProps, 'children'> = {
    columns: 2,
    onClick,
    selected,
    density,
    className
  };

  return (
    <DataRowCard {...rowProps}>
      {/* DIV SUPERIOR - Información completa */}
      <div className="flex flex-col gap-2 w-full">
        {/* HEADER CON NOMBRE SOLAMENTE */}
        <div className="w-full">
          {/* DIV SUPERIOR 1: Rubro (Unidad) */}
          <div className="text-xs text-[var(--text-secondary)] font-bold">
            {task.division || 'Sin categoría'}{task.unit && ` (${task.unit})`}
          </div>
          
          {/* DIV SUPERIOR 2: Nombre completo de la tarea */}
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {task.custom_name || task.name_rendered || 'Sin nombre'}
          </div>
        </div>
        
        {/* LÍNEA DIVISORIA */}
        <div className="border-t border-[var(--border)] w-full"></div>
        
        {/* DIV INFERIOR: 4 columnas M.O., MAT, TOTAL, Ojo */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              M.O.
            </span>
            <div className="text-xs text-[var(--text-secondary)]">
              <TaskLaborCost task={task} />
            </div>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              MAT
            </span>
            <div className="text-xs text-[var(--text-secondary)]">
              <TaskMaterialsSubtotal task={task} />
            </div>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              TOTAL
            </span>
            <div className="text-xs text-[var(--text-secondary)]">
              <TaskTotalSubtotal task={task} />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center">
            <TaskMaterialDetailPopover task={task} showCost={false} />
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}