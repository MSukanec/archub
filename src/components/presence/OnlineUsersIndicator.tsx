import { usePresenceStore } from '@/stores/presenceStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Mapea nombres técnicos de vistas a nombres legibles en español
 */
function formatViewName(view: string | null): string {
  if (!view) return 'Sin ubicación';
  
  const viewMap: Record<string, string> = {
    'home': 'Inicio',
    'organization_dashboard': 'Dashboard Organización',
    'organization_projects': 'Proyectos',
    'organization_preferences': 'Preferencias',
    'organization_activity': 'Actividad',
    'organization': 'Organización',
    'project_dashboard': 'Dashboard Proyecto',
    'project_data': 'Datos del Proyecto',
    'budgets': 'Presupuestos',
    'construction': 'Construcción',
    'contacts': 'Contactos',
    'movements': 'Movimientos',
    'capital': 'Capital',
    'general_costs': 'Gastos Generales',
    'analysis': 'Análisis',
    'learning_dashboard': 'Dashboard Capacitaciones',
    'learning_courses': 'Cursos',
    'learning': 'Capacitaciones',
    'admin_dashboard': 'Admin - Analytics',
    'admin_administration': 'Admin - Administración',
    'admin_support': 'Admin - Soporte',
    'admin_payments': 'Admin - Pagos',
    'admin_courses': 'Admin - Cursos',
    'admin_costs': 'Admin - Costos',
    'admin_tasks': 'Admin - Tareas',
    'admin_general': 'Admin - General',
    'admin_layout': 'Admin - Layout',
    'admin': 'Administración',
    'provider_products': 'Productos',
    'notifications': 'Notificaciones',
    'calendar': 'Calendario',
    'media': 'Archivos',
    'clients': 'Clientes',
    'profile': 'Perfil',
    'pricing': 'Planes',
  };
  
  return viewMap[view] || view.replace(/_/g, ' ');
}

/**
 * Componente que muestra usuarios online en tiempo real
 * Diseño compacto para header con popover desplegable
 */
export function OnlineUsersIndicator() {
  const { onlineUsers } = usePresenceStore();
  
  const onlineCount = onlineUsers.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
            "hover:bg-muted/50",
            "text-sm text-muted-foreground hover:text-foreground"
          )}
          data-testid="button-online-users"
        >
          <Users className="h-4 w-4" />
          <span className="font-medium">{onlineCount}</span>
          
          {/* Indicador de actividad (ping animation si hay usuarios) */}
          {onlineCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-4" 
        align="end"
        sideOffset={8}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-semibold text-sm">
              Usuarios Activos
            </h4>
            <Badge variant="secondary" className="ml-auto">
              {onlineCount}
            </Badge>
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {onlineCount === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay usuarios activos en este momento
              </p>
            ) : (
              onlineUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Indicador verde de online */}
                    <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5">
                      <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border border-background"></span>
                    </span>
                  </div>
                  
                  {/* Nombre y ubicación */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name || 'Usuario'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span className="truncate">
                        {formatViewName(user.current_view)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
