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
          {/* Checkbox/Check Icon */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleCompleted(task.id, !isCompleted)}
          >
            {isCompleted ? (
            ) : (
            )}
          </Button>

          {/* Task Content */}
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
        {Array.from({ length: 3 }).map((_, i) => (
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
      {/* Active Tasks */}
      {activeTasks.map(task => (
        <TaskCard key={task.id} task={task} onToggleCompleted={onToggleCompleted} />
      ))}

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
          <Collapsible open={isCompletedOpen} onOpenChange={setIsCompletedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${isCompletedOpen ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}