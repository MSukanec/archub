import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { Layout } from "@/components/layout/desktop/Layout";
import { Building, Users, BarChart3, FileText, ArrowRight, Zap } from "lucide-react";

export default function DashboardHome() {
  const [, navigate] = useLocation();
  const { data: userData, isLoading } = useCurrentUser();
  const { setSidebarContext } = useNavigationStore();

  useEffect(() => {
    setSidebarContext('organization');
  }, [setSidebarContext]);

  const quickActions = [
    {
      title: "Ver Organización",
      description: "Gestiona tu organización y miembros",
      icon: Building,
      color: "bg-blue-500",
      action: () => navigate('/organization'),
    },
    {
      title: "Gestionar Proyectos",
      description: "Crea y administra proyectos",
      icon: FileText,
      color: "bg-green-500",
      action: () => navigate('/projects'),
    },
    {
      title: "Ver Finanzas",
      description: "Controla presupuestos y gastos",
      icon: BarChart3,
      color: "bg-purple-500",
      action: () => navigate('/finances'),
    },
    {
      title: "Gestionar Equipo",
      description: "Administra usuarios y roles",
      icon: Users,
      color: "bg-orange-500",
      action: () => navigate('/organization'),
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerProps={{
        title: "Panel Principal",
        description: "Bienvenido a tu espacio de trabajo",
      }}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-accent/20 rounded-lg">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  ¡Bienvenido, {userData?.user_data?.first_name || userData?.user?.full_name || 'Usuario'}!
                </CardTitle>
                <CardDescription className="text-base">
                  Tu centro de control para gestión de construcción
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Desde aquí puedes acceder a todas las herramientas para gestionar tus proyectos, 
              equipos y finanzas de manera eficiente.
            </p>
            <Button onClick={() => navigate('/organization')}>
              Explorar organización
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={action.action}
                >
                  <CardHeader className="pb-3">
                    <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Organization Status */}
        {userData?.organization && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Estado de la organización</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Organización:</span>
                  <span className="font-medium">{userData.organization.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plan:</span>
                  <span className="font-medium capitalize">{userData.organization.plan || 'Básico'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-xs font-medium">
                    Activa
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Primeros pasos</CardTitle>
            <CardDescription>
              Te recomendamos seguir estos pasos para configurar tu espacio de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <span className="text-sm">Cuenta creada y verificada</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <span className="text-sm">Organización configurada</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">2</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-sm"
                  onClick={() => navigate('/projects')}
                >
                  Crear tu primer proyecto
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">3</span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 text-sm"
                  onClick={() => navigate('/organization')}
                >
                  Invitar miembros del equipo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}