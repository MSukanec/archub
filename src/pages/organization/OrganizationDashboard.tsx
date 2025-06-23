import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjects } from '@/hooks/use-projects'
import { useContacts } from '@/hooks/use-contacts'
import { Building, Users, Folder, TrendingUp, Calendar, Crown } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function OrganizationDashboard() {
  const { data: userData, isLoading } = useCurrentUser()
  const { data: projects = [], isLoading: projectsLoading } = useProjects(userData?.organization?.id)
  const { data: contacts = [], isLoading: contactsLoading } = useContacts(userData?.organization?.id)

  const organization = userData?.organization

  // Calcular estadísticas
  const activeProjects = projects.filter(p => p.status === 'active').length
  const totalProjects = projects.length
  const totalContacts = contacts.length
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
  const recentContacts = contacts
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  const headerProps = {
    title: "Dashboard",
    showSearch: false,
    showFilters: false
  }

  if (isLoading || projectsLoading || contactsLoading) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          Cargando dashboard...
        </div>
      </Layout>
    )
  }

  if (!organization) {
    return (
      <Layout headerProps={headerProps}>
        <div className="p-8 text-center text-muted-foreground">
          <Building className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <h3 className="text-sm font-medium mb-1">No hay organización seleccionada</h3>
          <p className="text-xs">Selecciona una organización para ver el dashboard</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Header de organización */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="text-lg font-bold">
                  {organization.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{organization.name}</h1>
                  {organization.is_active && (
                    <Badge variant="default" className="text-xs">
                      Activa
                    </Badge>
                  )}
                  {organization.is_system && (
                    <Badge variant="outline" className="text-xs">
                      Sistema
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Creada el {format(new Date(organization.created_at), 'dd/MM/yyyy', { locale: es })}
                </p>
                {userData?.plan && (
                  <div className="flex items-center gap-2 mt-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{userData.plan.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ${userData.plan.price}/mes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Totales</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {activeProjects} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contactos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContacts}</div>
              <p className="text-xs text-muted-foreground">
                Total registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(((activeProjects / totalProjects) * 100) || 0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Proyectos activos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proyectos recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proyectos Recientes</CardTitle>
              <CardDescription>
                Los últimos proyectos creados en la organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentProjects.length > 0 ? (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Folder className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.project_data?.project_type?.name || 'Sin especificar'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={project.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {project.status === 'active' ? 'Activo' : 
                           project.status === 'planning' ? 'Planificación' : 
                           project.status === 'completed' ? 'Completado' : 
                           project.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(project.created_at), 'dd/MM', { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay proyectos aún</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contactos recientes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contactos Recientes</CardTitle>
              <CardDescription>
                Los últimos contactos agregados a la organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentContacts.length > 0 ? (
                <div className="space-y-4">
                  {recentContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {(contact.first_name.charAt(0) + contact.last_name.charAt(0)).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {contact.company_name && (
                          <p className="text-xs font-medium">{contact.company_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(contact.created_at), 'dd/MM', { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No hay contactos aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Membresías */}
        {userData?.memberships && userData.memberships.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Miembros de la Organización</CardTitle>
              <CardDescription>
                Usuarios con acceso a esta organización
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.memberships
                  .filter(membership => membership.organization_id === organization.id)
                  .map((membership) => (
                    <div key={membership.organization_id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {membership.organization_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{membership.organization_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {membership.role.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Desde {format(new Date(membership.joined_at), 'MMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}