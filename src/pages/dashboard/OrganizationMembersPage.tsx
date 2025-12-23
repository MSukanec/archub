import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { OrganizationMembersListView, OrganizationPermissionsView, useOrganizationMembers } from '@/features/organization';
import { Users, UserPlus, Search, Filter, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { useMobile } from "@/hooks/use-mobile";
import { PlanRestricted } from "@/features/users";
import { useActionBarMobile } from '@/layouts';
import { FEATURE_IMAGES } from '@/constants/images';

export function OrganizationMembersPage() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('list');

  const isMobile = useMobile();
  const { setActions, setShowActionBar, clearActions } = useActionBarMobile();

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId);

  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {},
        },
        create: {
          id: 'create',
          icon: UserPlus,
          label: 'Invitar Miembro',
          onClick: () => openModal('member'),
          variant: 'primary',
          planRestriction: {
            feature: 'max_members',
            current: organizationMembers.length,
            modalImage: FEATURE_IMAGES.MEMBERS,
            modalTitle: 'Alcanzaste el límite de miembros',
            modalDescription: 'Has llegado al máximo de miembros permitidos en tu plan actual. Actualiza a un plan superior para invitar más miembros a tu equipo y gestionar colaboraciones sin restricciones.',
          },
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {},
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {},
        },
      });
      setShowActionBar(true);
    }

    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile, openModal, organizationMembers.length, setActions, setShowActionBar, clearActions]);

  const tabs = [
    { id: 'list', label: 'Lista', isActive: activeTab === 'list' },
    { id: 'permissions', label: 'Permisos', isActive: activeTab === 'permissions' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return <OrganizationMembersListView />;
      case 'permissions':
        return <OrganizationPermissionsView />;
      default:
        return <OrganizationMembersListView />;
    }
  };

  const headerProps = {
    icon: Users,
    title: "Miembros",
    description: "Invita a tu equipo para trabajar juntos y colaborar fácilmente. Gestiona sus permisos para proyectos mejores.",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab,
    actions: activeTab === 'list' ? [
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
    ] : []
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
