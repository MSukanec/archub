import { useState, useEffect } from "react";
import { User } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { ProfileBasicData } from './ProfileBasicData';
import { ProfilePreferences } from './ProfilePreferences';
import { ProfileOrganizations } from './ProfileOrganizations';

import { useCurrentUser } from "@/hooks/use-current-user";

export default function Profile() {
  const [location, setLocation] = useLocation();
  const { data: userData, isLoading } = useCurrentUser();
  
  // Determinar el tab activo basado en la URL
  const getActiveTabFromUrl = (url: string): string => {
    if (url.includes('/organizations')) return 'Organizaciones';
    if (url.includes('/preferences')) return 'Preferencias';
    return 'Datos Básicos';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl(location));
  
  // Sincronizar el tab activo cuando cambie la URL
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl(location));
  }, [location]);
  
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

  const handleTabChange = (tabId: string) => {
    // Navegar a la URL correspondiente
    switch (tabId) {
      case 'Organizaciones':
        setLocation('/profile/organizations');
        break;
      case 'Preferencias':
        setLocation('/profile/preferences');
        break;
      default:
        setLocation('/profile');
        break;
    }
  };

  const headerProps = {
    icon: User,
    title: user?.full_name || 'Perfil de Usuario',
    subtitle: `${user?.email || 'Usuario'} • Perfil Personal`,
    description: 'Administra tu información personal, preferencias de la aplicación y las organizaciones a las que perteneces.',
    tabs: headerTabs,
    onTabChange: handleTabChange
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando perfil...</div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Usuario no encontrado</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      {activeTab === 'Datos Básicos' && <ProfileBasicData user={user} />}
      {activeTab === 'Preferencias' && <ProfilePreferences user={user} />}
      {activeTab === 'Organizaciones' && <ProfileOrganizations user={user} />}
    </Layout>
  );
}