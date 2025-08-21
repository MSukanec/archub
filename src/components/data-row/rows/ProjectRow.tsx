import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para el proyecto (usando la estructura real de la app)
interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  created_by: string;
  organization_id: string;
  is_active: boolean;
  
  // Datos expandidos del proyecto
  project_data?: {
    client_name?: string;
    contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface ProjectRowProps {
  project: Project;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
  isActive?: boolean; // Para marcar el proyecto activo
}

// Helper para obtener las iniciales del proyecto
const getProjectInitials = (project: Project): string => {
  const words = project.name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
};

// Helper para obtener el color de estado
const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'activo':
    case 'active':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    case 'completado':
    case 'completed':
      return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
    case 'pausado':
    case 'paused':
      return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
    case 'cancelado':
    case 'cancelled':
      return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    default:
      return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20';
  }
};

export default function ProjectRow({ 
  project, 
  onClick, 
  selected, 
  density = 'normal',
  className,
  isActive = false
}: ProjectRowProps) {
  // Configurar las props base del DataRowCard
  const baseProps: Omit<DataRowCardProps, 'children'> = {
    onClick,
    selected,
    density,
    className: `${className} ${isActive ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`,
  };

  return (
    <DataRowCard {...baseProps}>
      {/* Avatar con iniciales */}
      <div className={`
        flex-shrink-0 flex items-center justify-center rounded-lg
        bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold
        ${density === 'compact' ? 'w-8 h-8 text-xs' : 
          density === 'comfortable' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-xs'}
      `}>
        {getProjectInitials(project)}
      </div>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          {/* Información principal */}
          <div className="flex-1 min-w-0">
            {/* Nombre del proyecto */}
            <div className="flex items-center gap-2">
              <p className={`
                font-medium text-foreground truncate
                ${density === 'compact' ? 'text-sm' : 'text-sm'}
              `}>
                {project.name}
                {isActive && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
              </p>
            </div>

            {/* Descripción/Cliente */}
            <div className="flex items-center gap-2 mt-1">
              <p className={`
                text-muted-foreground truncate
                ${density === 'compact' ? 'text-xs' : 'text-sm'}
              `}>
                {project.description || project.project_data?.client_name || 'Sin descripción'}
              </p>
              
              {/* Estado */}
              <span className={`
                inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                ${getStatusColor(project.status)}
              `}>
                {project.status || 'Sin estado'}
              </span>
            </div>

            {/* Información adicional (ubicación/fecha) */}
            {density !== 'compact' && (
              <div className="flex items-center gap-4 mt-1">
                {project.project_data?.city && (
                  <span className="text-xs text-muted-foreground">
                    📍 {project.project_data.city}
                    {project.project_data.state && `, ${project.project_data.state}`}
                  </span>
                )}
                
                <span className="text-xs text-muted-foreground">
                  Creado {format(new Date(project.created_at), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
            )}
          </div>

          {/* Información lateral */}
          <div className="flex-shrink-0 text-right ml-4">
            {/* Fecha de actualización o creación */}
            <p className={`
              text-muted-foreground
              ${density === 'compact' ? 'text-xs' : 'text-sm'}
            `}>
              {project.updated_at 
                ? format(new Date(project.updated_at), 'dd/MM/yy', { locale: es })
                : format(new Date(project.created_at), 'dd/MM/yy', { locale: es })
              }
            </p>
            
            {/* Estado activo/inactivo */}
            {density !== 'compact' && (
              <div className="mt-1">
                <span className={`
                  inline-flex items-center w-2 h-2 rounded-full
                  ${project.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                `} />
              </div>
            )}
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}