import React from 'react'
import { ChevronDown, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useProjectContext } from '@/stores/projectContext'
import { useUpdateUserOrganizationPreferences, useGetLastProjectForOrganization } from '@/hooks/use-user-organization-preferences'
import { useEffect } from 'react'

export function ProjectSelector() {
  const { data: userData } = useCurrentUser()
  const { data: projects = [] } = useProjects(userData?.organization?.id)
  const { selectedProjectId, setSelectedProject } = useProjectContext()
  const organizationId = userData?.organization?.id
  
  // Get last project for current organization using new system
  const lastProjectId = useGetLastProjectForOrganization(organizationId)
  
  // Update user organization preferences when project changes
  const updateProjectMutation = useUpdateUserOrganizationPreferences()

  // Initialize project from organization preferences, always ensure a project is selected
  useEffect(() => {
    if (organizationId && projects.length > 0) {
      // Try to use saved project from organization preferences if it exists
      if (lastProjectId && projects.some(p => p.id === lastProjectId)) {
        setSelectedProject(lastProjectId)
      } else {
        // If no valid saved project, select the first available project
        const firstProject = projects[0]
        if (firstProject) {
          setSelectedProject(firstProject.id)
          // Update organization preferences to reflect this selection
          updateProjectMutation.mutate({
            organizationId,
            lastProjectId: firstProject.id
          })
        }
      }
    }
  }, [organizationId, lastProjectId, projects, setSelectedProject, updateProjectMutation])
  
  // Find current project based on selectedProjectId
  const currentProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)
    : null

  const handleProjectSelect = (projectId: string) => {
    console.log("🎯 ProjectSelector: Selecting project", { 
      from: selectedProjectId, 
      to: projectId,
      projectName: projects.find(p => p.id === projectId)?.name,
      organizationId,
      userId: userData?.user?.id
    });
    
    // Don't change selection if clicking the same project
    if (selectedProjectId === projectId) {
      return
    }
    
    // Update context and database using new organization preferences system
    setSelectedProject(projectId)
    if (organizationId) {
      console.log("🎯 ProjectSelector: Calling mutation with", { organizationId, projectId });
      updateProjectMutation.mutate({
        organizationId,
        lastProjectId: projectId
      }, {
        onSuccess: (data) => {
          console.log("🎯 ProjectSelector: Mutation successful", data);
        },
        onError: (error) => {
          console.error("🎯 ProjectSelector: Mutation failed", error);
        }
      })
    }
  }

  const displayName = currentProject?.name || "Seleccionar proyecto"
  const displayIcon = <Folder className="w-4 h-4" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1 h-auto text-sm font-medium hover:bg-muted/50 data-[state=open]:bg-muted/50"
        >
          {displayIcon}
          <span className="truncate max-w-32">{displayName}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {/* Lista de proyectos */}
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleProjectSelect(project.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span className="truncate">{project.name}</span>
            </div>
            {selectedProjectId === project.id && (
              <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: 'var(--accent)' }} />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}