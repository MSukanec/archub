import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, Video, Users, CalendarX } from 'lucide-react';
import { useFounderEvents, useRegisterEvent, useUnregisterEvent, type FounderEvent } from '../services';
import { useToast } from '@/hooks/use-toast';

function getEventTypeBadge(type: string) {
  const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    webinar: { label: 'Webinar', variant: 'default' },
    meetup: { label: 'Meetup', variant: 'secondary' },
    workshop: { label: 'Taller', variant: 'outline' },
    conference: { label: 'Conferencia', variant: 'default' },
    networking: { label: 'Networking', variant: 'secondary' },
  };
  
  return typeMap[type] || { label: type, variant: 'outline' as const };
}

function EventCard({ event }: { event: FounderEvent }) {
  const { toast } = useToast();
  const registerMutation = useRegisterEvent();
  const unregisterMutation = useUnregisterEvent();
  
  const eventDate = new Date(event.event_date);
  const isPast = eventDate < new Date();
  const registrationCount = event.registrations_count || 0;
  const typeBadge = getEventTypeBadge(event.event_type);

  const handleRegister = async () => {
    try {
      await registerMutation.mutateAsync(event.id);
      toast({
        title: 'Registrado',
        description: 'Te has registrado exitosamente al evento',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo completar el registro',
        variant: 'destructive',
      });
    }
  };

  const handleUnregister = async () => {
    try {
      await unregisterMutation.mutateAsync(event.id);
      toast({
        title: 'Registro cancelado',
        description: 'Has cancelado tu registro al evento',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo cancelar el registro',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card 
      className={`${isPast ? 'opacity-60' : ''}`}
      data-testid={`card-event-${event.id}`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                {isPast && <Badge variant="outline">Finalizado</Badge>}
              </div>
              <h3 className="font-medium text-[var(--text-default)] line-clamp-2">
                {event.title}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(eventDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.is_virtual && (
              <div className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                <span>Online</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{registrationCount} registrados</span>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-[var(--text-muted)] line-clamp-2">
              {event.description}
            </p>
          )}

          {!isPast && (
            <div className="flex justify-end pt-2">
              {event.is_registered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnregister}
                  disabled={unregisterMutation.isPending}
                  data-testid={`button-unregister-${event.id}`}
                >
                  {unregisterMutation.isPending ? 'Cancelando...' : 'Cancelar registro'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                  data-testid={`button-register-${event.id}`}
                >
                  {registerMutation.isPending ? 'Registrando...' : 'Registrarse'}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EventsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FounderEvents() {
  const { data: events, isLoading, error } = useFounderEvents();

  if (isLoading) {
    return <EventsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[var(--text-muted)]">
        Error al cargar los eventos
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarX className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
        <p className="text-[var(--text-muted)]">
          No hay eventos próximos
        </p>
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="space-y-6">
      {upcomingEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Próximos eventos
          </h3>
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {pastEvents.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Eventos pasados
          </h3>
          {pastEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
