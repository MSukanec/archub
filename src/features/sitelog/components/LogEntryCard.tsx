import { Star, Edit, Trash2, Image, Video, Play, FileText } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMediaLightbox, type MediaItem } from "@/components/shared/viewers/ImageLightbox";
import { WEATHER_TYPES } from '../constants';
interface LogEntryCardProps {
  siteLog: any;
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  toggleFavorite: (siteLogId: string) => void;
  handleViewSiteLog: (siteLog: any) => void;
  handleEditSiteLog: (siteLog: any) => void;
  handleDeleteSiteLog: (siteLog: any) => void;
  mediaItems: MediaItem[];
  lightbox: ReturnType<typeof useMediaLightbox>;
}
export function LogEntryCard({
  siteLog,
  toggleFavorite,
  handleViewSiteLog,
  handleEditSiteLog,
  handleDeleteSiteLog,
  mediaItems,
  lightbox
}: LogEntryCardProps) {
  // Obtener configuración del tipo desde la relación site_log_type
  const entryTypeName = siteLog.site_log_type?.name || 'Registro General';
  const entryTypeConfig = { label: entryTypeName, icon: FileText, color: 'bg-teal-100 text-teal-800'};
  const weatherConfig = WEATHER_TYPES[siteLog.weather as keyof typeof WEATHER_TYPES];
  
  // Formatear hora del created_at
  const formattedTime = siteLog.created_at 
    ? format(new Date(siteLog.created_at), 'HH:mm')
    : '00:00';
  
  // Componentes de ícono dinámicos
  const WeatherIcon = weatherConfig?.icon;
  const TypeIcon = entryTypeConfig.icon;
  return (
    <div 
      className="group pl-12 py-3 border border-transparent hover:border-gray-300 rounded-md transition-colors cursor-pointer"
      onClick={() => handleViewSiteLog(siteLog)}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={siteLog.creator?.avatar_url} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {siteLog.creator?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name + Time */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm">
              {siteLog.creator?.full_name || 'Usuario desconocido'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formattedTime}
            </span>
            {/* Tipo de Entrada como Badge */}
            {entryTypeConfig && (
              <Badge 
                variant="secondary" 
                className="text-xs font-medium px-2 py-0.5 bg-[var(--accent)] text-white hover:bg-[var(--accent)]"
              >
                {entryTypeConfig.label}
              </Badge>
            )}
            {/* Clima con icono */}
            {weatherConfig && WeatherIcon && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <WeatherIcon className="h-3.5 w-3.5" />
                {weatherConfig.label}
              </span>
            )}
          </div>
          {/* Comentarios */}
          {siteLog.comments && (
            <div className="mb-4">
              <p className="text-sm">{siteLog.comments}</p>
            </div>
          )}
          {/* Archivos Adjuntos */}
          {siteLog.files && siteLog.files.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {siteLog.files.map((file: any, index: number) => {
                  if (file.file_type === 'image') {
                    return (
                      <div key={index} className="relative group/image">
                        <img 
                          src={file.file_url} 
                          alt={file.file_name}
                          className="w-16 h-16 object-cover rounded border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            const mediaIndex = mediaItems.findIndex(m => m.src === file.file_url);
                            if (mediaIndex !== -1) {
                              lightbox.openLightbox(mediaIndex);
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
                        <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded border-2 border-gray-200" style={{ display: 'none'}}>
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                    );
                  } else if (file.file_type === 'video') {
                    return (
                      <div 
                        key={index} 
                        className="relative w-16 h-16 cursor-pointer group/video"
                        onClick={(e) => {
                          e.stopPropagation();
                          const mediaIndex = mediaItems.findIndex(m => m.src === file.file_url);
                          if (mediaIndex !== -1) {
                            lightbox.openLightbox(mediaIndex);
                          }
                        }}
                      >
                        <video 
                          src={file.file_url}
                          className="w-16 h-16 object-cover rounded border-2 border-gray-200 group-hover/video:border-gray-300 transition-colors"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded group-hover/video:bg-black/40 transition-colors">
                          <div className="bg-white/90 rounded-full p-1.5">
                            <Play className="h-3 w-3 text-gray-900 fill-gray-900" />
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={index} className="flex items-center gap-2 px-2 py-1 rounded border border-gray-200">
                        <Video className="h-4 w-4 text-gray-500" />
                        <span className="text-xs text-muted-foreground">
                          {file.file_name && file.file_name.length > 15 ? 
                            file.file_name.substring(0, 15) + '...': 
                            file.file_name || 'Sin nombre'
                          }
                        </span>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
          {/* Asistencias */}
          {siteLog.attendees && siteLog.attendees.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Asistencias ({siteLog.attendees.length}):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {siteLog.attendees.map((attendee: any, index: number) => (
                  <Card key={index} className="p-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)'}}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: '#3b82f6'}}>
                        {attendee.contact ? 
                          `${attendee.contact.first_name || ''} ${attendee.contact.last_name || ''}`.trim() || 'Personal'
                          : 'Personal'
                        }
                      </span>
                      <span className="text-xs px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                        {attendee.attendance_type || 'Presente'}
                      </span>
                    </div>
                    {attendee.description && (
                      <p className="text-xs text-muted-foreground">{attendee.description}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Action Buttons - Show on hover */}
        <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(siteLog.id);
            }}
          >
            <Star className={`h-4 w-4 ${siteLog.is_favorite ? 'text-yellow-500 fill-yellow-500': 'text-muted-foreground'}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditSiteLog(siteLog);
            }}
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSiteLog(siteLog);
            }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
