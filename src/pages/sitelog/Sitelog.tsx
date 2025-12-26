import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { Layout } from "@/layouts/dashboard/DashboardLayout";
import { LoadingSpinner } from '@/components/shared/layout/LoadingSpinner';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from '@/stores/projectContext';
import { useSiteLogs } from "@/features/sitelog/hooks/use-site-logs";
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from "@/components/modal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import SitelogEntriesTab from './SitelogEntriesTab';
import SitelogMedia from './SitelogMedia';
import SitelogSettings from './SitelogSettings';
import { SitelogStatsSection } from '@/features/sitelog/components/SitelogStatsSection';
export default function Sitelog() {
  const { openModal } = useGlobalModalStore();
  const [activeTab, setActiveTab] = useState<'entradas'| 'multimedia'| 'ajustes'>('entradas');
  
  const { data: userData, isLoading } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  // Si selectedProjectId es null, mostrará todas las bitácoras de la organización
  const { data: siteLogs = [], isLoading: siteLogsLoading } = useSiteLogs(
    selectedProjectId || undefined,
    currentOrganizationId || undefined
  );
  
  // Si no hay bitácoras y el usuario está en multimedia, redirigir a entradas
  useEffect(() => {
    if (siteLogs.length === 0 && activeTab === 'multimedia') {
      setActiveTab('entradas');
    }
  }, [siteLogs.length, activeTab]);
  
  const { setSidebarContext } = useNavigationStore()
  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])
  
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
  const handleViewSiteLog = (siteLog: any) => {
    openModal('site-log', { id: siteLog.id, data: siteLog, mode: 'view'});
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
  const headerProps = {
    icon: BookOpen,
    title: "Bitácora de Obra",
    description: "Registra el progreso diario del proyecto con entradas detalladas de obra, condiciones climáticas, personal y eventos importantes",
    organizationId: currentOrganizationId || undefined,
    showMembers: true,
    showProjectSelector: true,
    tabs: [
      { id: 'entradas', label: 'Entradas', isActive: activeTab === 'entradas'},
      { 
        id: 'multimedia', 
        label: 'Multimedia', 
        isActive: activeTab === 'multimedia',
        isDisabled: siteLogs.length === 0
      },
      { id: 'ajustes', label: 'Ajustes', isActive: activeTab === 'ajustes'}
    ],
    onTabChange: (tabId: string) => setActiveTab(tabId as 'entradas'| 'multimedia'| 'ajustes'),
    actionButton: activeTab === 'entradas'? {
      label: 'Nueva Bitácora',
      icon: Plus,
      onClick: () => openModal('site-log')
    } : undefined
  };
  if (isLoading || siteLogsLoading) {
    return (
      <Layout wide headerProps={headerProps}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }
  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Stats Section - Solo mostrar si hay datos y estamos en tab de entradas */}
        {activeTab === 'entradas'&& siteLogs.length > 0 && (
          <SitelogStatsSection siteLogs={siteLogs} />
        )}
        {/* Render active tab content */}
        {activeTab === 'entradas'&& (
          <SitelogEntriesTab 
            siteLogs={siteLogs}
            toggleFavorite={toggleFavorite}
            handleViewSiteLog={handleViewSiteLog}
            handleEditSiteLog={handleEditSiteLog}
            handleDeleteSiteLog={handleDeleteSiteLog}
          />
        )}
        {activeTab === 'multimedia'&& <SitelogMedia />}
        
        {activeTab === 'ajustes'&& <SitelogSettings />}
      </div>
    </Layout>
  );
}
