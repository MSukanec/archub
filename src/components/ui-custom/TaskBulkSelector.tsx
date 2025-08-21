import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTaskSearch } from '@/hooks/use-task-search';
import { cn } from '@/lib/utils';

interface TaskSelection {
  taskId: string;
  quantity: number;
}

interface TaskBulkSelectorProps {
  organizationId: string;
  selections: TaskSelection[];
  onSelectionChange: (selections: TaskSelection[]) => void;
  className?: string;
}

export function TaskBulkSelector({
  organizationId,
  selections,
  onSelectionChange,
  className
}: TaskBulkSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Búsqueda de tareas con debounce automático
  const { data: tasks = [], isLoading } = useTaskSearch(
    searchQuery, 
    organizationId, 
    { origin: 'all' },
    searchQuery.length >= 2 // Buscar con 2+ caracteres
  );

  // Mapear selecciones para acceso rápido
  const selectedTasksMap = useMemo(() => {
    if (!selections || !Array.isArray(selections)) return {};
    return selections.reduce((acc, selection) => {
      acc[selection.taskId] = selection.quantity;
      return acc;
    }, {} as Record<string, number>);
  }, [selections]);

  // Manejar selección/deselección de tarea
  const handleTaskToggle = useCallback((taskId: string, isSelected: boolean) => {
    const currentSelections = selections || [];
    if (isSelected) {
      // Agregar tarea con cantidad por defecto
      const newSelections = [...currentSelections, { taskId, quantity: 1 }];
      onSelectionChange(newSelections);
    } else {
      // Quitar tarea
      const newSelections = currentSelections.filter(s => s.taskId !== taskId);
      onSelectionChange(newSelections);
    }
  }, [selections, onSelectionChange]);

  // Manejar cambio de cantidad
  const handleQuantityChange = useCallback((taskId: string, quantity: number) => {
    const currentSelections = selections || [];
    const newSelections = currentSelections.map(selection => 
      selection.taskId === taskId 
        ? { ...selection, quantity: Math.max(0.01, quantity) }
        : selection
    );
    onSelectionChange(newSelections);
  }, [selections, onSelectionChange]);

  // Incrementar/decrementar cantidad
  const adjustQuantity = useCallback((taskId: string, delta: number) => {
    const currentQuantity = selectedTasksMap[taskId] || 1;
    const newQuantity = Math.max(0.01, currentQuantity + delta);
    handleQuantityChange(taskId, newQuantity);
  }, [selectedTasksMap, handleQuantityChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar tareas por nombre o código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Información de selección */}
      {(selections?.length || 0) > 0 && (
        <div className="text-sm text-muted-foreground">
          {selections?.length || 0} tarea{(selections?.length || 0) !== 1 ? 's' : ''} seleccionada{(selections?.length || 0) !== 1 ? 's' : ''}
        </div>
      )}

      {/* Lista de tareas */}
      <div className="border rounded-lg">
        {/* Header de la tabla */}
        <div className="grid grid-cols-[40px_1fr_200px_120px] gap-2 p-3 border-b bg-muted/20 text-xs font-medium text-muted-foreground">
          <div></div> {/* Checkbox column */}
          <div>TAREA</div>
          <div>RUBRO</div>
          <div className="text-center">CANTIDAD</div>
        </div>

        {/* Contenido de la tabla */}
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Buscando tareas...
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery.length >= 2 
                ? "No se encontraron tareas"
                : "Escriba al menos 2 caracteres para buscar"
              }
            </div>
          ) : (
            tasks.map((task) => {
              const isSelected = task.id in selectedTasksMap;
              const quantity = selectedTasksMap[task.id] || 1;

              return (
                <div 
                  key={task.id}
                  className={cn(
                    "grid grid-cols-[40px_1fr_200px_120px] gap-2 p-3 border-b hover:bg-muted/10 transition-colors",
                    isSelected && "bg-accent/5"
                  )}
                >
                  {/* Checkbox */}
                  <div className="flex items-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleTaskToggle(task.id, checked === true)
                      }
                    />
                  </div>

                  {/* Nombre de la tarea */}
                  <div className="flex flex-col min-w-0">
                    <div className="text-sm font-medium truncate">
                      {task.display_name || task.code || 'Sin nombre'}
                    </div>
                    {task.code && task.display_name && (
                      <div className="text-xs text-muted-foreground">
                        {task.code}
                      </div>
                    )}
                  </div>

                  {/* Rubro */}
                  <div className="text-sm text-muted-foreground truncate">
                    {task.rubro_name || 'Sin rubro'}
                  </div>

                  {/* Cantidad (solo si está seleccionada) */}
                  <div className="flex items-center justify-center">
                    {isSelected ? (
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="h-7 w-7 p-0"
                          onClick={() => adjustQuantity(task.id, -1)}
                          disabled={quantity <= 0.01}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              handleQuantityChange(task.id, value);
                            }
                          }}
                          className="h-7 w-16 text-center text-sm"
                          min="0.01"
                          step="0.01"
                        />
                        <Button
                          variant="outline"
                          size="icon-sm"
                          className="h-7 w-7 p-0"
                          onClick={() => adjustQuantity(task.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">-</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}