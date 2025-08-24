import { useEffect, useState } from 'react';
import { Database } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { DataBasic } from './DataBasic';

export default function OrganizationData() {
  const [activeTab, setActiveTab] = useState('basic');
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const currentOrganization = userData?.organization;

  const headerTabs = [
    {
      id: 'basic',
      label: 'Datos Básicos',
      isActive: activeTab === 'basic'
    }
  ];

  const headerProps = {
    icon: Database,
    title: 'Datos de la Organización',
    subtitle: 'Gestiona la información básica de tu organización',
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId)
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <DataBasic organization={currentOrganization} />;
      default:
        return <DataBasic organization={currentOrganization} />;
    }
  };

  return (
    <Layout headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
}