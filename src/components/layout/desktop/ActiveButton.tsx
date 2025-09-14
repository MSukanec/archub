import { useState } from "react";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectsLite } from "@/hooks/use-projects-lite";
import { useProjectContext } from "@/stores/projectContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Función auxiliar para generar iniciales
function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

interface ActiveButtonProps {
  className?: string;
}

export default function ActiveButton({ className }: ActiveButtonProps) {
  const [open, setOpen] = useState(false);
  const { data: userData } = useCurrentUser();
  const { data: projects = [] } = useProjectsLite(userData?.organization?.id);
  const { selectedProjectId, setSelectedProject, isViewingOrganization, setViewingOrganization } = useProjectContext();
  const queryClient = useQueryClient();
  
  // Encontrar organización y proyecto actual
  const currentOrganization = userData?.organization;
  const currentProject = selectedProjectId ? projects.find((p: any) => p.id === selectedProjectId) : null;
  
  // Determinar qué mostrar como texto principal
  const displayText = isViewingOrganization 
    ? currentOrganization?.name || "Sin organización"
    : currentProject?.name || "Sin proyecto";
    
  const displaySubtext = isViewingOrganization ? "ORGANIZACIÓN" : "PROYECTO";
  
  // Mutación para cambiar organización
  const updateOrganizationMutation = useMutation({
    mutationFn: async () => {
      // Lógica para cambiar a vista de organización
      setViewingOrganization(true);
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    }
  });
  
  // Mutación para cambiar proyecto
  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userData?.user?.id || !userData?.organization?.id) {
        throw new Error('Usuario u organización no disponibles');
      }
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert(
          {
            user_id: userData.user.id,
            organization_id: userData.organization.id,
            last_project_id: projectId,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'user_id,organization_id' }
        );
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      setSelectedProject(projectId);
      setViewingOrganization(false);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      queryClient.invalidateQueries({ queryKey: ['user-organization-preferences'] });
    }
  });
  
  const handleOrganizationSelect = () => {
    if (isViewingOrganization) return;
    updateOrganizationMutation.mutate();
  };
  
  const handleProjectSelect = (projectId: string) => {
    if (selectedProjectId === projectId && !isViewingOrganization) return;
    updateProjectMutation.mutate(projectId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost" 
          className={cn(
            "h-12 px-2 justify-start gap-3 hover:bg-accent/5 transition-colors",
            "border border-muted-foreground/20 rounded-lg bg-card/50",
            className
          )}
          data-testid="active-button"
        >
          {/* Avatar de organización a la izquierda */}
          <div className="flex-shrink-0">
            {currentOrganization?.logo_url ? (
              <img 
                src={currentOrganization.logo_url} 
                alt={currentOrganization.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-accent" />
              </div>
            )}
          </div>
          
          {/* Texto en el medio */}
          <div className="flex-1 text-left min-w-0">
            <div className="font-medium text-sm truncate">
              {displayText}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              {displaySubtext}
            </div>
          </div>
          
          {/* Chevron a la derecha */}
          <div className="flex-shrink-0">
            {open ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-2" 
        align="start"
        side="right"
        sideOffset={8}
        data-testid="active-button-popover"
      >
        {/* Opción de organización */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-12 px-3",
            isViewingOrganization && "bg-accent/10"
          )}
          onClick={handleOrganizationSelect}
          data-testid="select-organization-button"
        >
          <div className="flex-shrink-0">
            {currentOrganization?.logo_url ? (
              <img 
                src={currentOrganization.logo_url} 
                alt={currentOrganization.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-accent" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-left min-w-0">
            <div className="font-medium text-sm truncate">
              {currentOrganization?.name || "Sin organización"}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              ORGANIZACIÓN
            </div>
          </div>
        </Button>
        
        {/* Separador */}
        <Separator className="my-2" />
        
        {/* Lista de proyectos */}
        <div className="space-y-1">
          {projects.length > 0 ? (
            projects.map((project: any) => (
              <Button
                key={project.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 px-3",
                  selectedProjectId === project.id && !isViewingOrganization && "bg-accent/10"
                )}
                onClick={() => handleProjectSelect(project.id)}
                data-testid={`select-project-${project.id}`}
              >
                <div className="flex-shrink-0">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: project.color || 'var(--accent)' }}
                  >
                    {getInitials(project.name)}
                  </div>
                </div>
                
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-sm truncate">
                    {project.name}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">
                    PROYECTO
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              No hay proyectos disponibles
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}