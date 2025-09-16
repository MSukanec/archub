import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { DataBasicTab } from './DataBasicTab';
import { FinancesTab } from './FinancesTab';

export default function Preferences() {
  const [activeTab, setActiveTab] = useState('basic');
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const headerTabs = [
    {
      id: 'basic',
      label: 'Datos Básicos',
      isActive: activeTab === 'basic'
    },
    {
      id: 'finances',
      label: 'Finanzas',
      isActive: activeTab === 'finances'
    }
  ];

  const headerProps = {
    icon: Settings,
    title: 'Preferencias',
    subtitle: 'Gestiona los datos básicos y configuraciones financieras de tu organización',
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId)
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <DataBasicTab />;
      case 'finances':
        return <FinancesTab />;
      default:
        return <DataBasicTab />;
    }
  };

  return (
    <Layout headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
}