import { useEffect } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { MoodboardGallery } from './MoodboardGallery';
import { Palette, Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/state/globalModalStore';

export default function Moodboard() {
  const { setSidebarContext } = useNavigationStore();
  const { currentOrganizationId, selectedProjectId } = useProjectContext();
  const { openModal } = useGlobalModalStore();

  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const handleAddItem = () => {
    openModal('new-moodboard-item', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
    });
  };

  const tabs = [
    { id: 'gallery', label: 'Galería', isActive: true }
  ];

  const headerProps = {
    icon: Palette,
    title: "Moodboard",
    description: "Tablero de inspiración con imágenes y referencias visuales para el proyecto",
    organizationId: currentOrganizationId ?? undefined,
    showMembers: true,
    showProjectSelector: true,
    tabs,
    onTabChange: () => {},
    actionButton: {
      label: "Agregar",
      icon: Plus,
      onClick: handleAddItem,
    },
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <MoodboardGallery />
    </Layout>
  );
}
