import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { OrganizationSettingsFinancesTab } from '@/pages/organization-settings/tabs/OrganizationSettingsFinancesTab';
import { OrganizationSettingsPdfTab } from '@/pages/organization-settings/tabs/OrganizationSettingsPdfTab';
import { Settings } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function OrganizationSettings() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('finances');
  const [headerActions, setHeaderActions] = useState<React.ReactNode[] | undefined>(undefined);

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const tabs = [
    { id: 'finances', label: 'Finanzas', isActive: activeTab === 'finances' },
    { id: 'pdf', label: 'Documentos PDF', isActive: activeTab === 'pdf' }
  ];

  const handlePdfHasChanges = (hasChanges: boolean, actions?: React.ReactNode[]) => {
    if (hasChanges && actions) {
      setHeaderActions(actions);
    } else {
      setHeaderActions(undefined);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'finances':
        return <OrganizationSettingsFinancesTab />;
      case 'pdf':
        return <OrganizationSettingsPdfTab onHasChanges={handlePdfHasChanges} />;
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
    onTabChange: (tabId: string) => {
      setActiveTab(tabId);
      setHeaderActions(undefined);
    },
    actions: activeTab === 'pdf' ? headerActions : undefined
  };

  return (
    <Layout headerProps={headerProps} wide={activeTab === 'pdf'}>
      {renderTabContent()}
    </Layout>
  );
}
