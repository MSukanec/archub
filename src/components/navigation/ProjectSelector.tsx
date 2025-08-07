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
// Eliminamos el sistema problemático de user_organization_preferences
import { useEffect } from 'react'

export function ProjectSelector() {
  const { data: userData } = useCurrentUser()
  const { data: projects = [] } = useProjects(userData?.organization?.id)
  const { selectedProjectId, setSelectedProject } = useProjectContext()
  const organizationId = userData?.organization?.id
  
  // Usar el proyecto directamente desde las preferencias del usuario
  const lastProjectId = userData?.preferences?.last_project_id

  // Initialize project from user preferences, always ensure a project is selected
  useEffect(() => {
    if (organizationId && projects.length > 0) {
      // Try to use saved project if it exists in current organization
      if (lastProjectId && projects.some(p => p.id === lastProjectId)) {
        setSelectedProject(lastProjectId)
      } else {
        // If no valid saved project, select the first available project
        const firstProject = projects[0]
        if (firstProject) {
          setSelectedProject(firstProject.id)
        }
      }
    }
  }, [organizationId, lastProjectId, projects, setSelectedProject])
  
  // Find current project based on selectedProjectId
  const currentProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)
    : null

  const handleProjectSelect = (projectId: string) => {
    // Don't change selection if clicking the same project
    if (selectedProjectId === projectId) {
      return
    }
    
    // Update context only - project persistence will be handled by projectContext.ts
    setSelectedProject(projectId)
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