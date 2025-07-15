import React from 'react'
import { ChevronDown, Folder, FolderOpen } from 'lucide-react'
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
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useEffect } from 'react'

export function ProjectSelector() {
  const { data: userData } = useCurrentUser()
  const { data: projects = [] } = useProjects(userData?.organization?.id)
  const { selectedProjectId, setSelectedProject } = useProjectContext()

  // Initialize project context with user preference if not set
  useEffect(() => {
    if (selectedProjectId === null && userData?.preferences?.last_project_id) {
      setSelectedProject(userData.preferences.last_project_id)
    }
  }, [userData?.preferences?.last_project_id, selectedProjectId, setSelectedProject])
  
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
    // Don't change selection if clicking the same project
    if (selectedProjectId === projectId) {
      return
    }
    setSelectedProject(projectId)
    updateProjectMutation.mutate(projectId)
  }

  // All projects options including "Todos los proyectos"
  const allOptions = [
    { id: null, name: "Todos los proyectos" },
    ...projects
  ]

  const displayName = selectedProjectId === null 
    ? "Todos los proyectos"
    : currentProject?.name || "Todos los proyectos"

  const displayIcon = selectedProjectId === null 
    ? <FolderOpen className="w-4 h-4" />
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
        {allOptions.map((option) => (
          <DropdownMenuItem
            key={option.id || 'all'}
            onClick={() => handleProjectSelect(option.id)}
            className="flex items-center gap-2"
          >
            {option.id === null ? (
              <FolderOpen className="w-4 h-4" />
            ) : (
              <Folder className="w-4 h-4" />
            )}
            <span className="truncate">{option.name}</span>
            {(selectedProjectId === null && option.id === null) || (selectedProjectId === option.id) ? (
              <div className="w-2 h-2 bg-accent rounded-full ml-auto" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}