import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { TaskMaterialDetailPopover } from '@/components/popovers/TaskMaterialDetailPopover';
import TaskLaborCost from '@/components/construction/TaskLaborCost';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para la tarea administrativa
interface AdminTaskRowProps {
  task: any;
  onEdit?: (task: any) => void;
  onDelete?: (task: any) => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

export default function AdminTaskRow({
  task,
  onEdit,
  onDelete,
  selected = false,
  density = 'normal',
  className
}: AdminTaskRowProps) {
  
  const rowProps: Omit<DataRowCardProps, 'children'> = {
    columns: 2, // Cambiado a 2 para cumplir con el tipo
    selected,
    density,
    className
  };

  return (
    <DataRowCard {...rowProps}>
      {/* DIV SUPERIOR - Información completa */}
      <div className="flex flex-col gap-2 w-full">
        {/* HEADER CON INFORMACIÓN DE LA TAREA */}
        <div className="w-full">
          {/* DIV SUPERIOR 1: Estado - Rubro (Unidad) - Sistema/Usuario */}
          <div className="text-xs text-[var(--text-secondary)] font-bold flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              task.is_completed ? 
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {task.is_completed ? 'Completado' : 'Incompleto'}
            </span>
            {task.category && (
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
            )}
            {task.unit && (
              <Badge variant="secondary" className="text-xs">
                {task.unit}
              </Badge>
            )}
            <Badge className={`text-xs ${
              task.is_system ? 
                'bg-green-100 text-green-800' : 
                'bg-blue-100 text-blue-800'
            }`}>
              {task.is_system ? 'SISTEMA' : 'USUARIO'}
            </Badge>
          </div>
          
          {/* DIV SUPERIOR 2: Nombre personalizado de la tarea */}
          <div className="text-sm font-medium text-[var(--text-primary)] mt-1">
            {task.custom_name || 'Sin nombre personalizado'}
          </div>
          
          {/* DIV SUPERIOR 3: Nombre paramétrico (si existe y es diferente) */}
          {task.name_rendered && task.name_rendered !== task.custom_name && (
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              {task.name_rendered}
            </div>
          )}

          {/* DIV SUPERIOR 4: Código y fecha */}
          <div className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-2">
            {task.code && (
              <span className="font-mono bg-[var(--background-secondary)] px-1 rounded">
                {task.code}
              </span>
            )}
            <span>
              {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
        </div>
        
        {/* LÍNEA DIVISORIA */}
        <div className="border-t border-[var(--border)] w-full"></div>
        
        {/* DIV INFERIOR: Mano de Obra, Materiales y Acciones */}
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
              Materiales
            </span>
            <div className="text-xs text-[var(--text-secondary)] flex justify-center">
              <TaskMaterialDetailPopover task={task} showCost={false} />
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-[var(--text-primary)] mb-1">
              Acciones
            </span>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(task)}
                  className="h-6 w-6 p-0"
                  title="Editar tarea"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  title="Eliminar tarea"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            {/* Espacio reservado para futuras funciones */}
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}