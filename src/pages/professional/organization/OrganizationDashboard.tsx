import { useEffect } from "react";
import { Building, Plus, Users, DollarSign, CheckSquare, FileText, HardHat, Receipt, Clock, Calendar, Kanban, Home } from "lucide-react";
import { useLocation } from 'wouter';

import { Layout } from '@/components/layout/desktop/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui-custom/CustomButton";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OrganizationDashboard() {
  const [, setLocation] = useLocation();
  
  const { data: userData, isLoading } = useCurrentUser();
  const { setShowActionBar } = useActionBarMobile();
  const isMobile = useMobile();
  
  // Usar la organización actual del usuario
  const organization = userData?.organization;
  const currentTime = new Date();


  // Dashboard no debe mostrar action bar
  useEffect(() => {
    if (isMobile) {
      setShowActionBar(false);
    }
  }, [isMobile, setShowActionBar]);

  if (isLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando organización...</div>
        </div>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Organización no encontrada</div>
        </div>
      </Layout>
    );
  }

  const headerProps = {
    icon: <Home className="w-5 h-5" />,
    title: "Dashboard"
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-6">
        {/* Welcome Card - Full Width */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent"></div>
          <CardContent className="relative p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6">
              {/* Organization Avatar */}
              <div className="flex-shrink-0">
                {organization?.logo_url ? (
                  <img 
                    src={organization.logo_url} 
                    alt={organization.name}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-accent/20"
                  />
                ) : (
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                    <Building className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                  </div>
                )}
              </div>

              {/* Welcome Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="mb-2">
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    ¡Bienvenido a {organization?.name || 'tu organización'}!
                  </h1>
                </div>
                <p className="text-muted-foreground text-sm md:text-base mb-3">
                  Estás gestionando las operaciones de construcción. Desde aquí puedes acceder rápidamente a todas las funciones principales.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(currentTime, "HH:mm", { locale: es })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-center sm:text-left">{format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                onClick={() => setLocation('/profile/projects')}
              />
              <CustomButton
                icon={Users}
                title="Crear un nuevo contacto"
                description="Agrega un nuevo cliente o proveedor"
                onClick={() => setLocation('/organization/contacts')}
              />
              <CustomButton
                icon={DollarSign}
                title="Crear un nuevo movimiento"
                description="Registra un ingreso o egreso financiero"
                onClick={() => setLocation('/general/finances')}
              />
              <CustomButton
                icon={Kanban}
                title="Gestionar tablero de organización"
                description="Administra las tareas del tablero organizacional"
                onClick={() => setLocation('/recursos/board')}
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
                title="Gestionar cronograma"
                description="Administra tareas y cronograma del proyecto"
                onClick={() => setLocation('/construction/schedule')}
              />
              <CustomButton
                icon={FileText}
                title="Gestionar bitácoras"
                description="Registra el progreso y eventos del proyecto"
                onClick={() => setLocation('/construction/logs')}
              />
              <CustomButton
                icon={HardHat}
                title="Gestionar subcontratos"
                description="Administra subcontratistas y sus tareas"
                onClick={() => setLocation('/construction/subcontracts')}
              />
              <CustomButton
                icon={Receipt}
                title="Gestionar presupuestos"
                description="Administra costos y presupuestos del proyecto"
                onClick={() => setLocation('/construction/budgets')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}