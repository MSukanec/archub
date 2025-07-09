import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  DollarSign,
  Calendar,
  MoreHorizontal,
  Star,
  Trash2,
  Edit
} from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Project status configurations
const projectStatuses = {
  planning: { label: 'Planificación', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
  active: { label: 'Activo', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  on_hold: { label: 'En Pausa', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
  completed: { label: 'Completado', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
};

interface ModernProjectCardProps {
  project: any;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
  onSelect: (project: any) => void;
}

export default function ModernProjectCard({ project, onEdit, onDelete, onSelect }: ModernProjectCardProps) {
  const statusConfig = projectStatuses[project.status as keyof typeof projectStatuses] || projectStatuses.planning;
  


  return (
    <SwipeableCard
      actions={[
        {
          label: "Favorito",
          icon: <Star className="w-4 h-4" />,
          onClick: () => {
            console.log('Toggle favorite for project:', project.id);
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
        className="w-full cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 overflow-hidden"
        onClick={() => onSelect(project)}
      >
        {/* Creator Info - Top */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={project.creator?.avatar_url || ''} />
              <AvatarFallback className="text-xs bg-gray-100">
                {project.creator?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">{project.creator?.full_name || project.creator?.first_name || 'Usuario'}</p>
              <p className="text-xs text-gray-500">
                {project.created_at ? format(new Date(project.created_at), 'dd MMM, yyyy', { locale: es }) : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Active Project Badge - Only show for selected project */}
            {project.is_active && (
              <span className="text-xs font-medium px-2 py-1 rounded-full text-white" style={{backgroundColor: 'var(--accent)'}}>
                ACTIVO
              </span>
            )}
            
            {/* More Options - Desktop */}
            <div className="md:block hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(project)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Project Image/Thumbnail */}
        <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden mx-4 rounded-lg">
          {project.thumbnail_url ? (
            <img 
              src={project.thumbnail_url} 
              alt={project.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-blue-200/50 rounded-lg">
              {project.name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
          )}
        </div>

        {/* Project Info - Bottom */}
        <div className="p-4 pt-3 space-y-2">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {project.name}
          </h3>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Tipología:</span> {project.project_data?.project_type?.name || 'Sin especificar'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Modalidad:</span> {project.project_data?.modality?.name || 'Sin especificar'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Estado:</span> {statusConfig.label}
            </p>
          </div>
        </div>
      </Card>
    </SwipeableCard>
  );
}