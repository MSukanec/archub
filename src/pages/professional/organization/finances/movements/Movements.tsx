import React, { useEffect } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DollarSign, Plus } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

// Import the existing components
import MovementsList from './MovementsList';

export default function Movements() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const headerProps = {
    icon: DollarSign,
    title: "Movimientos",
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