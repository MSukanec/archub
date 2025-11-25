import { useEffect, useState } from 'react';
import { DashboardLayout as Layout } from "@/layouts";
import { MediaDocumentation } from './MediaDocumentation';
import { MediaGallery } from './MediaGallery';
import { FolderOpen, Upload, Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal';
import { useProjectContext } from '@/stores/projectContext';

export default function Media() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const { currentOrganizationId } = useProjectContext();
  const [activeTab, setActiveTab] = useState('gallery');

  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const tabs = [
    { id: 'gallery', label: 'Archivos', isActive: activeTab === 'gallery' }
  ];

  const getActionButton = () => {
    return {
      label: 'Subir Archivos',
      icon: Plus,
      onClick: () => openModal('gallery', {})
    };
  };

  const renderTabContent = () => {
    return <MediaGallery />;
  };

  const headerProps = {
    icon: FolderOpen,
    title: "Archivos y Media",
    description: "Gestiona todos los archivos del proyecto: galería de imágenes y videos, documentación técnica y archivos adjuntos",
    organizationId: currentOrganizationId,
    showMembers: true,
    showProjectSelector: true,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      {renderTabContent()}
    </Layout>
  );
}
