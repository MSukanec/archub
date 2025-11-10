import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MoreHorizontal,
  Star,
  Trash2,
  Edit
} from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getProjectInitials } from '@/utils/initials';
import { getProjectImageUrl, getProjectImageSrcSet } from '@/lib/storage/projectImages';

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
  onNavigateToBasicData: (project: any) => void;
  isActiveProject?: boolean;
}

export default function ModernProjectCard({ project, onEdit, onDelete, onSelect, onNavigateToBasicData, isActiveProject = false }: ModernProjectCardProps) {
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
      <Card className="w-full overflow-hidden hover:shadow-lg transition-all duration-200 cursor-default">
        {/* HERO SECTION - Imagen completa con avatar y acciones superpuestas */}
        <div className="relative h-48 w-full">
          {/* Background Image */}
          {project.project_data?.project_image_url ? (
            <img 
              src={project.project_data.project_image_url} 
              alt={project.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              key={project.project_data.project_image_url}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-6xl font-bold text-white/80 relative overflow-hidden"
            >
              {/* Degradado radial suave de fondo */}
              <div 
                className="absolute inset-0"
                style={{ 
                  background: `radial-gradient(ellipse at top right, ${project.color || '#8b5cf6'}40 0%, ${project.color || '#8b5cf6'}26 30%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.7) 100%)`
                }}
              />
              {/* Iniciales del proyecto sobre el degradado */}
              <span className="relative z-10">
                {getProjectInitials(project.name)}
              </span>
            </div>
          )}
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
          
          {/* Project Avatar - Top Left */}
          <div className="absolute top-4 left-4">
            <Avatar className="h-12 w-12 border border-black shadow-lg">
              <AvatarFallback 
                className="text-black font-bold text-lg"
                style={{ backgroundColor: project.color || '#ffffff' }}
              >
                {getProjectInitials(project.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Actions Menu - Top Right */}
          <div className="absolute top-4 right-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 p-0"
                >
                  <MoreHorizontal className="w-4 h-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edición rápida
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNavigateToBasicData(project); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edición completa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(project); }} className="text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* INFO SECTION - Información del proyecto */}
        <CardContent className="p-4 space-y-4">
          {/* Project Name and Active Button */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-lg leading-tight truncate flex-1 mr-3">
              {project.name}
            </h3>
            
            {isActiveProject ? (
              <Button 
                size="sm"
                className="text-xs font-medium px-3 py-1 h-7 text-white"
                style={{ backgroundColor: 'var(--accent)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Do nothing - just prevent card click
                }}
              >
                ACTIVO
              </Button>
            ) : (
              <Button 
                variant="ghost"
                size="sm"
                className="text-xs font-medium px-3 py-1 h-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(project);
                }}
              >
                Seleccionar activo
              </Button>
            )}
          </div>
          
          {/* Project Details and Member Avatars */}
          <div className="flex items-end justify-between">
            {/* Left side - Project details */}
            <div className="space-y-1 flex-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Tipología:</span> {project.project_data?.project_type?.name || 'Sin especificar'}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Modalidad:</span> {project.project_data?.modality?.name || 'Sin especificar'}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Estado:</span> {statusConfig.label}
              </p>
            </div>
            
            {/* Right side - Member avatars (only creator for now) */}
            <div className="flex items-center">
              {project.creator && (
                <Avatar className="w-8 h-8 border-2 border-background">
                  <AvatarImage src={project.creator.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {project.creator.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              {/* Placeholder for future members count */}
              <span className="text-xs text-muted-foreground ml-2">(1)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  );
}