import { useState, useEffect } from "react";
import { Building, Home } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { DashboardDashboard } from './DashboardDashboard';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Resumen');
  const [, navigate] = useLocation();
  
  const { data: userData, isLoading } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const { setActions, setShowActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  
  // Usar la organización actual del usuario
  const organization = userData?.organization;

  const headerTabs = [
    {
      id: 'Resumen',
      label: 'Resumen',
      isActive: activeTab === 'Resumen'
    }
  ];

  const headerProps = {
    icon: Building,
    title: organization?.name || 'Organización',
    subtitle: `${organization?.is_system ? 'Organización del sistema' : 'Organización'} • Plan ${organization?.plan?.name || 'Free'}`,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
  };

  // Dashboard no debe mostrar action bar
  useEffect(() => {
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [isMobile, setShowActionBar]);

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando organización...</div>
        </div>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Organización no encontrada</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide={true}>
      {activeTab === 'Resumen' && <DashboardDashboard organization={organization} />}
    </Layout>
  );
}