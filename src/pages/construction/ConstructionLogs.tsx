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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ImageLightbox, useImageLightbox } from "@/components/ui-custom/ImageLightbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { FeatureIntroduction } from "@/components/ui-custom/FeatureIntroduction";
import { CustomRestricted } from "@/components/ui-custom/CustomRestricted";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { useSiteLogTimeline } from "@/hooks/use-sitelog-timeline";
import { SiteLogTimelineChart } from "@/components/charts/SiteLogTimelineChart";
import { useNavigationStore } from '@/stores/navigationStore';
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useMobile } from "@/hooks/use-mobile";
import { useMobileActionBar } from "@/components/layout/mobile/MobileActionBarContext";
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

      console.log('Fetching site logs for project:', projectId, 'in organization:', organizationId);

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
        console.error('Error fetching site logs:', error);
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
          contact:contacts(
            id,
            first_name,
            last_name
          )
        `)
        .in('site_log_id', logIds);

      if (attendeesError) {
        console.error('Error fetching attendees:', attendeesError);
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

      // Fetch files separately
      const { data: filesData } = await supabase
        .from('site_log_files')
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

      console.log('Site logs with related data:', data);

      if (error) {
        console.error('Error fetching site logs:', error);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteLogToDelete, setSiteLogToDelete] = useState<any>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'days' | 'weeks' | 'months'>('days');
  const [activeTab, setActiveTab] = useState("bitacoras");
  
  const isMobile = useMobile();
  const { setActions, setShowActionBar } = useMobileActionBar();

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

  // Configure Mobile Action Bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        slot2: {
          id: 'search',
          label: 'Buscar',
          onClick: () => {
            // Focus search in header (if visible) or show search modal
          }
        },
        slot3: {
          id: 'create-log',
          label: 'Nueva Bitácora',
          onClick: () => openModal('site-log')
        },
        slot4: {
          id: 'filters',
          label: 'Filtros',
          onClick: () => {
            // Toggle filter panel or show filter modal
          }
        },
        slot5: {
          id: 'clear-filters',
          label: 'Limpiar',
          onClick: clearFilters
        }
      });
      setShowActionBar(true);
    } else {
      setShowActionBar(false);
    }

    return () => {
      if (isMobile) {
        setShowActionBar(false);
      }
    };
  }, [isMobile, setActions, setShowActionBar]);

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
      toast({
        title: "Entrada eliminada",
        description: "La entrada de bitácora ha sido eliminada correctamente",
      });
      setDeleteDialogOpen(false);
      setSiteLogToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting site log:', error);
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
      console.error('Error toggling favorite:', error);
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
    setSiteLogToDelete(siteLog);
    setDeleteDialogOpen(true);
  };



  const clearFilters = () => {
    setSearchValue("");
    setSortBy("date_recent");
    setFilterByType("all");
    setFavoritesOnly(false);
    setPublicOnly(false);
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
          Cargando bitácora...
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      {/* Feature Introduction - Mobile only */}
      <FeatureIntroduction
        features={[
          {
            title: "Registro Diario Completo",
            description: "Documenta avances de obra, visitas técnicas, problemas detectados, pedidos de material y notas climáticas con clasificación automática por tipo de entrada."
          },
          {
            title: "Documentación Visual",
            description: "Adjunta fotos y videos directamente a cada entrada para crear un registro visual completo del progreso y evidenciar cada etapa del proyecto."
          },
          {
            title: "Control de Privacidad",
            description: "Gestiona visibilidad de entradas (públicas/privadas), marca favoritos importantes y configura qué información es accesible para cada miembro del equipo."
          },
          {
            title: "Seguimiento Temporal",
            description: "Filtra entradas por fecha, tipo y estado para revisar cronológicamente el desarrollo del proyecto y generar reportes de progreso periódicos."
          }
        ]}
      />



      {filteredSiteLogs.length === 0 ? (
        <EmptyState
          title={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly ? "No se encontraron entradas" : "No hay entradas de bitácora"}
          description={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly 
            ? 'Prueba ajustando los filtros de búsqueda' 
            : 'Comienza creando tu primera entrada de bitácora para documentar el progreso'
          }
        />
      ) : (
        <>
          {/* Tab Content Based on activeTab */}
            {activeTab === "bitacoras" && (
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
                      {/* Lado izquierdo: Información principal */}
                      <CollapsibleTrigger asChild>
                            {isExpanded ? (
                            ) : (
                            )}
                            
                            {/* Fecha y Hora */}
                              {format(new Date(siteLog.log_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })} 21:00
                            </span>

                            {/* Clima */}
                            {weatherConfig && (
                                  {weatherConfig.label}
                                </span>
                              </div>
                            )}

                            {/* Creador */}
                                <AvatarImage src={siteLog.creator?.avatar_url} />
                                  {siteLog.creator?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                                {siteLog.creator?.full_name || 'Usuario desconocido'}
                              </span>
                            </div>

                            {/* Tipo de Entrada */}
                              {entryTypeConfig?.label || 'Sin tipo'}
                            </span>


                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Lado derecho: Botones de acción */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(siteLog.id);
                          }}
                        >
                          <Star className={`h-4 w-4 transition-colors ${siteLog.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal('site-log', { data: siteLog });
                          }}
                        >
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogOpen(true);
                            setSiteLogToDelete(siteLog);
                          }}
                        >
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                          {/* Comentarios */}
                          <div>
                              Comentarios ({siteLog.comments ? '1' : '0'}):
                            </h3>
                              {siteLog.comments ? (
                              ) : (
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}

                          {/* Archivos Adjuntos */}
                          <div>
                              Archivos ({siteLog.files?.length || 0}):
                            </h3>
                              {siteLog.files && Array.isArray(siteLog.files) && siteLog.files.length > 0 ? (
                                siteLog.files.map((file: any, index: number) => {
                                  return file.file_type === 'image' ? (
                                      <img 
                                        src={file.file_url} 
                                        alt={file.file_name}
                                        onClick={() => {
                                          const imageIndex = imageUrls.indexOf(file.file_url);
                                          if (imageIndex !== -1) {
                                            lightbox.openLightbox(imageIndex);
                                          }
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'flex';
                                        }}
                                      />
                                      </div>
                                    </div>
                                  ) : (
                                        {file.file_name && file.file_name.length > 15 ? 
                                          file.file_name.substring(0, 15) + '...' : 
                                          file.file_name || 'Sin nombre'
                                        }
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}

                          {/* Eventos */}
                          <div>
                              Eventos ({siteLog.events?.length || 0}):
                            </h3>
                              {siteLog.events && Array.isArray(siteLog.events) && siteLog.events.length > 0 ? (
                                siteLog.events.map((event: any, index: number) => (
                                        {event.event_type?.name || event.type || 'Evento'}
                                      </span>
                                    </div>
                                  </Card>
                                ))
                              ) : (
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}

                          {/* Asistencias */}
                          <div>
                              Asistencias ({siteLog.attendees?.length || 0}):
                            </h3>
                              {siteLog.attendees && Array.isArray(siteLog.attendees) && siteLog.attendees.length > 0 ? (
                                siteLog.attendees.map((attendee: any, index: number) => (
                                        {attendee.contact ? 
                                          `${attendee.contact.first_name || ''} ${attendee.contact.last_name || ''}`.trim() || 'Personal' 
                                          : 'Personal'
                                        }
                                      </span>
                                        {attendee.attendance_type || 'Presente'}
                                      </span>
                                    </div>
                                    {attendee.description && (
                                    )}
                                  </Card>
                                ))
                              ) : (
                              )}
                            </div>
                          </div>

                          {/* Línea divisoria punteada */}

                          {/* Maquinaria */}
                          <div>
                              Maquinaria ({siteLog.equipment?.length || 0}):
                            </h3>
                              {siteLog.equipment && siteLog.equipment.length > 0 ? (
                                siteLog.equipment.map((equipment: any, index: number) => (
                                        {equipment.equipment?.name || 'Equipo'}
                                      </span>
                                        x{equipment.quantity || 1}
                                      </span>
                                    </div>
                                    {equipment.description && (
                                    )}
                                  </Card>
                                ))
                              ) : (
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



      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrada de bitácora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta entrada de la bitácora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => siteLogToDelete && deleteSiteLogMutation.mutate(siteLogToDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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