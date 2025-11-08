import { useEffect, useState } from 'react';
import { Activity as ActivityIcon, Building } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useNavigationStore } from '@/stores/navigationStore';
import ActivityLogs from './ActivityLogs';

export default function Activity() {
  const { data: userData } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();
  const [location] = useLocation();
  const [, navigate] = useLocation();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const organizationId = userData?.preferences?.last_organization_id;

  // Determine active tab based on route
  const activeTab = 'Registro'; // Only one tab for now

  // Tabs configuration
  const headerTabs = [
    {
      id: 'Registro',
      label: 'Registro de Actividad',
      isActive: activeTab === 'Registro'
    }
  ];

  const handleTabChange = (tabId: string) => {
    // Navigate to the URL corresponding to the tab
    switch (tabId) {
      default:
        navigate('/activity');
        break;
    }
  };

  const headerProps = {
    icon: ActivityIcon,
    title: 'Actividad de la Organización',
    subtitle: 'Registro de actividades y cambios en la organización',
    organizationId,
    showMembers: true,
    tabs: headerTabs,
    onTabChange: handleTabChange
  };

  if (!organizationId) {
    return (
      <Layout headerProps={headerProps} wide={false}>
        <div className="text-center py-12 text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-sm">No hay organización seleccionada.</p>
          <p className="text-xs">Selecciona una organización para ver la actividad.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={false}>
      {activeTab === 'Registro' && <ActivityLogs organizationId={organizationId} />}
    </Layout>
  );
}
