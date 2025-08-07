import React from 'react';
import { Check, X, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Task {
  id: string;
  name_rendered: string;
  unit_name: string;
}

interface Props {
  tasks: Task[];
  selectedTaskIds: string[];
  onSelectionChange: (taskIds: string[]) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function TaskMultiSelector({ 
  tasks, 
  selectedTaskIds, 
  onSelectionChange, 
  placeholder = "Seleccionar tareas...",
  isLoading = false 
}: Props) {
  const [selectedTaskId, setSelectedTaskId] = React.useState<string>('');
  
  const addTask = (taskId: string) => {
    if (taskId && !selectedTaskIds?.includes(taskId)) {
      onSelectionChange([...(selectedTaskIds || []), taskId]);
      setSelectedTaskId(''); // Reset selector
    }
  };
  
  const removeTask = (taskIdToRemove: string) => {
    onSelectionChange((selectedTaskIds || []).filter(id => id !== taskIdToRemove));
  };
  
  const selectedTasks = tasks.filter(task => selectedTaskIds?.includes(task.id));
  const availableTasks = tasks.filter(task => !selectedTaskIds?.includes(task.id));
  
  if (isLoading) {
    return (
      </div>
    );
  }
  
  return (
      {/* Selector para agregar tareas */}
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {availableTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name_rendered} ({task.unit_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          type="button"
          onClick={() => addTask(selectedTaskId)}
          disabled={!selectedTaskId}
          size="sm"
        >
          Agregar
        </Button>
      </div>
      
      {/* Lista de tareas seleccionadas */}
      {selectedTasks.length > 0 && (
              {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''} seleccionada{selectedTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
            {selectedTasks.map((task) => (
                    {task.unit_name}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTask(task.id)}
                >
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Empty state */}
      {selectedTasks.length === 0 && (
          Selecciona las tareas de construcción relacionadas con este movimiento
        </div>
      )}
    </div>
  );
}