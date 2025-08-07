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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
        >
          {displayIcon}
        </Button>
      </DropdownMenuTrigger>
        {/* Lista de proyectos */}
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => handleProjectSelect(project.id)}
          >
            </div>
            {selectedProjectId === project.id && (
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}