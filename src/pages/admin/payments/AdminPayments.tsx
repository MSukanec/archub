import { useState, useEffect } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/desktop/Layout';
import { Button } from '@/components/ui/button';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminPaymentsTab from './AdminPaymentsTab';
import AdminPaymentsTransfersTab from './AdminPaymentsTransfersTab';
import AdminPaymentCoupons from './AdminPaymentCoupons';

const AdminPayments = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { openModal } = useGlobalModalStore();

  useEffect(() => {
    // Only set to 'admin' if not in 'general' mode (respects user's hub selection)
    if (sidebarLevel !== 'general') {
      setSidebarLevel('admin');
    }
  }, [setSidebarLevel, sidebarLevel]);

  const handleCreateCoupon = () => {
    openModal('coupon', {});
  };

  const handleCreatePayment = () => {
    openModal('payment', {});
  };

  const headerProps = {
    title: "Pagos",
    icon: Wallet,
    tabs: [
      {
        id: 'payments',
        label: 'Todos los Pagos',
        isActive: activeTab === 'payments'
      },
      {
        id: 'transfers',
        label: 'Transferencias',
        isActive: activeTab === 'transfers'
      },
      {
        id: 'coupons',
        label: 'Cupones',
        isActive: activeTab === 'coupons'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: [
      activeTab === 'payments' && (
        <Button
          key="create-payment"
          onClick={handleCreatePayment}
          className="h-8 px-3 text-xs"
          data-testid="button-create-payment"
        >
          <Plus className="w-4 h-4 mr-1" />
          Crear Pago Manual
        </Button>
      ),
      activeTab === 'coupons' && (
        <Button
          key="create-coupon"
          onClick={handleCreateCoupon}
          className="h-8 px-3 text-xs"
          data-testid="button-create-coupon"
        >
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Cupón
        </Button>
      ),
    ].filter(Boolean)
  };

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {activeTab === 'payments' && <AdminPaymentsTab />}
        {activeTab === 'transfers' && <AdminPaymentsTransfersTab />}
        {activeTab === 'coupons' && <AdminPaymentCoupons />}
      </div>
    </Layout>
  );
};

export default AdminPayments;
