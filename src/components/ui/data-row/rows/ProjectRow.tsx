import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { formatDateCompact } from '@/lib/date-utils';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    project_image_url?: string | null;
    project_type_id?: string;
    modality_id?: string;
    project_type?: {
      id: string;
      name: string;
    };
    modality?: {
      id: string;
      name: string;
    };
  };
}

interface ProjectRowProps {
  project: Project;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
  isActive?: boolean; // Para marcar el proyecto activo
  actions?: Array<{
    label: string;
    icon?: any;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  'data-testid'?: string;
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
  isActive = false,
  actions,
  'data-testid': dataTestId
}: ProjectRowProps) {
  // Configurar las props base del DataRowCard
  const baseProps: Omit<DataRowCardProps, 'children'> = {
    onClick,
    selected,
    density,
    className,
    activeBorder: isActive,
    'data-testid': dataTestId,
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

          {/* COLUMNA DERECHA: Fecha de creación, Badge activo y Menú de acciones */}
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
              {/* Fecha de creación */}
              <p className={`
                text-muted-foreground
                ${density === 'compact' ? 'text-xs' : 'text-sm'}
              `}>
                {formatDateCompact(project.created_at)}
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

            {/* Botón de menú contextual */}
            {actions && actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    aria-label="Acciones"
                    data-testid="button-project-actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick();
                        }}
                        className={action.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                        data-testid={`menuitem-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {action.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </DataRowCard>
  );
}