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
        <Input
          placeholder="Buscar tareas por nombre o código..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Información de selección */}
      {(selections?.length || 0) > 0 && (
          {selections?.length || 0} tarea{(selections?.length || 0) !== 1 ? 's' : ''} seleccionada{(selections?.length || 0) !== 1 ? 's' : ''}
        </div>
      )}

      {/* Lista de tareas */}
        {/* Header de la tabla */}
          <div></div> {/* Checkbox column */}
          <div>TAREA</div>
          <div>RUBRO</div>
        </div>

        {/* Contenido de la tabla */}
          {isLoading ? (
              Buscando tareas...
            </div>
          ) : tasks.length === 0 ? (
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
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleTaskToggle(task.id, checked === true)
                      }
                    />
                  </div>

                  {/* Nombre de la tarea */}
                      {task.display_name || task.code || 'Sin nombre'}
                    </div>
                    {task.code && task.display_name && (
                        {task.code}
                      </div>
                    )}
                  </div>

                  {/* Rubro */}
                    {task.rubro_name || 'Sin rubro'}
                  </div>

                  {/* Cantidad (solo si está seleccionada) */}
                    {isSelected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustQuantity(task.id, -1)}
                          disabled={quantity <= 0.01}
                        >
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
                          min="0.01"
                          step="0.01"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => adjustQuantity(task.id, 1)}
                        >
                        </Button>
                      </div>
                    ) : (
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