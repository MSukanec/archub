import { useState, useEffect } from "react";
import { Building, Home } from 'lucide-react';
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { DashboardDashboard } from './DashboardDashboard';
import { DashboardBasicData } from './DashboardBasicData';
import { DashboardActivity } from './DashboardActivity';

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
    },
    {
      id: 'Datos Básicos',
      label: 'Datos Básicos',
      isActive: activeTab === 'Datos Básicos'
    },

    {
      id: 'Actividad',
      label: 'Actividad',
      isActive: activeTab === 'Actividad'
    }
  ];

  const headerProps = {
    icon: Building,
    title: organization?.name || 'Organización',
    subtitle: `${organization?.is_system ? 'Organización del sistema' : 'Organización'} • Plan ${organization?.plan?.name || 'Free'}`,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),
  };

  // Configurar action bar móvil
  useEffect(() => {
    if (isMobile) {
      setActions({
        home: {
          id: 'home',
          icon: <Home className="h-5 w-5" />,
          label: 'Inicio',
          onClick: () => {
            navigate('/dashboard');
          },
        },
      });
      setShowActionBar(true);
    }
    
    // Cleanup
    return () => {
      if (isMobile) {
        setShowActionBar(false);
      }
    };
  }, [isMobile, setActions, setShowActionBar, navigate]);

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
      {activeTab === 'Datos Básicos' && <DashboardBasicData organization={organization} />}
      {activeTab === 'Actividad' && <DashboardActivity />}
    </Layout>
  );
}