import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DollarSign, Plus, BarChart3, FileSpreadsheet } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

// Import the existing components
import MovementsList from './MovementsList';
import MovementsDashboard from './MovementsDashboard';
import MovementsDetail from './MovementsDetail';

export default function Movements() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('movements');

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const tabs = [
    { id: 'movements', label: 'Movimientos', isActive: activeTab === 'movements' },
    { id: 'dashboard', label: 'Resumen', isActive: activeTab === 'dashboard' },
    { id: 'detail', label: 'Detalle', isActive: activeTab === 'detail' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
      case 'movements':
        return {
          label: "Nuevo Movimiento",
          icon: Plus,
          onClick: () => openModal('movement', {})
        };
      case 'dashboard':
        return {
          label: "Exportar Resumen",
          icon: FileSpreadsheet,
          onClick: () => {
            // TODO: Implement export functionality
            console.log('Export dashboard data');
          }
        };
      case 'detail':
        return {
          label: "Exportar Detalle",
          icon: BarChart3,
          onClick: () => {
            // TODO: Implement export functionality
            console.log('Export detail data');
          }
        };
      default:
        return undefined;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'movements':
        return <MovementsList />;
      case 'dashboard':
        return <MovementsDashboard />;
      case 'detail':
        return <MovementsDetail />;
      default:
        return <MovementsList />;
    }
  };

  const headerProps = {
    icon: DollarSign,
    title: "Movimientos",
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      {renderTabContent()}
    </Layout>
  );
}