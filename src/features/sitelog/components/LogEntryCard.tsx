import { Star, Edit, Trash2, Image, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useImageLightbox } from "@/components/ui-custom/media/ImageLightbox";
import { ENTRY_TYPES, WEATHER_TYPES } from '../constants';

interface LogEntryCardProps {
  siteLog: any;
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  toggleFavorite: (siteLogId: string) => void;
  handleDeleteSiteLog: (siteLog: any) => void;
  imageUrls: string[];
  lightbox: ReturnType<typeof useImageLightbox>;
}

export function LogEntryCard({
  siteLog,
  toggleFavorite,
  handleDeleteSiteLog,
  imageUrls,
  lightbox
}: LogEntryCardProps) {
  const { openModal } = useGlobalModalStore();
  const entryTypeConfig = ENTRY_TYPES[siteLog.entry_type as keyof typeof ENTRY_TYPES];
  const weatherConfig = WEATHER_TYPES[siteLog.weather as keyof typeof WEATHER_TYPES];

  return (
    <div className="group pl-12 py-3 hover:border hover:border-border rounded-md transition-all">
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
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-bold text-sm">
              {siteLog.creator?.full_name || 'Usuario desconocido'}
            </span>
            <span className="text-xs text-muted-foreground">
              21:00
            </span>
            {/* Tipo de Entrada */}
            <span className="text-xs font-medium text-muted-foreground">
              {entryTypeConfig?.label || 'Sin tipo'}
            </span>
            {/* Clima */}
            {weatherConfig && (
              <span className="text-xs text-muted-foreground">
                • {weatherConfig.label}
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
                  return file.file_type === 'image' ? (
                    <div key={index} className="relative group/image">
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
                })}
              </div>
            </div>
          )}

          {/* Eventos */}
          {siteLog.events && siteLog.events.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">
                Eventos ({siteLog.events.length}):
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {siteLog.events.map((event: any, index: number) => (
                  <Card key={index} className="p-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: '#22c55e' }}>
                        {event.event_type?.name || event.type || 'Evento'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{event.description || 'Sin descripción'}</p>
                  </Card>
                ))}
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
            <Star className={`h-4 w-4 ${siteLog.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openModal('site-log', { data: siteLog });
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
