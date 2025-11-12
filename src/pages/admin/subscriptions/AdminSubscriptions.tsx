import { useState, useEffect } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from '@/components/ui/button';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminPlansTab from './AdminPlansTab';
import AdminPlanPricesTab from './AdminPlanPricesTab';

const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('plans');
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { openModal } = useGlobalModalStore();

  useEffect(() => {
    if (sidebarLevel !== 'general') {
      setSidebarLevel('admin');
    }
  }, [setSidebarLevel, sidebarLevel]);

  const handleCreatePlan = () => {
    openModal('plan', {});
  };

  const handleCreatePrice = () => {
    openModal('plan-price', {});
  };

  const headerProps = {
    title: "Suscripciones",
    icon: CreditCard,
    tabs: [
      {
        id: 'plans',
        label: 'Planes',
        isActive: activeTab === 'plans'
      },
      {
        id: 'prices',
        label: 'Precios',
        isActive: activeTab === 'prices'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: [
      activeTab === 'plans' && (
        <Button
          key="create-plan"
          onClick={handleCreatePlan}
          className="h-8 px-3 text-xs"
          data-testid="button-create-plan"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Plan
        </Button>
      ),
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
      {activeTab === 'plans' && <AdminPlansTab />}
      {activeTab === 'prices' && <AdminPlanPricesTab />}
    </Layout>
  );
};

export default AdminSubscriptions;
