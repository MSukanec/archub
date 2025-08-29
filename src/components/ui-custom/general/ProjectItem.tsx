import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit } from 'lucide-react';

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

interface ProjectItemProps {
  project: Project;
  onClick?: () => void;
  onEdit?: () => void;
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
  onEdit,
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
        bg-white dark:bg-card rounded-2xl shadow-sm border cursor-pointer
        transition-all duration-200 ease-in-out
        hover:shadow-md hover:-translate-y-1
        ${isActive ? 'ring-2 ring-[var(--accent)] ring-offset-2' : ''}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${className || ''}
      `}
      onClick={onClick}
    >
      {/* Sección superior: Imagen de fondo */}
      <div className="relative h-48 rounded-t-2xl overflow-hidden m-3 mb-0">
        {/* Imagen de fondo del proyecto */}
        <div 
          className="absolute inset-0 bg-cover bg-center rounded-2xl"
          style={{
            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
            backgroundColor: imageUrl ? 'transparent' : 'var(--muted)'
          }}
        />
        
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 rounded-2xl" />

        {/* Contenido sobre la imagen */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* Header con avatar y botón editar */}
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

            {/* Botón Editar */}
            <Button 
              variant="ghost" 
              size="icon-sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          {/* Botón "Ir al Proyecto" */}
          <div className="self-start">
            <Button 
              variant="ghost" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 text-sm font-medium backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              Ir al Proyecto
            </Button>
          </div>
        </div>
      </div>

      {/* Sección inferior: Datos del proyecto */}
      <div className="p-4 space-y-3 min-h-[140px]">
        {/* Nombre del proyecto */}
        <div>
          <h3 className="font-semibold text-base text-foreground leading-tight">
            {project.name}
          </h3>
          
          {/* Badges de tipo y modalidad */}
          <div className="flex gap-2 mt-2">
            {project.project_data?.project_type?.name && (
              <Badge 
                className="bg-[var(--accent)] text-white border-0 text-xs"
              >
                {project.project_data.project_type.name}
              </Badge>
            )}
            {project.project_data?.modality?.name && (
              <Badge 
                className="bg-[var(--accent)] text-white border-0 text-xs"
              >
                {project.project_data.modality.name}
              </Badge>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <p className="text-muted-foreground text-xs line-clamp-2">
            {project.description || "Sin descripción"}
          </p>
        </div>

        {/* Badge de status abajo */}
        <div className="flex justify-between items-center">
          <Badge 
            className={`text-xs ${
              project.status === 'completed' 
                ? 'bg-[var(--accent)] text-white border-0' 
                : project.status === 'active'
                ? 'bg-transparent text-[var(--accent)] border border-[var(--accent)]'
                : statusColorClass
            }`}
          >
            {statusText}
          </Badge>
          
          {/* Información adicional compacta */}
          {project.project_data?.client_name && (
            <span className="text-xs text-muted-foreground truncate ml-2">
              {project.project_data.client_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}