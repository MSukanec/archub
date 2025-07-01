import { useState } from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface TaskBarProps {
  task: {
    id: string;
    name: string;
    start_date?: string | null;
    end_date?: string | null;
    status: string;
    priority: string;
  };
  position: {
    left: string;
    width: string;
  } | null;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskBar({ task, position, onEdit, onDelete }: TaskBarProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!position) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'in_progress': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'on_hold': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '📋';
      default: return '📋';
    }
  };

  return (
    <div 
      className={`absolute h-4 rounded-sm flex items-center justify-between px-1 cursor-pointer transition-all ${getStatusColor(task.status)}`}
      style={{ 
        left: position.left,
        width: position.width,
        top: '8px'
      }}
      title={`${task.name} (${task.start_date} - ${task.end_date})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-xs text-white font-medium truncate mr-1">
        {task.name}
      </span>
      
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-white rounded-sm flex items-center justify-center">
          <span className="text-[8px]">{getPriorityIcon(task.priority)}</span>
        </div>
        
        {isHovered && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-white hover:bg-white/20"
              >
                <MoreHorizontal className="h-2 w-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}