import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { MediaDocumentation } from './MediaDocumentation';
import { MediaGallery } from './MediaGallery';
import { FolderOpen } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
export default function Media() {
  const { setSidebarContext } = useNavigationStore();
  const { currentOrganizationId } = useProjectContext();
  const [activeTab, setActiveTab] = useState('gallery');
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);
  const tabs = [
    { id: 'gallery', label: 'Archivos', isActive: activeTab === 'gallery'}
  ];
  const renderTabContent = () => {
    return <MediaGallery />;
  };
  const headerProps = {
    icon: FolderOpen,
    title: "Archivos y Media",
    description: "Gestiona todos los archivos del proyecto: galería de imágenes y videos, documentación técnica y archivos adjuntos",
    organizationId: currentOrganizationId ?? undefined,
    showMembers: true,
    showProjectSelector: true,
    tabs,
    onTabChange: setActiveTab
  };
  return (
    <Layout headerProps={headerProps} wide={true}>
      {renderTabContent()}
    </Layout>
  );
}
