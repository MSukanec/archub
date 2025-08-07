import React, { useState, useMemo } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, CheckSquare, List, FolderOpen } from 'lucide-react';
import { useConstructionTasks } from '@/hooks/use-construction-tasks';
import { useCurrentUser } from '@/hooks/use-current-user';

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
  
  const { data: allTasks = [], isLoading } = useConstructionTasks(
    userData?.preferences?.last_project_id || '',
    userData?.organization?.id || ''
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
      </div>
    );
  }

  return (
      {/* Search and Grouping Controls */}
          <Input
            placeholder="Buscar por nombre o rubro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={grouping} onValueChange={(value: GroupingType) => setGrouping(value)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rubro">
                <span>Agrupadas por Rubro</span>
              </div>
            </SelectItem>
            <SelectItem value="none">
                <span>Sin Agrupar</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selection Summary */}
      {selectedTasks.length > 0 && (
                {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''} seleccionada{selectedTasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Render based on grouping type */}
      {grouping === 'rubro' ? (
        // Grouped by Rubro View
          {Object.entries(tasksByRubro).map(([rubroName, rubroTasks]) => (
                  <Checkbox
                    checked={isRubroFullySelected(rubroTasks)}
                    onCheckedChange={(checked) => handleSelectAllRubro(rubroTasks, !!checked)}
                  />
                    {rubroTasks.length}
                  </Badge>
                </div>
              </CardHeader>
                  {rubroTasks.map((task) => (
                    <div 
                      key={task.task_instance_id}
                    >
                      <Checkbox
                        checked={isTaskSelected(task.task_instance_id)}
                        onCheckedChange={(checked) => handleTaskToggle(task, !!checked)}
                      />
                          {task.task?.display_name || task.display_name || task.task_code}
                        </div>
                      </div>
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
              {filteredTasks.map((task) => (
                <div 
                  key={task.task_instance_id}
                >
                  <Checkbox
                    checked={isTaskSelected(task.task_instance_id)}
                    onCheckedChange={(checked) => handleTaskToggle(task, !!checked)}
                  />
                    <div>
                        {task.task?.display_name || task.display_name || task.task_code}
                      </div>
                        {task.task?.rubro_name || task.rubro_name || 'Sin Rubro'}
                      </div>
                    </div>
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
              <p>No se encontraron tareas con "{searchTerm}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {availableTasks.length === 0 && (
        <Card>
              <p>No hay tareas disponibles para agregar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});