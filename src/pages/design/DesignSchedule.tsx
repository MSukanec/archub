import { useState, useMemo } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignProjectPhases } from '@/hooks/use-design-project-phases';
import { useAllDesignPhaseTasksForProject } from '@/hooks/use-design-phase-tasks';
import { CustomPageLayout } from '@/components/ui-custom/layout/CustomPageLayout';
import { CustomPageHeader } from '@/components/ui-custom/layout/CustomPageHeader';
import { Calendar, Plus, Search, Filter, Clock, User, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function DesignSchedule() {
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: projectPhases = [], isLoading: phasesLoading } = useDesignProjectPhases(projectId || '');
  const { data: allTasks = [], isLoading: tasksLoading } = useAllDesignPhaseTasksForProject(projectId || '');
  
  const [showNewPhaseModal, setShowNewPhaseModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);

  // Calcular el rango de fechas del proyecto
  const dateRange = useMemo(() => {
    const allDates = [
      ...projectPhases.map(p => p.start_date).filter(Boolean),
      ...projectPhases.map(p => p.end_date).filter(Boolean),
      ...allTasks.map(t => t.start_date).filter(Boolean),
      ...allTasks.map(t => t.end_date).filter(Boolean)
    ].filter(Boolean) as string[];

    if (allDates.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      const end = new Date(today);
      end.setDate(today.getDate() + 60);
      return { start, end, days: 90 };
    }

    const dates = allDates.map(d => new Date(d));
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Añadir margen
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return { start, end, days };
  }, [projectPhases, allTasks]);

  // Generar array de días para el timeline
  const timelineDays = useMemo(() => {
    const days = [];
    const current = new Date(dateRange.start);
    
    for (let i = 0; i < dateRange.days; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [dateRange]);

  // Agrupar tareas por fase
  const tasksGroupedByPhase = useMemo(() => {
    const grouped = new Map();
    
    allTasks.forEach(task => {
      const phaseId = task.project_phase_id;
      if (!grouped.has(phaseId)) {
        grouped.set(phaseId, []);
      }
      grouped.get(phaseId).push(task);
    });
    
    return grouped;
  }, [allTasks]);

  const togglePhaseExpansion = (phaseId: string) => {
    setExpandedPhases(prev => 
      prev.includes(phaseId) 
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  const calculateTaskPosition = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
    
    const startDayIndex = timelineDays.findIndex(day => 
      day.toDateString() === start.toDateString()
    );
    
    const endDayIndex = timelineDays.findIndex(day => 
      day.toDateString() === end.toDateString()
    );
    
    if (startDayIndex === -1) return null;
    
    const width = Math.max(1, endDayIndex - startDayIndex + 1);
    const left = (startDayIndex / timelineDays.length) * 100;
    const widthPercent = (width / timelineDays.length) * 100;
    
    return { left: `${left}%`, width: `${widthPercent}%` };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (phasesLoading || tasksLoading) {
    return (
      <CustomPageLayout padding="md">
        <CustomPageHeader
          title="Cronograma de Diseño"
          icon={Calendar}
          showSearch={false}
        />
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="text-muted-foreground mt-2">Cargando cronograma...</p>
        </div>
      </CustomPageLayout>
    );
  }

  return (
    <CustomPageLayout padding="none">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
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
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar tareas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="ghost" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {/* Timeline Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex">
            <div className="w-80 flex-shrink-0 border-r border-border p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Fases y Tareas</h3>
            </div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex" style={{ minWidth: `${timelineDays.length * 40}px` }}>
                {timelineDays.map((day, index) => (
                  <div
                    key={index}
                    className="w-10 flex-shrink-0 p-1 text-center border-r border-border"
                  >
                    <div className="text-xs text-muted-foreground">
                      {formatDate(day)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {projectPhases.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay fases creadas</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primera fase de diseño
              </p>
              <Button onClick={() => setShowNewPhaseModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Fase
              </Button>
            </div>
          ) : (
            <div className="space-y-0">
              {projectPhases.map((phase) => {
                const phaseTasks = tasksGroupedByPhase.get(phase.id) || [];
                const isExpanded = expandedPhases.includes(phase.id);
                
                return (
                  <Collapsible
                    key={phase.id}
                    open={isExpanded}
                    onOpenChange={() => togglePhaseExpansion(phase.id)}
                  >
                    <div className="border-b border-border">
                      {/* Phase Row */}
                      <div className="flex items-center hover:bg-muted/50">
                        <div className="w-80 flex-shrink-0 border-r border-border p-4">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-2 cursor-pointer">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">{phase.name}</h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {phaseTasks.length} tareas
                                  </Badge>
                                </div>
                                {phase.start_date && phase.end_date && (
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>
                        </div>
                        
                        <div className="flex-1 relative h-16 overflow-x-auto">
                          <div className="absolute inset-0" style={{ minWidth: `${timelineDays.length * 40}px` }}>
                            {/* Phase timeline bar */}
                            {phase.start_date && phase.end_date && (
                              <div
                                className="absolute top-6 h-4 bg-accent/20 border-2 border-accent rounded"
                                style={calculateTaskPosition(phase.start_date, phase.end_date) || {}}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tasks */}
                      <CollapsibleContent>
                        {phaseTasks.map((task) => (
                          <div key={task.id} className="flex items-center hover:bg-muted/30">
                            <div className="w-80 flex-shrink-0 border-r border-border p-4 pl-8">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="text-sm font-medium">
                                    {task.name || task.design_task?.name || 'Sin nombre'}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${getStatusColor(task.status)} text-white`}
                                    >
                                      {task.status === 'todo' ? 'Por hacer' : 
                                       task.status === 'in_progress' ? 'En progreso' : 'Completado'}
                                    </Badge>
                                    {task.assigned_user && (
                                      <div className="flex items-center gap-1">
                                        <Avatar className="w-4 h-4">
                                          <AvatarFallback className="text-xs">
                                            {task.assigned_user.full_name?.charAt(0) || '?'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground">
                                          {task.assigned_user.full_name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex-1 relative h-12 overflow-x-auto">
                              <div className="absolute inset-0" style={{ minWidth: `${timelineDays.length * 40}px` }}>
                                {/* Task timeline bar */}
                                {task.start_date && (
                                  <div
                                    className={`absolute top-3 h-6 rounded border-2 ${getStatusColor(task.status)} ${getPriorityColor(task.priority || 'medium')}`}
                                    style={calculateTaskPosition(task.start_date, task.end_date) || {}}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {phaseTasks.length === 0 && (
                          <div className="flex items-center justify-center py-8 text-muted-foreground border-r border-border ml-80">
                            <div className="text-center">
                              <Clock className="w-6 h-6 mx-auto mb-2" />
                              <p className="text-sm">No hay tareas en esta fase</p>
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </CustomPageLayout>
  );
}