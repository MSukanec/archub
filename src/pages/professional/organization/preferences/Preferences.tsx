import { useEffect, useState } from 'react';
import { Settings, UserPlus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { PlanRestricted } from '@/components/ui-custom/security/PlanRestricted';
import { useOrganizationMembers } from '@/hooks/use-organization-members';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';
import { DataBasicTab } from './DataBasicTab';
import { MembersTab } from './MembersTab';
import { FinancesTab } from './FinancesTab';

export default function Preferences() {
  const [activeTab, setActiveTab] = useState('basic');
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const { data: organizationMembers = [] } = useOrganizationMembers(userData?.organization?.id);
  const { setActions, setShowActionBar, clearActions } = useActionBarMobile();
  const isMobile = useMobile();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  // Configure mobile action bar based on active tab
  useEffect(() => {
    if (!isMobile) return;
    
    if (activeTab === 'members') {
      setActions({
        create: {
          id: 'invite-member',
          icon: UserPlus,
          label: 'Invitar Miembro',
          onClick: () => openModal('member'),
          restriction: {
            feature: 'max_members',
            current: organizationMembers.length,
            badgeOnly: true
          }
        }
      });
      setShowActionBar(true);
    } else {
      clearActions();
    }
    
    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [activeTab, isMobile, organizationMembers.length, setActions, setShowActionBar, clearActions, openModal]);

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
    subtitle: 'Gestiona los datos básicos, miembros y configuraciones financieras de tu organización',
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