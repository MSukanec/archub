import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { OrganizationBillingView } from '@/features/organization';
import { CreditCard, Sparkles } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useLocation } from 'wouter';

export function OrganizationBillingPage() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('list');
  const [, navigate] = useLocation();

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
        return <OrganizationBillingView />;
      default:
        return <OrganizationBillingView />;
    }
  };

  const headerProps = {
    icon: CreditCard,
    title: "Facturación",
    description: "Gestiona tu plan de suscripción, consulta tu historial de pagos y descarga facturas.",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab,
    actionButton: {
      label: "Ver Planes",
      icon: Sparkles,
      onClick: () => navigate('/settings/pricing-plan')
    }
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
