import { useState } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProjectContext } from "@/stores/projectContext";
import { cn } from "@/lib/utils";

export function ProjectSelectorButton() {
  const { data: projectsLite = [] } = useProjectsLite();
  const { selectedProjectId, setSelectedProject, currentOrganizationId } = useProjectContext();
  const [open, setOpen] = useState(false);

  const currentProject = projectsLite.find(p => p.id === selectedProjectId);
  const currentProjectName = currentProject?.name || "Seleccionar proyecto";

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId, currentOrganizationId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs gap-2"
        >
          <FolderOpen className="h-4 w-4 text-[var(--accent)]" />
          <span className="font-medium">{currentProjectName}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
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
            projectsLite.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectChange(project.id)}
                className={cn(
                  "w-full px-2 py-2 text-left text-sm rounded-md transition-colors",
                  project.id === selectedProjectId
                    ? "bg-accent text-accent-foreground font-medium"
                    : "hover:bg-accent/5"
                )}
              >
                {project.name}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
