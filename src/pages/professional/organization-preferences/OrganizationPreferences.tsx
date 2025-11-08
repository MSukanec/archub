import { useEffect, useState } from 'react';
import { Settings, UserPlus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { DataBasicTab } from './OrganizationPreferencesDataBasicTab';
import { MembersTab } from './OrganizationPreferencesMembersTab';
import { FinancesTab } from './OrganizationPreferencesFinancesTab';
import { PartnersTab } from './OrganizationPreferencesPartnersTab';

export default function OrganizationPreferences() {
  const [activeTab, setActiveTab] = useState('basic');
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);

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
      id: 'members',
      label: 'Miembros',
      isActive: activeTab === 'members'
    },
    {
      id: 'finances',
      label: 'Finanzas',
      isActive: activeTab === 'finances'
    },
    {
      id: 'partners',
      label: 'Socios',
      isActive: activeTab === 'partners'
    }
  ];

  // Create action button for members tab
  const membersActions = activeTab === 'members' ? [
    <PlanRestricted key="invite-member" feature="max_members" current={organizationMembers.length}>
      <Button 
        onClick={() => openModal('member')}
        className="flex items-center gap-2"
        data-testid="invite-member-button"
      >
        <UserPlus className="h-4 w-4" />
        Invitar Miembro
      </Button>
    </PlanRestricted>
  ] : undefined;

  const headerProps = {
    icon: Settings,
    title: 'Preferencias',
    subtitle: 'Configuración de tu Organización',
    description: 'Gestiona los datos básicos, miembros, configuraciones financieras y socios de tu organización.',
    organizationId,
    showMembers: true,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: membersActions
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return <DataBasicTab />;
      case 'members':
        return <MembersTab />;
      case 'finances':
        return <FinancesTab />;
      case 'partners':
        return <PartnersTab />;
      default:
        return <DataBasicTab />;
    }
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}