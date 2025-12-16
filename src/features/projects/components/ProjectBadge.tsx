import { Badge } from "@/components/ui/badge";

interface ProjectBadgeProps {
  projectId: string | null;
  projectsMap: Record<string, { id: string; name: string; color: string | null }>;
}

export function ProjectBadge({ projectId, projectsMap }: ProjectBadgeProps) {
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
        Organización
      </Badge>
    );
  }

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

  const backgroundColor = project.color || '#000000';
  
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
      title={project.name}
    >
      {displayName}
    </Badge>
  );
}
