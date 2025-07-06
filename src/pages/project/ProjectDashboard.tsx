import { useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CustomCard from '@/components/ui-custom/misc/CustomCard'
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
        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CustomCard
            topContent={
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{projectSummary?.totalDocuments || 0}</div>
                <FileText className="h-8 w-8 opacity-80" />
              </div>
            }
            title="Documentos"
            description="Diseño"
          />
          
          <CustomCard
            topContent={
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{projectSummary?.totalSiteLogs || 0}</div>
                <Construction className="h-8 w-8 opacity-80" />
              </div>
            }
            title="Registros"
            description="Obra"
          />
          
          <CustomCard
            topContent={
              <div className="flex items-center justify-between">
                <div className="text-4xl font-bold">{projectSummary?.totalBudgets || 0}</div>
                <Calculator className="h-8 w-8 opacity-80" />
              </div>
            }
            title="Presupuestos"
            description="Creados"
          />
          
          <CustomCard
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
            </CardContent>
          </Card>

          {/* Información del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Información del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}