import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeatmapCell, CellStatus } from './types';
export interface StatusHeatmapProps {
  cells: HeatmapCell[];
  onCellClick?: (cell: HeatmapCell) => void;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  gridClassName?: string;
  sortBy?: 'status'| 'value'| 'none';
}
const statusClasses: Record<CellStatus, { card: string; bar: string; indicator: string; text: string }> = {
  critical: {
    card: 'bg-[var(--destructive)]/15 border-[var(--destructive)]/50 hover:bg-[var(--destructive)]/25',
    bar: 'bg-[var(--destructive)]',
    indicator: 'bg-[var(--destructive)]',
    text: 'text-[var(--destructive)]',
  },
  warning: {
    card: 'bg-[var(--warning)]/15 border-[var(--warning)]/50 hover:bg-[var(--warning)]/25',
    bar: 'bg-[var(--warning)]',
    indicator: 'bg-[var(--warning)]',
    text: 'text-[var(--warning)]',
  },
  healthy: {
    card: 'bg-[var(--success)]/15 border-[var(--success)]/50 hover:bg-[var(--success)]/25',
    bar: 'bg-[var(--success)]',
    indicator: 'bg-[var(--success)]',
    text: 'text-[var(--success)]',
  },
};
export function StatusHeatmap({
  cells,
  onCellClick,
  formatValue = (v) => v.toLocaleString(),
  emptyMessage = 'No hay elementos para mostrar',
  emptyIcon,
  className,
  gridClassName,
  sortBy = 'status',
}: StatusHeatmapProps) {
  const sortedCells = useMemo(() => {
    if (sortBy === 'none') return cells;
    
    return [...cells].sort((a, b) => {
      if (sortBy === 'status') {
        const statusOrder: Record<CellStatus, number> = { critical: 0, warning: 1, healthy: 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
      }
      return b.value - a.value;
    });
  }, [cells, sortBy]);
  if (cells.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-64 text-center", className)}>
        {emptyIcon || <Grid3X3 className="w-16 h-16 text-[var(--text-subtle)] mb-4" />}
        <p className="text-[var(--text-muted)]">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className={cn("absolute inset-0 overflow-auto p-8 pt-24", className)}>
      <div className="max-w-6xl mx-auto">
        <div className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3",
          gridClassName
        )}>
          {sortedCells.map((cell) => {
            const percent = cell.maxValue > 0 
              ? Math.round((cell.currentValue / cell.maxValue) * 100) 
              : 100;
            const classes = statusClasses[cell.status];
            
            return (
              <motion.div
                key={cell.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => onCellClick?.(cell)}
                className={cn(
                  "relative p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border",
                  classes.card
                )}
                data-testid={`heatmap-cell-${cell.id}`}
              >
                {cell.status === 'critical'&& (
                  <div className="absolute top-2 right-2">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", classes.indicator)} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--foreground)] truncate" title={cell.label}>
                    {cell.label.split('')[0]}
                  </p>
                  {cell.sublabel && (
                    <p className="text-xs text-[var(--text-muted)]">{cell.sublabel}</p>
                  )}
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--text-muted)]">Progreso</span>
                      <span className={classes.text}>{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={cn("h-full rounded-full", classes.bar)}
                      />
                    </div>
                  </div>
                  
                  {cell.value > 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                      {formatValue(cell.value)}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
