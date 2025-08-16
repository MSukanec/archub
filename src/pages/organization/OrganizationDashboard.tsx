import { Layout } from "@/components/layout/desktop/Layout";
import { Building, Plus, Users, DollarSign, CheckSquare, FileText, HardHat, Receipt, Clock, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/CustomButton";
import { useGlobalModalStore } from "@/components/modal/form/useGlobalModalStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UpcomingTasksTimeline } from "@/components/charts/dashboard/UpcomingTasksTimeline";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OrganizationDashboard() {
  const { openModal } = useGlobalModalStore();
  const { data: userData } = useCurrentUser();
  
  const organization = userData?.organization;
  const currentTime = new Date();

  const headerProps = {
    title: "Resumen de Organización",
    icon: Building,
    breadcrumb: [
      { name: "Organización", href: "/organization/dashboard" }
    ],
    showSearch: false,
    showFilters: false,
  };

  return (
    <Layout headerProps={headerProps} wide>
      <div className="space-y-6">
        {/* Welcome Card - Full Width */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center gap-6">
              {/* Organization Avatar */}
              <div className="flex-shrink-0">
                {organization?.logo_url ? (
                  <img 
                    src={organization.logo_url} 
                    alt={organization.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-accent/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                    <Building className="w-8 h-8 text-accent" />
                  </div>
                )}
              </div>

              {/* Welcome Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">
                    ¡Bienvenido a {organization?.name || 'tu organización'}!
                  </h1>
                </div>
                <p className="text-muted-foreground mb-3">
                  Estás gestionando las operaciones de construcción. Desde aquí puedes acceder rápidamente a todas las funciones principales.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(currentTime, "HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex-shrink-0">
                <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Sistema Activo
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Tareas Próximas */}
        <UpcomingTasksTimeline />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acciones Rápidas de Organización */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Acciones Rápidas de Organización
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CustomButton
                icon={Plus}
                title="Crear un nuevo proyecto"
                description="Inicia un nuevo proyecto de construcción"
                onClick={() => openModal('project', {})}
              />
              <CustomButton
                icon={Users}
                title="Crear un nuevo contacto"
                description="Agrega un nuevo cliente o proveedor"
                onClick={() => openModal('contact', {})}
              />
              <CustomButton
                icon={DollarSign}
                title="Crear un nuevo movimiento"
                description="Registra un ingreso o egreso financiero"
                onClick={() => openModal('movement', {})}
              />
              <CustomButton
                icon={CheckSquare}
                title="Crear una nueva tarea"
                description="Agrega una tarea administrativa"
                onClick={() => openModal('construction-task', {})}
              />
            </CardContent>
          </Card>

          {/* Acciones Rápidas de Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                Acciones Rápidas de Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CustomButton
                icon={CheckSquare}
                title="Crear una nueva tarea"
                description="Agrega una tarea de construcción al proyecto activo"
                onClick={() => openModal('construction-task', {})}
              />
              <CustomButton
                icon={FileText}
                title="Crear una nueva bitácora"
                description="Registra el progreso y eventos del proyecto"
                onClick={() => openModal('site-log', {})}
              />
              <CustomButton
                icon={HardHat}
                title="Crear un nuevo subcontrato"
                description="Gestiona subcontratistas y trabajos externos"
                onClick={() => openModal('subcontract', {})}
              />
              <CustomButton
                icon={Receipt}
                title="Crear un nuevo presupuesto"
                description="Estima costos para el proyecto"
                onClick={() => openModal('budget', {})}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
