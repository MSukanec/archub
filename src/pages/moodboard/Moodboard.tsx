import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { MoodboardGallery } from './MoodboardGallery';
import { MoodboardBoards } from './MoodboardBoards';
import { Palette, Plus, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';

export default function Moodboard() {
  const { setSidebarContext } = useNavigationStore();
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const handleAddItem = () => {
    openModal('new-moodboard-item', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
    });
  };

  const headerProps = {
    icon: Palette,
    title: selectedBoardId ? "Pins del Tablero" : "Moodboard",
    description: selectedBoardId 
      ? "Imágenes y referencias visuales organizadas"
      : "Tablero de inspiración con imágenes y referencias visuales para el proyecto",
    organizationId: currentOrganizationId ?? undefined,
    showMembers: true,
    showProjectSelector: true,
    actionButton: {
      label: "Agregar",
      icon: Plus,
      onClick: handleAddItem,
    },
  };

  if (!selectedBoardId) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <MoodboardBoards onSelectBoard={setSelectedBoardId} />
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedBoardId(null)}
          className="gap-1"
          data-testid="button-back-to-boards"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a Tableros
        </Button>
        <MoodboardGallery boardId={selectedBoardId} />
      </div>
    </Layout>
  );
}
