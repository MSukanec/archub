import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, Star, Globe, Lock, ChevronDown, ChevronRight, Edit, Trash2, MoreHorizontal, Flame, Package, StickyNote, Sun, Cloud, CloudRain, CloudSnow, Wind, CloudDrizzle, CloudLightning, Thermometer, TrendingUp, Users, AlertTriangle, CloudSun, CheckCircle, Search, Camera, Eye, Calendar, Filter, X, Image, Video, Clock, Settings, BarChart3 } from "lucide-react";

import { Layout } from '@/components/layout/desktop/Layout';

import { SelectableGhostButton } from '@/components/ui-custom/SelectableGhostButton';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { ImageLightbox, useImageLightbox } from "@/components/ui-custom/ImageLightbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui-custom/EmptyState";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useSiteLogTimeline } from "@/hooks/use-sitelog-timeline";
import { SiteLogTimelineChart } from "@/components/charts/SiteLogTimelineChart";
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import SiteLogCard from "@/components/cards/SiteLogCard";

// Entry types enum with their icons and labels
const entryTypes = {
  avance_de_obra: { icon: TrendingUp, label: "Avance de obra", color: "bg-green-100 text-green-800" },
  visita_tecnica: { icon: Users, label: "Visita técnica", color: "bg-blue-100 text-blue-800" },
  problema_detectado: { icon: AlertTriangle, label: "Problema detectado", color: "bg-red-100 text-red-800" },
  pedido_material: { icon: Package, label: "Pedido material", color: "bg-orange-100 text-orange-800" },
  nota_climatica: { icon: Sun, label: "Nota climática", color: "bg-yellow-100 text-yellow-800" },
  decision: { icon: CheckCircle, label: "Decisión", color: "bg-purple-100 text-purple-800" },
  inspeccion: { icon: Search, label: "Inspección", color: "bg-indigo-100 text-indigo-800" },
  foto_diaria: { icon: Camera, label: "Foto diaria", color: "bg-gray-100 text-gray-800" },
  registro_general: { icon: StickyNote, label: "Registro general", color: "bg-teal-100 text-teal-800" }
};

const weatherTypes = {
  sunny: { icon: Sun, label: "Soleado" },
  partly_cloudy: { icon: CloudSun, label: "Parcialmente nublado" },
  cloudy: { icon: Cloud, label: "Nublado" },
  rain: { icon: CloudRain, label: "Lluvia" },
  storm: { icon: CloudLightning, label: "Tormenta" },
  snow: { icon: CloudSnow, label: "Nieve" },
  fog: { icon: CloudDrizzle, label: "Niebla" },
  windy: { icon: Wind, label: "Ventoso" },
  hail: { icon: CloudSnow, label: "Granizo" }
};

// Hook personalizado para obtener las bitácoras del proyecto
function useSiteLogs(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['site-logs', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) {
        return [];
      }



      // First get the site logs
      const { data: logsData, error } = await supabase
        .from('site_logs')
        .select(`
          *,
          creator:organization_members(
            id,
            user:users(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!logsData || logsData.length === 0) {
        return [];
      }

      // Get log IDs for related data
      const logIds = logsData?.map(log => log.id) || [];

      if (logIds.length === 0) {
        return [];
      }

      // Fetch events separately
      const { data: eventsData, error: eventsError } = await supabase
        .from('site_log_events')
        .select(`
          *,
          event_type:event_types(
            id,
            name
          )
        `)
        .in('site_log_id', logIds);
      


      // Fetch attendees separately from ATTENDEES table
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('attendees')
        .select(`
          *,
          personnel:project_personnel(
            id,
            notes,
            contact:contacts(
              id,
              first_name,
              last_name
            )
          )
        `)
        .in('site_log_id', logIds);

      if (attendeesError) {

      }

      // Fetch equipment separately
      const { data: equipmentData } = await supabase
        .from('site_log_equipment')
        .select(`
          *,
          equipment:equipment(
            id,
            name
          )
        `)
        .in('site_log_id', logIds);

      // Fetch files separately from project_media table
      const { data: filesData } = await supabase
        .from('project_media')
        .select('*')
        .in('site_log_id', logIds);

      // Combine data and fix creator structure
      const data = logsData.map(log => ({
        ...log,
        creator: log.creator?.user ? {
          id: log.creator.user.id,
          full_name: log.creator.user.full_name,
          avatar_url: log.creator.user.avatar_url
        } : null,
        events: eventsData?.filter(event => event.site_log_id === log.id) || [],
        attendees: attendeesData?.filter(attendee => attendee.site_log_id === log.id) || [],
        equipment: equipmentData?.filter(equip => equip.site_log_id === log.id) || [],
        files: filesData?.filter(file => file.site_log_id === log.id) || []
      }));

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!supabase && !!projectId && !!organizationId
  });
}

export default function ConstructionLogs() {
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("date_recent");
  const [filterByType, setFilterByType] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const { openModal } = useGlobalModalStore();

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'days' | 'weeks' | 'months'>('days');
  const [activeTab, setActiveTab] = useState("bitacoras");
  
  const isMobile = useMobile();

  const { data: userData, isLoading } = useCurrentUser();
  const { data: siteLogs = [], isLoading: siteLogsLoading } = useSiteLogs(
    userData?.preferences?.last_project_id,
    userData?.organization?.id
  );
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, [])
  
  // Site log timeline data for timeline chart
  const { data: siteLogTimelineData = [], isLoading: timelineLoading } = useSiteLogTimeline(
    userData?.organization?.id,
    userData?.preferences?.last_project_id,
    timePeriod
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-expand the most recent entry when data loads
  useEffect(() => {
    if (siteLogs && siteLogs.length > 0 && !expandedLogId) {
      setExpandedLogId(siteLogs[0].id);
    }
  }, [siteLogs, expandedLogId]);

  // Filtrar bitácoras según los criterios
  let filteredSiteLogs = siteLogs?.filter((log: any) => {
    const matchesSearch = log.comments?.toLowerCase().includes(searchValue.toLowerCase()) || "";
    
    if (filterByType !== "all" && log.entry_type !== filterByType) return false;
    if (favoritesOnly && !log.is_favorite) return false;
    if (publicOnly && !log.is_public) return false;
    
    return matchesSearch;
  }) || [];

  // Ordenar bitácoras
  if (sortBy === "date_recent") {
    filteredSiteLogs.sort((a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  } else if (sortBy === "date_old") {
    filteredSiteLogs.sort((a: any, b: any) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
  } else if (sortBy === "type") {
    filteredSiteLogs.sort((a: any, b: any) => a.entry_type.localeCompare(b.entry_type));
  }

  // Initialize lightbox with all images from filtered logs
  const imageUrls = filteredSiteLogs.flatMap((log: any) => 
    log.files?.filter((file: any) => file.file_type === 'image').map((file: any) => file.file_url) || []
  );
  const lightbox = useImageLightbox(imageUrls);

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
    title: "Bitácora",
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
      <div>
      {filteredSiteLogs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-muted-foreground" />}
          title={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly ? "No se encontraron entradas" : "No hay entradas de bitácora"}
          description={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly 
            ? 'Prueba ajustando los filtros de búsqueda' 
            : 'Comienza creando tu primera entrada de bitácora para documentar el progreso'
          }
        />
      ) : (
        <>
          {/* Tab Content Based on activeTab */}
          <div className="space-y-6">
            {activeTab === "bitacoras" && (
              <div className="space-y-3">
                {filteredSiteLogs.map((siteLog: any) => {
              const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
              const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];
              const isExpanded = expandedLogId === siteLog.id;

              // Render mobile card or desktop collapsible
              if (isMobile) {
                return (
                  <SiteLogCard
                    key={siteLog.id}
                    siteLog={siteLog}
                    onEdit={handleEditSiteLog}
                    onDelete={handleDeleteSiteLog}
                    onToggleFavorite={toggleFavorite}
                    onImageClick={(imageUrl, allImages) => {
                      const imageIndex = imageUrls.indexOf(imageUrl);
                      if (imageIndex !== -1) {
                        lightbox.openLightbox(imageIndex);
                      }
                    }}
                  />
                );
              }
              
              return (
                <Collapsible 
                  key={siteLog.id}
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedLogId(open ? siteLog.id : null)}
                >
                  <Card className="w-full transition-all hover:shadow-sm">
                    <div className="flex items-center justify-between p-4">
                      {/* Lado izquierdo: Información principal */}
                      <CollapsibleTrigger asChild>
                        <div className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-4">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            
                            {/* Fecha y Hora */}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(siteLog.log_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })} 21:00
                            </span>

                            {/* Clima */}
                            {weatherConfig && (
                              <div className="flex items-center gap-1">
                                <weatherConfig.icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  {weatherConfig.label}
                                </span>
                              </div>
                            )}

                            {/* Creador */}
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={siteLog.creator?.avatar_url} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {siteLog.creator?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                {siteLog.creator?.full_name || 'Usuario desconocido'}
                              </span>
                            </div>

                            {/* Tipo de Entrada */}
                            <span className="text-sm font-bold">
                              {entryTypeConfig?.label || 'Sin tipo'}
                            </span>


                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Lado derecho: Botones de acción */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(siteLog.id);
                          }}
                          className=" hover:bg-transparent group"
                        >
                          <Star className={`h-4 w-4 transition-colors ${siteLog.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('site-log', { data: siteLog });
                          }}
                          className=" hover:bg-transparent group"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSiteLog(siteLog);
                          }}
                          className=" hover:bg-transparent group"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                        <div className="space-y-4">
                          {/* Comentarios */}
                          <div>
                            <h3 className="font-medium text-muted-foreground mb-3">
                              Comentarios ({siteLog.comments ? '1' : '0'}):
                            </h3>
                            <div className="pl-4">
                              {siteLog.comments ? (
                                <p className="text-sm">{siteLog.comments}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Sin comentarios adicionales</p>
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}
                          <div className="border-t border-dashed border-muted-foreground/30"></div>

                          {/* Archivos Adjuntos */}
                          <div>
                            <h3 className="font-medium text-muted-foreground mb-3">
                              Archivos ({siteLog.files?.length || 0}):
                            </h3>
                            <div className="pl-4 flex flex-wrap gap-2">
                              {siteLog.files && Array.isArray(siteLog.files) && siteLog.files.length > 0 ? (
                                siteLog.files.map((file: any, index: number) => {
                                  return file.file_type === 'image' ? (
                                    <div key={index} className="relative group">
                                      <img 
                                        src={file.file_url} 
                                        alt={file.file_name}
                                        className="w-16 h-16 object-cover rounded border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                                        onClick={() => {
                                          const imageIndex = imageUrls.indexOf(file.file_url);
                                          if (imageIndex !== -1) {
                                            lightbox.openLightbox(imageIndex);
                                          }
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement | null;
                                          if (nextElement) {
                                            nextElement.style.display = 'flex';
                                          }
                                        }}
                                      />
                                      <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border-2 border-gray-200" style={{ display: 'none' }}>
                                        <Image className="h-6 w-6 text-gray-400" />
                                      </div>
                                    </div>
                                  ) : (
                                    <div key={index} className="flex items-center gap-2 px-2 py-1 rounded border border-gray-200">
                                      <Video className="h-4 w-4 text-gray-500" />
                                      <span className="text-xs text-muted-foreground">
                                        {file.file_name && file.file_name.length > 15 ? 
                                          file.file_name.substring(0, 15) + '...' : 
                                          file.file_name || 'Sin nombre'
                                        }
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-sm text-muted-foreground">Sin archivos adjuntos</p>
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}
                          <div className="border-t border-dashed border-muted-foreground/30"></div>

                          {/* Eventos */}
                          <div>
                            <h3 className="font-medium text-muted-foreground mb-3">
                              Eventos ({siteLog.events?.length || 0}):
                            </h3>
                            <div className="pl-4 grid grid-cols-1 md:grid-cols-5 gap-2">
                              {siteLog.events && Array.isArray(siteLog.events) && siteLog.events.length > 0 ? (
                                siteLog.events.map((event: any, index: number) => (
                                  <Card key={index} className="p-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium" style={{ color: '#22c55e' }}>
                                        {event.event_type?.name || event.type || 'Evento'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{event.description || 'Sin descripción'}</p>
                                  </Card>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}
                          <div className="border-t border-dashed border-muted-foreground/30"></div>

                          {/* Asistencias */}
                          <div>
                            <h3 className="font-medium text-muted-foreground mb-3">
                              Asistencias ({siteLog.attendees?.length || 0}):
                            </h3>
                            <div className="pl-4 grid grid-cols-1 md:grid-cols-5 gap-2">
                              {siteLog.attendees && Array.isArray(siteLog.attendees) && siteLog.attendees.length > 0 ? (
                                siteLog.attendees.map((attendee: any, index: number) => (
                                  <Card key={index} className="p-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium" style={{ color: '#3b82f6' }}>
                                        {attendee.contact ? 
                                          `${attendee.contact.first_name || ''} ${attendee.contact.last_name || ''}`.trim() || 'Personal' 
                                          : 'Personal'
                                        }
                                      </span>
                                      <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                        {attendee.attendance_type || 'Presente'}
                                      </span>
                                    </div>
                                    {attendee.description && (
                                      <p className="text-xs text-muted-foreground">{attendee.description}</p>
                                    )}
                                  </Card>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">Sin personal registrado</p>
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}
                          <div className="border-t border-dashed border-muted-foreground/30"></div>

                          {/* Maquinaria */}
                          <div>
                            <h3 className="font-medium text-muted-foreground mb-3">
                              Maquinaria ({siteLog.equipment?.length || 0}):
                            </h3>
                            <div className="pl-4 grid grid-cols-1 md:grid-cols-5 gap-2">
                              {siteLog.equipment && siteLog.equipment.length > 0 ? (
                                siteLog.equipment.map((equipment: any, index: number) => (
                                  <Card key={index} className="p-2" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)' }}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium" style={{ color: '#fbbf24' }}>
                                        {equipment.equipment?.name || 'Equipo'}
                                      </span>
                                      <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
                                        x{equipment.quantity || 1}
                                      </span>
                                    </div>
                                    {equipment.description && (
                                      <p className="text-xs text-muted-foreground">{equipment.description}</p>
                                    )}
                                  </Card>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">Sin maquinaria registrada</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
                })}
              </div>
            )}

            {activeTab === "graficos" && (
              <div className="space-y-6">
                {/* Timeline Chart */}
                <SiteLogTimelineChart 
                  data={siteLogTimelineData} 
                  isLoading={timelineLoading}
                  timePeriod={timePeriod}
                  onTimePeriodChange={setTimePeriod}
                />
              </div>
            )}
          </div>
        </>
      )}



      {/* Image Lightbox */}
      <ImageLightbox
        images={imageUrls}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.closeLightbox}
      />
      </div>
    </Layout>
  );
}