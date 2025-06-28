import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Clock,
  User,
  Cloud,
  MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { useCurrentUser } from "@/hooks/use-current-user";
import { NewSiteLogModal } from "@/modals/NewSiteLogModal";
import { CustomGradebook } from "@/components/ui-custom/misc/CustomGradebook";

const ENTRY_TYPE_LABELS = {
  avance_de_obra: "Avance de Obra",
  visita_tecnica: "Visita Técnica", 
  problema_detectado: "Problema Detectado",
  pedido_material: "Pedido Material",
  nota_climatica: "Nota Climática",
  decision: "Decisión",
  inspeccion: "Inspección",
  foto_diaria: "Foto Diaria",
  registro_general: "Registro General"
};

const WEATHER_LABELS = {
  sunny: "Soleado",
  cloudy: "Nublado",
  rainy: "Lluvioso",
  stormy: "Tormentoso",
  windy: "Ventoso",
  snowy: "Nevado",
  hot: "Caluroso",
  cold: "Frío"
};

function useSiteLogs(projectId: string | undefined, organizationId: string | undefined) {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  return useQuery({
    queryKey: ['site-logs', projectId, organizationId],
    queryFn: async () => {
      if (!supabase || !projectId || !organizationId) return [];

      const { data, error } = await supabase
        .from('site_logs')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', organizationId)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('Error fetching site logs:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!supabase && !!projectId && !!organizationId
  });
}

function groupLogsByDate(logs: any[]) {
  const grouped: { [key: string]: any[] } = {};
  
  logs.forEach(log => {
    const dateKey = format(new Date(log.log_date), 'yyyy-MM-dd');
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(log);
  });
  
  return grouped;
}

export default function ConstructionLogs() {
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("date_recent");
  const [filterByType, setFilterByType] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const { data: userData } = useCurrentUser();
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;

  const { data: logs = [], isLoading, error } = useSiteLogs(projectId, organizationId);

  // Auto-expand most recent log
  useEffect(() => {
    if (logs && logs.length > 0) {
      setExpandedLogs(new Set([logs[0].id]));
    }
  }, [logs]);

  const toggleExpanded = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const filteredLogs = logs.filter(log => {
    if (searchValue && !log.comments?.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    if (filterByType !== "all" && log.entry_type !== filterByType) {
      return false;
    }
    if (favoritesOnly && !log.is_favorite) {
      return false;
    }
    if (publicOnly && !log.is_public) {
      return false;
    }
    return true;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    switch (sortBy) {
      case "date_recent":
        return new Date(b.log_date).getTime() - new Date(a.log_date).getTime();
      case "date_oldest":
        return new Date(a.log_date).getTime() - new Date(b.log_date).getTime();
      case "type":
        return a.entry_type.localeCompare(b.entry_type);
      default:
        return 0;
    }
  });

  const groupedLogs = groupLogsByDate(sortedLogs);

  const headerProps = {
    title: "Bitácora de Obra",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    customFilters: (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Ordenar por
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="date_recent">Fecha (Más recientes)</option>
            <option value="date_oldest">Fecha (Más antiguos)</option>
            <option value="type">Tipo de entrada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Filtrar por tipo
          </label>
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    ),
    onClearFilters: () => {
      setSearchValue("");
      setSortBy("date_recent");
      setFilterByType("all");
      setFavoritesOnly(false);
      setPublicOnly(false);
    },
    actions: (
      <Button onClick={() => setShowModal(true)} size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Nueva Entrada
      </Button>
    )
  };

  if (isLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-6">
          <div className="text-center text-muted-foreground">
            Error al cargar las entradas de bitácora
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="p-6 space-y-6">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              No hay entradas de bitácora para mostrar
            </div>
            <Button 
              onClick={() => setShowModal(true)} 
              className="mt-4"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Entrada
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dateLogs]) => (
                <div key={date} className="space-y-3">
                  {/* Date marker */}
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Logs for this date */}
                  <div className="ml-6 space-y-3">
                    {dateLogs.map((log) => (
                      <Card key={log.id} className="border shadow-sm">
                        {/* Collapsed view */}
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            {/* Left side info */}
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{format(new Date(log.created_at), "HH:mm")}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {log.created_by || "Usuario"}
                                </span>
                              </div>

                              <Badge variant="outline" className="text-xs">
                                {ENTRY_TYPE_LABELS[log.entry_type as keyof typeof ENTRY_TYPE_LABELS] || log.entry_type}
                              </Badge>

                              {log.weather && (
                                <div className="flex items-center space-x-1">
                                  <Cloud className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {WEATHER_LABELS[log.weather as keyof typeof WEATHER_LABELS] || log.weather}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right side actions */}
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(log.id)}
                              >
                                {expandedLogs.has(log.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setEditingLog(log);
                                    setShowModal(true);
                                  }}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* Expanded view */}
                          {expandedLogs.has(log.id) && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="grid grid-cols-3 gap-6">
                                {/* Comments column */}
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                    <h4 className="text-sm font-medium">Comentarios</h4>
                                  </div>
                                  <div className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                                    {log.comments || "Sin comentarios"}
                                  </div>
                                </div>

                                {/* Personnel column */}
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <h4 className="text-sm font-medium">Personal</h4>
                                  </div>
                                  <div className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                                    Sin personal registrado
                                  </div>
                                </div>

                                {/* Events column */}
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <h4 className="text-sm font-medium">Eventos</h4>
                                  </div>
                                  <div className="text-sm text-muted-foreground bg-muted rounded-md p-3">
                                    Sin eventos registrados
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewSiteLogModal 
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingLog(null);
          }}
          editingLog={editingLog}
        />
      )}
    </Layout>
  );
}