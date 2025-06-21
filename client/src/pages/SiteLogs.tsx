import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Plus, Star, Globe, Lock } from "lucide-react";

import { CustomPageLayout } from "@/components/ui-custom/CustomPageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useCurrentUser } from "@/hooks/use-current-user";
import { CreateSiteLogModal } from "@/modals/CreateSiteLogModal";
import { supabase } from "@/lib/supabase";

interface SiteLogItem {
  id: string;
  log_date: string;
  title: string;
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
  const { data: userData } = useCurrentUser();
  const [openModal, setOpenModal] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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
    log.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    log.comments.toLowerCase().includes(searchValue.toLowerCase())
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
              <div className="col-span-1">Fecha</div>
              <div className="col-span-3">Título</div>
              <div className="col-span-1">Tipo</div>
              <div className="col-span-4">Comentarios</div>
              <div className="col-span-1">Clima</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-1">Acciones</div>
            </div>

            {/* Site Log Rows */}
            {filteredSiteLogs.map((log) => (
              <div
                key={log.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3 text-sm border-b border-[var(--card-border)] hover:bg-[var(--card-bg)] transition-colors ${
                  log.is_favorite ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                }`}
              >
                <div className="col-span-1 text-muted-foreground">
                  {formatDate(log.log_date)}
                </div>
                <div className="col-span-3 font-medium">
                  <div className="flex items-center gap-2">
                    {log.is_favorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                    <span className="truncate">{log.title}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  {getEntryTypeBadge(log.entry_type)}
                </div>
                <div className="col-span-4 text-muted-foreground truncate">
                  {log.comments}
                </div>
                <div className="col-span-1 text-muted-foreground text-xs">
                  {log.weather || '-'}
                </div>
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    {log.is_public ? (
                      <Globe className="h-3 w-3 text-green-500" title="Público" />
                    ) : (
                      <Lock className="h-3 w-3 text-gray-400" title="Privado" />
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  {/* Future: Add edit/delete actions */}
                  <div className="text-xs text-muted-foreground">
                    {formatDate(log.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomPageLayout>

      <CreateSiteLogModal
        open={openModal}
        onClose={() => setOpenModal(false)}
      />
    </>
  )
}