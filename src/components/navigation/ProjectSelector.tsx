import React from 'react'
import { ChevronDown, Folder, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useProjectContext } from '@/stores/projectContext'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useEffect } from 'react'

export function ProjectSelector() {
  const { data: userData } = useCurrentUser()
  const { data: projects = [] } = useProjects(userData?.organization?.id)
  const { selectedProjectId, setSelectedProject } = useProjectContext()

  // Initialize project context with user preference ONLY on first load
  useEffect(() => {
    // Only set initial project if context is null AND we haven't explicitly set it to null
    if (selectedProjectId === null && userData?.preferences?.last_project_id) {
      // Check if this is the initial load by seeing if we have a stored preference
      const hasExplicitGeneralSelection = localStorage.getItem('explicit-general-mode') === 'true'
      if (!hasExplicitGeneralSelection) {
        setSelectedProject(userData.preferences.last_project_id)
      }
    }
  }, [userData?.preferences?.last_project_id])
  
  // Find current project SOLO basado en selectedProjectId, SIN fallback a last_project_id
  const currentProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId)
    : null

  // Update user preferences when project changes
  const updateProjectMutation = useMutation({
    mutationFn: async (projectId: string | null) => {
      if (!userData?.preferences?.id || !supabase) return
      
      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
    }
  })

  const handleProjectSelect = (projectId: string | null) => {
    console.log("🎯 ProjectSelector: Selecting project", { 
      from: selectedProjectId, 
      to: projectId,
      projectName: projects.find(p => p.id === projectId)?.name || 'General'
    });
    
    // Don't change selection if clicking the same project
    if (selectedProjectId === projectId) {
      return
    }
    
    // Mark when user explicitly selects General mode
    if (projectId === null) {
      localStorage.setItem('explicit-general-mode', 'true')
    } else {
      localStorage.removeItem('explicit-general-mode')
    }
    
    setSelectedProject(projectId)
    updateProjectMutation.mutate(projectId)
  }

  const displayName = selectedProjectId === null 
    ? "General"
    : currentProject?.name || "General"

  const displayIcon = selectedProjectId === null 
    ? <Building2 className="w-4 h-4" />
    : <Folder className="w-4 h-4" />

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
        
        {/* Separador */}
        <DropdownMenuSeparator />
        
        {/* Opción General */}
        <DropdownMenuItem
          onClick={() => handleProjectSelect(null)}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="truncate">General</span>
          </div>
          {selectedProjectId === null && (
            <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: 'var(--accent)' }} />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}