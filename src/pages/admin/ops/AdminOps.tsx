import { useState } from 'react';
import { Activity, Play, RefreshCw } from 'lucide-react';
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/use-admin-permissions';
import AdminOpsAlertsTab from './AdminOpsAlertsTab';
import AdminOpsHistoryTab from './AdminOpsHistoryTab';
import AdminOpsRunbooksTab from './AdminOpsRunbooksTab';
import AdminOpsFlagsTab from './AdminOpsFlagsTab';

interface OpsStats {
  open: number;
  ack: number;
  resolved: number;
  critical: number;
  high: number;
  last_run: {
    id: string;
    created_at: string;
    status: string;
    duration_ms: number;
    stats: Record<string, any>;
  } | null;
}

export default function AdminOps() {
  const [activeTab, setActiveTab] = useState('alertas');
  const { toast } = useToast();
  const isAdmin = useIsAdmin();

  const { data: stats } = useQuery<OpsStats>({
    queryKey: ['/api/admin/ops/stats'],
    enabled: isAdmin,
  });

  const runChecksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/ops/run-checks');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Checks ejecutados', description: `Alertas creadas: ${data.stats?.total_created || 0}` });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ops/check-runs'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const totalOpen = (stats?.open || 0) + (stats?.ack || 0);

  const tabs = [
    { 
      id: 'alertas', 
      label: 'Alertas', 
      isActive: activeTab === 'alertas',
      badgeCount: totalOpen > 0 ? totalOpen : undefined
    },
    { 
      id: 'historial', 
      label: 'Historial', 
      isActive: activeTab === 'historial'
    },
    { 
      id: 'runbooks', 
      label: 'Runbooks', 
      isActive: activeTab === 'runbooks'
    },
    { 
      id: 'flags', 
      label: 'Feature Flags', 
      isActive: activeTab === 'flags'
    }
  ];

  const getActionButton = () => {
    if (activeTab === 'alertas' && isAdmin) {
      return {
        label: runChecksMutation.isPending ? "Ejecutando..." : "Ejecutar Checks",
        icon: runChecksMutation.isPending ? RefreshCw : Play,
        onClick: () => runChecksMutation.mutate(),
        disabled: runChecksMutation.isPending
      };
    }
    return undefined;
  };

  const headerProps = {
    title: "Ops Center",
    icon: Activity,
    showSearch: false,
    showFilters: false,
    tabs,
    onTabChange: setActiveTab,
    actionButton: getActionButton()
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'alertas':
        return <AdminOpsAlertsTab stats={stats} />;
      case 'historial':
        return <AdminOpsHistoryTab />;
      case 'runbooks':
        return <AdminOpsRunbooksTab />;
      case 'flags':
        return <AdminOpsFlagsTab />;
      default:
        return <AdminOpsAlertsTab stats={stats} />;
    }
  };

  return (
    <Layout wide headerProps={headerProps}>
      {renderTabContent()}
    </Layout>
  );
}
