import { useState } from "react";
import { Building, UserPlus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { DashboardDashboard } from './DashboardDashboard';
import { DashboardMembers } from './DashboardMembers';
import { DashboardBasicData } from './DashboardBasicData';
import { DashboardActivity } from './DashboardActivity';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Resumen');
  
  const { data: userData, isLoading } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  
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
      id: 'Miembros',
      label: 'Miembros',
      isActive: activeTab === 'Miembros'
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

    // Solo mostrar botón de invitar en la tab de Miembros
    ...(activeTab === 'Miembros' && {
      actionButton: {
        label: 'Invitar Miembro',
        icon: UserPlus,
        onClick: () => openModal('member')
      }
    })
  };

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
      {activeTab === 'Miembros' && <DashboardMembers organization={organization} />}
      {activeTab === 'Actividad' && <DashboardActivity />}
    </Layout>
  );
}