import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DollarSign, BarChart3, FileSpreadsheet } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';

// Import the existing components
import FinancesDashboard from './FinancesDashboard';
import FinancesAnalysis from './FinancesAnalysis';

export default function Finances() {
  const { setSidebarContext } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const tabs = [
    { id: 'dashboard', label: 'Resumen', isActive: activeTab === 'dashboard' },
    { id: 'analysis', label: 'Análisis', isActive: activeTab === 'analysis' }
  ];

  const getActionButton = () => {
    switch (activeTab) {
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
      case 'dashboard':
        return <FinancesDashboard />;
      case 'analysis':
        return <FinancesAnalysis />;
      default:
        return <FinancesDashboard />;
    }
  };

  const headerProps = {
    icon: DollarSign,
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