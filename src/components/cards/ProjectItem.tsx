import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Project status configurations
const projectStatuses = {
  planning: { label: 'Planificación', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
  active: { label: 'Activo', variant: 'default' as const, color: 'bg-green-100 text-green-800' },
  on_hold: { label: 'En Pausa', variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
  completed: { label: 'Completado', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
};

interface ProjectItemProps {
  project: any;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
  onSelect: (project: any) => void;
  onNavigateToBasicData: (project: any) => void;
  isActiveProject?: boolean;
}

export default function ProjectItem({ project, onEdit, onDelete, onSelect, onNavigateToBasicData, isActiveProject = false }: ProjectItemProps) {
  const statusConfig = projectStatuses[project.status as keyof typeof projectStatuses] || projectStatuses.planning;

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 cursor-default">
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
  );
}