import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, Star, Edit, Trash2, TrendingUp, Users, AlertTriangle, Package, Cloud, CloudRain, CloudSnow, Wind, Zap, Sun, Search, Camera, Eye, Calendar, ClipboardCheck } from "lucide-react";

import { Layout } from '@/components/layout/Layout';
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomEmptyState } from "@/components/ui-custom/misc/CustomEmptyState";
import { CustomTable } from "@/components/ui-custom/misc/CustomTable";
import SiteLogCard from "@/components/cards/SiteLogCard";

import { useCurrentUser } from "@/hooks/use-current-user";
import { NewSiteLogModal } from "@/modals/construction/NewSiteLogModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";


// Entry types enum with their icons and labels
const entryTypes = {
  avance_de_obra: { icon: TrendingUp, label: "Avance de obra", color: "bg-green-100 text-green-800" },
  visita_tecnica: { icon: Users, label: "Visita técnica", color: "bg-blue-100 text-blue-800" },
  problema_detectado: { icon: AlertTriangle, label: "Problema detectado", color: "bg-red-100 text-red-800" },
  pedido_material: { icon: Package, label: "Pedido material", color: "bg-orange-100 text-orange-800" },
  nota_climatica: { icon: Sun, label: "Nota climática", color: "bg-yellow-100 text-yellow-800" },
  decision: { icon: ClipboardCheck, label: "Decisión", color: "bg-purple-100 text-purple-800" },
  inspeccion: { icon: Search, label: "Inspección", color: "bg-indigo-100 text-indigo-800" },
  foto_diaria: { icon: Camera, label: "Foto diaria", color: "bg-gray-100 text-gray-800" },
  registro_general: { icon: FileText, label: "Registro general", color: "bg-teal-100 text-teal-800" }
};

const weatherTypes = {
  sunny: { icon: Sun, label: "Soleado" },
  partly_cloudy: { icon: Cloud, label: "Parcialmente nublado" },
  cloudy: { icon: Cloud, label: "Nublado" },
  rain: { icon: CloudRain, label: "Lluvia" },
  storm: { icon: Zap, label: "Tormenta" },
  snow: { icon: CloudSnow, label: "Nieve" },
  fog: { icon: Cloud, label: "Niebla" },
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

      if (!logsData || logsData.length === 0) {
        return [];
      }

      // Get log IDs for related data
      const logIds = logsData.map(log => log.id);

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
      


      // Fetch attendees separately
      const { data: attendeesData } = await supabase
        .from('site_log_attendees')
        .select(`
          *,
          contact:contacts(
            id,
            first_name,
            last_name
          )
        `)
        .in('site_log_id', logIds);

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

      // Combine data
      const data = logsData.map(log => ({
        ...log,
        events: eventsData?.filter(event => event.site_log_id === log.id) || [],
        attendees: attendeesData?.filter(attendee => attendee.site_log_id === log.id) || [],
        equipment: equipmentData?.filter(equip => equip.site_log_id === log.id) || []
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
  const [showNewSiteLogModal, setShowNewSiteLogModal] = useState(false);
  const [editingSiteLog, setEditingSiteLog] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteLogToDelete, setSiteLogToDelete] = useState<any>(null);
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
    filteredSiteLogs.sort((a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  } else if (sortBy === "date_old") {
    filteredSiteLogs.sort((a: any, b: any) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
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
        {/* Tarjetas de estadísticas - Only show when there's data */}
        {filteredSiteLogs && filteredSiteLogs.length > 0 && (
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
        )}



        <CustomTable
          data={filteredSiteLogs}
          columns={[
            {
              key: 'log_date',
              label: 'Fecha',
              sortable: true,
              sortType: 'date',
              width: '15%',
              render: (siteLog: any) => (
                <span className="text-xs">
                  {format(new Date(siteLog.log_date), 'dd/MM/yyyy', { locale: es })}
                </span>
              )
            },
            {
              key: 'entry_type',
              label: 'Tipo',
              sortable: true,
              sortType: 'string',
              width: '20%',
              render: (siteLog: any) => {
                const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
                return (
                  <div className="flex items-center gap-2">
                    {entryTypeConfig?.icon && (
                      <entryTypeConfig.icon className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-xs">{entryTypeConfig?.label || 'Sin tipo'}</span>
                  </div>
                );
              }
            },
            {
              key: 'creator',
              label: 'Creador',
              sortable: true,
              sortType: 'string',
              width: '20%',
              render: (siteLog: any) => (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-[10px] font-medium text-primary">
                      {siteLog.creator?.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-xs truncate">
                    {siteLog.creator?.full_name || 'Usuario'}
                  </span>
                </div>
              )
            },
            {
              key: 'weather',
              label: 'Clima',
              sortable: true,
              sortType: 'string',
              width: '15%',
              render: (siteLog: any) => {
                const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];
                return weatherConfig ? (
                  <div className="flex items-center gap-1">
                    <weatherConfig.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{weatherConfig.label}</span>
                  </div>
                ) : null;
              }
            },
            {
              key: 'comments',
              label: 'Comentarios',
              sortable: false,
              width: '20%',
              render: (siteLog: any) => (
                <span className="text-xs text-muted-foreground">
                  {siteLog.comments ? (siteLog.comments.length > 30 ? `${siteLog.comments.substring(0, 30)}...` : siteLog.comments) : 'Sin comentarios'}
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Acciones',
              sortable: false,
              width: '10%',
              render: (siteLog: any) => (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(siteLog.id);
                    }}
                    className="h-6 w-6 p-0 hover:bg-transparent group"
                  >
                    <Star className={`h-3 w-3 transition-colors ${siteLog.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground group-hover:text-yellow-500'}`} />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSiteLog(siteLog);
                      setShowNewSiteLogModal(true);
                    }}
                    className="h-6 w-6 p-0 hover:bg-transparent group"
                  >
                    <Edit className="h-3 w-3 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                      setSiteLogToDelete(siteLog);
                    }}
                    className="h-6 w-6 p-0 hover:bg-transparent group"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  </Button>
                </div>
              )
            }
          ]}
          emptyState={
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
          }
          renderCard={(siteLog: any) => (
            <SiteLogCard 
              siteLog={siteLog}
              onEdit={(log) => {
                setEditingSiteLog(log);
                setShowNewSiteLogModal(true);
              }}
              onDelete={(logId) => {
                const log = filteredSiteLogs.find(l => l.id === logId);
                if (log) {
                  setDeleteDialogOpen(true);
                  setSiteLogToDelete(log);
                }
              }}
              onToggleFavorite={toggleFavorite}
            />
          )}
          defaultSort={{
            key: 'log_date',
            direction: 'desc'
          }}
        />
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