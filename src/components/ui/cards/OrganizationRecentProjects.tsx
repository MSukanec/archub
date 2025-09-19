import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Building, 
  ExternalLink, 
  Plus,
  Clock
} from 'lucide-react'
import { useLocation } from 'wouter'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { useCurrentUser } from '@/hooks/use-current-user'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useToast } from '@/hooks/use-toast'
import { useNavigationStore } from '@/stores/navigationStore'
import { getProjectInitials } from '@/utils/initials'

export function OrganizationRecentProjects() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const { setSidebarContext } = useNavigationStore()
  const currentOrganization = userData?.organization

  // Fetch recent projects ordered by last activity (updated_at)
  const { data: recentProjects = [], isLoading } = useQuery({
    queryKey: ['recent-projects-by-activity', currentOrganization?.id],
    queryFn: async () => {
      if (!supabase || !currentOrganization?.id) return []
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('updated_at', { ascending: false })
        .limit(6)
      
      // Sort to put active project first, then by updated_at
      const sortedData = data?.sort((a, b) => {
        const userActiveProjectId = userData?.preferences?.last_project_id
        if (a.id === userActiveProjectId) return -1
        if (b.id === userActiveProjectId) return 1
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
      })
      
      if (error) throw error
      return sortedData || []
    },
    enabled: !!currentOrganization?.id
  })

  // Project selection mutation
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userData?.preferences?.id || !supabase) throw new Error('No user preferences found')

      const { error } = await supabase
        .from('user_preferences')
        .update({ last_project_id: projectId })
        .eq('id', userData.preferences.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] })
      toast({
        title: "Proyecto seleccionado",
        description: "El proyecto ha sido activado correctamente"
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo seleccionar el proyecto",
        variant: "destructive"
      })
    }
  })

  const handleSetActiveProject = (projectId: string) => {
    selectProjectMutation.mutate(projectId, {
      onSuccess: () => {
        // Invalidate the projects query to refresh the list order
        queryClient.invalidateQueries({ queryKey: ['recent-projects-by-activity'] })
      }
    })
  }


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Proyectos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Proyectos Recientes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/organization/projects')}
            className="text-sm"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Ver Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentProjects.length === 0 ? (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No hay proyectos</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer proyecto para comenzar
            </p>
            <Button onClick={() => navigate('/organization/projects')}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Proyecto
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                className={`p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer ${
                  userData?.preferences?.last_project_id === project.id 
                    ? 'ring-2 ring-offset-2 ring-accent' 
                    : ''
                }`}
                onClick={() => handleSetActiveProject(project.id)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={project.hero_image_url} alt={project.name} />
                    <AvatarFallback className="text-sm font-bold text-accent-foreground bg-accent">
                      {getProjectInitials(project.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{project.name}</h4>
                      {userData?.preferences?.last_project_id === project.id && (
                        <Badge variant="outline" className="text-xs px-1 py-0 border-accent text-accent">
                          ACTIVO
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        Actualizado el {format(new Date(project.updated_at || project.created_at), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                  
                  {project.type && (
                    <Badge variant="outline" className="text-xs">
                      {project.type}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}