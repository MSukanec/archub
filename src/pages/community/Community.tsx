import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { useNavigationStore } from '@/stores/navigationStore';
import { Users } from 'lucide-react';
import { Tabs } from '@/components/ui-custom/Tabs';
import CommunityDashboardTab from './CommunityDashboardTab';

export default function Community() {
  const { setSidebarLevel } = useNavigationStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    setSidebarLevel('community');
  }, [setSidebarLevel]);

  const headerProps = {
    title: "Comunidad",
    icon: Users,
    description: "Conecta con otros profesionales y comparte conocimiento",
    showSearch: false,
    showFilters: false,
  };

  const tabs = [
    { value: 'dashboard', label: 'Dashboard' },
  ];

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        <Tabs 
          tabs={tabs}
          value={activeTab}
          onValueChange={setActiveTab}
        />
        
        {activeTab === 'dashboard' && <CommunityDashboardTab />}
      </div>
    </Layout>
  );
}
