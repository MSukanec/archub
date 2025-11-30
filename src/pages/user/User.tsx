import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

import { DashboardLayout as Layout } from "@/layouts";
import { useCurrentUser } from '@/hooks/use-current-user';
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner';

import UserBasicDataTab from './tabs/UserBasicDataTab';
import UserPreferencesTab from './tabs/UserPreferencesTab';
import UserOrganizationsTab from './tabs/UserOrganizationsTab';
import UserNotificationsTab from './tabs/UserNotificationsTab';

export default function User() {
  const [activeTab, setActiveTab] = useState('basic-data');
  const { data: userData, isLoading } = useCurrentUser();

  const tabs = [
    { id: 'basic-data', label: 'Datos Básicos', isActive: activeTab === 'basic-data' },
    { id: 'preferences', label: 'Preferencias', isActive: activeTab === 'preferences' },
    { id: 'organizations', label: 'Organizaciones', isActive: activeTab === 'organizations' },
    { id: 'notifications', label: 'Notificaciones', isActive: activeTab === 'notifications' },
  ];

  const headerProps = {
    icon: UserIcon,
    title: 'Usuario',
    subtitle: 'Configuración de Cuenta',
    description: 'Administra tu perfil, preferencias y configuración de cuenta.',
    tabs,
    onTabChange: setActiveTab,
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  const user = userData?.user;

  if (!user) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Usuario no encontrado</div>
        </div>
      </Layout>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic-data':
        return <UserBasicDataTab user={user} />;
      case 'preferences':
        return <UserPreferencesTab user={user} />;
      case 'organizations':
        return <UserOrganizationsTab user={user} />;
      case 'notifications':
        return <UserNotificationsTab userId={user.id} />;
      default:
        return <UserBasicDataTab user={user} />;
    }
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
