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

  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
            Proyectos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
            {Array.from({ length: 3 }).map((_, i) => (
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
            Proyectos Recientes
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/organization/projects')}
          >
            Ver Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentProjects.length === 0 ? (
              Crea tu primer proyecto para comenzar
            </p>
            <Button onClick={() => navigate('/organization/projects')}>
              Crear Proyecto
            </Button>
          </div>
        ) : (
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
                    <AvatarImage src={project.hero_image_url} alt={project.name} />
                      {getProjectInitials(project.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                      {userData?.preferences?.last_project_id === project.id && (
                          ACTIVO
                        </Badge>
                      )}
                    </div>
                      <span>
                        Actualizado el {format(new Date(project.updated_at || project.created_at), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                  
                  {project.type && (
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