import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProjectContext } from '@/stores/projectContext';
import ProjectBasicDataTab from './ProjectBasicDataTab';

export default function ProjectData() {
  const [activeTab, setActiveTab] = useState('basic');
  const { setSidebarContext } = useNavigationStore();
  const { selectedProjectId } = useProjectContext();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const headerTabs = [
    {
      id: 'basic',
      label: 'Datos Básicos',
      isActive: activeTab === 'basic'
    }
  ];

  const headerProps = {
    icon: FileText,
    title: 'Datos Básicos',
    subtitle: 'Información general del proyecto, datos del cliente y ubicación',
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId)
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <ProjectBasicDataTab />;
      default:
        return <ProjectBasicDataTab />;
    }
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
