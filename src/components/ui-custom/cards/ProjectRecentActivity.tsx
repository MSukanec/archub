import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FileText, Construction, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'

interface ProjectRecentActivityProps {
  projectId: string | null
}

export function ProjectRecentActivity({ projectId }: ProjectRecentActivityProps) {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id

  const { data: recentActivity, isLoading } = useQuery({
    queryKey: ['project-recent-activity', organizationId, projectId],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId) return []

      // Get recent activities from different sources
      const [documentsResult, siteLogsResult, movementsResult] = await Promise.all([
        supabase
          .from('design_documents')
          .select(`
            *,
            creator:created_by(full_name, avatar_url)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(3),
        
        supabase
          .from('site_logs')
          .select(`
            *,
            creator:created_by(full_name, avatar_url)
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(3),
        
        supabase
          .from('movements')
          .select(`
            *,
            creator:created_by(full_name, avatar_url)
          `)
          .eq('organization_id', organizationId)
          .eq('project_id', projectId)
          .order('movement_date', { ascending: false })
          .limit(3)
      ])

      const activities = [
        ...(documentsResult.data || []).map(doc => ({
          id: doc.id,
          type: 'document' as const,
          title: doc.file_name || 'Documento sin nombre',
          description: doc.description || '',
          creator: doc.creator,
          date: new Date(doc.created_at),
          icon: FileText
        })),
        ...(siteLogsResult.data || []).map(log => ({
          id: log.id,
          type: 'site_log' as const,
          title: log.title,
          description: log.description || '',
          creator: log.creator,
          date: new Date(log.created_at),
          icon: Construction
        })),
        ...(movementsResult.data || []).map(movement => ({
          id: movement.id,
          type: 'movement' as const,
          title: `Movimiento: ${movement.description || 'Sin descripción'}`,
          description: `$${movement.amount?.toLocaleString()} ${movement.currency || ''}`,
          creator: movement.creator,
          date: new Date(movement.movement_date),
          icon: DollarSign
        }))
      ]

      // Sort by date and take the most recent 5
      return activities
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 5)
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimas actividades del proyecto
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                  <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
                </div>
                <div className="h-3 w-16 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'document':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Documento</Badge>
      case 'site_log':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Bitácora</Badge>
      case 'movement':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Finanzas</Badge>
      default:
        return <Badge variant="outline">Actividad</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimas actividades del proyecto
        </p>
      </CardHeader>
      <CardContent>
        {!recentActivity || recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm">
              No hay actividad reciente en este proyecto
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.creator?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {activity.creator?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <activity.icon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    {getActivityBadge(activity.type)}
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(activity.date, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}