import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { OrganizationSettingsFinancesTab } from '@/pages/organization-settings/tabs/OrganizationSettingsFinancesTab';
import { Settings } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function OrganizationSettings() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('finances');

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const tabs = [
    { id: 'finances', label: 'Finanzas', isActive: activeTab === 'finances' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'finances':
        return <OrganizationSettingsFinancesTab />;
      default:
        return <OrganizationSettingsFinancesTab />;
    }
  };

  const headerProps = {
    icon: Settings,
    title: "Ajustes de la Organización",
    description: "Configuración avanzada de tu organización",
    organizationId: organizationId ?? undefined,
    showMembers: false,
    tabs,
    onTabChange: setActiveTab
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
