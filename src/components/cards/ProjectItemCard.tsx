import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Pencil } from 'lucide-react';
import chroma from 'chroma-js';

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

interface ProjectItemCardProps {
  project: Project;
  onClick?: () => void;
  onNavigateToProject?: () => void; // Nuevo: para el botón "Ir al Proyecto"
  onEdit?: () => void;
  selected?: boolean;
  className?: string;
  isActive?: boolean;
  projectColor?: string;
}

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

export default function ProjectItemCard({ 
  project, 
  onClick, 
  onNavigateToProject,
  onEdit,
  selected, 
  className,
  isActive = false,
  projectColor = 'var(--accent)'
}: ProjectItemCardProps) {
  const imageUrl = project.project_data?.project_image_url;
  const statusText = getStatusText(project.status);
  
  // Crear color suave para el badge de estado
  const getSoftAccentColor = () => {
    try {
      // Si el color es una variable CSS, usar un color por defecto
      if (projectColor.includes('var(')) {
        return 'rgba(139, 92, 246, 0.15)'; // violeta suave por defecto
      }
      return chroma(projectColor).alpha(0.15).css();
    } catch {
      return 'rgba(139, 92, 246, 0.15)';
    }
  };

  return (
    <div
      className={`
        group
        rounded-2xl shadow-sm cursor-pointer
        transition-all duration-500 ease-in-out
        hover:shadow-lg hover:-translate-y-1
        overflow-hidden
        relative
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${className || ''}
      `}
      style={{ 
        backgroundColor: 'var(--main-sidebar-bg)',
        height: '480px'
      }}
      onClick={onClick}
    >
      {/* Imagen de fondo - SIEMPRE 100% de altura */}
      <div className="absolute inset-0">
        {/* Imagen de fondo del proyecto */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundColor: imageUrl ? 'transparent' : 'var(--muted)'
          }}
        />
        
        {/* Overlay degradado - diferente según estado */}
        {!isActive ? (
          // Degradado intenso para inactivos - comienza más abajo
          <div 
            className="absolute inset-0" 
            style={{ 
              background: `linear-gradient(to top, var(--main-sidebar-bg) 0%, var(--main-sidebar-bg) 20%, rgba(var(--main-sidebar-bg-rgb, 31, 31, 31), 0.85) 35%, rgba(var(--main-sidebar-bg-rgb, 31, 31, 31), 0.5) 50%, rgba(var(--main-sidebar-bg-rgb, 31, 31, 31), 0.2) 70%, transparent 100%)`
            }}
          />
        ) : (
          // Degradado suave para activos - con color del proyecto más leve y que sube más
          <div 
            className="absolute inset-0" 
            style={{ 
              background: projectColor.includes('var(')
                ? `linear-gradient(to top, var(--accent) 0%, rgba(139, 92, 246, 0.3) 20%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 60%, transparent 100%)`
                : `linear-gradient(to top, ${chroma(projectColor).alpha(1).css()} 0%, ${chroma(projectColor).alpha(0.3).css()} 20%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 60%, transparent 100%)`
            }}
          />
        )}
      </div>

      {/* Contenido - SIEMPRE en el mismo lugar (parte inferior) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="space-y-4">
          {/* Nombre del proyecto + Badge activo (si aplica) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg leading-tight project-card-title">
                {project.name}
              </h3>
              {isActive && (
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: projectColor }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          {project.description && (
            <p className="text-gray-300 text-sm line-clamp-2">
              {project.description}
            </p>
          )}

          {/* 3 Badges inline: Tipo, Modalidad, Estado */}
          <div className="flex flex-wrap gap-2">
            {project.project_data?.project_type?.name && (
              <Badge className="bg-white/15 backdrop-blur-sm text-white border-0 text-xs">
                {project.project_data.project_type.name}
              </Badge>
            )}
            {project.project_data?.modality?.name && (
              <Badge className="bg-white/15 backdrop-blur-sm text-white border-0 text-xs">
                {project.project_data.modality.name}
              </Badge>
            )}
            <Badge 
              className="border-0 text-xs"
              style={{ 
                backgroundColor: getSoftAccentColor(),
                color: 'white'
              }}
            >
              {statusText}
            </Badge>
          </div>

          {/* Botones - abajo - SOLO EN HOVER */}
          <div className="flex justify-end gap-2">
            <Button 
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              data-testid="button-edit-project"
            >
              <Pencil />
              Editar
            </Button>
            <Button 
              size="sm"
              className="text-white border-0 text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: projectColor }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToProject?.();
              }}
              data-testid="button-navigate-project"
            >
              Ir al Proyecto
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
