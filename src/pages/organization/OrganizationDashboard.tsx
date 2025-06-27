import { useEffect } from 'react';
import { Building2, FolderOpen, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function OrganizationDashboard() {
  const { setContext } = useSidebarStore();
  const { data: userData } = useCurrentUser();

  useEffect(() => {
    setContext('organization');
  }, [setContext]);

  const organization = userData?.organization;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Resumen de la Organización</h1>
          <p className="text-muted-foreground">
            Vista general de {organization?.name || 'tu organización'}
          </p>
        </div>

        {/* Organization Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {organization?.name || 'Organización'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Creada</p>
                <p className="font-medium">
                  {organization?.created_at 
                    ? new Date(organization.created_at).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="secondary">
                  {organization?.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{organization?.plan?.name || 'Sin plan'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proyectos</p>
                <p className="font-medium">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sin proyectos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Miembros del Equipo</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">Miembro activo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contactos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Sin contactos registrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay actividad reciente para mostrar.</p>
              <p className="text-sm mt-2">
                La actividad aparecerá aquí cuando comiences a usar la plataforma.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}