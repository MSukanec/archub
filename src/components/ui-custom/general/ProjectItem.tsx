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
        relative overflow-hidden rounded-lg cursor-pointer
        transition-all duration-200 ease-in-out
        hover:shadow-lg hover:scale-[1.02]
        ${isActive ? 'ring-2 ring-[var(--accent)] ring-offset-2' : ''}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${className || ''}
      `}
      onClick={onClick}
      style={{ height: '200px' }} // 2.5x más alto que una row normal (~80px)
    >
      {/* Imagen de fondo del proyecto */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-gradient-to-br from-muted/20 to-muted/40"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          backgroundColor: imageUrl ? 'transparent' : 'var(--muted)'
        }}
      >
        {/* Overlay para mejorar legibilidad del texto */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Contenido superpuesto */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        {/* Header con avatar y badge de status */}
        <div className="flex items-start justify-between">
          {/* Avatar con iniciales del proyecto */}
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
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
            className={`${statusColorClass} shadow-sm border text-xs`}
          >
            {statusText}
          </Badge>
        </div>

        {/* Footer con nombre del proyecto */}
        <div className="space-y-2">
          <h3 className="text-white font-semibold text-lg leading-tight drop-shadow-sm">
            {project.name}
          </h3>
          
          {/* Información adicional si existe */}
          {project.project_data?.client_name && (
            <p className="text-white/80 text-sm truncate drop-shadow-sm">
              Cliente: {project.project_data.client_name}
            </p>
          )}
        </div>
      </div>

      {/* Indicador de proyecto activo */}
      {isActive && (
        <div 
          className="absolute top-2 left-2 w-3 h-3 rounded-full shadow-sm"
          style={{ backgroundColor: projectColor }}
        />
      )}
    </div>
  );
}