import { useEffect } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { MoodboardGallery } from './MoodboardGallery';
import { Palette } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';

export default function Moodboard() {
  const { setSidebarContext } = useNavigationStore();
  const { currentOrganizationId } = useProjectContext();

  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

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
    onTabChange: () => {}
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <MoodboardGallery />
    </Layout>
  );
}
