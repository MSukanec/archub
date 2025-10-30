import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import AdminPaymentsTransfersTab from './AdminPaymentsTransfersTab';
import AdminPaymentsHistoryTab from './AdminPaymentsHistoryTab';

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('transferencias');

  const tabs = [
    { id: 'transferencias', label: 'Transferencias Manuales', isActive: activeTab === 'transferencias' },
    { id: 'historial', label: 'Historial & Métricas', isActive: activeTab === 'historial' },
    // { id: 'suscripciones', label: 'Suscripciones', isActive: activeTab === 'suscripciones' }, // Futuro
  ];

  const headerProps = {
    title: "Pagos",
    icon: Wallet,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'transferencias':
        return <AdminPaymentsTransfersTab />;
      case 'historial':
        return <AdminPaymentsHistoryTab />;
      // case 'suscripciones':
      //   return <AdminPaymentsSubscriptionsTab />;
      default:
        return <AdminPaymentsTransfersTab />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
};

export default AdminPayments;
