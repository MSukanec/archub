import { useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignProjectPhases, useGanttPhasesWithTasks } from '@/hooks/use-design-phases';
import { useProject } from '@/hooks/use-projects';
import { Gantt } from '@/components/gantt';
import { NewPhaseModal } from '@/modals/design/NewPhaseModal';
import { NewPhaseTaskModal } from '@/modals/design/NewPhaseTaskModal';

export default function DesignTimeline() {
  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: project } = useProject(projectId || '');
  const { data: projectPhases = [], isLoading } = useDesignProjectPhases(projectId || '');
  const { data: phasesWithTasks = [], isLoading: isGanttLoading } = useGanttPhasesWithTasks(projectId || '');
  
  console.log('DesignTimeline - projectId:', projectId);
  console.log('DesignTimeline - phasesWithTasks:', phasesWithTasks);
  console.log('DesignTimeline - isLoading:', isLoading, 'isGanttLoading:', isGanttLoading);

  const handleEditPhase = (phase: any) => {
    setEditingPhase(phase);
    setIsModalOpen(true);
  };

  const handleAddTask = (phaseId: string) => {
    setSelectedPhaseId(phaseId);
    setIsTaskModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPhase(null);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedPhaseId("");
  };

  const handleCloseEditTaskModal = () => {
    setIsEditTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleTaskClick = (taskId: string) => {
    // Buscar la tarea en los datos
    const task = phasesWithTasks
      .flatMap(phase => phase.tasks || [])
      .find((t: any) => t.id === taskId);
    
    if (task) {
      setEditingTask(task);
      setIsEditTaskModalOpen(true);
    }
  };

  const handleTaskDateChange = (taskId: string, startDate: string, endDate: string) => {
    console.log('Task date change:', { taskId, startDate, endDate });
    // Aquí implementarías la lógica para actualizar las fechas en la base de datos
    // Por ahora solo logeamos para debug
  };

  const headerProps = {
    title: "Cronograma",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: false,
    actions: [
      <Button 
        key="nueva-fase"
        className="h-8 px-3 text-sm"
        onClick={() => {
          setEditingPhase(null);
          setIsModalOpen(true);
        }}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nueva Fase de Diseño
      </Button>
    ]
  };

  if (isLoading || isGanttLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout headerProps={headerProps} wide={true}>
        <div className="space-y-6">
          <Gantt 
            phasesWithTasks={phasesWithTasks}
            projectCreatedAt={project?.created_at}
            onCreatePhase={() => setIsModalOpen(true)}
            onEditPhase={handleEditPhase}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onTaskClick={handleTaskClick}
            onTaskDateChange={handleTaskDateChange}
          />
        </div>
      </Layout>

      <NewPhaseModal
        open={isModalOpen}
        onClose={handleCloseModal}
        projectId={projectId || ''}
        organizationId={userData?.organization?.id || ''}
        nextPosition={projectPhases.length}
        editingPhase={editingPhase}
      />

      <NewPhaseTaskModal
        open={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        projectPhaseId={selectedPhaseId}
      />

      <NewPhaseTaskModal
        open={isEditTaskModalOpen}
        onClose={handleCloseEditTaskModal}
        projectPhaseId={editingTask?.project_phase_id || selectedPhaseId}
        editingTask={editingTask}
      />
    </>
  );
}