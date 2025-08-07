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
  
  // Function to get project initials
  const getProjectInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <SwipeableCard
      actions={[
        {
          label: "Favorito",
          onClick: () => {
            console.log('Toggle favorite for project:', project.id);
          }
        },
        {
          label: "Editar",
          onClick: () => onEdit(project)
        },
        {
          label: "Eliminar",
          variant: "destructive" as const,
          onClick: () => onDelete(project)
        }
      ]}
    >
        {/* HERO SECTION - Imagen completa con avatar y acciones superpuestas */}
          {/* Background Image */}
          {project.project_data?.project_image_url ? (
            <img 
              src={project.project_data.project_image_url} 
              alt={project.name}
              key={project.project_data.project_image_url}
            />
          ) : (
            <div 
              style={{ backgroundColor: project.color || '#ffffff' }}
            >
              {getProjectInitials(project.name)}
            </div>
          )}
          
          {/* Gradient overlay for better text readability */}
          
          {/* Project Avatar - Top Left */}
              <AvatarFallback 
                style={{ backgroundColor: project.color || '#ffffff' }}
              >
                {getProjectInitials(project.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Actions Menu - Top Right */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                >
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                  Edición rápida
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onNavigateToBasicData(project); }}>
                  Edición completa
                </DropdownMenuItem>
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* INFO SECTION - Información del proyecto */}
          {/* Project Name and Active Button */}
              {project.name}
            </h3>
            
            {isActiveProject ? (
              <Button 
                size="sm"
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
            {/* Left side - Project details */}
              </p>
              </p>
              </p>
            </div>
            
            {/* Right side - Member avatars (only creator for now) */}
              {project.creator && (
                  <AvatarImage src={project.creator.avatar_url || ''} />
                    {project.creator.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              {/* Placeholder for future members count */}
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  );
}