import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, User, Settings, UserPlus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrganizationHistoryViewProps {
  organization: any;
}

// Mock data para el historial - en una implementación real vendría de una API
const mockHistoryEvents = [
  {
    id: '1',
    type: 'created',
    title: 'Organización creada',
    description: 'La organización fue creada',
    timestamp: new Date().toISOString(),
    user: {
      name: 'Sistema',
      avatar: null
    },
    icon: Settings
  },
  {
    id: '2',
    type: 'member_joined',
    title: 'Nuevo miembro',
    description: 'Se unió un nuevo miembro a la organización',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
    user: {
      name: 'Juan Pérez',
      avatar: null
    },
    icon: UserPlus
  },
  {
    id: '3',
    type: 'settings_changed',
    title: 'Configuración modificada',
    description: 'Se actualizaron las preferencias de la organización',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 días atrás
    user: {
      name: 'María García',
      avatar: null
    },
    icon: Edit
  }
];

export function OrganizationHistoryView({ organization }: OrganizationHistoryViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Historial de la Organización</h2>
        <p className="text-muted-foreground">
          Registro de actividades y cambios en la organización
        </p>
      </div>

      {/* Timeline de eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockHistoryEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    {index < mockHistoryEvents.length - 1 && (
                      <div className="w-px h-6 bg-border mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{event.title}</h4>
                      <time className="text-sm text-muted-foreground">
                        {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {event.user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        por {event.user.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {mockHistoryEvents.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Sin actividad reciente</h3>
              <p className="text-muted-foreground">
                No hay eventos registrados para esta organización.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas de actividad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">3</div>
            <p className="text-sm text-muted-foreground">Eventos este mes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">1</div>
            <p className="text-sm text-muted-foreground">Nuevos miembros</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">2</div>
            <p className="text-sm text-muted-foreground">Cambios de configuración</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}