import { Layout } from "@/components/layout/desktop/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Users, BarChart3, FileText, Settings, Plus } from "lucide-react";
import { Link } from "wouter";
import { useCurrentUser } from "@/hooks/use-current-user";

const quickActions = [
  {
    title: "Ir a Organización",
    description: "Gestiona tu organización y proyectos",
    icon: Building,
    href: "/organization",
    color: "bg-blue-500"
  },
  {
    title: "Ver Proyectos", 
    description: "Administra todos tus proyectos",
    icon: FileText,
    href: "/projects",
    color: "bg-green-500"
  },
  {
    title: "Finanzas",
    description: "Revisa movimientos y presupuestos",
    icon: BarChart3,
    href: "/finances",
    color: "bg-purple-500"
  },
  {
    title: "Mi Perfil",
    description: "Configura tu cuenta y preferencias",
    icon: Settings,
    href: "/profile",
    color: "bg-gray-500"
  }
];

const headerProps = {
  title: "Panel Principal",
  description: "Accede rápidamente a todas las secciones de Archub"
};

export default function DashboardHome() {
  const { data: userData } = useCurrentUser();

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ¡Bienvenido{userData?.user_data?.first_name ? `, ${userData.user_data.first_name}` : ''}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestiona tus proyectos de construcción de manera eficiente
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="text-center pb-4">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pt-0">
                    <p className="text-muted-foreground text-sm">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Tu actividad reciente aparecerá aquí
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/organization/projects">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Proyecto
                </Button>
              </Link>
              <Link href="/finances/movements">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Movimiento
                </Button>
              </Link>
              <Link href="/construction/logs">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Entrada de Bitácora
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}