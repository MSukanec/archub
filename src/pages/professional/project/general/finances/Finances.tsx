import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/desktop/Layout';
import { DollarSign } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';

// Import the existing components
import Movements from './Movements';
import FinancesDashboard from './FinancesDashboard';
import FinancesAnalysis from './FinancesAnalysis';

export default function Finances() {
  const { setSidebarContext } = useNavigationStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('project');
  }, [setSidebarContext]);

  const tabs = [
    { id: 'dashboard', label: 'Resumen', isActive: activeTab === 'dashboard' },
    { id: 'movements', label: 'Movimientos', isActive: activeTab === 'movements' },
    { id: 'analysis', label: 'Análisis', isActive: activeTab === 'analysis' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <FinancesDashboard />;
      case 'movements':
        return <Movements />;
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
    onTabChange: setActiveTab
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      {renderTabContent()}
    </Layout>
  );
}