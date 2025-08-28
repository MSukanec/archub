import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Star, ChevronDown, ChevronRight, Edit, Trash2, Image, Video, Home, Search, Plus, Filter, Bell, FileText } from "lucide-react";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { ImageLightbox, useImageLightbox } from "@/components/ui-custom/ImageLightbox";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useMobile } from "@/hooks/use-mobile";
import { LogRow } from "@/components/data-row/rows";
import { useActionBarMobile } from "@/components/layout/mobile/ActionBarMobileContext";
import { EmptyState } from "@/components/ui-custom/security/EmptyState";

// Entry types enum with their icons and labels
const entryTypes = {
  avance_de_obra: { icon: Star, label: "Avance de obra", color: "bg-green-100 text-green-800" },
  visita_tecnica: { icon: Star, label: "Visita técnica", color: "bg-blue-100 text-blue-800" },
  problema_detectado: { icon: Star, label: "Problema detectado", color: "bg-red-100 text-red-800" },
  pedido_material: { icon: Star, label: "Pedido material", color: "bg-orange-100 text-orange-800" },
  nota_climatica: { icon: Star, label: "Nota climática", color: "bg-yellow-100 text-yellow-800" },
  decision: { icon: Star, label: "Decisión", color: "bg-purple-100 text-purple-800" },
  inspeccion: { icon: Star, label: "Inspección", color: "bg-indigo-100 text-indigo-800" },
  foto_diaria: { icon: Star, label: "Foto diaria", color: "bg-gray-100 text-gray-800" },
  registro_general: { icon: Star, label: "Registro general", color: "bg-teal-100 text-teal-800" }
};

const weatherTypes = {
  sunny: { icon: Star, label: "Soleado" },
  partly_cloudy: { icon: Star, label: "Parcialmente nublado" },
  cloudy: { icon: Star, label: "Nublado" },
  rain: { icon: Star, label: "Lluvia" },
  storm: { icon: Star, label: "Tormenta" },
  snow: { icon: Star, label: "Nieve" },
  fog: { icon: Star, label: "Niebla" },
  windy: { icon: Star, label: "Ventoso" },
  hail: { icon: Star, label: "Granizo" }
};

// Entry type options for filters
const entryTypeOptions = [
  { value: "avance_de_obra", label: "Avance de obra" },
  { value: "visita_tecnica", label: "Visita técnica" },
  { value: "problema_detectado", label: "Problema detectado" },
  { value: "pedido_material", label: "Pedido material" },
  { value: "nota_climatica", label: "Nota climática" },
  { value: "decision", label: "Decisión" },
  { value: "inspeccion", label: "Inspección" },
  { value: "foto_diaria", label: "Foto diaria" },
  { value: "registro_general", label: "Registro general" }
];

interface LogEntriesProps {
  siteLogs: any[];
  toggleFavorite: (siteLogId: string) => void;
  handleEditSiteLog: (siteLog: any) => void;
  handleDeleteSiteLog: (siteLog: any) => void;
}

export default function LogEntries({ 
  siteLogs, 
  toggleFavorite, 
  handleEditSiteLog, 
  handleDeleteSiteLog 
}: LogEntriesProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [sortBy, setSortBy] = useState("date_recent");
  const [filterByType, setFilterByType] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [publicOnly, setPublicOnly] = useState(false);
  
  const { openModal } = useGlobalModalStore();
  const isMobile = useMobile();
  const { setActions, setShowActionBar, clearActions, setFilterConfig, searchValue: mobileSearchValue, setSearchValue: setMobileSearchValue } = useActionBarMobile();
  const [, navigate] = useLocation();

  // Función para abrir modal de vista (no edición)
  const handleViewSiteLog = (siteLog: any) => {
    openModal('site-log-view', { viewingSiteLog: siteLog });
  };

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        home: {
          id: 'home',
          icon: <Home className="h-6 w-6 text-gray-600 dark:text-gray-400" />,
          label: 'Inicio',
          onClick: () => {
            navigate('/dashboard');
          },
        },
        search: {
          id: 'search',
          icon: <Search className="h-5 w-5" />,
          label: 'Buscar',
          onClick: () => {}
        },
        create: {
          id: 'create',
          icon: <Plus className="h-6 w-6" />,
          label: 'Nueva Bitácora',
          onClick: () => openModal('site-log'),
          variant: 'primary'
        },
        filter: {
          id: 'filter',
          icon: <Filter className="h-5 w-5" />,
          label: 'Filtros',
          onClick: () => {}
        },
        notifications: {
          id: 'notifications',
          icon: <Bell className="h-5 w-5" />,
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
            options: entryTypeOptions
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

  // Filtrar bitácoras según los criterios
  const filteredSiteLogs = siteLogs?.filter((log: any) => {
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

  // Auto-expand the most recent entry when data loads
  useEffect(() => {
    if (filteredSiteLogs && filteredSiteLogs.length > 0 && !expandedLogId) {
      setExpandedLogId(filteredSiteLogs[0].id);
    }
  }, [filteredSiteLogs, expandedLogId]);

  // Initialize lightbox with all images from filtered logs
  const imageUrls = filteredSiteLogs.flatMap((log: any) => 
    log.files?.filter((file: any) => file.file_type === 'image').map((file: any) => file.file_url) || []
  );
  const lightbox = useImageLightbox(imageUrls);

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
        />
      ) : (
        <div className="space-y-3">
          {filteredSiteLogs.map((siteLog: any) => {
          const entryTypeConfig = entryTypes[siteLog.entry_type as keyof typeof entryTypes];
          const weatherConfig = weatherTypes[siteLog.weather as keyof typeof weatherTypes];
          const isExpanded = expandedLogId === siteLog.id;

          // Render mobile row or desktop collapsible
          if (isMobile) {
            return (
              <LogRow
                key={siteLog.id}
                siteLog={siteLog}
                onClick={() => handleViewSiteLog(siteLog)}
                onEdit={handleEditSiteLog}
                onDelete={handleDeleteSiteLog}
                onToggleFavorite={toggleFavorite}
                enableSwipe={true}
                density="normal"
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
                      size="sm"
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
                      size="sm"
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
                      size="sm"
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

      {/* Image Lightbox */}
      <ImageLightbox
        images={imageUrls}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.closeLightbox}
      />
    </>
  );
}