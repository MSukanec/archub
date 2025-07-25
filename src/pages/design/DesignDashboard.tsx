import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle2, Clock, Layers, Plus, Calendar, Palette } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useDesignSummary, useRecentDesignDocuments, useDesignPhasesWithTasks, useUpcomingDesignTasks } from '@/hooks/use-design-dashboard'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'wouter'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function DesignDashboard() {
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  const { data: designSummary, isLoading: summaryLoading } = useDesignSummary(organizationId, projectId)
  const { data: recentDocuments, isLoading: documentsLoading } = useRecentDesignDocuments(organizationId, projectId, 5)
  const { data: phasesWithTasks, isLoading: phasesLoading } = useDesignPhasesWithTasks(organizationId, projectId)
  const { data: upcomingTasks, isLoading: tasksLoading } = useUpcomingDesignTasks(organizationId, projectId, 5)

  const headerProps = {
    title: "Resumen de Diseño",
    showSearch: false,
    showFilters: false,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completado':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case 'en_progreso':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En progreso</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado':
        return 'text-green-600'
      case 'en_revision':
        return 'text-blue-600'
      case 'rechazado':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  // Show empty state if no design data exists
  if (!summaryLoading && (!designSummary || (designSummary.totalDocuments === 0 && designSummary.totalPhases === 0 && designSummary.totalTasks === 0))) {
    return (
      <Layout headerProps={headerProps}>
        <EmptyState 
          icon={<Layers className="h-12 w-12" />}
          title="Sin actividad de diseño registrada"
          description="Comienza creando fases de diseño y documentos para ver el resumen completo del proyecto."
        />
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Métricas Principales - Desktop */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Totales</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : designSummary?.totalDocuments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                archivos del proyecto
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Aprobados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summaryLoading ? '...' : designSummary?.approvedDocuments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                listos para construcción
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fases de Diseño</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : designSummary?.totalPhases || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                etapas del proyecto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : `${designSummary?.progress || 0}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                tareas completadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Principales - Mobile (Compactas) */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--card-border)] shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-foreground">
                {summaryLoading ? '...' : designSummary?.totalDocuments || 0}
              </div>
              <div className="text-xs text-muted-foreground font-medium leading-tight">
                Documentos Totales
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--card-border)] shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {summaryLoading ? '...' : designSummary?.approvedDocuments || 0}
              </div>
              <div className="text-xs text-muted-foreground font-medium leading-tight">
                Documentos Aprobados
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--card-border)] shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-foreground">
                {summaryLoading ? '...' : designSummary?.totalPhases || 0}
              </div>
              <div className="text-xs text-muted-foreground font-medium leading-tight">
                Fases de Diseño
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--card-border)] shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-foreground">
                {summaryLoading ? '...' : `${designSummary?.progress || 0}%`}
              </div>
              <div className="text-xs text-muted-foreground font-medium leading-tight">
                Progreso General
              </div>
            </div>
          </div>
        </div>

        {/* Fases de Diseño y Documentación Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fases de Diseño</CardTitle>
            </CardHeader>
            <CardContent>
              {phasesLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </div>
              ) : phasesWithTasks && phasesWithTasks.length > 0 ? (
                <div className="space-y-3">
                  {phasesWithTasks.map((phase: any) => (
                    <div key={phase.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(phase.status)}
                        <span className="text-sm font-medium">
                          {phase.design_phases?.name || 'Fase sin nombre'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {phase.progress}% ({phase.completedTasks}/{phase.totalTasks})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="Sin fases de diseño"
                  description="Crea fases para organizar el proceso de diseño del proyecto."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentación Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </div>
              ) : recentDocuments && recentDocuments.length > 0 ? (
                <div className="space-y-3">
                  {recentDocuments.map((document: any) => (
                    <div key={document.id} className="flex items-center gap-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={document.creator?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {document.creator?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {document.file_name || 'Documento sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {document.creator?.full_name || 'Usuario'} - {format(new Date(document.created_at), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                      <Badge variant="outline" className={getDocumentStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="Sin documentos registrados"
                  description="Sube documentos de diseño para ver la actividad aquí."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Estado de Documentos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {summaryLoading ? '...' : designSummary?.pendingDocuments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                documentos por revisar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
              <Palette className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {summaryLoading ? '...' : designSummary?.inReviewDocuments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                en proceso de revisión
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summaryLoading ? '...' : ((designSummary?.totalTasks || 0) - (designSummary?.completedTasks || 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                tareas por completar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Próximas Tareas */}
        {upcomingTasks && upcomingTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximas Tareas</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <Badge variant="outline" className={
                        new Date(task.end_date) < new Date() ? 'border-red-500 text-red-500' : 
                        new Date(task.end_date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? 'border-yellow-500 text-yellow-600' : 
                        'border-muted-foreground'
                      }>
                        {new Date(task.end_date) < new Date() ? 'Vencida' : 
                         new Date(task.end_date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? 'Esta semana' : 
                         'Próxima'}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.design_project_phases?.design_phases?.name} - Vence {format(new Date(task.end_date), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                      {task.assigned_user && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assigned_user.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {task.assigned_user.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}