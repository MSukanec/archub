import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { TaskMaterialDetailPopover } from '@/components/popovers/TaskMaterialDetailPopover';
import TaskMaterialsSubtotal from '@/components/construction/TaskMaterialsSubtotal';
import TaskTotalSubtotal from '@/components/construction/TaskTotalSubtotal';

// Interface para la tarea de construcción
interface TaskRowProps {
  task: any;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

export default function TaskRow({
  task,
  onClick,
  selected = false,
  density = 'normal',
  className
}: TaskRowProps) {
  
  const rowProps: Omit<DataRowCardProps, 'children'> = {
    columns: 2, // Cambiado a 2 para cumplir con el tipo
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
          {/* DIV SUPERIOR 1: Fase - Rubro (Unidad) */}
          <div className="text-xs text-[var(--text-secondary)] font-bold">
            {task.phase_name && `${task.phase_name} - `}{task.category_name || 'Sin categoría'}{(task.unit || task.task?.unit_symbol) && ` (${task.unit || task.task?.unit_symbol})`}
          </div>
          
          {/* DIV SUPERIOR 2: Nombre completo de la tarea */}
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {task.custom_name || task.task?.name || 'Sin nombre'}
          </div>
        </div>
        
        {/* LÍNEA DIVISORIA */}
        <div className="border-t border-[var(--border)] w-full"></div>
        
        {/* DIV INFERIOR: 4 columnas Cantidad, Costo Unitario, Subtotal, Acción */}
        <div className="grid grid-cols-4 gap-2 w-full">
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              Cantidad
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {(task.quantity || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              Costo Unitario
            </span>
            <div className="text-xs text-[var(--text-secondary)]">
              <TaskMaterialsSubtotal task={task} />
            </div>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Subtotal
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