import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Star,
  Trash2,
  Edit
} from 'lucide-react';
import SwipeableCard from '@/components/layout/mobile/SwipeableCard';

// Project status configurations
const projectStatuses = {
  planning: { label: 'Planificación', variant: 'secondary' as const },
  active: { label: 'Activo', variant: 'default' as const },
  on_hold: { label: 'En Pausa', variant: 'outline' as const },
  completed: { label: 'Completado', variant: 'default' as const },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const }
};

interface ProjectCardProps {
  project: any;
  onEdit: (project: any) => void;
  onDelete: (project: any) => void;
  onSelect: (project: any) => void;
}

export default function ProjectCard({ project, onEdit, onDelete, onSelect }: ProjectCardProps) {
  const statusConfig = projectStatuses[project.status as keyof typeof projectStatuses] || projectStatuses.planning;

  return (
    <SwipeableCard
      actions={[
        {
          label: "Favorito",
          onClick: () => {
            // TODO: Implement favorite functionality
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
      <Card 
        onClick={() => onSelect(project)}
      >

        {/* Row 2: Project name and status (inline) */}
              {project.name}
            </h3>
          </div>
            {statusConfig.label}
          </Badge>
        </div>

        {/* Row 3: Location and dates */}
              {project.location || 'Sin ubicación'}
            </span>
          </div>
            <span>
              {project.start_date 
                ? format(new Date(project.start_date), 'dd/MM/yy', { locale: es })
                : 'Sin fecha'
              }
            </span>
          </div>
        </div>

        {/* Row 4: Creator info and budget */}
              <AvatarImage 
                src={project.creator?.avatar_url} 
                alt={project.creator?.full_name} 
              />
                {project.creator?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
              {project.creator?.full_name || 'Sin creador'}
            </span>
          </div>
            <span>
              {project.budget 
                ? new Intl.NumberFormat('es-AR', { 
                    style: 'currency', 
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(project.budget)
                : 'Sin presupuesto'
              }
            </span>
          </div>
        </div>
        </CardContent>
      </Card>
    </SwipeableCard>
  );
}