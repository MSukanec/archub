import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DollarSign, Plus, BarChart3, FileSpreadsheet } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

// Import the existing components
import Movements from './Movements';
import FinancesDashboard from './FinancesDashboard';
import FinancesAnalysis from './FinancesAnalysis';

export default function Finances() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('movements');

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const tabs = [
    { id: 'movements', label: 'Movimientos', isActive: activeTab === 'movements' },
    { id: 'dashboard', label: 'Resumen', isActive: activeTab === 'dashboard' },
    { id: 'analysis', label: 'Análisis', isActive: activeTab === 'analysis' }
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
      case 'analysis':
        return {
          label: "Exportar Análisis",
          icon: BarChart3,
          onClick: () => {
            // TODO: Implement export functionality
            console.log('Export analysis data');
          }
        };
      default:
        return undefined;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'movements':
        return <Movements />;
      case 'dashboard':
        return <FinancesDashboard />;
      case 'analysis':
        return <FinancesAnalysis />;
      default:
        return <Movements />;
    }
  };

  const headerProps = {
    icon: <DollarSign className="w-5 h-5" />,
    title: "Finanzas",
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