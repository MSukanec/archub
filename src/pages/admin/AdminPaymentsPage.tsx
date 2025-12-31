import { useState, useEffect } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal';
import AdminPaymentsDashboardView, { type PeriodFilter } from '@/features/admin/views/AdminPaymentsDashboardView';
import AdminPaymentsView from '@/features/admin/views/AdminPaymentsView';
import AdminPaymentsTransfersView from '@/features/admin/views/AdminPaymentsTransfersView';
import AdminPaymentsCouponsView from '@/features/admin/views/AdminPaymentsCouponsView';

const AdminPaymentsPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { openModal } = useGlobalModalStore();

  useEffect(() => {
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

  const periodOptions = [
    { value: 'all', label: 'Histórico' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '3m', label: 'Últimos 3 meses' },
    { value: '6m', label: 'Últimos 6 meses' },
    { value: '1y', label: 'Último año' },
  ];

  const headerProps = {
    title: "Pagos",
    icon: Wallet,
    tabs: [
      {
        id: 'dashboard',
        label: 'Visión General',
        isActive: activeTab === 'dashboard'
      },
      {
        id: 'payments',
        label: 'Pagos',
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
      activeTab === 'dashboard' && (
        <Select 
          key="period-selector"
          value={selectedPeriod} 
          onValueChange={(value) => setSelectedPeriod(value as PeriodFilter)}
        >
          <SelectTrigger 
            className="w-[180px] h-8 text-xs"
            data-testid="select-period"
          >
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(option => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                data-testid={`select-period-option-${option.value}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
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
        {activeTab === 'dashboard' && <AdminPaymentsDashboardView selectedPeriod={selectedPeriod} />}
        {activeTab === 'payments' && <AdminPaymentsView />}
        {activeTab === 'transfers' && <AdminPaymentsTransfersView />}
        {activeTab === 'coupons' && <AdminPaymentsCouponsView />}
      </div>
    </Layout>
  );
};

export default AdminPaymentsPage;
