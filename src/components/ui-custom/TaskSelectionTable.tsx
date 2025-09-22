import React, { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, CheckSquare, List, FolderOpen } from 'lucide-react';
import { useConstructionTasks } from '@/hooks/use-construction-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectContext } from '@/stores/projectContext';

export interface SelectedTask {
  task_instance_id: string;
  display_name: string;
  rubro_name: string | null;
  quantity: number;
  unit_symbol: string | null;
  task_code: string;
}

type GroupingType = 'none' | 'rubro';

interface TaskSelectionTableProps {
  selectedTasks: SelectedTask[];
  onTasksChange: (tasks: SelectedTask[]) => void;
  excludeTaskIds?: string[]; // IDs de tareas que ya están en el presupuesto
}

export const TaskSelectionTable = React.memo(function TaskSelectionTable({ 
  selectedTasks, 
  onTasksChange, 
  excludeTaskIds = [] 
}: TaskSelectionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [grouping, setGrouping] = useState<GroupingType>('rubro');
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  
  const { data: allTasks = [], isLoading } = useConstructionTasks(
    selectedProjectId || '',
    currentOrganizationId || ''
  );

  // Debug logging to understand data structure
  React.useEffect(() => {
    console.log('TaskSelectionTable - allTasks:', allTasks);
    console.log('TaskSelectionTable - allTasks length:', allTasks.length);
    if (allTasks.length > 0) {
      console.log('TaskSelectionTable - sample task:', JSON.stringify(allTasks[0], null, 2));
    }
  }, [allTasks]);

  // Filtrar tareas disponibles (excluir las que ya están en el presupuesto)
  const availableTasks = useMemo(() => {
    const filtered = allTasks.filter(task => 
      !excludeTaskIds.includes(task.task_instance_id)
    );
    console.log('TaskSelectionTable - availableTasks:', filtered.length);
    return filtered;
  }, [allTasks, excludeTaskIds]);

  // Filtrar tareas por término de búsqueda
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) {
      console.log('TaskSelectionTable - no search term, returning all available tasks:', availableTasks.length);
      return availableTasks;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = availableTasks.filter((task: any) => {
      // Based on console logs, data structure is: task.task.display_name, task.rubro_name, etc.
      const displayName = task.task?.display_name || task.display_name;
      const rubroName = task.task?.rubro_name || task.rubro_name;
      const taskCode = task.task_code || task.task?.code;
      
      console.log('TaskSelectionTable - checking task:', { displayName, rubroName, taskCode });
      
      return displayName?.toLowerCase().includes(term) ||
             rubroName?.toLowerCase().includes(term) ||
             taskCode?.toLowerCase().includes(term);
    });
    
    console.log('TaskSelectionTable - filtered by search:', filtered.length, 'from', availableTasks.length);
    return filtered;
  }, [availableTasks, searchTerm]);

  // Agrupar tareas por rubro
  const tasksByRubro = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    filteredTasks.forEach((task: any) => {
      // Based on console logs: task.task.rubro_name or task.rubro_name
      const rubroName = task.task?.rubro_name || task.rubro_name || 'Sin Rubro';
      if (!groups[rubroName]) {
        groups[rubroName] = [];
      }
      groups[rubroName].push(task);
    });
    
    console.log('TaskSelectionTable - groups by rubro:', Object.keys(groups), groups);
    return groups;
  }, [filteredTasks]);

  const handleTaskToggle = (task: any, isChecked: boolean) => {
    const selectedTask: SelectedTask = {
      task_instance_id: task.task_instance_id,
      display_name: task.task?.display_name || task.display_name || task.task_code,
      rubro_name: task.task?.rubro_name || task.rubro_name || null,
      quantity: task.quantity || 0,
      unit_symbol: task.task?.unit_symbol || task.unit_symbol || null,
      task_code: task.task_code || task.task?.code
    };

    if (isChecked) {
      onTasksChange([...selectedTasks, selectedTask]);
    } else {
      onTasksChange(selectedTasks.filter(t => t.task_instance_id !== task.task_instance_id));
    }
  };

  const handleSelectAllRubro = (rubroTasks: any[], isChecked: boolean) => {
    if (isChecked) {
      const newTasks = rubroTasks.map((task: any) => ({
        task_instance_id: task.task_instance_id,
        display_name: task.task?.display_name || task.display_name || task.task_code,
        rubro_name: task.task?.rubro_name || task.rubro_name || null,
        quantity: task.quantity || 0,
        unit_symbol: task.task?.unit_symbol || task.unit_symbol || null,
        task_code: task.task_code || task.task?.code
      }));
      
      const currentIds = selectedTasks.map(t => t.task_instance_id);
      const filteredNewTasks = newTasks.filter(t => !currentIds.includes(t.task_instance_id));
      
      onTasksChange([...selectedTasks, ...filteredNewTasks]);
    } else {
      const rubroTaskIds = rubroTasks.map((t: any) => t.task_instance_id);
      onTasksChange(selectedTasks.filter(t => !rubroTaskIds.includes(t.task_instance_id)));
    }
  };

  const isTaskSelected = (taskId: string) => {
    return selectedTasks.some(t => t.task_instance_id === taskId);
  };

  const isRubroFullySelected = (rubroTasks: any[]) => {
    return rubroTasks.length > 0 && rubroTasks.every((task: any) => isTaskSelected(task.task_instance_id));
  };

  const isRubroPartiallySelected = (rubroTasks: any[]) => {
    return rubroTasks.some((task: any) => isTaskSelected(task.task_instance_id)) && !isRubroFullySelected(rubroTasks);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Cargando cómputos disponibles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Grouping Controls */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o rubro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={grouping} onValueChange={(value: GroupingType) => setGrouping(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rubro">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span>Agrupadas por Rubro</span>
              </div>
            </SelectItem>
            <SelectItem value="none">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                <span>Sin Agrupar</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selection Summary */}
      {selectedTasks.length > 0 && (
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">
                {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''} seleccionada{selectedTasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render based on grouping type */}
      {grouping === 'rubro' ? (
        // Grouped by Rubro View
        <div className="space-y-2">
          {Object.entries(tasksByRubro).map(([rubroName, rubroTasks]) => (
            <Card key={rubroName} className="overflow-hidden">
              <CardHeader className="pb-2 pt-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isRubroFullySelected(rubroTasks)}
                    onCheckedChange={(checked) => handleSelectAllRubro(rubroTasks, !!checked)}
                  />
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-sm">{rubroName}</CardTitle>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    {rubroTasks.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {rubroTasks.map((task) => (
                    <div 
                      key={task.task_instance_id}
                      className="flex items-center gap-3 py-1 px-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={isTaskSelected(task.task_instance_id)}
                        onCheckedChange={(checked) => handleTaskToggle(task, !!checked)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground line-clamp-1">
                          {task.task?.display_name || task.display_name || task.task_code}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-muted-foreground flex-shrink-0">
                        {task.quantity || 0} {task.task?.unit_symbol || task.unit_symbol || ''}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Flat List View
        <Card>
          <CardContent className="p-3">
            <div className="space-y-1">
              {filteredTasks.map((task) => (
                <div 
                  key={task.task_instance_id}
                  className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={isTaskSelected(task.task_instance_id)}
                    onCheckedChange={(checked) => handleTaskToggle(task, !!checked)}
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-3">
                    <div>
                      <div className="text-sm text-foreground line-clamp-1">
                        {task.task?.display_name || task.display_name || task.task_code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {task.task?.rubro_name || task.rubro_name || 'Sin Rubro'}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground text-right">
                      {task.quantity || 0} {task.task?.unit_symbol || task.unit_symbol || ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredTasks.length === 0 && searchTerm && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No se encontraron tareas con "{searchTerm}"</p>
              <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>
            </div>
          </CardContent>
        </Card>
      )}

      {availableTasks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay tareas disponibles para agregar</p>
              <p className="text-xs mt-1">Todas las tareas ya están incluidas en el presupuesto</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});