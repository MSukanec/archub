import DataRowCard from '../DataRowCard';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  showChevron?: boolean;
  enableSwipe?: boolean;
  isActive?: boolean; // Para marcar el proyecto activo
  'data-testid'?: string;
}

// Helper para obtener iniciales del proyecto
const getProjectInitials = (name: string): string => {
  if (!name) return "P";
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

// Función helper para mapear status a texto legible
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'active': 'En Proceso',
    'inactive': 'Inactivo',
    'completed': 'Completado',
    'paused': 'Pausado',
  };
  return statusMap[status] || status;
};

export default function ProjectRow({ 
  project, 
  onClick, 
  onEdit,
  onDelete,
  selected, 
  density = 'normal',
  showChevron = false,
  enableSwipe = true,
  isActive = false,
  'data-testid': dataTestId
}: ProjectRowProps) {
  // Get avatar from project image or use fallback
  const avatarUrl = project.project_data?.project_image_url || undefined;
  const avatarFallback = getProjectInitials(project.name);

  // Build metadata string (tipo, modalidad, estado)
  const metadata: string[] = [];
  
  if (project.project_data?.project_type?.name) {
    metadata.push(project.project_data.project_type.name);
  }
  
  if (project.project_data?.modality?.name) {
    metadata.push(project.project_data.modality.name);
  }
  
  metadata.push(getStatusText(project.status));

  // Contenido interno del card usando el nuevo sistema de 3 columnas
  const cardContent = (
    <>
      {/* Columna 2: Nombre (negrita) y metadata abajo */}
      <div className="flex-1 min-w-0">
        {/* Nombre del proyecto en negrita */}
        <div className="font-semibold text-sm truncate">
          {project.name}
        </div>

        {/* Metadata: Tipo, Modalidad, Estado */}
        {metadata.length > 0 && (
          <div className="text-muted-foreground text-xs truncate mt-0.5">
            {metadata.join(' • ')}
          </div>
        )}
      </div>

      {/* Columna 3: Badge de ACTIVO */}
      {isActive && (
        <div className="flex items-center">
          <Badge 
            variant="default"
            className="bg-[var(--accent)] text-white"
            data-testid="badge-active-project"
          >
            Activo
          </Badge>
        </div>
      )}
    </>
  );

  // Usar el nuevo DataRowCard con avatar (Columna 1)
  const projectCard = (
    <DataRowCard
      avatarUrl={avatarUrl}
      avatarFallback={avatarFallback}
      selected={selected}
      density={density}
      onClick={onClick ? () => onClick(project) : undefined}
      data-testid={dataTestId}
    >
      {cardContent}
    </DataRowCard>
  );

  // If swipe is enabled and we have edit/delete handlers, wrap in SwipeableCard
  if (enableSwipe && (onEdit || onDelete)) {
    const swipeActions = [];
    
    if (onEdit) {
      swipeActions.push({
        label: "Editar",
        icon: <Edit className="w-4 h-4" />,
        variant: "default" as const,
        onClick: () => onEdit(project),
      });
    }
    
    if (onDelete) {
      swipeActions.push({
        label: "Eliminar",
        icon: <Trash2 className="w-4 h-4" />,
        variant: "destructive" as const,
        onClick: () => onDelete(project),
      });
    }

    return (
      <SwipeableCard actions={swipeActions}>
        {projectCard}
      </SwipeableCard>
    );
  }

  return projectCard;
}
