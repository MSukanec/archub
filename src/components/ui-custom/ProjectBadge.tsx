import { Badge } from "@/components/ui/badge";

interface ProjectBadgeProps {
  projectId: string | null;
  projectsMap: Record<string, { id: string; name: string; color: string | null }>;
}

export function ProjectBadge({ projectId, projectsMap }: ProjectBadgeProps) {
  // Si no hay project_id, mostrar badge "General"
  if (!projectId) {
    return (
      <Badge 
        variant="secondary"
        className="text-xs px-1 py-0.5"
        style={{
          backgroundColor: 'hsl(0, 0%, 20%)',
          color: 'white',
          fontSize: '10px',
          lineHeight: '12px'
        }}
      >
        General
      </Badge>
    );
  }

  // Buscar el proyecto en el mapa
  const project = projectsMap[projectId];
  
  if (!project) {
    return (
      <Badge 
        variant="secondary"
        className="text-xs px-1 py-0.5"
        style={{
          backgroundColor: 'hsl(0, 0%, 20%)',
          color: 'white',
          fontSize: '10px',
          lineHeight: '12px'
        }}
      >
        Proyecto no encontrado
      </Badge>
    );
  }

  // Determinar el color del badge
  const backgroundColor = project.color || '#000000';
  
  // Truncar el nombre si es muy largo
  const displayName = project.name.length > 15 
    ? `${project.name.substring(0, 12)}...` 
    : project.name;

  return (
    <Badge 
      variant="secondary"
      className="text-xs px-1 py-0.5"
      style={{
        backgroundColor: backgroundColor,
        color: 'white',
        fontSize: '10px',
        lineHeight: '12px'
      }}
      title={project.name} // Tooltip con el nombre completo
    >
      {displayName}
    </Badge>
  );
}