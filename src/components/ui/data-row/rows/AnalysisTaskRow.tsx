import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useTaskCosts } from '@/hooks/use-task-costs';

// Interface para la tarea de análisis
interface AnalysisTask {
  id: string;
  name_rendered?: string;
  custom_name?: string;
  division?: string;
  unit?: string;
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
  // Obtener datos reales de costos
  const taskId = task.id;
  const { data: costs = [], isLoading } = useTaskCosts(taskId);
  
  // Calcular costos de materiales y mano de obra
  const materialCosts = costs.filter(c => c.type === 'Materiales');
  const laborCosts = costs.filter(c => c.type === 'Mano de Obra');
  
  const materialTotal = materialCosts.reduce((sum, c) => sum + c.total_price, 0);
  const laborTotal = laborCosts.reduce((sum, c) => sum + c.total_price, 0);
  const grandTotal = materialTotal + laborTotal;
  
  // Formatear montos
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  const rowProps: Omit<DataRowCardProps, 'children'> = {
    columns: 2, // DataRowCard requiere 2 o 3 columnas
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
          {task.division || 'Sin categoría'}{(task.unit || task.unit_name) && ` (${task.unit || task.unit_name})`}
        </div>
        
        {/* DIV SUPERIOR 2: Nombre completo de la tarea */}
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {task.custom_name || task.name_rendered || 'Sin nombre'}
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
              {isLoading ? '...' : formatCurrency(laborTotal)}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
              MAT:
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {isLoading ? '...' : formatCurrency(materialTotal)}
            </span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              TOT:
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {isLoading ? '...' : formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}