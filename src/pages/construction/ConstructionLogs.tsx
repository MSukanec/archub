import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, Star, Globe, Lock, ChevronDown, ChevronRight, Edit, Trash2, MoreHorizontal, Flame, Package, StickyNote, Sun, Cloud, CloudRain, CloudSnow, Wind, CloudDrizzle, CloudLightning, Thermometer, TrendingUp, Users, AlertTriangle, CloudSun, CheckCircle, Search, Camera, Eye, Calendar } from "lucide-react";

import { Layout } from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

      const { data, error } = await supabase
        .from('site_logs')
        .select(`
          *,
          creator:users!created_by(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

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
  const [showNewSiteLogModal, setShowNewSiteLogModal] = useState(false);
  const [editingSiteLog, setEditingSiteLog] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteLogToDelete, setSiteLogToDelete] = useState<any>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: userData, isLoading } = useCurrentUser();
  const { data: siteLogs = [], isLoading: siteLogsLoading } = useSiteLogs(
    userData?.preferences?.last_project_id,
    userData?.organization?.id
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    filteredSiteLogs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortBy === "date_old") {
    filteredSiteLogs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (sortBy === "type") {
    filteredSiteLogs.sort((a: any, b: any) => a.entry_type.localeCompare(b.entry_type));
  }

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

  return (
    <Layout wide headerProps={headerProps}>
      <div className="space-y-6">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total de Entradas</span>
            </div>
            <p className="text-lg font-semibold mt-1">{filteredSiteLogs?.length || 0}</p>
          </div>
          
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Favoritos</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {filteredSiteLogs?.filter(log => log.is_favorite).length || 0}
            </p>
          </div>
          
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Entradas Públicas</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {filteredSiteLogs?.filter(log => log.is_public).length || 0}
            </p>
          </div>
          
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Esta Semana</span>
            </div>
            <p className="text-lg font-semibold mt-1">
              {filteredSiteLogs?.filter(log => {
                const logDate = new Date(log.log_date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return logDate >= weekAgo;
              }).length || 0}
            </p>
          </div>
        </div>



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
          <div className="space-y-3">
            {filteredSiteLogs.map((siteLog: any) => {
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
                            
                            {/* Fecha */}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(siteLog.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </span>

                            {/* Tipo de Entrada */}
                            <span className="text-sm font-bold">
                              {entryTypeConfig?.label || 'Sin tipo'}
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
                              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {siteLog.creator?.full_name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {siteLog.creator?.full_name || 'Usuario desconocido'}
                              </span>
                            </div>

                            {/* Status indicators */}
                            <div className="flex gap-1 ml-auto">
                              {siteLog.is_public ? <Globe className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-gray-400" />}
                            </div>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      {/* Lado derecho: Botones de acción */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(siteLog.id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-transparent group"
                        >
                          <Star className={`h-4 w-4 transition-colors ${siteLog.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSiteLog(siteLog);
                            setShowNewSiteLogModal(true);
                          }}
                          className="h-8 w-8 p-0 hover:bg-transparent group"
                        >
                          <Edit className="h-4 w-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialogOpen(true);
                            setSiteLogToDelete(siteLog);
                          }}
                          className="h-8 w-8 p-0 hover:bg-transparent group"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                        </Button>
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          {/* Comentario Completo */}
                          <div>
                            <span className="font-medium text-muted-foreground block mb-2">Comentario Completo</span>
                            <p className="text-sm">{siteLog.comments || 'Sin comentarios adicionales'}</p>
                          </div>

                          {/* Eventos */}
                          <div>
                            <span className="font-medium text-muted-foreground block mb-2">Eventos</span>
                            <div className="space-y-1">
                              {siteLog.events && siteLog.events.length > 0 ? (
                                siteLog.events.map((event: any, index: number) => (
                                  <div key={index} className="text-xs bg-blue-50 px-2 py-1 rounded">
                                    {event.event_type?.name || 'Evento'}: {event.description || 'Sin descripción'}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground">Sin eventos registrados</p>
                              )}
                            </div>
                          </div>

                          {/* Personal */}
                          <div>
                            <span className="font-medium text-muted-foreground block mb-2">Personal</span>
                            <div className="space-y-1">
                              {siteLog.attendees && siteLog.attendees.length > 0 ? (
                                siteLog.attendees.map((attendee: any, index: number) => (
                                  <div key={index} className="text-xs bg-green-50 px-2 py-1 rounded">
                                    {attendee.contact ? `${attendee.contact.first_name || ''} ${attendee.contact.last_name || ''}`.trim() || 'Personal' : 'Personal'}: {attendee.attendance_type || 'Presente'}
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground">Sin personal registrado</p>
                              )}
                            </div>
                          </div>

                          {/* Maquinaria */}
                          <div>
                            <span className="font-medium text-muted-foreground block mb-2">Maquinaria</span>
                            <div className="space-y-1">
                              {siteLog.equipment && siteLog.equipment.length > 0 ? (
                                siteLog.equipment.map((equipment: any, index: number) => (
                                  <div key={index} className="text-xs bg-orange-50 px-2 py-1 rounded">
                                    {equipment.equipment?.name || 'Equipo'} (x{equipment.quantity || 1})
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-muted-foreground">Sin maquinaria registrada</p>
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
      </div>

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