import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useDesignProjectPhases } from '@/hooks/use-design-phases';
import { CustomDesignGantt } from '@/components/ui-custom/misc/CustomDesignGantt';
import { NewPhaseModal } from '@/modals/design/NewPhaseModal';

export default function DesignTimeline() {
  const [searchValue, setSearchValue] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  
  const { data: projectPhases = [], isLoading } = useDesignProjectPhases(projectId || '');

  const headerProps = {
    title: "Cronograma de Diseño",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: false,
    actions: [
      <Button 
        key="nueva-fase"
        className="h-8 px-3 text-sm"
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Nueva Fase
      </Button>
    ]
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout headerProps={headerProps}>
        <div className="space-y-6">
          <CustomDesignGantt 
            phases={projectPhases}
            searchValue={searchValue}
            projectId={projectId || ''}
          />
        </div>
      </Layout>

      <NewPhaseModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId || ''}
        organizationId={userData?.organization?.id || ''}
        nextPosition={projectPhases.length}
      />
    </>
  );
}