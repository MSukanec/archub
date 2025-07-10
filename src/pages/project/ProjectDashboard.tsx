import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FolderOpen, 
  Calendar, 
  Building, 
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
        {/* Métricas Principales - Desktop */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Documentos de Diseño
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectSummary?.totalDocuments || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total documentos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Registros de Obra
              </CardTitle>
              <Construction className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectSummary?.totalSiteLogs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Entradas de bitácora
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Presupuestos
              </CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectSummary?.totalBudgets || 0}</div>
              <p className="text-xs text-muted-foreground">
                Presupuestos creados
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Movimientos
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projectSummary?.totalMovements || 0}</div>
              <p className="text-xs text-muted-foreground">
                Transacciones
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Principales - Mobile (Compactas) */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {/* Row 1 */}
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                {summaryLoading ? '...' : projectSummary?.totalDocuments || 0}
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Documentos de Diseño
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <Construction className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                {summaryLoading ? '...' : projectSummary?.totalSiteLogs || 0}
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Registros de Obra
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <Calculator className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                {summaryLoading ? '...' : projectSummary?.totalBudgets || 0}
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Presupuestos
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                {summaryLoading ? '...' : projectSummary?.totalMovements || 0}
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Movimientos
              </div>
            </div>
          </div>
        </div>

        {/* Información del Proyecto - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Información del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectSummary?.project ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-lg">{projectSummary.project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {projectSummary.project.description || 'Sin descripción'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Creado el {format(new Date(projectSummary.project.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>Estado: </span>
                    {getStatusBadge(projectSummary.project.status || 'active')}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground mb-1">
                      {((projectSummary?.totalDocuments || 0) + (projectSummary?.totalSiteLogs || 0) + (projectSummary?.totalBudgets || 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">Total elementos</div>
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
          </CardContent>
        </Card>

        {/* Acciones Rápidas - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-2"
                onClick={() => {
                  setSidebarContext('design')
                  navigate('/design/documentation')
                }}
              >
                <PenTool className="h-5 w-5" />
                <span className="text-sm">Crear Documento de Diseño</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-2"
                onClick={() => {
                  setSidebarContext('construction')
                  navigate('/construction/budgets')
                }}
              >
                <Calculator className="h-5 w-5" />
                <span className="text-sm">Gestionar Presupuestos</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-2"
                onClick={() => {
                  setSidebarContext('construction')
                  navigate('/construction/logs')
                }}
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">Crear Registro de Obra</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-16 flex flex-col gap-2"
                onClick={() => {
                  setSidebarContext('finances')
                  navigate('/finances/movements')
                }}
              >
                <DollarSign className="h-5 w-5" />
                <span className="text-sm">Agregar Movimiento</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actividad Reciente - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(!recentActivity?.siteLogs?.length && !recentActivity?.documents?.length) ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">Sin actividad reciente</h3>
                <p className="text-sm text-muted-foreground">
                  La actividad del proyecto aparecerá aquí
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Recent Documents */}
                {recentActivity?.documents?.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 p-4 rounded-lg border">
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
                  <div key={log.id} className="flex items-start gap-3 p-4 rounded-lg border">
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}