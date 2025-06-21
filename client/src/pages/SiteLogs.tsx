// SiteLogs.tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Plus,
  Star,
  Globe,
  Lock,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

import { CustomPageLayout } from "@/components/ui-custom/CustomPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { CreateSiteLogModal } from "@/modals/CreateSiteLogModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SiteLogItem {
  id: string;
  log_date: string;
  entry_type: string;
  comments: string;
  weather?: string;
  is_public: boolean;
  is_favorite: boolean;
  created_by: string;
  project_id: string;
  created_at: string;
}

export default function SiteLogs() {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();
  const [openModal, setOpenModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [editingSiteLog, setEditingSiteLog] = useState<SiteLogItem | null>(
    null,
  );
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteLogToDelete, setSiteLogToDelete] = useState<SiteLogItem | null>(
    null,
  );

  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.preferences?.last_organization_id;
  const { data: organizationMembers = [] } =
    useOrganizationMembers(organizationId);

  const getCreator = (userId: string) => {
    const member = organizationMembers.find((m) => m.user_id === userId);
    const name = member?.users?.full_name || member?.users?.email || "Usuario";
    const initials = name?.charAt(0).toUpperCase();
    return { name, initials };
  };

  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filters = [
    { label: "Todas las entradas", value: "all" },
    { label: "Favoritas", value: "favorite" },
    { label: "Públicas", value: "public" },
    { label: "Avances", value: "avance" },
    { label: "Incidentes", value: "incidente" },
    { label: "Entregas", value: "entrega" },
    { label: "Notas", value: "nota" },
  ].map((f) => ({
    label: f.label,
    onClick: () => setActiveFilter(f.value),
  }));

  const {
    data: siteLogs = [],
    isLoading,
    error,
  } = useQuery<SiteLogItem[]>({
    queryKey: ["bitacora", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("site_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    if (siteLogs.length > 0) {
      setExpandedCard(siteLogs[0].id);
    }
  }, [siteLogs]);

  const filteredSiteLogs = siteLogs.filter((log) => {
    const matchesSearch =
      log.entry_type.toLowerCase().includes(searchValue.toLowerCase()) ||
      log.comments.toLowerCase().includes(searchValue.toLowerCase()) ||
      (log.weather &&
        log.weather.toLowerCase().includes(searchValue.toLowerCase()));
    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "favorite" && log.is_favorite) ||
      (activeFilter === "public" && log.is_public) ||
      log.entry_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const actions = (
    <Button variant="default" onClick={() => setOpenModal(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Nueva entrada
    </Button>
  );

  const handleClearFilters = () => setSearchValue("");

  const getEntryTypeBadge = (type: string) => {
    const data = {
      avance: { variant: "default", label: "Avance", icon: "✅" },
      incidente: { variant: "destructive", label: "Incidente", icon: "⚠️" },
      entrega: { variant: "secondary", label: "Entrega", icon: "📦" },
      nota: { variant: "outline", label: "Nota", icon: "📝" },
    } as const;
    const entry = data[type as keyof typeof data] || {
      variant: "outline",
      label: type,
      icon: "🗒️",
    };
    return (
      <Badge variant={entry.variant}>
        {entry.icon} {entry.label}
      </Badge>
    );
  };

  const handleEdit = (siteLog: SiteLogItem) => {
    setEditingSiteLog(siteLog);
    setOpenModal(true);
  };

  const handleDeleteClick = (siteLog: SiteLogItem) => {
    setSiteLogToDelete(siteLog);
    setDeleteDialogOpen(true);
  };

  const deleteSiteLogMutation = useMutation({
    mutationFn: async (siteLogId: string) => {
      const { error } = await supabase
        .from("site_logs")
        .delete()
        .eq("id", siteLogId);
      if (error) throw new Error(`Error al eliminar entrada: ${error.message}`);
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Entrada de bitácora eliminada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["bitacora", projectId] });
      setDeleteDialogOpen(false);
      setSiteLogToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la entrada",
        variant: "destructive",
      });
    },
  });

  const handleConfirmDelete = () => {
    if (siteLogToDelete) deleteSiteLogMutation.mutate(siteLogToDelete.id);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingSiteLog(null);
  };

  return (
    <>
      <CustomPageLayout
        icon={FileText}
        title="Bitácora de Obra"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        customFilters={customFilters}
        onClearFilters={handleClearFilters}
        showSearch={true}
      >
        {filteredSiteLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {siteLogs.length === 0
              ? "No hay entradas en la bitácora. Crea la primera entrada del proyecto."
              : "No se encontraron entradas que coincidan con tu búsqueda."}
          </div>
        ) : (
          <div className="space-y-4 px-4">
            {filteredSiteLogs.map((log) => {
              const isExpanded = expandedCard === log.id;
              const creator = getCreator(log.created_by);
              return (
                <Collapsible
                  key={log.id}
                  open={isExpanded}
                  onOpenChange={() =>
                    setExpandedCard(isExpanded ? null : log.id)
                  }
                >
                  <Card
                    className={`border border-muted shadow-sm ${log.is_favorite ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}`}
                  >
                    <CollapsibleTrigger asChild>
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest("[data-dropdown]")
                          ) {
                            e.preventDefault();
                            e.stopPropagation();
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                            {creator.initials}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {creator.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            •{" "}
                            {format(new Date(log.log_date), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </div>
                          <div>{getEntryTypeBadge(log.entry_type)}</div>
                          {log.is_favorite && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div data-dropdown>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(log)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(log)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 pt-2 border-t border-muted bg-gray-50 dark:bg-gray-800/50">
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              {log.is_public ? (
                                <>
                                  <Globe className="h-3 w-3 text-green-500" />
                                  <span className="text-green-600">
                                    Público
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-500">Privado</span>
                                </>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              Creado el{" "}
                              {format(new Date(log.created_at), "dd MMM yyyy", {
                                locale: es,
                              })}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Comentarios completos:
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {log.comments}
                            </p>
                          </div>
                          {log.weather && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">
                                Condiciones climáticas:
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {log.weather}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CustomPageLayout>

      <CreateSiteLogModal
        open={openModal}
        onClose={handleCloseModal}
        editingSiteLog={editingSiteLog}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrada de bitácora?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              esta entrada de la bitácora del proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSiteLogMutation.isPending}
            >
              {deleteSiteLogMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
