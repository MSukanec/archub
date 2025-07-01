import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignProjectPhases } from '@/hooks/use-design-project-phases';
import { useAllDesignPhaseTasksForProject } from '@/hooks/use-design-phase-tasks';
import { Layout } from '@/components/layout/Layout';
import { Calendar, Plus, Clock, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function DesignSchedule() {
  const { data: userData } = useCurrentUser();
  const [showNewPhaseModal, setShowNewPhaseModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const currentProjectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.organization?.id;

  const { 
    data: phases = [], 
    isLoading: phasesLoading 
  } = useDesignProjectPhases(currentProjectId || '');

  const { 
    data: tasks = [], 
    isLoading: tasksLoading 
  } = useAllDesignPhaseTasksForProject(currentProjectId || '');

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { variant: 'secondary' as const, label: 'Pendiente' },
      'in_progress': { variant: 'default' as const, label: 'En Progreso' },
      'completed': { variant: 'success' as const, label: 'Completado' },
      'on_hold': { variant: 'warning' as const, label: 'En Pausa' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (phasesLoading || tasksLoading) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando cronograma...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-accent" />
            <h1 className="text-2xl font-semibold">Cronograma de Diseño</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewTaskModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Tarea
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowNewPhaseModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Fase
            </Button>
          </div>
        </div>

        {phases.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay fases de diseño</h3>
            <p className="text-muted-foreground mb-4">
              Comienza creando tu primera fase de diseño para organizar el proyecto.
            </p>
            <Button onClick={() => setShowNewPhaseModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Fase
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {phases.map((phase) => {
              const phaseTasks = tasks.filter(task => task.project_phase_id === phase.id);
              
              return (
                <div key={phase.id} className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{phase.name}</h3>
                      <Badge variant="outline">
                        {phaseTasks.length} tarea{phaseTasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDate(phase.start_date)} - {formatDate(phase.end_date)}
                    </div>
                  </div>

                  {phaseTasks.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                      <p className="text-muted-foreground">No hay tareas en esta fase</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {phaseTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <h4 className="font-medium">{task.name}</h4>
                              {task.description && (
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {task.assigned_user && (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={task.assigned_user.avatar_url || ''} />
                                  <AvatarFallback className="text-xs">
                                    {task.assigned_user.full_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                  {task.assigned_user.full_name}
                                </span>
                              </div>
                            )}
                            {getStatusBadge(task.status)}
                            <div className="text-sm text-muted-foreground">
                              {task.start_date && task.end_date && (
                                <>
                                  {formatDate(task.start_date)} - {formatDate(task.end_date)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}