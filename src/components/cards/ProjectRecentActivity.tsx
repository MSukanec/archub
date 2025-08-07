import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { FileText, Construction, DollarSign, Activity } from 'lucide-react'
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
          </div>
            Últimas actividades del proyecto
          </p>
        </CardHeader>
        <CardContent>
            {Array.from({ length: 3 }).map((_, i) => (
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
        </div>
          Últimas actividades del proyecto
        </p>
      </CardHeader>
      <CardContent>
        {!recentActivity || recentActivity.length === 0 ? (
              La actividad del proyecto aparecerá aquí
            </p>
          </div>
        ) : (
            {recentActivity.map((activity) => (
                  <AvatarImage src={activity.creator?.avatar_url} />
                    {activity.creator?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                  </div>
                  {activity.description && (
                      {activity.description}
                    </p>
                  )}
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