import { useState, useEffect } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from '@/components/ui/button';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminPlanPricesTab from './AdminPlanPricesTab';

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('prices');
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { openModal } = useGlobalModalStore();

  useEffect(() => {
    if (sidebarLevel !== 'general') {
      setSidebarLevel('admin');
    }
  }, [setSidebarLevel, sidebarLevel]);

  const handleCreatePrice = () => {
    openModal('plan-price', {});
  };

  const headerProps = {
    title: "Suscripciones",
    icon: CreditCard,
    tabs: [
      {
        id: 'prices',
        label: 'Precios de Planes',
        isActive: activeTab === 'prices'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: [
      activeTab === 'prices' && (
        <Button
          key="create-price"
          onClick={handleCreatePrice}
          className="h-8 px-3 text-xs"
          data-testid="button-create-price"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Precio
        </Button>
      ),
    ].filter(Boolean)
  };

  return (
    <Layout wide headerProps={headerProps}>
      {activeTab === 'prices' && <AdminPlanPricesTab />}
    </Layout>
  );
};

export default AdminSubscriptions;
