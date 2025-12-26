import { useState, useEffect } from "react";
import { Home, Search, Plus, Filter, Bell, FileText } from "lucide-react";
import { useLocation } from "wouter";

import { useGlobalModalStore } from "@/components/modal";
import { useMobile } from "@/hooks/use-mobile";
import SitelogRow from "@/features/sitelog/components/SitelogRow";
import { useActionBarMobile } from '@/layouts';
import { EmptyState } from "@/components/shared/EmptyState";
import { LogTimeline } from "@/features/sitelog/components/LogTimeline";
import { ENTRY_TYPE_OPTIONS } from '@/features/sitelog/constants';
import { Button } from "@/components/ui/button";
import { useSitelogFiltersStore } from "@/features/sitelog/stores/useSitelogFiltersStore";

interface SitelogEntriesProps {
  siteLogs: any[];
  toggleFavorite: (siteLogId: string) => void;
  handleViewSiteLog: (siteLog: any) => void;
  handleEditSiteLog: (siteLog: any) => void;
  handleDeleteSiteLog: (siteLog: any) => void;
}

export default function SitelogEntriesTab({ 
  siteLogs, 
  toggleFavorite,
  handleViewSiteLog,
  handleEditSiteLog,
  handleDeleteSiteLog 
}: SitelogEntriesProps) {
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("date_recent");
  const [filterByType, setFilterByType] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  
  const { openModal } = useGlobalModalStore();
  const isMobile = useMobile();
  const { setActions, setShowActionBar, clearActions, setFilterConfig, searchValue: mobileSearchValue } = useActionBarMobile();
  const [, navigate] = useLocation();

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        home: {
          id: 'home',
          icon: Home,
          label: 'Inicio',
          onClick: () => {
            navigate('/dashboard');
          },
        },
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {}
        },
        create: {
          id: 'create',
          icon: Plus,
          label: 'Nueva Bitácora',
          onClick: () => openModal('site-log'),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {}
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {}
        }
      });
      
      setFilterConfig({
        filters: [
          {
            key: 'type',
            label: 'Tipo de entrada',
            value: filterByType,
            onChange: setFilterByType,
            placeholder: 'Todos los tipos',
            allOptionLabel: 'Todos los tipos',
            options: ENTRY_TYPE_OPTIONS
          },
          {
            key: 'sort',
            label: 'Ordenar por',
            value: sortBy,
            onChange: setSortBy,
            placeholder: 'Seleccionar orden',
            options: [
              { value: 'date_recent', label: 'Fecha (más recientes)' },
              { value: 'date_old', label: 'Fecha (más antiguos)' },
              { value: 'type', label: 'Tipo de entrada' }
            ]
          }
        ],
        switches: [
          {
            key: 'favorites',
            label: 'Solo favoritos',
            checked: favoritesOnly,
            onChange: setFavoritesOnly
          },
          {
            key: 'public',
            label: 'Solo públicos',
            checked: publicOnly,
            onChange: setPublicOnly
          }
        ]
      });
      
      setShowActionBar(true);
    }
    
    return () => {
      if (isMobile) {
        clearActions();
        setShowActionBar(false);
      }
    };
  }, [isMobile, filterByType, sortBy, favoritesOnly, publicOnly]);

  // Sync mobile search with local search
  useEffect(() => {
    setSearchValue(mobileSearchValue);
  }, [mobileSearchValue]);

  // Get Zustand store filters
  const { getFilteredLogs } = useSitelogFiltersStore();

  // First apply Zustand store filters (from SitelogFiltersBar)
  const storeFilteredLogs = getFilteredLogs(siteLogs || []);

  // Then apply additional local filters (mobile action bar and sorting)
  const filteredSiteLogs = storeFilteredLogs.filter((log: any) => {
    // Solo filtrar por búsqueda si hay un valor de búsqueda
    if (searchValue && !log.comments?.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }
    
    if (filterByType !== "all" && log.entry_type !== filterByType) return false;
    if (favoritesOnly && !log.is_favorite) return false;
    if (publicOnly && !log.is_public) return false;
    
    return true;
  });

  // Ordenar bitácoras
  if (sortBy === "date_recent") {
    filteredSiteLogs.sort((a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
  } else if (sortBy === "date_old") {
    filteredSiteLogs.sort((a: any, b: any) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime());
  } else if (sortBy === "type") {
    filteredSiteLogs.sort((a: any, b: any) => a.entry_type.localeCompare(b.entry_type));
  }

  return (
    <>
      {filteredSiteLogs.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12 text-muted-foreground" />}
          title={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly ? "No se encontraron entradas" : "No hay entradas de bitácora"}
          description={searchValue || filterByType !== 'all' || favoritesOnly || publicOnly 
            ? 'Prueba ajustando los filtros de búsqueda' 
            : 'Comienza creando tu primera entrada de bitácora para documentar el progreso'
          }
          action={
            !searchValue && filterByType === 'all' && !favoritesOnly && !publicOnly ? (
              <Button
                onClick={() => openModal('site-log')}
                variant="default"
                className="gap-2"
                data-testid="button-create-sitelog-empty"
              >
                <Plus className="h-4 w-4" />
                Nueva Bitácora
              </Button>
            ) : undefined
          }
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredSiteLogs.map((siteLog: any) => (
            <SitelogRow
              key={siteLog.id}
              siteLog={siteLog}
              onClick={() => handleViewSiteLog(siteLog)}
              onEdit={handleEditSiteLog}
              onDelete={handleDeleteSiteLog}
              onToggleFavorite={toggleFavorite}
              enableSwipe={true}
              density="normal"
            />
          ))}
        </div>
      ) : (
        <LogTimeline 
          siteLogs={filteredSiteLogs}
          toggleFavorite={toggleFavorite}
          handleViewSiteLog={handleViewSiteLog}
          handleEditSiteLog={handleEditSiteLog}
          handleDeleteSiteLog={handleDeleteSiteLog}
        />
      )}
    </>
  );
}
