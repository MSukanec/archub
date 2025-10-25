import { useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/desktop/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useProjectContext } from "@/stores/projectContext";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useToast } from "@/hooks/use-toast";
import { 
  Home as HomeIcon, 
  Building, 
  FolderOpen, 
  GraduationCap, 
  Crown,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const [, navigate] = useLocation();
  const { data: userData, isLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  const { selectedProjectId } = useProjectContext();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();

  const currentDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const greeting = getGreeting();

  // Mantener el sidebar en modo general
  useEffect(() => {
    setSidebarLevel('general');
  }, [setSidebarLevel]);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 20) return "Buenas tardes";
    return "Buenas noches";
  }

  const sections = [
    {
      id: 'organization',
      title: 'Organización',
      description: 'Gestión empresarial',
      icon: Building,
      color: 'from-blue-500/10 to-blue-600/5',
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: () => {
        setSidebarLevel('organization');
        navigate('/organization/dashboard');
      }
    },
    {
      id: 'project',
      title: 'Proyecto',
      description: 'Gestión de obras',
      icon: FolderOpen,
      color: 'from-green-500/10 to-green-600/5',
      iconColor: 'text-green-600 dark:text-green-400',
      onClick: () => {
        if (!selectedProjectId) {
          toast({
            title: "No hay proyecto seleccionado",
            description: "Selecciona un proyecto desde la sección Organización",
            variant: "destructive"
          });
          return;
        }
        setSidebarLevel('project');
        navigate('/project/dashboard');
      }
    },
    {
      id: 'learning',
      title: 'Capacitaciones',
      description: 'Cursos y formación',
      icon: GraduationCap,
      color: 'from-purple-500/10 to-purple-600/5',
      iconColor: 'text-purple-600 dark:text-purple-400',
      onClick: () => {
        setSidebarLevel('learning');
        navigate('/learning/dashboard');
      }
    },
  ];

  if (isAdmin) {
    sections.push({
      id: 'admin',
      title: 'Administración',
      description: 'Panel de control',
      icon: Crown,
      color: 'from-yellow-500/10 to-yellow-600/5',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      onClick: () => {
        setSidebarLevel('admin');
        navigate('/admin/community');
      }
    });
  }

  if (isLoading) {
    return (
      <Layout wide={true}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando...</div>
        </div>
      </Layout>
    );
  }

  const headerProps = {
    icon: HomeIcon,
    title: "Inicio"
  };

  return (
    <Layout headerProps={headerProps} wide={true}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">
            {greeting}, {userData?.user_data?.first_name || 'Usuario'}
          </h2>
          <p className="text-muted-foreground capitalize">
            {currentDate}
          </p>
        </div>

        {/* Quick Access Sections */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-4">Secciones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => (
              <Card
                key={section.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-accent/50"
                onClick={section.onClick}
                data-testid={`section-card-${section.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                        <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">
                          {section.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Optional: Quick Stats or Info */}
        {userData?.organization && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {userData.organization.logo_url ? (
                  <img 
                    src={userData.organization.logo_url} 
                    alt={userData.organization.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-accent/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border-2 border-accent/20">
                    <Building className="w-6 h-6 text-accent" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Organización</p>
                  <h4 className="text-lg font-semibold text-foreground">
                    {userData.organization.name}
                  </h4>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
