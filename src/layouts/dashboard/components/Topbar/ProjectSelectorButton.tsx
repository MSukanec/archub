import { useState } from "react";
import { ChevronDown, Plus, Building2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useProjectsLite } from "@/features/projects";
import { useProjectContext } from "@/stores/projectContext";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUpdateUserOrganizationPreferences } from "@/features/organization";
import { cn } from "@/lib/utils";

export function ProjectSelectorButton() {
  const { data: projectsLite = [] } = useProjectsLite();
  const { selectedProjectId, setSelectedProject, currentOrganizationId } = useProjectContext();
  const { data: userData } = useCurrentUser();
  const userId = userData?.user?.id;
  const updatePreferencesMutation = useUpdateUserOrganizationPreferences(userId);
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  const currentProject = projectsLite.find(p => p.id === selectedProjectId);
  const organizationName = userData?.organization?.name || "Organización";
  const currentProjectName = currentProject?.name || organizationName;

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

  const handleOrganizationView = async () => {
    if (!currentOrganizationId) return;
    
    // Update preference in database to persist organization-wide view
    await updatePreferencesMutation.mutateAsync({
      organizationId: currentOrganizationId,
      lastProjectId: null
    });
    
    // Set to null to indicate organization-wide view
    setSelectedProject(null, currentOrganizationId);
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
          {currentProject ? (
            <Avatar className="h-5 w-5">
              <AvatarFallback 
                className="text-[10px] font-semibold"
                style={{ 
                  backgroundColor: currentProject.color || 'var(--accent)',
                  color: 'white'
                }}
              >
                {getProjectInitials(currentProject.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-5 w-5 flex items-center justify-center rounded-full bg-accent/10">
              <Building2 className="h-3 w-3 text-[var(--accent)]" />
            </div>
          )}
          <span className="font-medium" style={{ color: 'var(--main-sidebar-fg)' }}>{currentProjectName}</span>
          <ChevronDown className="h-3 w-3 opacity-60" style={{ color: 'var(--main-sidebar-fg)' }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="space-y-1">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Contexto de Datos</p>
          </div>

          {/* Opción Organización */}
          <button
            onClick={handleOrganizationView}
            data-testid="organization-view-option"
            className="w-full px-2 py-2 text-left text-sm rounded-md transition-colors hover:bg-accent/5 flex items-center gap-2"
          >
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-accent/10 flex-shrink-0">
              <Building2 className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <span className="flex-1 truncate font-medium">{organizationName}</span>
            {!selectedProjectId && (
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

          {/* Separador */}
          <div className="my-1 border-t border-border"></div>

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
