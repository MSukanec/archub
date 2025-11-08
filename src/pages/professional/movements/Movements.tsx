import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DollarSign, Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

// Import the existing components
import MovementsList from './MovementsList';

import { useCurrentUser } from '@/hooks/use-current-user';

export default function Movements() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('movements');
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const tabs = [
    { id: 'movements', label: 'Movimientos', isActive: activeTab === 'movements' }
  ];

  const headerProps = {
    icon: DollarSign,
    title: "Movimientos",
    description: "Registra y gestiona todos los movimientos financieros de tu organización.",
    organizationId,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab,
    actionButton: {
      label: "Nuevo Movimiento",
      icon: Plus,
      onClick: () => openModal('movement', {})
    }
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <MovementsList />
    </Layout>
  );
}