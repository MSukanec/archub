import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { MediaDocumentation } from './MediaDocumentation';
import { MediaGallery } from './MediaGallery';
import { FolderOpen, Upload, Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useProjectContext } from '@/stores/projectContext';

export default function Media() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const { currentOrganizationId } = useProjectContext();
  const [activeTab, setActiveTab] = useState('documentation');

  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const tabs = [
    { id: 'documentation', label: 'Documentación', isActive: activeTab === 'documentation' },
    { id: 'gallery', label: 'Galería', isActive: activeTab === 'gallery' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
      case 'documentation':
        return {
          label: "Subir Documentos",
          icon: Upload,
          onClick: () => openModal('document-upload', {})
        };
      case 'gallery':
        return {
          label: 'Subir Archivo',
          icon: Plus,
          onClick: () => openModal('gallery', {})
        };
      default:
        return undefined;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documentation':
        return <MediaDocumentation />;
      case 'gallery':
        return <MediaGallery />;
      default:
        return <MediaDocumentation />;
    }
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
