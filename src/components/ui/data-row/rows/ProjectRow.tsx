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

// Helper para obtener el tipo de proyecto basado en el estado
const getProjectType = (project: Project): string => {
  if (project.description) {
    return project.description;
  }
  if (project.project_data?.client_name) {
    return project.project_data.client_name;
  }
  return project.status || 'Proyecto';
};

// Función helper para mapear status a texto legible
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'active': 'En proceso',
    'completed': 'Completado',
    'paused': 'Pausado',
    'cancelled': 'Cancelado',
    'planning': 'Planificación'
  };
  return statusMap[status] || status;
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
    className,
    activeBorder: isActive,
  };

  return (
    <DataRowCard {...baseProps}>
      {/* Contenido con dos columnas */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          {/* COLUMNA IZQUIERDA: Nombre y Tipo */}
          <div className="flex-1 min-w-0">
            {/* Nombre del proyecto */}
            <p className={`
              font-medium text-foreground truncate
              ${density === 'compact' ? 'text-sm' : 'text-sm'}
            `}>
              {project.name}
            </p>

            {/* Status del proyecto */}
            <p className={`
              text-muted-foreground truncate mt-1
              ${density === 'compact' ? 'text-xs' : 'text-sm'}
            `}>
              {getStatusText(project.status)}
            </p>
          </div>

          {/* COLUMNA DERECHA: Fecha de creación y Badge activo */}
          <div className="flex-shrink-0 text-right ml-4 flex flex-col items-end gap-1">
            {/* Fecha de creación */}
            <p className={`
              text-muted-foreground
              ${density === 'compact' ? 'text-xs' : 'text-sm'}
            `}>
              {format(new Date(project.created_at), 'dd/MM/yy', { locale: es })}
            </p>
            
            {/* Badge activo únicamente si es el proyecto activo */}
            {isActive && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white" 
                style={{ 
                  backgroundColor: 'hsl(76, 100%, 40%)',
                  color: 'white'
                }}
              >
                Activo
              </span>
            )}
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}