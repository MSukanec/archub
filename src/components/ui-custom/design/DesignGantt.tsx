import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Calendar, User, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/hooks/use-current-user';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DesignPhase {
  id: string;
  name: string;
  description?: string;
  project_id: string;
  organization_id: string;
  position: number;
  color: string;
  is_active: boolean;
  created_at: string;
  tasks?: DesignTask[];
}

interface DesignTask {
  id: string;
  title: string;
  description?: string;
  phase_id: string;
  parent_id?: string;
  assigned_to?: string;
  start_date?: string;
  end_date?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  position: number;
  created_by: string;
  created_at: string;
  children?: DesignTask[];
  assigned_user?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface DesignGanttProps {
  searchValue: string;
  onTaskClick: (task: DesignTask) => void;
}

export function DesignGantt({ searchValue, onTaskClick }: DesignGanttProps) {
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set());
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());
  const { data: userData } = useCurrentUser();

  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.organization?.id;

  // Fetch design phases
  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['design-phases', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return [];
      
      const { data, error } = await supabase
        .from('design_phases')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('position');
      
      if (error) {
        console.error('Error fetching design phases:', error);
        // Return mock data for development
        return [
          {
            id: '1',
            name: 'Anteproyecto',
            description: 'Diseño conceptual inicial',
            project_id: projectId,
            organization_id: organizationId || '',
            position: 1,
            color: '#3b82f6',
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: '2', 
            name: 'Proyecto Ejecutivo',
            description: 'Planos detallados de construcción',
            project_id: projectId,
            organization_id: organizationId || '',
            position: 2,
            color: '#10b981',
            is_active: true,
            created_at: new Date().toISOString()
          }
        ] as DesignPhase[];
      }
      
      return data as DesignPhase[];
    },
    enabled: !!projectId && !!supabase,
  });

  // Fetch design tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['design-tasks', projectId],
    queryFn: async () => {
      if (!supabase || !projectId) return [];
      
      const { data, error } = await supabase
        .from('design_tasks')
        .select(`
          *,
          assigned_user:organization_members!assigned_to(
            id,
            users(full_name, email, avatar_url)
          )
        `)
        .eq('project_id', projectId)
        .order('position');
      
      if (error) {
        console.error('Error fetching design tasks:', error);
        // Return mock data for development
        return [
          {
            id: '1',
            title: 'Análisis del terreno',
            description: 'Estudiar las características del sitio',
            phase_id: '1',
            assigned_to: undefined,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'in_progress' as const,
            priority: 'high' as const,
            position: 1,
            created_by: 'user1',
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Diseño arquitectónico inicial',
            description: 'Crear los primeros bocetos del diseño',
            phase_id: '1',
            assigned_to: undefined,
            start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'todo' as const,
            priority: 'medium' as const,
            position: 2,
            created_by: 'user1',
            created_at: new Date().toISOString()
          }
        ] as DesignTask[];
      }
      
      return data as DesignTask[];
    },
    enabled: !!projectId && !!supabase,
  });

  // Group tasks by phase and build hierarchy
  const groupedData = phases.map(phase => {
    const phaseTasks = tasks.filter(task => task.phase_id === phase.id);
    const rootTasks = phaseTasks.filter(task => !task.parent_id);
    
    const buildTaskHierarchy = (parentTask: DesignTask): DesignTask => {
      const children = phaseTasks.filter(task => task.parent_id === parentTask.id);
      return {
        ...parentTask,
        children: children.map(buildTaskHierarchy)
      };
    };

    return {
      ...phase,
      tasks: rootTasks.map(buildTaskHierarchy)
    };
  });

  // Filter data based on search
  const filteredData = groupedData.map(phase => ({
    ...phase,
    tasks: phase.tasks?.filter(task => 
      task.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchValue.toLowerCase())
    ) || []
  })).filter(phase => 
    phase.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (phase.tasks && phase.tasks.length > 0)
  );

  const togglePhase = (phaseId: string) => {
    const newCollapsed = new Set(collapsedPhases);
    if (newCollapsed.has(phaseId)) {
      newCollapsed.delete(phaseId);
    } else {
      newCollapsed.add(phaseId);
    }
    setCollapsedPhases(newCollapsed);
  };

  const toggleTask = (taskId: string) => {
    const newCollapsed = new Set(collapsedTasks);
    if (newCollapsed.has(taskId)) {
      newCollapsed.delete(taskId);
    } else {
      newCollapsed.add(taskId);
    }
    setCollapsedTasks(newCollapsed);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      todo: { variant: 'secondary', text: 'Por hacer' },
      in_progress: { variant: 'default', text: 'En progreso' },
      review: { variant: 'outline', text: 'En revisión' },
      done: { variant: 'default', text: 'Completado' }
    };
    
    const config = variants[status] || variants.todo;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'border-l-green-500',
      medium: 'border-l-yellow-500', 
      high: 'border-l-red-500'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const renderTask = (task: DesignTask, level = 0) => {
    const hasChildren = task.children && task.children.length > 0;
    const isCollapsed = collapsedTasks.has(task.id);

    return (
      <div key={task.id}>
        <div 
          className={`flex items-center justify-between p-3 border-l-4 bg-card hover:bg-accent/50 cursor-pointer transition-colors ${getPriorityColor(task.priority)}`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTask(task.id);
                }}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            {!hasChildren && <div className="w-6" />}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{task.title}</span>
                {getStatusBadge(task.status)}
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {task.start_date && task.end_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{task.start_date} - {task.end_date}</span>
                  </div>
                )}
                {task.assigned_user && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{task.assigned_user.full_name || task.assigned_user.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            {task.assigned_user && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={task.assigned_user.avatar_url} />
                <AvatarFallback>
                  {task.assigned_user.full_name?.charAt(0) || task.assigned_user.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTaskClick(task)}>
                Editar tarea
              </DropdownMenuItem>
              <DropdownMenuItem>
                Agregar subtarea
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {hasChildren && !isCollapsed && (
          <div>
            {task.children!.map(child => renderTask(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (phasesLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando cronograma...</div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-muted-foreground">No hay proyecto seleccionado</h3>
          <p className="text-sm text-muted-foreground mt-2">Selecciona un proyecto para ver las tareas de diseño</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredData.map(phase => {
        const isPhaseCollapsed = collapsedPhases.has(phase.id);
        
        return (
          <div key={phase.id} className="border rounded-lg overflow-hidden">
            <div 
              className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-center gap-3">
                {isPhaseCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: phase.color }}
                  />
                  <div>
                    <h3 className="font-semibold">{phase.name}</h3>
                    {phase.description && (
                      <p className="text-sm text-muted-foreground">{phase.description}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {phase.tasks?.length || 0} tareas
                </Badge>
              </div>
            </div>
            
            {!isPhaseCollapsed && (
              <div className="border-t">
                {phase.tasks && phase.tasks.length > 0 ? (
                  <div className="divide-y">
                    {phase.tasks.map(task => renderTask(task))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay tareas en esta fase
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {filteredData.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground">No se encontraron resultados</h3>
          <p className="text-sm text-muted-foreground mt-2">
            {searchValue ? 'Intenta con otros términos de búsqueda' : 'Comienza creando una nueva tarea'}
          </p>
        </div>
      )}
    </div>
  );
}