import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Circle, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type Task = {
  id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  created_at?: string;
  [key: string]: any; // Allow additional fields
};

type Props = {
  tasks: Task[];
  onToggleCompleted: (id: string, completed: boolean) => void;
  isLoading?: boolean;
};

function TaskCard({ task, onToggleCompleted }: { task: Task; onToggleCompleted: (id: string, completed: boolean) => void }) {
  const isCompleted = task.is_completed;
  
  const formatCompletedDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'd MMM', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <Card className={`group transition-all duration-200 ${isCompleted ? 'opacity-75' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox/Check Icon */}
          <Button
            variant="ghost"
            size="icon-sm"
            className=" flex-shrink-0 mt-0.5"
            onClick={() => onToggleCompleted(task.id, !isCompleted)}
          >
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
            )}
          </Button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div 
              className={`text-sm font-medium ${
                isCompleted 
                  ? 'line-through text-muted-foreground opacity-60' 
                  : 'text-foreground'
              }`}
            >
              {task.title}
            </div>
            
            {task.description && (
              <div 
                className={`text-xs mt-1 ${
                  isCompleted 
                    ? 'text-muted-foreground opacity-50' 
                    : 'text-muted-foreground'
                }`}
              >
                {task.description}
              </div>
            )}

            {/* Completed Date */}
            {isCompleted && task.completed_at && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground opacity-60">
                <Calendar className="h-3 w-3" />
                <span>Completado el {formatCompletedDate(task.completed_at)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanList({ tasks, onToggleCompleted, isLoading = false }: Props) {
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  // Sort active tasks by creation date (newest first)
  activeTasks.sort((a, b) => {
    if (!a.created_at || !b.created_at) return 0;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Sort completed tasks by completion date (newest first)
  completedTasks.sort((a, b) => {
    if (!a.completed_at || !b.completed_at) return 0;
    return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="h-4 w-4 bg-muted rounded-full mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-1" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Active Tasks */}
      {activeTasks.map(task => (
        <TaskCard key={task.id} task={task} onToggleCompleted={onToggleCompleted} />
      ))}

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div className="pt-4">
          <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto p-2 w-full justify-start text-sm text-muted-foreground hover:text-foreground data-[state=open]:text-foreground"
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${isCompletedOpen ? 'rotate-90' : ''}`} />
                <span className="ml-1">Completadas ({completedTasks.length})</span>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <TaskCard key={task.id} task={task} onToggleCompleted={onToggleCompleted} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Empty State */}
      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Circle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">No hay tareas disponibles</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}