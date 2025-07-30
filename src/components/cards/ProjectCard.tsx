import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Star,
  Trash2,
  Edit
} from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';

// Project status configurations
const projectStatuses = {
  planning: { label: 'Planificación', variant: 'secondary' as const },
  active: { label: 'Activo', variant: 'default' as const },
  on_hold: { label: 'En Pausa', variant: 'outline' as const },
  completed: { label: 'Completado', variant: 'default' as const },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const }
};

interface ProjectCardProps {
  project: any;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
  onSelect: (project: any) => void;
}

export default function ProjectCard({ project, onEdit, onDelete, onSelect }: ProjectCardProps) {
  const statusConfig = projectStatuses[project.status as keyof typeof projectStatuses] || projectStatuses.planning;

  return (
    <SwipeableCard
      actions={[
        {
          label: "Favorito",
          icon: <Star className="w-4 h-4" />,
          onClick: () => {
            // TODO: Implement favorite functionality
          }
        },
        {
          label: "Editar",
          icon: <Edit className="w-4 h-4" />,
          onClick: () => onEdit(project)
        },
        {
          label: "Eliminar",
          icon: <Trash2 className="w-4 h-4" />,
          variant: "destructive" as const,
          onClick: () => onDelete(project)
        }
      ]}
    >
      <Card 
        className="w-full cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() => onSelect(project)}
      >
        <CardContent className="p-3">

        {/* Row 2: Project name and status (inline) */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h3 className="font-medium text-sm text-foreground truncate">
              {project.name}
            </h3>
          </div>
          <Badge variant={statusConfig.variant} className="text-xs ml-2 flex-shrink-0">
            {statusConfig.label}
          </Badge>
        </div>

        {/* Row 3: Location and dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate max-w-[120px]">
              {project.location || 'Sin ubicación'}
            </span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Calendar className="h-3 w-3" />
            <span>
              {project.start_date 
                ? format(new Date(project.start_date), 'dd/MM/yy', { locale: es })
                : 'Sin fecha'
              }
            </span>
          </div>
        </div>

        {/* Row 4: Creator info and budget */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage 
                src={project.creator?.avatar_url} 
                alt={project.creator?.full_name} 
              />
              <AvatarFallback className="text-xs bg-gray-100">
                {project.creator?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 truncate max-w-[100px]">
              {project.creator?.full_name || 'Sin creador'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <DollarSign className="h-3 w-3" />
            <span>
              {project.budget 
                ? new Intl.NumberFormat('es-AR', { 
                    style: 'currency', 
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(project.budget)
                : 'Sin presupuesto'
              }
            </span>
          </div>
        </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  );
}