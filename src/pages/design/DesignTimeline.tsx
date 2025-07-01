import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignProjectPhases } from '@/hooks/use-design-phases';
import { CustomDesignGantt } from '@/components/ui-custom/misc/CustomDesignGantt';
import { NewPhaseModal } from '@/modals/design/NewPhaseModal';
import { NewPhaseTaskModal } from '@/modals/design/NewPhaseTaskModal';

export default function DesignTimeline() {
  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: projectPhases = [], isLoading } = useDesignProjectPhases(projectId || '');

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

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedPhaseId("");
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

  if (isLoading) {
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
          <CustomDesignGantt 
            phases={projectPhases}
            searchValue={searchValue}
            projectId={projectId || ''}
            onEditPhase={handleEditPhase}
            onAddTask={handleAddTask}
            onCreatePhase={() => {
              setEditingPhase(null);
              setIsModalOpen(true);
            }}
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
    </>
  );
}