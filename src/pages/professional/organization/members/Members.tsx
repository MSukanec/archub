import { useState } from "react";
import { Users, UserPlus } from 'lucide-react';

import { Layout } from '@/components/layout/desktop/Layout';
import { MemberList } from './MemberList';
import { MemberPartners } from './MemberPartners';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

export default function Members() {
  const [activeTab, setActiveTab] = useState('Lista');
  
  const { data: userData, isLoading } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  
  // Usar la organización actual del usuario
  const organization = userData?.organization;

  const headerTabs = [
    {
      id: 'Lista',
      label: 'Lista',
      isActive: activeTab === 'Lista'
    },
    {
      id: 'Socios',
      label: 'Socios',
      isActive: activeTab === 'Socios'
    }
  ];

  const headerProps = {
    icon: <Users className="w-5 h-5" />,
    title: 'Miembros',
    subtitle: `Gestión de miembros y clientes de ${organization?.name || 'la organización'}`,
    tabs: headerTabs,
    onTabChange: (tabId: string) => setActiveTab(tabId),

    // Botones según la tab activa
    ...(activeTab === 'Lista' && {
      actionButton: {
        label: 'Invitar Miembro',
        icon: UserPlus,
        onClick: () => openModal('member')
      }
    }),
    ...(activeTab === 'Socios' && {
      actionButton: {
        label: 'Ingresar Socio',
        icon: UserPlus,
        onClick: () => openModal('partner')
      }
    })
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps} wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando miembros...</div>
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
      {activeTab === 'Lista' && <MemberList organization={organization} />}
      {activeTab === 'Socios' && <MemberPartners organization={organization} />}
    </Layout>
  );
}