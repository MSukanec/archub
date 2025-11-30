import { useEffect, useState } from 'react';
import { DashboardLayout as Layout } from "@/layouts";
import { BillingListTab } from '@/pages/billing/tabs/BillingListTab';
import { CreditCard } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function Billing() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const tabs = [
    { id: 'list', label: 'Resumen', isActive: activeTab === 'list' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return <BillingListTab />;
      default:
        return <BillingListTab />;
    }
  };

  const headerProps = {
    icon: CreditCard,
    title: "Facturación",
    description: "Gestiona tu plan de suscripción, consulta tu historial de pagos y descarga facturas.",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
