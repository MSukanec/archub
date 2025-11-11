import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProjectContext } from "@/stores/projectContext";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function ProjectSelectorButton() {
  const { data: projectsLite = [] } = useProjectsLite();
  const { selectedProjectId, setSelectedProject, currentOrganizationId } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  const currentProject = projectsLite.find(p => p.id === selectedProjectId);
  const currentProjectName = currentProject?.name || "Seleccionar proyecto";

  // Ordenar proyectos por última actividad (updated_at descendente)
  const sortedProjects = [...projectsLite].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return dateB - dateA; // Más reciente primero
  });

  // Función para obtener las iniciales del proyecto
  const getProjectInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId, currentOrganizationId);
    setOpen(false);
  };

  const handleNewProject = () => {
    setOpen(false);
    navigate('/organization/projects');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs gap-2 border border-border"
          data-testid="button-project-selector"
        >
          <Avatar className="h-5 w-5">
            <AvatarFallback 
              className="text-[10px] font-semibold"
              style={{ 
                backgroundColor: currentProject?.color || 'var(--accent)',
                color: 'white'
              }}
            >
              {currentProject ? getProjectInitials(currentProject.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium" style={{ color: 'var(--main-sidebar-fg)' }}>{currentProjectName}</span>
          <ChevronDown className="h-3 w-3 opacity-60" style={{ color: 'var(--main-sidebar-fg)' }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="space-y-1">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Proyectos</p>
          </div>
          {projectsLite.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-muted-foreground">No hay proyectos disponibles</p>
            </div>
          ) : (
            <>
              {sortedProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectChange(project.id)}
                  data-testid={`project-item-${project.id}`}
                  className="w-full px-2 py-2 text-left text-sm rounded-md transition-colors hover:bg-accent/5 flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarFallback 
                      className="text-[10px] font-semibold"
                      style={{ 
                        backgroundColor: project.color || 'var(--accent)',
                        color: 'white'
                      }}
                    >
                      {getProjectInitials(project.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.id === selectedProjectId && (
                    <Badge 
                      variant="secondary" 
                      className="h-5 px-1.5 text-[10px] font-semibold"
                      style={{ 
                        backgroundColor: 'var(--accent)',
                        color: 'white'
                      }}
                    >
                      Activo
                    </Badge>
                  )}
                </button>
              ))}
              
              {/* Botón Nuevo Proyecto */}
              <div className="pt-1 mt-1 border-t border-border">
                <button
                  onClick={handleNewProject}
                  data-testid="button-new-project"
                  className="w-full px-2 py-2 text-left text-sm rounded-md transition-colors hover:bg-accent/5 flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-accent/10">
                    <Plus className="h-4 w-4 text-[var(--accent)]" />
                  </div>
                  <span className="flex-1 font-medium">Nuevo Proyecto</span>
                </button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
