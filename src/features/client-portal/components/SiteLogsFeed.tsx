import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Cloud, Sun, CloudRain, CloudSnow, Wind, Image, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientPortalSiteLog } from '../types';

interface SiteLogsFeedProps {
  logs: ClientPortalSiteLog[];
  isLoading?: boolean;
}

const weatherIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  sunny: Sun,
  partly_cloudy: Cloud,
  cloudy: Cloud,
  rain: CloudRain,
  storm: CloudRain,
  snow: CloudSnow,
  fog: Cloud,
  windy: Wind,
  hail: CloudRain,
  none: Cloud,
};

const weatherLabels: Record<string, string> = {
  sunny: 'Soleado',
  partly_cloudy: 'Parcialmente nublado',
  cloudy: 'Nublado',
  rain: 'Lluvia',
  storm: 'Tormenta',
  snow: 'Nieve',
  fog: 'Niebla',
  windy: 'Ventoso',
  hail: 'Granizo',
};

export function SiteLogsFeed({ logs, isLoading }: SiteLogsFeedProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "EEEE d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-muted rounded w-32" />
                  <div className="h-5 bg-muted rounded w-20" />
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
    <div className="space-y-4" data-testid="sitelog-feed">
      {logs.map((log) => {
        const WeatherIcon = weatherIcons[log.weather || 'none'] || Cloud;
        const weatherLabel = weatherLabels[log.weather || ''] || log.weather;

        return (
          <Card key={log.id} data-testid={`sitelog-item-${log.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base font-medium capitalize">
                  {formatDate(log.log_date)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {log.weather && log.weather !== 'none' && (
                    <Badge variant="outline" className="gap-1">
                      <WeatherIcon className="h-3 w-3" />
                      <span className="capitalize">{weatherLabel}</span>
                    </Badge>
                  )}
                  {log.type_name && (
                    <Badge variant="secondary">{log.type_name}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {log.comments && (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {log.comments}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {log.files_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Image className="h-4 w-4" />
                    <span>{log.files_count} {log.files_count === 1 ? 'foto' : 'fotos'}</span>
                  </div>
                )}
                {log.creator_name && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{log.creator_name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
