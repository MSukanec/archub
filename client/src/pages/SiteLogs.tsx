import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, Star, Globe, Lock, ChevronDown, ChevronRight, Edit, Trash2, MoreHorizontal } from "lucide-react";

import { CustomPageLayout } from "@/components/ui-custom/CustomPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { useCurrentUser } from "@/hooks/use-current-user";
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
  const [searchValue, setSearchValue] = useState('');
  const [editingSiteLog, setEditingSiteLog] = useState<SiteLogItem | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [siteLogToDelete, setSiteLogToDelete] = useState<SiteLogItem | null>(null);

  const projectId = userData?.preferences?.last_project_id;

  const { data: siteLogs = [], isLoading, error } = useQuery<SiteLogItem[]>({
    queryKey: ['bitacora', projectId],
    queryFn: async () => {
      if (!projectId) return []
      
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('site_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('log_date', { ascending: false })

      if (error) {
        console.error('Error fetching site logs:', error)
        throw error
      }

      return data || []
    },
    enabled: !!projectId
  })

  const filteredSiteLogs = siteLogs.filter(log => 
    log.entry_type.toLowerCase().includes(searchValue.toLowerCase()) ||
    log.comments.toLowerCase().includes(searchValue.toLowerCase()) ||
    (log.weather && log.weather.toLowerCase().includes(searchValue.toLowerCase()))
  )

  const filters = [
    { label: 'Todas las entradas', onClick: () => {} },
    { label: 'Favoritas', onClick: () => {} },
    { label: 'Públicas', onClick: () => {} },
    { label: 'Avances', onClick: () => {} },
    { label: 'Incidentes', onClick: () => {} }
  ]

  const actions = (
    <Button variant="default" onClick={() => setOpenModal(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Nueva entrada
    </Button>
  )

  const handleClearFilters = () => {
    setSearchValue('')
  }

  const getEntryTypeBadge = (type: string) => {
    const variants = {
      'avance': 'default',
      'incidente': 'destructive',
      'entrega': 'secondary',
      'nota': 'outline'
    } as const

    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'dd MMM yyyy', { locale: es })
  }

  const toggleCardExpansion = (logId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedCards(newExpanded)
  }

  const handleEdit = (siteLog: SiteLogItem) => {
    setEditingSiteLog(siteLog)
    setOpenModal(true)
  }

  const handleDeleteClick = (siteLog: SiteLogItem) => {
    setSiteLogToDelete(siteLog)
    setDeleteDialogOpen(true)
  }

  const deleteSiteLogMutation = useMutation({
    mutationFn: async (siteLogId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('site_logs')
        .delete()
        .eq('id', siteLogId)

      if (error) {
        throw new Error(`Error al eliminar entrada: ${error.message}`)
      }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Entrada de bitácora eliminada correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['bitacora', projectId] })
      setDeleteDialogOpen(false)
      setSiteLogToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la entrada",
        variant: "destructive"
      })
    }
  })

  const handleConfirmDelete = () => {
    if (siteLogToDelete) {
      deleteSiteLogMutation.mutate(siteLogToDelete.id)
    }
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setEditingSiteLog(null)
  }

  if (isLoading) {
    return (
      <CustomPageLayout
        icon={FileText}
        title="Bitácora de Obra"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
        showSearch={true}
      >
        <div className="p-8 text-center text-muted-foreground">
          Cargando bitácora...
        </div>
      </CustomPageLayout>
    )
  }

  if (error) {
    return (
      <CustomPageLayout
        icon={FileText}
        title="Bitácora de Obra"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
        showSearch={true}
      >
        <div className="p-8 text-center text-muted-foreground">
          Error al cargar la bitácora: {(error as Error).message}
        </div>
      </CustomPageLayout>
    )
  }

  return (
    <>
      <CustomPageLayout
        icon={FileText}
        title="Bitácora de Obra"
        actions={actions}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        onClearFilters={handleClearFilters}
        showSearch={true}
      >
        {filteredSiteLogs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {siteLogs.length === 0 
              ? "No hay entradas en la bitácora. Crea la primera entrada del proyecto."
              : "No se encontraron entradas que coincidan con tu búsqueda."
            }
          </div>
        ) : (
          <div className="space-y-0">
            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-[var(--card-border)]">
              <div className="col-span-2">Fecha</div>
              <div className="col-span-2">Creador</div>
              <div className="col-span-2">Tipo de Entrada</div>
              <div className="col-span-2">Clima</div>
              <div className="col-span-3">Comentarios</div>
              <div className="col-span-1">Acciones</div>
            </div>

            {/* Site Log Cards */}
            {filteredSiteLogs.map((log) => {
              const isExpanded = expandedCards.has(log.id)
              
              return (
                <Collapsible key={log.id} open={isExpanded} onOpenChange={() => toggleCardExpansion(log.id)}>
                  <Card 
                    className={`rounded-none border-x-0 border-t-0 border-b border-[var(--card-border)] ${
                      log.is_favorite ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                    }`}
                  >
                    <CollapsibleTrigger asChild>
                      <div 
                        className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-[var(--card-bg)] transition-colors cursor-pointer"
                        onClick={(e) => {
                          // Don't expand if clicking on actions dropdown
                          if ((e.target as HTMLElement).closest('[data-dropdown]')) {
                            e.preventDefault()
                            e.stopPropagation()
                          }
                        }}
                      >
                        <div className="col-span-2 text-muted-foreground flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                          {formatDate(log.log_date)}
                        </div>
                        <div className="col-span-2 text-muted-foreground text-xs">
                          {/* TODO: Show creator name when we have user lookup */}
                          Usuario
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            {getEntryTypeBadge(log.entry_type)}
                            {log.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                          </div>
                        </div>
                        <div className="col-span-2 text-muted-foreground text-xs">
                          {log.weather || '-'}
                        </div>
                        <div className="col-span-3 text-muted-foreground truncate">
                          {log.comments}
                        </div>
                        <div className="col-span-1" data-dropdown>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                      <div className="px-4 pb-4 pt-2 border-t border-[var(--card-border)] bg-gray-50 dark:bg-gray-800/50">
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              {log.is_public ? (
                                <>
                                  <Globe className="h-3 w-3 text-green-500" />
                                  <span className="text-green-600">Público</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-500">Privado</span>
                                </>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              Creado el {formatDate(log.created_at)}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Comentarios completos:</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {log.comments}
                            </p>
                          </div>

                          {log.weather && (
                            <div>
                              <h4 className="text-sm font-medium mb-1">Condiciones climáticas:</h4>
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
              )
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
              Esta acción no se puede deshacer. Se eliminará permanentemente esta entrada de la bitácora del proyecto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSiteLogMutation.isPending}
            >
              {deleteSiteLogMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}