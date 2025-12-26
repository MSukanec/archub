import { useState, useEffect } from 'react';
import { CreditCard, Plus, RotateCcw, Play, Bell, Search } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from '@/components/modal';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import AdminSubscriptionsTab from './AdminSubscriptionsTab';
import AdminPlansTab from './AdminPlansTab';
import AdminAuditTab from './AdminAuditTab';
const AdminSubscriptions = () => {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const { setSidebarLevel, sidebarLevel } = useNavigationStore();
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  useEffect(() => {
    if (sidebarLevel !== 'general') {
      setSidebarLevel('admin');
    }
  }, [setSidebarLevel, sidebarLevel]);
  const executeDowngradesCronMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/cron/execute-scheduled-downgrades');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al ejecutar cron');
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Cron ejecutado',
        description: `Procesados: ${data.result?.processed || 0}, Exitosos: ${data.result?.successful || 0}, Fallidos: ${data.result?.failed || 0}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo ejecutar el cron job',
        variant: 'destructive',
      });
    },
  });
  const executeNotifierCronMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/cron/execute-expiry-notifier');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al ejecutar notificador');
      return data;
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Notificador ejecutado',
        description: `Emails enviados: ${data.result?.sent || 0}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo ejecutar el notificador',
        variant: 'destructive',
      });
    },
  });
  const getActions = () => {
    switch (activeTab) {
      case 'subscriptions':
        return [
          <Button 
            key="downgrades" 
            variant="secondary" 
            onClick={() => executeDowngradesCronMutation.mutate()}
            disabled={executeDowngradesCronMutation.isPending}
            data-testid="button-execute-downgrades"
          >
            <Play className="w-4 h-4 mr-1" />
            {executeDowngradesCronMutation.isPending ? 'Ejecutando...': 'Ejecutar Downgrades'}
          </Button>,
          <Button 
            key="notifier" 
            variant="secondary" 
            onClick={() => executeNotifierCronMutation.mutate()}
            disabled={executeNotifierCronMutation.isPending}
            data-testid="button-execute-notifier"
          >
            <Bell className="w-4 h-4 mr-1" />
            {executeNotifierCronMutation.isPending ? 'Ejecutando...': 'Ejecutar Notificador'}
          </Button>,
          <Button 
            key="reset" 
            onClick={() => openModal('reset-test-data', {})}
            data-testid="button-reset-test-data"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Resetear Test Data
          </Button>,
        ];
      case 'plans':
        return [
          <Button 
            key="new-plan" 
            onClick={() => openModal('plan', {})}
            data-testid="button-new-plan"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nuevo Plan
          </Button>,
        ];
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
      {
        id: 'audit',
        label: 'Auditoría',
        isActive: activeTab === 'audit'
      },
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId),
    actions: getActions(),
  };
  return (
    <Layout wide headerProps={headerProps}>
      {activeTab === 'subscriptions'&& <AdminSubscriptionsTab />}
      {activeTab === 'plans'&& <AdminPlansTab />}
      {activeTab === 'audit'&& <AdminAuditTab />}
    </Layout>
  );
};
export default AdminSubscriptions;
