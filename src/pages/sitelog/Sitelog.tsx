import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { FileText, Plus } from "lucide-react";

import { Layout } from '@/components/layout/desktop/Layout';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from '@/stores/projectContext';
import { useSiteLogTimeline } from "@/features/sitelog/hooks/use-sitelog-timeline";
import { useSiteLogs } from "@/features/sitelog/hooks/use-site-logs";
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

import SitelogEntriesTab from './SitelogEntriesTab';
import SitelogChartsTab from './SitelogChartsTab';

export default function Sitelog() {
  const { openModal } = useGlobalModalStore();

  const [timePeriod, setTimePeriod] = useState<'days' | 'weeks' | 'months'>('days');
  const [activeTab, setActiveTab] = useState("bitacoras");

  const { data: userData, isLoading } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { data: siteLogs = [], isLoading: siteLogsLoading } = useSiteLogs(
    selectedProjectId || undefined,
    currentOrganizationId || undefined
  );
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])
  
  // Site log timeline data for timeline chart
  const { data: siteLogTimelineData = [], isLoading: timelineLoading } = useSiteLogTimeline(
    currentOrganizationId || undefined,
    selectedProjectId || undefined,
    timePeriod
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Mutation para eliminar bitácora
  const deleteSiteLogMutation = useMutation({
    mutationFn: async (siteLogId: string) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const { error } = await supabase
        .from('site_logs')
        .delete()
        .eq('id', siteLogId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sitelog-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-data'] });
      queryClient.invalidateQueries({ queryKey: ['project-personnel'] });
      toast({
        title: "Entrada eliminada",
        description: "La entrada de bitácora ha sido eliminada correctamente",
      });
    },
    onError: (error) => {

      toast({
        title: "Error",
        description: "No se pudo eliminar la entrada de bitácora",
        variant: "destructive",
      });
    }
  });

  // Mutation para toggle favorito
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (siteLogId: string) => {
      if (!supabase) throw new Error('Supabase client not available');
      
      const siteLog = siteLogs?.find(log => log.id === siteLogId);
      if (!siteLog) throw new Error('Site log not found');

      const { error } = await supabase
        .from('site_logs')
        .update({ is_favorite: !siteLog.is_favorite })
        .eq('id', siteLogId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      queryClient.invalidateQueries({ queryKey: ['sitelog-timeline'] });
    },
    onError: (error) => {

      toast({
        title: "Error",
        description: "No se pudo actualizar el favorito",
        variant: "destructive",
      });
    }
  });

  const toggleFavorite = (siteLogId: string) => {
    toggleFavoriteMutation.mutate(siteLogId);
  };

  const handleEditSiteLog = (siteLog: any) => {
    openModal('site-log', { data: siteLog, isEditing: true });
  };

  const handleDeleteSiteLog = (siteLog: any) => {
    openModal('delete-confirmation', {
      mode: 'simple',
      title: 'Eliminar entrada de bitácora',
      description: '¿Estás seguro de que quieres eliminar esta entrada de bitácora? Esta acción no se puede deshacer.',
      destructiveActionText: 'Eliminar entrada',
      onConfirm: () => deleteSiteLogMutation.mutate(siteLog.id),
      isLoading: deleteSiteLogMutation.isPending
    });
  };

  // Header tabs configuration
  const headerTabs = [
    {
      id: "bitacoras",
      label: "Entradas",
      isActive: activeTab === "bitacoras"
    },
    {
      id: "graficos", 
      label: "Gráficos",
      isActive: activeTab === "graficos"
    }
  ]

  const headerProps = {
    icon: FileText,
    title: "Bitácora de Obra",
    description: "Registra el progreso diario del proyecto con entradas detalladas de obra, condiciones climáticas, personal y eventos importantes",
    organizationId: currentOrganizationId,
    showMembers: true,
    showProjectSelector: true,
    tabs: headerTabs,
    onTabChange: setActiveTab,
    actionButton: activeTab === "bitacoras" ? {
      label: 'Nueva Bitácora',
      icon: Plus,
      onClick: () => openModal('site-log')
    } : undefined
  };

  if (isLoading || siteLogsLoading) {
    return (
      <Layout wide headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando bitácora...
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {activeTab === "bitacoras" && (
          <SitelogEntriesTab 
            siteLogs={siteLogs}
            toggleFavorite={toggleFavorite}
            handleEditSiteLog={handleEditSiteLog}
            handleDeleteSiteLog={handleDeleteSiteLog}
          />
        )}

        {activeTab === "graficos" && (
          <SitelogChartsTab 
            siteLogTimelineData={siteLogTimelineData}
            timelineLoading={timelineLoading}
            timePeriod={timePeriod}
            setTimePeriod={setTimePeriod}
          />
        )}
      </div>
    </Layout>
  );
}
