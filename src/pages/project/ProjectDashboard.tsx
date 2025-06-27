import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { Folder, Calendar, User, Building } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function ProjectDashboard() {
  const { data: userData, isLoading } = useCurrentUser()
  const { data: projects = [], isLoading: projectsLoading } = useProjects(userData?.organization?.id)

  const currentProject = projects.find(p => p.id === userData?.preferences?.last_project_id)

  const headerProps = {
    title: "Dashboard",
    showSearch: false,
    showFilters: false
  }

  if (isLoading || projectsLoading) {
    return (
      <Layout >
        <div className="p-8 text-center text-muted-foreground">
          Cargando dashboard del proyecto...
        </div>
      </Layout>
    )
  }

  if (!currentProject) {
    return (
      <Layout >
        <div className="p-8 text-center text-muted-foreground">
          <Folder className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-sm font-medium mb-1">No hay proyecto seleccionado</h3>
          <p className="text-xs">Selecciona un proyecto para ver el dashboard</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout >
      <div className="space-y-6">
        {/* Header del proyecto */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Folder className="w-12 h-12 text-muted-foreground" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-2xl">{currentProject.name}</CardTitle>
                    <Badge 
                      variant={currentProject.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {currentProject.status === 'active' ? 'Activo' : 
                       currentProject.status === 'planning' ? 'Planificación' : 
                       currentProject.status === 'completed' ? 'Completado' : 
                       currentProject.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Creado el {format(new Date(currentProject.created_at), 'dd/MM/yyyy', { locale: es })}
                    </span>
                    {currentProject.project_data?.project_type?.name && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {currentProject.project_data.project_type.name}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Información del proyecto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipología</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.project_data?.project_type?.name || 'No especificado'}
              </div>
              <p className="text-xs text-muted-foreground">
                Tipo de proyecto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Modalidad</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.project_data?.modality?.name || 'No especificado'}
              </div>
              <p className="text-xs text-muted-foreground">
                Modalidad de ejecución
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentProject.status === 'active' ? 'Activo' : 
                 currentProject.status === 'planning' ? 'Planificación' : 
                 currentProject.status === 'completed' ? 'Completado' : 
                 currentProject.status}
              </div>
              <p className="text-xs text-muted-foreground">
                Estado actual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accesos rápidos a etapas */}
        <Card>
          <CardHeader>
            <CardTitle>Etapas del Proyecto</CardTitle>
            <CardDescription>
              Accede a las diferentes etapas de desarrollo del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Folder className="w-6 h-6 text-blue-500" />
                  <h3 className="font-medium">Proyecto</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Datos generales, moodboard y documentación de diseño
                </p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Building className="w-6 h-6 text-orange-500" />
                  <h3 className="font-medium">Obra</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestión de tareas, bitácora y seguimiento de obra
                </p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-6 h-6 text-green-500 text-xl">$</span>
                  <h3 className="font-medium">Finanzas</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Control de movimientos, presupuestos y gastos
                </p>
              </div>

              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-6 h-6 text-purple-500" />
                  <h3 className="font-medium">Comercialización</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gestión de clientes, ventas y marketing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}