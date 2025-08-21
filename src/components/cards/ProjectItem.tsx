import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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
    <Card 
      className={`w-full hover:shadow-lg transition-all duration-200 ${
        isActiveProject 
          ? 'border-2 shadow-md cursor-default' 
          : 'border border-border cursor-pointer hover:bg-muted/50'
      }`}
      style={isActiveProject ? { borderColor: 'var(--accent)' } : {}}
      onClick={!isActiveProject ? () => onSelect(project) : undefined}
    >
      {/* INFO SECTION - Información del proyecto */}
      <CardContent className="p-4 space-y-3">
        {/* Row 1: Project Name and Buttons */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-lg leading-tight truncate flex-1 mr-3">
            {project.name}
          </h3>
          
          <div className="flex items-center gap-2">
            {/* Edit and Delete buttons */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Row 2: Inline Project Details and Member Avatars */}
        <div className="flex items-center justify-between">
          {/* Left side - Inline project details */}
          <div className="text-sm text-muted-foreground">
            {project.project_data?.project_type?.name || 'Sin especificar'} / {project.project_data?.modality?.name || 'Sin especificar'} / {statusConfig.label}
          </div>
          
          {/* Right side - Member avatars (only creator for now) */}
          <div className="flex items-center">
            {project.creator && (
              <Avatar className="w-7 h-7 border-2 border-background">
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