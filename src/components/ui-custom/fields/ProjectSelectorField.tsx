import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Project {
  id: string;
  name: string;
  color?: string;
  project_data?: {
    project_image_url?: string;
  };
}

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
}

interface ProjectSelectorFieldProps {
  projects: Project[];
  organization?: Organization;
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
}

// Función para generar iniciales de proyectos (como en Sidebar.tsx)
function getProjectInitials(name: string): string {
  return name
    .charAt(0)
    .toUpperCase();
}

// Función para generar iniciales de organizaciones (como en Sidebar.tsx)
function getOrganizationInitials(name: string): string {
  return name
    .charAt(0)
    .toUpperCase();
}

export default function ProjectSelectorField({
  projects,
  organization,
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

  // Convertir null a string especial para el Select
  const selectValue = value === null ? '__organization__' : (value || '');
  const selectedProject = value ? sortedProjects.find(project => project.id === value) : null;
  const isOrganizationSelected = value === null;

  return (
    <Select value={selectValue} onValueChange={(val) => onChange(val === '__organization__' ? null : val)}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          {isOrganizationSelected ? (
            <>
              <Avatar className="w-5 h-5 border-0">
                {organization?.logo_url ? (
                  <AvatarImage src={organization.logo_url} alt="Organización" />
                ) : (
                  <AvatarFallback 
                    className="text-xs font-medium text-white border-0"
                    style={{ backgroundColor: 'hsl(var(--accent))' }}
                  >
                    {organization ? getOrganizationInitials(organization.name) : 'O'}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="truncate">Organización</span>
            </>
          ) : selectedProject ? (
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
        {/* Opción Organización - siempre primera */}
        <SelectItem value="__organization__">
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5 border-0">
              {organization?.logo_url ? (
                <AvatarImage src={organization.logo_url} alt="Organización" />
              ) : (
                <AvatarFallback 
                  className="text-xs font-medium text-white border-0"
                  style={{ backgroundColor: 'hsl(var(--accent))' }}
                >
                  {organization ? getOrganizationInitials(organization.name) : 'O'}
                </AvatarFallback>
              )}
            </Avatar>
            <span>Organización</span>
          </div>
        </SelectItem>
        
        {/* Separador */}
        {sortedProjects.length > 0 && <Separator className="my-1" />}
        
        {/* Proyectos */}
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