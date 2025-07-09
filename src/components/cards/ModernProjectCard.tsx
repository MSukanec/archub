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
        className="w-full cursor-pointer hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 overflow-hidden group"
        onClick={() => onSelect(project)}
      >
        {/* Project Image/Thumbnail */}
        <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
          {project.thumbnail_url ? (
            <img 
              src={project.thumbnail_url} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-blue-200/50">
              {project.name?.charAt(0)?.toUpperCase() || 'P'}
            </div>
          )}
          
          {/* Status Badge - Top Right */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* More Options - Top Left for Desktop */}
          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
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

        <CardContent className="p-4">
          {/* Project Title */}
          <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
            {project.name}
          </h3>

          {/* Project Type Tags */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {project.project_data?.project_type?.name && (
              <Badge variant="outline" className="text-xs">
                {project.project_data.project_type.name}
              </Badge>
            )}
            {project.project_data?.modality?.name && (
              <Badge variant="outline" className="text-xs">
                {project.project_data.modality.name}
              </Badge>
            )}
          </div>

          {/* Project Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                ${project.estimated_budget ? 
                  new Intl.NumberFormat('es-AR').format(project.estimated_budget) : 
                  '0'
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>
                {project.start_date ? 
                  format(new Date(project.start_date), 'dd MMM yyyy', { locale: es }) : 
                  'Sin fecha'
                }
              </span>
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={project.creator?.avatar_url} />
              <AvatarFallback className="text-xs">
                {project.creator?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">
              {project.creator?.full_name || 'Usuario'}
            </span>
            <div className="ml-auto text-xs text-gray-400">
              {project.updated_at ? 
                `Actualizado ${format(new Date(project.updated_at), 'dd MMM', { locale: es })}` :
                format(new Date(project.created_at), 'dd MMM', { locale: es })
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  );
}