import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Lock } from 'lucide-react';
import chroma from 'chroma-js';
import { useQuery } from '@tanstack/react-query';
import { getProjectImageUrlFromData } from '@/lib/storage/uploadProjectImage';
import { projectsKeys } from '@/core/query-keys';

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
  is_over_limit?: boolean;
  
  project_data?: {
    client_name?: string;
    contact_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    image_bucket?: string | null;
    image_path?: string | null;
    project_type_id?: string;
    project_modality_id?: string;
    project_type?: {
      id: string;
      name: string;
    };
    project_modality?: {
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
    'inactive': 'Inactivo',
    'completed': 'Completado',
    'paused': 'Pausado',
    'cancelled': 'Cancelado',
    'planning': 'Planificación'
  };
  return statusMap[status] || status;
};

export function ProjectItemCard({ 
  project, 
  onClick, 
  onNavigateToProject,
  onEdit,
  selected, 
  className,
  isActive = false,
  projectColor = 'var(--accent)'
}: ProjectItemCardProps) {
  const statusText = getStatusText(project.status);
  const isOverLimit = project.is_over_limit === true;

  // Track image load state to prevent flicker
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Generate image URL on-demand from bucket+path with React Query
  // Data comes from projects_view which includes image_bucket, image_path, is_public
  const { data: imageUrl } = useQuery({
    queryKey: projectsKeys.image(project.id),
    queryFn: () => getProjectImageUrlFromData(project.project_data || {}),
    enabled: !!project.project_data?.image_bucket && !!project.project_data?.image_path,
    refetchInterval: 30 * 60 * 1000,  // Refresh every 30 min
    staleTime: Infinity,               // Never consider URL stale during session
    gcTime: 60 * 60 * 1000,            // Keep in cache for 1 hour
    refetchOnWindowFocus: false,       // Prevent refetch on window focus (reduces failures)
    refetchOnMount: false,             // Don't refetch on mount if we have data
    refetchOnReconnect: false,         // Don't refetch on reconnect
    retry: 2,                          // Retry failed requests
    retryDelay: 1000,                  // Wait 1 second between retries
  });
  
  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);
  
  // Handle image load error - show fallback gradient
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
  
  // Obtener el color real del proyecto desde el objeto project
  const actualProjectColor = (project as any).use_custom_color && (project as any).custom_color_hex 
    ? (project as any).custom_color_hex 
    : (project as any).color || projectColor;
  
  // Crear color suave para el badge de estado
  const getSoftAccentColor = () => {
    try {
      // Si el color es una variable CSS, usar un color por defecto
      if (actualProjectColor.includes('var(')) {
        return 'rgba(139, 92, 246, 0.15)'; // violeta suave por defecto
      }
      return chroma(actualProjectColor).alpha(0.15).css();
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
        ${isOverLimit ? 'grayscale opacity-70' : ''}
        ${className || ''}
      `}
      style={{ 
        backgroundColor: 'var(--main-sidebar-bg)',
        height: '480px'
      }}
      onClick={onClick}
      data-testid={`card-project-${project.id}`}
    >
      {/* Imagen de fondo - SIEMPRE 100% de altura */}
      <div className="absolute inset-0">
        {/* Fallback gradient - always rendered behind the image */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: actualProjectColor && !actualProjectColor.includes('var(')
              ? `radial-gradient(ellipse at top right, ${chroma(actualProjectColor).alpha(0.25).css()} 0%, ${chroma(actualProjectColor).alpha(0.15).css()} 30%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.7) 100%)`
              : `radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 30%, rgba(0, 0, 0, 0.4) 70%, rgba(0, 0, 0, 0.7) 100%)`
          }}
        />
        {/* Imagen de fondo del proyecto con lazy loading - layered on top */}
        {imageUrl && !imageError && (
          <img
            src={imageUrl}
            alt={project.name}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{ 
              opacity: imageLoaded ? 1 : 0,
              visibility: imageLoaded ? 'visible' : 'hidden'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
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
              background: actualProjectColor && !actualProjectColor.includes('var(')
                ? `linear-gradient(to top, ${chroma(actualProjectColor).alpha(1).css()} 0%, ${chroma(actualProjectColor).alpha(0.3).css()} 20%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 60%, transparent 100%)`
                : `linear-gradient(to top, var(--accent) 0%, rgba(139, 92, 246, 0.3) 20%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.1) 60%, transparent 100%)`
            }}
          />
        )}
      </div>

      {/* Contenido - SIEMPRE en el mismo lugar (parte inferior) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="space-y-4">
          {/* Nombre del proyecto + Badge activo/bloqueado (si aplica) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isOverLimit && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-amber-500">
                  <Lock className="h-3 w-3 text-white" />
                </div>
              )}
              <h3 className="font-semibold text-lg leading-tight project-card-title">
                {project.name}
              </h3>
              {isActive && !isOverLimit && (
                <div 
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: actualProjectColor }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>
            {isOverLimit && (
              <Badge className="bg-amber-500/20 text-amber-300 border-0 text-xs">
                Solo Lectura
              </Badge>
            )}
          </div>

          {/* Descripción */}
          {project.description && (
            <p className="text-gray-300 text-sm line-clamp-2">
              {project.description}
            </p>
          )}

          {/* 3 Badges inline: Tipo, Modalidad, Estado - TODOS IDENTICOS con color del proyecto */}
          <div className="flex flex-wrap gap-2">
            {project.project_data?.project_type?.name && (
              <Badge 
                className="border-0 text-xs"
                style={{ 
                  borderColor: actualProjectColor,
                  backgroundColor: actualProjectColor && !actualProjectColor.includes('var(')
                    ? chroma(actualProjectColor).alpha(0.15).css()
                    : 'rgba(139, 92, 246, 0.15)',
                  color: 'white'
                }}
              >
                {project.project_data.project_type.name}
              </Badge>
            )}
            {project.project_data?.project_modality?.name && (
              <Badge 
                className="border-0 text-xs"
                style={{ 
                  borderColor: actualProjectColor,
                  backgroundColor: actualProjectColor && !actualProjectColor.includes('var(')
                    ? chroma(actualProjectColor).alpha(0.15).css()
                    : 'rgba(139, 92, 246, 0.15)',
                  color: 'white'
                }}
              >
                {project.project_data.project_modality.name}
              </Badge>
            )}
            <Badge 
              className="border-0 text-xs"
              style={{ 
                borderColor: actualProjectColor,
                backgroundColor: actualProjectColor && !actualProjectColor.includes('var(')
                  ? chroma(actualProjectColor).alpha(0.15).css()
                  : 'rgba(139, 92, 246, 0.15)',
                color: 'white'
              }}
            >
              {statusText}
            </Badge>
          </div>

          {/* Botones - abajo - SOLO EN HOVER */}
          <div className="flex justify-end gap-2">
            {!isOverLimit && (
              <Button 
                variant="secondary"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ 
                  borderColor: actualProjectColor,
                  color: actualProjectColor
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                data-testid="button-edit-project"
              >
                Editar
              </Button>
            )}
            <Button 
              size="sm"
              className="text-white border-0 text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ backgroundColor: isOverLimit ? '#d97706' : actualProjectColor }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigateToProject?.();
              }}
              data-testid="button-navigate-project"
            >
              {isOverLimit ? 'Ver Proyecto' : 'Ir al Proyecto'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
