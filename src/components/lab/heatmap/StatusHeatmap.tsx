import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HeatmapCell, CellStatus, DEFAULT_STATUS_COLORS, StatusColors } from './types';

export interface StatusHeatmapProps {
  cells: HeatmapCell[];
  onCellClick?: (cell: HeatmapCell) => void;
  statusColors?: Record<CellStatus, StatusColors>;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  className?: string;
  gridClassName?: string;
  sortBy?: 'status' | 'value' | 'none';
}

export function StatusHeatmap({
  cells,
  onCellClick,
  statusColors = DEFAULT_STATUS_COLORS,
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
        {emptyIcon || <Grid3X3 className="w-16 h-16 text-white/20 mb-4" />}
        <p className="text-white/50">{emptyMessage}</p>
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
            const colors = statusColors[cell.status];
            
            return (
              <motion.div
                key={cell.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => onCellClick?.(cell)}
                className={cn(
                  "relative p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border",
                  cell.status === 'critical' && "bg-red-500/20 border-red-500/50 hover:bg-red-500/30",
                  cell.status === 'warning' && "bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/30",
                  cell.status === 'healthy' && "bg-green-500/20 border-green-500/50 hover:bg-green-500/30",
                )}
                data-testid={`heatmap-cell-${cell.id}`}
              >
                {cell.status === 'critical' && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white truncate" title={cell.label}>
                    {cell.label.split(' ')[0]}
                  </p>
                  {cell.sublabel && (
                    <p className="text-xs text-white/50">{cell.sublabel}</p>
                  )}
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">Progreso</span>
                      <span className={colors.text}>{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={cn(
                          "h-full rounded-full",
                          cell.status === 'critical' && "bg-red-500",
                          cell.status === 'warning' && "bg-yellow-500",
                          cell.status === 'healthy' && "bg-green-500",
                        )}
                      />
                    </div>
                  </div>
                  
                  {cell.value > 0 && (
                    <p className="text-xs text-white/70 mt-2">
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
