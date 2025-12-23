import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LabLayout } from '@/layouts/lab/LabLayout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';

import { UserBasicDataView } from '@/features/user/views/UserBasicDataView';
import { UserPreferencesView } from '@/features/user/views/UserPreferencesView';
import { UserOrganizationsView } from '@/features/user/views/UserOrganizationsView';
import { UserNotificationsView } from '@/features/user/views/UserNotificationsView';

const USER_TABS = [
  { id: 'basic-data', label: 'Datos Básicos' },
  { id: 'preferences', label: 'Preferencias' },
  { id: 'organizations', label: 'Organizaciones' },
  { id: 'notifications', label: 'Notificaciones' },
];

/**
 * PAGE: User Settings
 * Orquestador que maneja layout selection, tab state, y renderización de views
 * Permite cambiar entre layouts (DashboardLayout vs LabLayout) dinámicamente
 */
export default function User() {
  const [activeTab, setActiveTab] = useState('basic-data');
  const { data: userData, isLoading } = useCurrentUser();

  const layoutPreference = userData?.preferences?.layout || 'experimental';
  const isLabLayout = layoutPreference === 'lab';

  const headerProps = {
    icon: UserIcon,
    title: 'Usuario',
    subtitle: 'Configuración de Cuenta',
    description: 'Administra tu perfil, preferencias y configuración de cuenta.',
  };

  // Renderizar contenido según activeTab
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

  // LabLayout: utiliza mega-menu y toolbar para tabs
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

  // DashboardLayout: utiliza header inline para tabs
  return (
    <Layout 
      headerProps={{
        ...headerProps,
        tabs: USER_TABS.map(tab => ({
          ...tab,
          isActive: activeTab === tab.id
        })),
        onTabChange: setActiveTab,
      }}
      wide={false}
    >
      {renderView()}
    </Layout>
  );
}
