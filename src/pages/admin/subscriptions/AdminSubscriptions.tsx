import { useState, useEffect } from 'react';
import { CreditCard, Plus, RotateCcw } from 'lucide-react';
import { DashboardLayout as Layout } from "@/layouts";
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal';
import AdminSubscriptionsTab from './AdminSubscriptionsTab';
import AdminPlansTab from './AdminPlansTab';

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { openModal } = useGlobalModalStore();

  useEffect(() => {
    if (sidebarLevel !== 'general') {
      setSidebarLevel('admin');
    }
  }, [setSidebarLevel, sidebarLevel]);

  const getActionButton = () => {
    switch (activeTab) {
      case 'subscriptions':
        return {
          label: "Resetear Test Data",
          icon: RotateCcw,
          onClick: () => openModal('reset-test-data', {}),
        };
      case 'plans':
        return {
          label: "Nuevo Plan",
          icon: Plus,
          onClick: () => openModal('plan', {}),
        };
      default:
        return undefined;
    }
  };

  const headerProps = {
    title: "Suscripciones",
    icon: CreditCard,
    tabs: [
      {
        id: 'subscriptions',
        label: 'Suscripciones',
        isActive: activeTab === 'subscriptions'
      },
      {
        id: 'plans',
        label: 'Planes',
        isActive: activeTab === 'plans'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actionButton: getActionButton(),
  };

  return (
    <Layout wide headerProps={headerProps}>
      {activeTab === 'subscriptions' && <AdminSubscriptionsTab />}
      {activeTab === 'plans' && <AdminPlansTab />}
    </Layout>
  );
};

export default AdminSubscriptions;
