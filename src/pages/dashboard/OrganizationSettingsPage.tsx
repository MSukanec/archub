import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { 
  OrganizationMembersListView,
  OrganizationPermissionsView,
  OrganizationActivityLogsView,
  OrganizationBillingView,
  OrganizationSettingsFinancesView, 
  OrganizationSettingsPdfView,
  useOrganizationMembers
} from '@/features/organization';
import { ComingSoonRestricted } from '@/components/shared/restrictions/guards/ComingSoonRestricted';
import { Settings, UserPlus, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { useLocation } from 'wouter';
import { PlanRestricted } from "@/features/users";
import { FEATURE_IMAGES } from '@/constants/images';

type TabId = 'members' | 'permissions' | 'activity' | 'billing' | 'finances' | 'pdf';

export function OrganizationSettingsPage() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>('members');
  const [headerActions, setHeaderActions] = useState<React.ReactNode[] | undefined>(undefined);

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);

  const tabs = [
    { id: 'members', label: 'Miembros', isActive: activeTab === 'members' },
    { id: 'permissions', label: 'Permisos', isActive: activeTab === 'permissions' },
    { id: 'activity', label: 'Actividad', isActive: activeTab === 'activity' },
    { id: 'billing', label: 'Facturación', isActive: activeTab === 'billing' },
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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabId);
    setHeaderActions(undefined);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'members':
        return <OrganizationMembersListView />;
      case 'permissions':
        return <OrganizationPermissionsView />;
      case 'activity':
        return <OrganizationActivityLogsView organizationId={organizationId ?? ''} />;
      case 'billing':
        return <OrganizationBillingView />;
      case 'finances':
        return <OrganizationSettingsFinancesView />;
      case 'pdf':
        return (
          <ComingSoonRestricted>
            <OrganizationSettingsPdfView onHasChanges={handlePdfHasChanges} />
          </ComingSoonRestricted>
        );
      default:
        return <OrganizationMembersListView />;
    }
  };

  const getTabActions = (): React.ReactNode[] | undefined => {
    switch (activeTab) {
      case 'members':
        return [
          <PlanRestricted 
            key="invite-member" 
            feature="max_members" 
            current={organizationMembers.length}
            useUpgradeModal={true}
            modalImage={FEATURE_IMAGES.MEMBERS}
            modalTitle="Alcanzaste el límite de miembros"
            modalDescription="Has llegado al máximo de miembros permitidos en tu plan actual. Actualiza a un plan superior para invitar más miembros a tu equipo y gestionar colaboraciones sin restricciones."
          >
            <Button 
              onClick={() => openModal('member')}
              className="flex items-center gap-2"
              data-testid="invite-member-button"
            >
              <UserPlus className="h-4 w-4" />
              Invitar Miembro
            </Button>
          </PlanRestricted>
        ];
      case 'billing':
        return [
          <Button 
            key="view-plans"
            onClick={() => navigate('/settings/pricing-plan')}
            className="flex items-center gap-2"
            data-testid="view-plans-button"
          >
            <Sparkles className="h-4 w-4" />
            Ver Planes
          </Button>
        ];
      case 'pdf':
        return headerActions;
      default:
        return undefined;
    }
  };

  const headerProps = {
    icon: Settings,
    title: "Ajustes de la Organización",
    description: "Gestiona miembros, permisos, facturación y configuración de tu organización",
    organizationId: organizationId ?? undefined,
    showMembers: activeTab === 'members',
    tabs,
    onTabChange: handleTabChange,
    actions: getTabActions()
  };

  return (
    <Layout headerProps={headerProps} wide={activeTab === 'pdf'}>
      {renderTabContent()}
    </Layout>
  );
}
