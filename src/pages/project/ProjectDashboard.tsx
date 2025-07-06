import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataCard } from '@/components/ui-custom/misc/DataCard'
import { SecondaryCard } from '@/components/ui-custom/misc/SecondaryCard'
import { ProjectProgressChart } from '@/components/graphics/dashboard/ProjectProgressChart'
import { ProjectTimelineChart } from '@/components/graphics/dashboard/ProjectTimelineChart'
import { ProjectKPIChart } from '@/components/graphics/dashboard/ProjectKPIChart'
import { ProjectActivityChart } from '@/components/graphics/dashboard/ProjectActivityChart'
import { useProjectDashboardCharts } from '@/hooks/use-project-dashboard-charts'
import { 
  FolderOpen, 
  Calendar, 
  Building, 
  Building2,
  Calculator, 
  DollarSign, 
  Users,
  CheckCircle2,
  Construction,
  FileText,
  Zap,
  Plus,
  PenTool,
  Palette,
  CreditCard,
  Contact,
  ShoppingCart,
  Target
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigationStore } from '@/stores/navigationStore'
import { useMobileActionBar } from '@/components/layout/mobile/MobileActionBarContext'
import { useMobile } from '@/hooks/use-mobile'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ProjectDashboard() {
  const { data: userData } = useCurrentUser()
  const { setSidebarContext } = useNavigationStore()
  const { setShowActionBar } = useMobileActionBar()
  const isMobile = useMobile()
  const [, navigate] = useLocation()

  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id

  // Fetch chart data
  const { data: chartData, isLoading: chartsLoading, error: chartsError } = useProjectDashboardCharts()

  // Debug logging
  console.log('Charts data:', { chartData, chartsLoading, chartsError })

  // Datos temporales para mostrar gráficos mientras se soluciona el hook
  const tempChartData = {
    progressData: [
      { phase: 'Diseño', progress: 85, total: 12, completed: 10, icon: FileText },
      { phase: 'Obra', progress: 60, total: 25, completed: 15, icon: Building2 },
      { phase: 'Finanzas', progress: 90, total: 8, completed: 7, icon: DollarSign },
      { phase: 'Comercial', progress: 45, total: 20, completed: 9, icon: Users }
    ],
    kpiData: {
      budget: { used: 780000, total: 1000000 },
      team: { active: 8, total: 10 },
      timeline: { elapsed: 60, total: 90 },
      efficiency: { score: 88, max: 100 }
    },
    timelineData: [
      { month: 'Enero', activities: 12 },
      { month: 'Febrero', activities: 19 },
      { month: 'Marzo', activities: 25 },
      { month: 'Abril', activities: 18 },
      { month: 'Mayo', activities: 32 },
      { month: 'Junio', activities: 28 },
      { month: 'Julio', activities: 35 }
    ],
    activityData: [
      { date: '2025-01-15', value: 5, type: 'medium' },
      { date: '2025-01-16', value: 12, type: 'very_high' },
      { date: '2025-01-17', value: 8, type: 'high' },
      { date: '2025-01-18', value: 3, type: 'low' },
      { date: '2025-01-19', value: 15, type: 'very_high' }
    ],
    recentActivities: [
      { 
        id: '1', 
        user: 'Juan Pérez', 
        action: 'Actualizó documento de diseño', 
        timestamp: '2025-01-19T10:30:00Z',
        type: 'design'
      },
      { 
        id: '2', 
        user: 'María García', 
        action: 'Revisó presupuesto', 
        timestamp: '2025-01-18T15:45:00Z',
        type: 'finance'
      }
    ]
  }

  // Fetch project summary data
  const { data: projectSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['project-summary', organizationId, projectId],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId) return null

      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      // Get design documents count
      const { count: documentsCount } = await supabase
        .from('design_documents')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Get site logs count
      const { count: siteLogsCount } = await supabase
        .from('site_logs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Get budgets count
      const { count: budgetsCount } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Get movements count for this project
      const { count: movementsCount } = await supabase
        .from('movements')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('project_id', projectId)

      return {
        project,
        totalDocuments: documentsCount || 0,
        totalSiteLogs: siteLogsCount || 0,
        totalBudgets: budgetsCount || 0,
        totalMovements: movementsCount || 0
      }
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['project-recent-activity', organizationId, projectId],
    queryFn: async () => {
      if (!supabase || !organizationId || !projectId) return []

      // Get recent site logs
      const { data: recentSiteLogs } = await supabase
        .from('site_logs')
        .select(`
          *,
          creator:created_by(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(3)

      // Get recent design documents
      const { data: recentDocuments } = await supabase
        .from('design_documents')
        .select(`
          *,
          creator:created_by(full_name, avatar_url)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(2)

      return {
        siteLogs: recentSiteLogs || [],
        documents: recentDocuments || []
      }
    },
    enabled: !!organizationId && !!projectId && !!supabase
  })

  // Set sidebar context and hide mobile action bar on dashboards
  useEffect(() => {
    setSidebarContext('project')
    if (isMobile) {
      setShowActionBar(false)
    }
  }, [setSidebarContext, setShowActionBar, isMobile])

  const headerProps = {
    title: "Resumen del Proyecto",
    showSearch: false,
    showFilters: false,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">En progreso</Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  // Show empty state if no project data exists
  if (!summaryLoading && (!projectSummary || (!projectSummary.totalDocuments && !projectSummary.totalSiteLogs && !projectSummary.totalBudgets))) {
    return (
      <Layout headerProps={headerProps}>
        <CustomEmptyState 
          icon={<FolderOpen className="h-12 w-12" />}
          title="Sin actividad del proyecto registrada"
          description="Comienza creando documentos, presupuestos o registros de obra para ver el resumen completo del proyecto."
          action={
            <Button className="h-8 px-3 text-sm" onClick={() => navigate('/design/documentation')}>
              <Plus className="h-3 w-3 mr-1" />
              Crear Primer Documento
            </Button>
          }
        />
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DataCard
            topContent={
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{projectSummary?.totalDocuments || 0}</div>
                <FileText className="h-8 w-8 opacity-80" />
              </div>
            }
            title="Documentos"
            description="Diseño"
          />
          
          <DataCard
            topContent={
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{projectSummary?.totalSiteLogs || 0}</div>
                <Construction className="h-8 w-8 opacity-80" />
              </div>
            }
            title="Registros"
            description="Obra"
          />
          
          <DataCard
            topContent={
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{projectSummary?.totalBudgets || 0}</div>
                <Calculator className="h-8 w-8 opacity-80" />
              </div>
            }
            title="Presupuestos"
            description="Creados"
          />
          
          <DataCard
            topContent={
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{projectSummary?.totalMovements || 0}</div>
                <DollarSign className="h-8 w-8 opacity-80" />
              </div>
            }
            title="Movimientos"
            description="Financieros"
          />
        </div>

        {/* Contenido en 3 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividad Reciente */}
          <SecondaryCard
            title="Actividad Reciente"
            icon={<CheckCircle2 className="h-5 w-5" />}
          >
            {(!recentActivity?.siteLogs?.length && !recentActivity?.documents?.length) ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Sin actividad reciente</h3>
                <p className="text-sm text-muted-foreground">
                  La actividad del proyecto aparecerá aquí
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Recent Documents */}
                {recentActivity?.documents?.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name || 'Documento sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.creator?.full_name || 'Usuario'} • {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {/* Recent Site Logs */}
                {recentActivity?.siteLogs?.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Construction className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.comments || 'Registro de obra'}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.creator?.full_name || 'Usuario'} • {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SecondaryCard>

          {/* Información del Proyecto */}
          <SecondaryCard
            title="Información del Proyecto"
            icon={<FolderOpen className="h-5 w-5" />}
          >
            {projectSummary?.project ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{projectSummary.project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {projectSummary.project.description || 'Sin descripción'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Creado el {format(new Date(projectSummary.project.created_at), 'dd/MM/yyyy', { locale: es })}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    {getStatusBadge(projectSummary.project.status || 'active')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Cargando información</h3>
                <p className="text-sm text-muted-foreground">
                  Obteniendo datos del proyecto...
                </p>
              </div>
            )}
          </SecondaryCard>

          {/* Acciones Rápidas */}
          <SecondaryCard
            title="Acciones Rápidas"
            icon={<Zap className="h-5 w-5" />}
          >
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSidebarContext('design')
                  navigate('/design/documentation')
                }}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Crear Documento de Diseño
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSidebarContext('construction')
                  navigate('/construction/budgets')
                }}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Gestionar Presupuestos
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSidebarContext('construction')
                  navigate('/construction/logs')
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Crear Registro de Obra
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSidebarContext('finances')
                  navigate('/finances/movements')
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Agregar Movimiento
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setSidebarContext('finances')
                  navigate('/finances/installments')
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Registrar Aporte
              </Button>
            </div>
          </SecondaryCard>
        </div>

        {/* Gráficos de Dashboard */}
        <div className="space-y-6 mt-8">
          <h2 className="text-2xl font-bold text-foreground">Análisis del Proyecto</h2>
          
          {chartsError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive font-medium">Error cargando gráficos:</p>
              <p className="text-sm text-destructive/80">{chartsError.message}</p>
            </div>
          )}
          
          {/* Primera fila de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectProgressChart data={(chartData || tempChartData).progressData} />
            <ProjectKPIChart data={(chartData || tempChartData).kpiData} />
          </div>

          {/* Segunda fila de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectTimelineChart data={(chartData || tempChartData).timelineData} />
            <ProjectActivityChart 
              data={(chartData || tempChartData).activityData} 
              recentActivities={(chartData || tempChartData).recentActivities}
            />
          </div>
        </div>

        {chartsLoading && (
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-[400px]">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-64 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}