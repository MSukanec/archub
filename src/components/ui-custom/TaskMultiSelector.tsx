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
      <div className="space-y-3">
        <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
        <div className="text-sm text-gray-500">Cargando tareas...</div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Selector para agregar tareas */}
      <div className="flex gap-2">
        <div className="flex-1">
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
          className="px-3"
        >
          <Package className="w-4 h-4 mr-1" />
          Agregar
        </Button>
      </div>
      
      {/* Lista de tareas seleccionadas */}
      {selectedTasks.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">
              {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''} seleccionada{selectedTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {selectedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{task.name_rendered}</span>
                  <Badge variant="outline" className="text-xs">
                    {task.unit_name}
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeTask(task.id)}
                  className="hover:bg-red-100 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Empty state */}
      {selectedTasks.length === 0 && (
        <div className="text-xs text-gray-500 px-1">
          Selecciona las tareas de construcción relacionadas con este movimiento
        </div>
      )}
    </div>
  );
}