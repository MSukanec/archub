import { useState } from 'react';
import { Plus, Filter, Search, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignPhases } from '@/hooks/use-design-phases';
import { useDesignTasks } from '@/hooks/use-design-tasks';
import { CustomPageLayout } from '@/components/ui-custom/layout/CustomPageLayout';
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState';
import { CustomDesignGantt } from '@/components/ui-custom/gantt/CustomDesignGantt';
import { NewDesignTaskModal } from '@/modals/design/NewDesignTaskModal';

export default function DesignGantt() {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: phases = [], isLoading: phasesLoading } = useDesignPhases(projectId || '');
  const { data: tasks = [], isLoading: tasksLoading } = useDesignTasks(projectId || '');
  
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');

  // Group tasks by phase
  const tasksByPhase = phases.map(phase => ({
    ...phase,
    tasks: tasks.filter(task => task.design_phase_id === phase.id)
  }));

  // Filter tasks based on search and status
  const filteredTasksByPhase = tasksByPhase.map(phase => ({
    ...phase,
    tasks: phase.tasks.filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
  })).filter(phase => phase.tasks.length > 0 || searchQuery === '');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22c55e'; // green
      case 'in_progress': return '#3b82f6'; // blue
      case 'pending': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En progreso';
      case 'pending': return 'Por hacer';
      default: return 'Sin estado';
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;

  const isLoading = phasesLoading || tasksLoading;
  const isEmpty = !isLoading && phases.length === 0;

  const customFilters = (
    <div className="space-y-4 w-72">
      <div className="space-y-2">
        <Label htmlFor="search">Buscar tareas</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <select
          id="status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Por hacer</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completado</option>
        </select>
      </div>

      {phases.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="phase">Fase</Label>
          <select
            id="phase"
            value={selectedPhaseId}
            onChange={(e) => setSelectedPhaseId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-input bg-background rounded-md"
          >
            <option value="">Todas las fases</option>
            {phases.map(phase => (
              <option key={phase.id} value={phase.id}>{phase.name}</option>
            ))}
          </select>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setSelectedPhaseId('');
        }}
        className="w-full"
      >
        Limpiar filtros
      </Button>
    </div>
  );

  if (isEmpty) {
    return (
      <CustomPageLayout
        title="Cronograma de Diseño"
        icon={Calendar}
        actions={[
          <Button
            key="new-task"
            onClick={() => setShowNewTaskModal(true)}
            className="h-8 px-3 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva tarea
          </Button>
        ]}
        customFilters={customFilters}
        isWide
      >
        <CustomEmptyState
          icon={Calendar}
          title="No hay fases de diseño"
          description="Crea la primera fase de diseño para comenzar a planificar las tareas del proyecto."
          actionLabel="Crear primera fase"
          onAction={() => setShowNewTaskModal(true)}
        />
      </CustomPageLayout>
    );
  }

  return (
    <CustomPageLayout
      title="Cronograma de Diseño"
      icon={Calendar}
      actions={[
        <Button
          key="new-task"
          onClick={() => setShowNewTaskModal(true)}
          className="h-8 px-3 text-sm font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva tarea
        </Button>
      ]}
      customFilters={customFilters}
      isWide
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-xs text-muted-foreground">Total de Tareas</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-semibold">{totalTasks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-xs text-muted-foreground">Por Hacer</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-semibold text-amber-600">{pendingTasks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-xs text-muted-foreground">En Progreso</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-semibold text-blue-600">{inProgressTasks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-xs text-muted-foreground">Completadas</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-semibold text-green-600">{completedTasks}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gantt Chart */}
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Cronograma de Tareas por Fase</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <CustomDesignGantt
              phases={filteredTasksByPhase}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
            />
          </CardContent>
        </Card>

        {/* Task List by Phase */}
        <div className="space-y-4">
          {filteredTasksByPhase.map(phase => (
            <Card key={phase.id}>
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">{phase.name}</CardTitle>
                    {phase.description && (
                      <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {phase.tasks.length} tareas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {phase.tasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium">{task.name}</h4>
                          <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                        )}
                        {(task.start_date || task.end_date) && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {task.start_date && (
                              <span>{new Date(task.start_date).toLocaleDateString()}</span>
                            )}
                            {task.start_date && task.end_date && <span>-</span>}
                            {task.end_date && (
                              <span>{new Date(task.end_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* New Task Modal */}
      <NewDesignTaskModal
        isOpen={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        phases={phases}
      />
    </CustomPageLayout>
  );
}