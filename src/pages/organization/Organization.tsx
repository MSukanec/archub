import { useState } from "react";
import { Building, UserPlus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { OrganizationDashboardView } from './tabs/OrganizationDashboardView';
import { OrganizationMembersView } from './tabs/OrganizationMembersView';
import { OrganizationSettingsView } from './tabs/OrganizationSettingsView';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function Organization() {
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
      id: 'Miembros',
      label: 'Miembros',
      isActive: activeTab === 'Miembros'
    },
    {
      id: 'Configuración',
      label: 'Configuración',
      isActive: activeTab === 'Configuración'
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
      {activeTab === 'Resumen' && <OrganizationDashboardView organization={organization} />}
      {activeTab === 'Miembros' && <OrganizationMembersView organization={organization} />}
      {activeTab === 'Configuración' && <OrganizationSettingsView organization={organization} />}
    </Layout>
  );
}