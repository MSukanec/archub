import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, Star, Globe, Lock, ChevronDown, ChevronRight, Edit, Trash2, MoreHorizontal, Flame, Package, StickyNote, Sun, Cloud, CloudRain, CloudSnow, Wind, CloudDrizzle, CloudLightning, Thermometer, TrendingUp, Users, AlertTriangle, CloudSun, CheckCircle, Search, Camera, Eye, Calendar } from "lucide-react";

import { Layout } from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomEmptyState } from "@/components/ui-custom/misc/CustomEmptyState";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { NewSiteLogModal } from "@/modals/NewSiteLogModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
  cloudy: { icon: Cloud, label: "Nublado" },
  rainy: { icon: CloudRain, label: "Lluvioso" },
  stormy: { icon: CloudLightning, label: "Tormentoso" },
  windy: { icon: Wind, label: "Ventoso" },
  snowy: { icon: CloudSnow, label: "Nevado" },
  hot: { icon: Thermometer, label: "Caluroso" },
  cold: { icon: CloudSnow, label: "Frío" }
};

// Hook personalizado para obtener las bitácoras del proyecto
function useSiteLogs(projectId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: ['site-logs', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return [];

      console.log('Fetching site logs for project:', projectId, 'in organization:', organizationId);

      const { data, error } = await supabase
        .from('site_logs')
        .select(`
          *,
          creator:organization_members!created_by(
            id,
            user:users(full_name, email)
          ),
          attendees:site_log_attendees(
            contact_id,
            attendance_type,
            description,
            contact:contacts(
              id,
              full_name,
              email,
              phone
            )
          ),
          events:site_log_events(
            event_type_id,
            description,
            event_type:event_types(
              id,
              name
            )
          )
        `)
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('Error fetching site logs:', error);
        throw error;
      }

      // Transform the data to flatten creator information
      const transformedData = data?.map(log => ({
        ...log,
        creator: {
          id: log.creator?.id,
          full_name: log.creator?.user?.full_name || log.creator?.user?.email,
          email: log.creator?.user?.email
        }
      })) || [];

      return transformedData;
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
  const [showNewSiteLogModal, setShowNewSiteLogModal] = useState(false);
  const [editingSiteLog, setEditingSiteLog] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteLogToDelete, setSiteLogToDelete] = useState<any>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: userData, isLoading } = useCurrentUser();

  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  const { data: siteLogs, isLoading: siteLogsLoading } = useSiteLogs(projectId, organizationId);
  const { data: organizationMembers } = useOrganizationMembers(organizationId);

  // Filter and sort site logs
  const filteredSiteLogs = siteLogs?.filter((log: any) => {
    const matchesSearch = !searchValue || 
      log.comments?.toLowerCase().includes(searchValue.toLowerCase()) ||
      log.creator?.full_name?.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesType = filterByType === "all" || log.entry_type === filterByType;
    const matchesFavorites = !favoritesOnly || log.is_favorite;
    const matchesPublic = !publicOnly || log.is_public;
    
    return matchesSearch && matchesType && matchesFavorites && matchesPublic;
  })?.sort((a: any, b: any) => {
    if (sortBy === "date_recent") {
      return new Date(b.log_date).getTime() - new Date(a.log_date).getTime();
    } else if (sortBy === "date_old") {
      return new Date(a.log_date).getTime() - new Date(b.log_date).getTime();
    } else if (sortBy === "type") {
      return a.entry_type.localeCompare(b.entry_type);
    }
    return 0;
  }) || [];

  // Delete mutation
  const deleteSiteLogMutation = useMutation({
    mutationFn: async (siteLogId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('site_logs')
        .delete()
        .eq('id', siteLogId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-logs'] });
      setDeleteDialogOpen(false);
      setSiteLogToDelete(null);
      toast({
        title: "Entrada eliminada",
        description: "La entrada de bitácora ha sido eliminada exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting site log:', error);
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la entrada de bitácora.",
        variant: "destructive",
      });
    }
  });

  const handleEditSiteLog = (siteLog: any) => {
    setEditingSiteLog(siteLog);
    setShowNewSiteLogModal(true);
  };

  const handleDeleteSiteLog = (siteLog: any) => {
    setSiteLogToDelete(siteLog);
    setDeleteDialogOpen(true);
  };

  const customFilters = (
    <div className="flex gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Ordenar por</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_recent">Más recientes</SelectItem>
            <SelectItem value="date_old">Más antiguos</SelectItem>
            <SelectItem value="type">Tipo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Filtrar por tipo</Label>
        <Select value={filterByType} onValueChange={setFilterByType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(entryTypes).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Filtros adicionales</Label>
        <div className="flex gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="favorites"
              checked={favoritesOnly}
              onCheckedChange={setFavoritesOnly}
            />
            <Label htmlFor="favorites" className="text-sm">Solo favoritos</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="public"
              checked={publicOnly}
              onCheckedChange={setPublicOnly}
            />
            <Label htmlFor="public" className="text-sm">Solo públicos</Label>
          </div>
        </div>
      </div>
    </div>
  );

  const clearFilters = () => {
    setSearchValue("");
    setSortBy("date_recent");
    setFilterByType("all");
    setFavoritesOnly(false);
    setPublicOnly(false);
  };

  const actions = [
    <Button 
      key="new-entry"
      className="h-8 px-3 text-sm"
      onClick={() => setShowNewSiteLogModal(true)}
    >
      <Plus className="w-4 h-4 mr-2" />
      Nueva Entrada
    </Button>
  ];

  const headerProps = {
    icon: FileText,
    title: "Bitácora",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    customFilters,
    onClearFilters: clearFilters,
    actions
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

  // Group logs by date
  const groupLogsByDate = (logs: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    logs.forEach(log => {
      const dateKey = format(new Date(log.log_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });
    return grouped;
  };

  const groupedLogs = groupLogsByDate(filteredSiteLogs);
  const sortedDates = Object.keys(groupedLogs).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Auto-expand the most recent log
  useEffect(() => {
    if (filteredSiteLogs.length > 0 && !expandedLogId) {
      setExpandedLogId(filteredSiteLogs[0].id);
    }
  }, [filteredSiteLogs, expandedLogId]);

  return (
    <Layout wide headerProps={headerProps}>
      {filteredSiteLogs.length === 0 ? (
        <CustomEmptyState
          icon={<FileText className="w-12 h-12 text-muted-foreground" />}
          title={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly ? "No se encontraron entradas" : "No hay entradas de bitácora"}
          description={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly 
            ? 'Prueba ajustando los filtros de búsqueda' 
            : 'Comienza creando tu primera entrada de bitácora para documentar el progreso'
          }
          action={
            !searchValue && filterByType === 'all' && !favoritesOnly && !publicOnly && (
              <Button onClick={() => setShowNewSiteLogModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Entrada
              </Button>
            )
          }
        />
      ) : (
        <div className="relative">
          {/* Vertical timeline */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border"></div>
          
          <div className="space-y-8">
            {sortedDates.map((dateKey) => {
              const logsForDate = groupedLogs[dateKey];
              const dateObj = new Date(dateKey);
              
              return (
                <div key={dateKey} className="relative">
                  {/* Timeline milestone for the day */}
                  <div className="absolute left-8 w-3 h-3 bg-primary rounded-full transform -translate-x-1/2 border-2 border-background"></div>
                  
                  {/* Date header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16"></div> {/* Space for timeline */}
                    <div className="text-sm font-medium text-muted-foreground">
                      {format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </div>
                  </div>
                  
                  {/* Logs for this date */}
                  <div className="space-y-3 ml-16">
                    {logsForDate.map((siteLog: any) => {
                      const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
                      const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];
                      const isExpanded = expandedLogId === siteLog.id;
              
                      return (
                        <Collapsible 
                          key={siteLog.id}
                          open={isExpanded}
                          onOpenChange={(open) => setExpandedLogId(open ? siteLog.id : null)}
                        >
                          <Card className="w-full transition-all hover:shadow-sm">
                            <CollapsibleTrigger asChild>
                              <div className="w-full p-4 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  {/* Left side: Time, Creator, Entry Type, Weather */}
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <div className="text-sm font-medium">
                                        {format(new Date(siteLog.log_date), 'HH:mm', { locale: es })}
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-xs font-medium text-primary">
                                          {siteLog.creator?.full_name?.charAt(0) || 'U'}
                                        </span>
                                      </div>
                                      <span className="text-sm font-medium">
                                        {siteLog.creator?.full_name || 'Usuario desconocido'}
                                      </span>
                                    </div>

                                    {entryTypeConfig && (
                                      <div className="flex items-center gap-2">
                                        <entryTypeConfig.icon className="h-4 w-4 text-muted-foreground" />
                                        <Badge variant="secondary" className="text-xs">
                                          {entryTypeConfig.label}
                                        </Badge>
                                      </div>
                                    )}

                                    {weatherConfig && (
                                      <div className="flex items-center gap-2">
                                        <weatherConfig.icon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                          {weatherConfig.label}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right side: Action buttons */}
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      {siteLog.is_favorite && <Star className="h-3 w-3 text-yellow-500" />}
                                      {siteLog.is_public ? <Globe className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-gray-400" />}
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditSiteLog(siteLog);
                                        }}>
                                          <Edit className="h-4 w-4 mr-2" />
                                          Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSiteLog(siteLog);
                                          }}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Eliminar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="px-4 pb-4 pt-2 border-t">
                                <div className="grid grid-cols-3 gap-6">
                                  {/* Comentarios */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Comentarios</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {siteLog.comments || 'Sin comentarios adicionales'}
                                    </p>
                                  </div>

                                  {/* Personal */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Personal</h4>
                                    {siteLog.attendees && siteLog.attendees.length > 0 ? (
                                      <div className="space-y-2">
                                        {siteLog.attendees.map((attendee: any, index: number) => (
                                          <div key={index} className="flex items-center gap-2 text-sm">
                                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                              <span className="text-xs">
                                                {attendee.contact?.full_name?.charAt(0) || 'U'}
                                              </span>
                                            </div>
                                            <span>{attendee.contact?.full_name || 'Personal'}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {attendee.attendance_type === 'full' ? 'Completa' : 'Media'}
                                            </Badge>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">Sin personal registrado</p>
                                    )}
                                  </div>

                                  {/* Eventos */}
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Eventos</h4>
                                    {siteLog.events && siteLog.events.length > 0 ? (
                                      <div className="space-y-2">
                                        {siteLog.events.map((event: any, index: number) => (
                                          <div key={index} className="text-sm">
                                            <div className="font-medium">{event.event_type?.name || 'Evento'}</div>
                                            <p className="text-muted-foreground text-xs">
                                              {event.description || 'Sin descripción'}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">Sin eventos registrados</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal para nueva entrada */}
      {showNewSiteLogModal && (
        <NewSiteLogModal
          open={showNewSiteLogModal}
          onClose={() => {
            setShowNewSiteLogModal(false);
            setEditingSiteLog(null);
          }}
          editingSiteLog={editingSiteLog}
        />
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}