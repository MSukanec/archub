import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  };
}

interface ProjectItemProps {
  project: Project;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  isActive?: boolean;
  projectColor?: string; // Color del proyecto para el avatar
}

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

// Función helper para obtener color del badge por status
const getStatusColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    'active': 'bg-green-100 text-green-800 border-green-200',
    'completed': 'bg-blue-100 text-blue-800 border-blue-200',
    'paused': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'cancelled': 'bg-red-100 text-red-800 border-red-200',
    'planning': 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Función helper para obtener iniciales del proyecto
const getProjectInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export default function ProjectItem({ 
  project, 
  onClick, 
  selected, 
  className,
  isActive = false,
  projectColor = 'var(--accent)'
}: ProjectItemProps) {
  const imageUrl = project.project_data?.project_image_url;
  const initials = getProjectInitials(project.name);
  const statusText = getStatusText(project.status);
  const statusColorClass = getStatusColor(project.status);

  return (
    <div
      className={`
        bg-card rounded-xl shadow-sm border cursor-pointer
        transition-all duration-200 ease-in-out
        hover:shadow-md hover:-translate-y-1
        ${isActive ? 'ring-2 ring-[var(--accent)] ring-offset-2' : ''}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${className || ''}
      `}
      onClick={onClick}
    >
      {/* Sección superior: Imagen de fondo */}
      <div className="relative h-48 rounded-t-xl overflow-hidden">
        {/* Imagen de fondo del proyecto */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundColor: imageUrl ? 'transparent' : 'var(--muted)'
          }}
        />
        
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* Header con avatar y badge de status */}
          <div className="flex items-start justify-between">
            {/* Avatar con iniciales del proyecto */}
            <Avatar className="h-10 w-10 shadow-sm">
              <AvatarFallback 
                className="text-white font-semibold text-sm"
                style={{ backgroundColor: projectColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Badge de status */}
            <Badge 
              variant="secondary" 
              className="bg-white/90 text-gray-800 shadow-sm border-0 text-xs backdrop-blur-sm"
            >
              {statusText}
            </Badge>
          </div>

          {/* Indicador de proyecto activo */}
          {isActive && (
            <div className="self-start">
              <Badge 
                className="bg-[var(--accent)] text-white border-0 text-xs font-medium"
              >
                Activo
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Sección inferior: Datos del proyecto */}
      <div className="p-4 space-y-3">
        {/* Nombre del proyecto */}
        <div>
          <h3 className="font-semibold text-lg text-foreground leading-tight">
            {project.name}
          </h3>
          
          {/* Descripción si existe */}
          {project.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Información adicional */}
        {project.project_data?.client_name && (
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="font-medium">Cliente:</span>
            <span className="ml-1 truncate">{project.project_data.client_name}</span>
          </div>
        )}

        {/* Ubicación si existe */}
        {project.project_data?.city && (
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="font-medium">Ubicación:</span>
            <span className="ml-1 truncate">
              {project.project_data.city}
              {project.project_data.state && `, ${project.project_data.state}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}