import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BookOpen, Image, Video, Play, FileText, Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useMediaLightbox, MediaLightbox, type MediaItem } from '@/components/shared/viewers/ImageLightbox';
import type { ClientPortalSiteLog } from '../types';
interface SiteLogsFeedProps {
  logs: ClientPortalSiteLog[];
  isLoading?: boolean;
}
const WEATHER_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>, label: string }> = {
  sunny: { icon: Sun, label: 'Soleado'},
  partly_cloudy: { icon: Cloud, label: 'Parcialmente nublado'},
  cloudy: { icon: Cloud, label: 'Nublado'},
  rain: { icon: CloudRain, label: 'Lluvia'},
  storm: { icon: CloudRain, label: 'Tormenta'},
  snow: { icon: CloudSnow, label: 'Nieve'},
  fog: { icon: Cloud, label: 'Niebla'},
  windy: { icon: Wind, label: 'Ventoso'},
  hail: { icon: CloudRain, label: 'Granizo'},
};
function DateSeparator({ date }: { date: Date }) {
  const formattedDate = format(date, "EEEE d 'de'MMMM", { locale: es });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  return (
    <div className="relative flex items-center my-6">
      <div className="flex-shrink-0 pr-4">
        <span className="text-xs font-medium text-border/60">
          {capitalizedDate}
        </span>
      </div>
      <div className="flex-grow border-t border-border/40"></div>
    </div>
  );
}
interface PortalLogEntryCardProps {
  siteLog: ClientPortalSiteLog;
  mediaItems: MediaItem[];
  lightbox: ReturnType<typeof useMediaLightbox>;
}
function PortalLogEntryCard({ siteLog, mediaItems, lightbox }: PortalLogEntryCardProps) {
  const entryTypeName = siteLog.type_name || 'Registro General';
  const weatherConfig = siteLog.weather ? WEATHER_CONFIG[siteLog.weather] : null;
  const WeatherIcon = weatherConfig?.icon;
  
  const formattedTime = siteLog.created_at 
    ? format(new Date(siteLog.created_at), 'HH:mm')
    : '00:00';
  return (
    <div 
      className="group pl-12 py-3 border border-transparent hover:border-gray-300 dark:hover:border-gray-700 rounded-md transition-colors"
      data-testid={`portal-log-entry-${siteLog.id}`}
    >
      <div className="flex gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={siteLog.creator?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {siteLog.creator?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-bold text-sm">
              {siteLog.creator?.full_name || 'Usuario'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formattedTime}
            </span>
            <Badge 
              variant="secondary" 
              className="text-xs font-medium px-2 py-0.5 bg-[var(--accent)] text-white hover:bg-[var(--accent)]"
            >
              {entryTypeName}
            </Badge>
            {weatherConfig && WeatherIcon && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <WeatherIcon className="h-3.5 w-3.5" />
                {weatherConfig.label}
              </span>
            )}
          </div>
          {siteLog.comments && (
            <div className="mb-4">
              <p className="text-sm whitespace-pre-wrap">{siteLog.comments}</p>
            </div>
          )}
          {siteLog.files && siteLog.files.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {siteLog.files.map((file, index) => {
                  if (file.file_type === 'image') {
                    return (
                      <div key={file.id} className="relative group/image">
                        <img 
                          src={file.file_url} 
                          alt={file.file_name || 'Imagen'}
                          className="w-16 h-16 object-cover rounded border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                          onClick={() => {
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
                        <div className="w-16 h-16 items-center justify-center bg-gray-100 dark:bg-gray-800 rounded border-2 border-gray-200 dark:border-gray-700 hidden">
                          <Image className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                    );
                  } else if (file.file_type === 'video') {
                    return (
                      <div 
                        key={file.id} 
                        className="relative w-16 h-16 cursor-pointer group/video"
                        onClick={() => {
                          const mediaIndex = mediaItems.findIndex(m => m.src === file.file_url);
                          if (mediaIndex !== -1) {
                            lightbox.openLightbox(mediaIndex);
                          }
                        }}
                      >
                        <video 
                          src={file.file_url}
                          className="w-16 h-16 object-cover rounded border-2 border-gray-200 dark:border-gray-700 group-hover/video:border-gray-300 dark:group-hover/video:border-gray-600 transition-colors"
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
                      <div key={file.id} className="flex items-center gap-2 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
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
        </div>
      </div>
    </div>
  );
}
export function SiteLogsFeed({ logs, isLoading }: SiteLogsFeedProps) {
  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: ClientPortalSiteLog[] } = {};
    
    logs.forEach((log) => {
      const dateKey = format(parseISO(log.log_date + 'T00:00:00'), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });
    
    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return sortedKeys.map(key => ({
      date: parseISO(key + 'T00:00:00'),
      logs: groups[key]
    }));
  }, [logs]);
  const mediaItems = useMemo(() => {
    return logs.flatMap((log) => 
      log.files?.filter((file) => file.file_type === 'image'|| file.file_type === 'video')
        .map((file) => ({
          type: file.file_type as 'image'| 'video',
          src: file.file_url
        })) || []
    );
  }, [logs]);
  
  const lightbox = useMediaLightbox(mediaItems);
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-32 mb-2" />
                    <div className="h-3 bg-muted rounded w-48" />
                  </div>
                </div>
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay avances publicados aún</p>
            <p className="text-sm text-muted-foreground mt-1">
              Los avances de obra aparecerán aquí cuando la constructora los publique
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <>
      <div className="space-y-2" data-testid="portal-sitelog-timeline">
        {groupedLogs.map(({ date, logs: dayLogs }) => (
          <div key={format(date, 'yyyy-MM-dd')}>
            <DateSeparator date={date} />
            <div className="space-y-3">
              {dayLogs.map((siteLog) => (
                <PortalLogEntryCard
                  key={siteLog.id}
                  siteLog={siteLog}
                  mediaItems={mediaItems}
                  lightbox={lightbox}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <MediaLightbox 
        media={mediaItems}
        currentIndex={lightbox.currentIndex}
        isOpen={lightbox.isOpen}
        onClose={lightbox.closeLightbox}
      />
    </>
  );
}
