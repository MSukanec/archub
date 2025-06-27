import { useEffect } from 'react';
import { FolderOpen, Calendar, DollarSign, HardHat, Palette, FileText } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function ProjectDashboard() {
  const { setContext } = useSidebarStore();
  const { data: userData } = useCurrentUser();

  useEffect(() => {
    setContext('project');
  }, [setContext]);

  // For now, we'll use placeholder project data until the project data structure is available
  const project = {
    name: 'Proyecto Actual',
    created_at: new Date().toISOString(),
    status: 'En Progreso',
    project_data: {
      typology: { name: 'Residencial' },
      modality: { name: 'Llave en Mano' }
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Dashboard del Proyecto</h1>
          <p className="text-muted-foreground">
            Vista general de {project?.name || 'tu proyecto'}
          </p>
        </div>

        {/* Project Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              {project?.name || 'Proyecto'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Inicio</p>
                <p className="font-medium">
                  {project?.created_at 
                    ? new Date(project.created_at).toLocaleDateString()
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant="secondary">
                  {project?.status || 'En Planificación'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">{project?.project_data?.typology?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modalidad</p>
                <p className="font-medium">{project?.project_data?.modality?.name || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso de Obra</CardTitle>
              <HardHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Proyecto en inicio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">Sin movimientos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Días Activo</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project?.created_at 
                  ? Math.floor((new Date().getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24))
                  : 0
                }
              </div>
              <p className="text-xs text-muted-foreground">Desde la creación</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Diseño</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="w-12 h-12 mx-auto mb-4" />
                <p>Sin documentos de diseño</p>
                <Button variant="outline" className="mt-4">
                  Subir Documentos
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bitácora de Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                <p>Sin entradas de bitácora</p>
                <Button variant="outline" className="mt-4">
                  Nueva Entrada
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}