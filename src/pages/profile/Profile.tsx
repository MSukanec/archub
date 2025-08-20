import { useState } from "react";
import { User } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { ProfileBasicData } from './ProfileBasicData';
import { ProfilePreferences } from './ProfilePreferences';
import { ProfileOrganizations } from './ProfileOrganizations';

import { useCurrentUser } from "@/hooks/use-current-user";

export default function Profile() {
  const [activeTab, setActiveTab] = useState('Datos Básicos');
  
  const { data: userData, isLoading } = useCurrentUser();
  
  const user = userData?.user;

  const headerTabs = [
    {
      id: 'Datos Básicos',
      label: 'Datos Básicos',
      isActive: activeTab === 'Datos Básicos'
    },
    {
      id: 'Preferencias',
      label: 'Preferencias',
      isActive: activeTab === 'Preferencias'
    },
    {
      id: 'Organizaciones',
      label: 'Organizaciones',
      isActive: activeTab === 'Organizaciones'
    }
  ];

  const headerProps = {
    icon: User,
    title: user?.full_name || 'Perfil de Usuario',
    subtitle: `${user?.email || 'Usuario'} • Perfil Personal`,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId)
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando perfil...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Usuario no encontrado</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      {activeTab === 'Datos Básicos' && <ProfileBasicData user={user} />}
      {activeTab === 'Preferencias' && <ProfilePreferences user={user} />}
      {activeTab === 'Organizaciones' && <ProfileOrganizations user={user} />}
    </Layout>
  );
}