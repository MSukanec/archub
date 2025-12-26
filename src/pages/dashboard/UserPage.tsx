import { useState } from 'react';
import { User as UserIcon, Plus } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from '@/layouts/lab/LabLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import { useGlobalModalStore } from '@/components/modal';

import { UserBasicDataView } from '@/features/users/views/UserBasicDataView';
import { UserPreferencesView } from '@/features/users/views/UserPreferencesView';
import { UserOrganizationsView } from '@/features/users/views/UserOrganizationsView';
import { UserNotificationsView } from '@/features/users/views/UserNotificationsView';

const USER_TABS = [
  { id: 'basic-data', label: 'Datos Básicos' },
  { id: 'preferences', label: 'Preferencias' },
  { id: 'organizations', label: 'Organizaciones' },
  { id: 'notifications', label: 'Notificaciones' },
];

export default function UserPage() {
  const [activeTab, setActiveTab] = useState('basic-data');
  const { data: userData, isLoading } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const isAdmin = useIsAdmin();

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const headerProps = {
    icon: UserIcon,
    title: 'Usuario',
    subtitle: 'Configuración de Cuenta',
    description: 'Administra tu perfil, preferencias y configuración de cuenta.',
  };

  const renderView = () => {
    switch (activeTab) {
      case 'basic-data':
        return <UserBasicDataView />;
      case 'preferences':
        return <UserPreferencesView />;
      case 'organizations':
        return <UserOrganizationsView />;
      case 'notifications':
        return <UserNotificationsView />;
      default:
        return <UserBasicDataView />;
    }
  };

  const getActionButton = () => {
    return undefined;
  };

  if (isLoading) {
    const content = (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );

    if (isLabLayout) {
      return (
        <LabLayout
          tabs={USER_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {content}
        </LabLayout>
      );
    }

    return (
      <Layout headerProps={headerProps} wide={false}>
        {content}
      </Layout>
    );
  }

  if (isLabLayout) {
    return (
      <LabLayout
        tabs={USER_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        {renderView()}
      </LabLayout>
    );
  }

  return (
    <Layout 
      headerProps={{
        ...headerProps,
        tabs: USER_TABS.map(tab => ({
          ...tab,
          isActive: activeTab === tab.id
        })),
        onTabChange: setActiveTab,
        actionButton: getActionButton(),
      }}
      wide={false}
    >
      {renderView()}
    </Layout>
  );
}
