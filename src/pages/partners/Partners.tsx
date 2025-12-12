import { useEffect, useState } from 'react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { PartnersListTab } from '@/pages/partners/tabs/PartnersListTab';
import { PartnerBalancesTab } from '@/pages/partners/tabs/PartnerBalancesTab';
import { PartnerTransactionsTab } from '@/pages/partners/tabs/PartnerTransactionsTab';
import { HandHeart, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Partners() {
  const { setSidebarLevel } = useNavigationStore();
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState('list');

  useEffect(() => {
    setSidebarLevel('organization');
  }, [setSidebarLevel]);

  const organizationId = userData?.organization?.id;

  const handleAddPartner = () => {
    openModal('partner', { organizationId });
  };

  const handleAddContribution = () => {
    openModal('partner-contribution', { organizationId });
  };

  const handleAddWithdrawal = () => {
    openModal('partner-withdrawal', { organizationId });
  };

  const tabs = [
    { id: 'list', label: 'Lista de Socios', isActive: activeTab === 'list' },
    { id: 'balances', label: 'Balance por Socio', isActive: activeTab === 'balances' },
    { id: 'transactions', label: 'Transacciones', isActive: activeTab === 'transactions' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return <PartnersListTab />;
      case 'balances':
        return <PartnerBalancesTab />;
      case 'transactions':
        return <PartnerTransactionsTab />;
      default:
        return <PartnersListTab />;
    }
  };

  const headerProps = {
    icon: HandHeart,
    title: "Socios",
    description: "Gestiona los socios de tu organización y sus participaciones",
    organizationId: organizationId ?? undefined,
    showMembers: true,
    tabs,
    onTabChange: setActiveTab,
    ...(activeTab === 'list' && {
      actionButton: {
        label: "Agregar Socio",
        icon: Plus,
        onClick: handleAddPartner
      }
    }),
    ...(activeTab === 'transactions' && {
      actions: [
        <DropdownMenu key="add-transaction">
          <DropdownMenuTrigger asChild>
            <Button className="h-8 px-3 text-xs" data-testid="button-add-transaction">
              <Plus className="w-4 h-4 mr-1" />
              Nuevo Movimiento
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddContribution} data-testid="menu-item-add-contribution">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Nuevo Aporte
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddWithdrawal} data-testid="menu-item-add-withdrawal">
              <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
              Nuevo Retiro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ]
    })
  };

  return (
    <Layout headerProps={headerProps} wide={false}>
      {renderTabContent()}
    </Layout>
  );
}
