import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Project {
  id: string;
  name: string;
  color?: string;
  project_data?: {
    project_image_url?: string;
  };
}

interface ProjectSelectorFieldProps {
  projects: Project[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Función para generar iniciales de proyectos (como en Sidebar.tsx)
function getProjectInitials(name: string): string {
  return name
    .charAt(0)
    .toUpperCase();
}

export default function ProjectSelectorField({
  projects,
  value,
  onChange,
  placeholder = "Seleccionar proyecto",
  className = ""
}: ProjectSelectorFieldProps) {
  // Ordenar proyectos alfabéticamente por nombre
  const sortedProjects = React.useMemo(() => {
    return [...projects].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [projects]);

  const selectedProject = sortedProjects.find(project => project.id === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {selectedProject ? (
            <>
              <Avatar className="w-5 h-5 border-0">
                <AvatarFallback 
                  className="text-xs font-medium text-white border-0"
                  style={{ backgroundColor: selectedProject.color || 'hsl(var(--accent))' }}
                >
                  {getProjectInitials(selectedProject.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{selectedProject.name || 'Sin nombre'}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
      </SelectTrigger>
      <SelectContent>
        {sortedProjects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex items-center gap-2">
              <Avatar className="w-5 h-5 border-0">
                <AvatarFallback 
                  className="text-xs font-medium text-white border-0"
                  style={{ backgroundColor: project.color || 'hsl(var(--accent))' }}
                >
                  {getProjectInitials(project.name)}
                </AvatarFallback>
              </Avatar>
              <span>{project.name || 'Sin nombre'}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}