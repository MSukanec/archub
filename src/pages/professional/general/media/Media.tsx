import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { MediaDocumentation } from './MediaDocumentation';
import { MediaGallery } from './MediaGallery';
import { FileText, Images, Upload, Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function Media() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('documentation');

  // Set sidebar context on mount
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
    icon: <FileText className="w-5 h-5" />,
    title: "Media",
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