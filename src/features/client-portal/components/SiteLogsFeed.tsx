import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientPortalSiteLog } from '../types';

interface SiteLogsFeedProps {
  logs: ClientPortalSiteLog[];
  isLoading?: boolean;
}

const weatherIcons: Record<string, React.ComponentType<any>> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  windy: Wind,
  none: Cloud,
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
                      <span className="capitalize">{log.weather}</span>
                    </Badge>
                  )}
                  {log.entry_type_name && (
                    <Badge variant="secondary">{log.entry_type_name}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {log.ai_summary && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm font-medium text-primary mb-1">Resumen</p>
                  <p className="text-sm text-muted-foreground">{log.ai_summary}</p>
                </div>
              )}

              {log.comments && (
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {log.comments}
                </p>
              )}

              {log.images && log.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {log.images.slice(0, 8).map((imageUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-muted"
                    >
                      <img
                        src={imageUrl}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                  {log.images.length > 8 && (
                    <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        +{log.images.length - 8} más
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
