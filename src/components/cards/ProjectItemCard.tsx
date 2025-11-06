import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2 } from 'lucide-react';
import { getProjectInitials } from '@/utils/initials';
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
  onEdit,
  selected, 
  className,
  isActive = false,
  projectColor = 'var(--accent)'
}: ProjectItemCardProps) {
  const imageUrl = project.project_data?.project_image_url;
  const initials = getProjectInitials(project.name);
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
        rounded-2xl shadow-sm cursor-pointer
        transition-all duration-300 ease-in-out
        hover:shadow-lg hover:-translate-y-1
        overflow-hidden
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${className || ''}
      `}
      style={{ 
        backgroundColor: 'var(--main-sidebar-bg)',
        height: '480px'
      }}
      onClick={onClick}
    >
      {/* Imagen de fondo - altura total cuando está activo */}
      <div 
        className="relative transition-all duration-300"
        style={{ 
          height: isActive ? '100%' : '180px'
        }}
      >
        {/* Imagen de fondo del proyecto */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundColor: imageUrl ? 'transparent' : 'var(--muted)'
          }}
        />
        
        {/* Overlay base */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        
        {/* Overlay difuminado abajo cuando está activo */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--main-sidebar-bg)] via-[var(--main-sidebar-bg)]/80 to-transparent" 
            style={{ 
              background: `linear-gradient(to top, var(--main-sidebar-bg) 0%, var(--main-sidebar-bg) 15%, rgba(0,0,0,0.4) 50%, transparent 100%)`
            }}
          />
        )}

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* Header con avatar */}
          <div className="flex items-start justify-between">
            <Avatar className="h-11 w-11 shadow-md">
              <AvatarFallback 
                className="text-white font-semibold text-sm"
                style={{ backgroundColor: projectColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Contenido inferior - siempre visible cuando activo */}
          {isActive && (
            <div className="space-y-4">
              {/* Nombre del proyecto + Badge activo */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg leading-tight project-card-title">
                    {project.name}
                  </h3>
                  <Badge 
                    className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Activo
                  </Badge>
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

              {/* Botón "Ir al Proyecto" - abajo a la derecha */}
              <div className="flex justify-end">
                <Button 
                  size="sm"
                  className="text-white border-0 text-sm font-medium shadow-md"
                  style={{ backgroundColor: projectColor }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  Ir al Proyecto
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sección inferior - solo visible cuando NO está activo */}
      {!isActive && (
        <div className="p-4 space-y-3">
          {/* Nombre del proyecto */}
          <div>
            <h3 className="font-semibold text-base leading-tight project-card-title">
              {project.name}
            </h3>
          </div>

          {/* Descripción */}
          {project.description && (
            <p className="text-gray-400 text-xs line-clamp-2">
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

          {/* Botón "Ir al Proyecto" - abajo a la derecha */}
          <div className="flex justify-end pt-2">
            <Button 
              size="sm"
              className="text-white border-0 text-xs font-medium h-7 px-3"
              style={{ backgroundColor: projectColor }}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              Ir al Proyecto
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
