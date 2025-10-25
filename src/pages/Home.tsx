import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/desktop/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useNavigationStore } from "@/stores/navigationStore";
import { useProjectContext } from "@/stores/projectContext";
import { useIsAdmin } from "@/hooks/use-admin-permissions";
import { useToast } from "@/hooks/use-toast";
import { useProjects } from "@/hooks/use-projects";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { 
  Home as HomeIcon, 
  CheckCircle2,
  Circle,
  Sparkles,
  Play,
  Plus,
  CheckSquare,
  FileUp,
  UserPlus,
  FolderOpen,
  Clock,
  GraduationCap,
  MessageSquare,
  ExternalLink,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  project_name: string;
  assigned_to: string;
  due_date: string | null;
}

export default function Home() {
  const [, navigate] = useLocation();
  const { data: userData, isLoading } = useCurrentUser();
  const { setSidebarLevel } = useNavigationStore();
  const { selectedProjectId, currentOrganizationId, setSelectedProject } = useProjectContext();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();

  const currentDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const greeting = getGreeting();

  // Estado para onboarding checklist (mock por ahora)
  const [onboardingSteps, setOnboardingSteps] = useState([
    { id: 1, label: "Crear primer proyecto", completed: false },
    { id: 2, label: "Crear primer contacto", completed: false },
    { id: 3, label: "Crear primer movimiento", completed: false },
  ]);

  // Determinar si es nuevo usuario (mock - luego usaremos datos reales)
  const isNewUser = true; // Cambiar según lógica real

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

  // Query para proyectos activos (datos reales)
  const { data: allProjects = [], isLoading: projectsLoading } = useProjects(currentOrganizationId || undefined);
  
  // Filtrar SOLO proyectos con estado "active"
  const filteredActiveProjects = allProjects.filter(project => project.status === 'active');
  
  // Ordenar: proyecto activo primero, luego los demás
  const activeProjects = filteredActiveProjects.sort((a, b) => {
    if (a.id === selectedProjectId) return -1;
    if (b.id === selectedProjectId) return 1;
    return 0;
  });

  // Mutación para cambiar el proyecto activo
  const selectProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!supabase || !userData?.user?.id || !currentOrganizationId) {
        throw new Error('Required data not available');
      }
      
      const { error } = await supabase
        .from('user_organization_preferences')
        .upsert({
          user_id: userData.user.id,
          organization_id: currentOrganizationId,
          last_project_id: projectId,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,organization_id'
        });
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      setSelectedProject(projectId, currentOrganizationId);
      
      queryClient.invalidateQueries({ 
        queryKey: ['user-organization-preferences', userData?.user?.id, currentOrganizationId] 
      });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      // Navegar al dashboard del proyecto
      setSidebarLevel('project');
      navigate('/project/dashboard');
      
      toast({
        title: "Proyecto activado",
        description: "El proyecto ha sido seleccionado correctamente",
      });
    },
    onError: (error) => {
      console.error('Error selecting project:', error);
      toast({
        title: "Error",
        description: "No se pudo seleccionar el proyecto",
        variant: "destructive"
      });
    }
  });

  // Query para tareas pendientes (mock por ahora)
  const { data: upcomingTasks = [] } = useQuery<Task[]>({
    queryKey: ['upcoming-tasks'],
    queryFn: async () => {
      // Mock data - reemplazar con API real
      return [];
    }
  });

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
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold text-foreground">
            {greeting}, {userData?.user_data?.first_name || 'Usuario'}
          </h2>
          <p className="text-muted-foreground capitalize">
            {currentDate}
          </p>
        </div>

        {/* Banner Principal */}
        {isNewUser ? (
          /* Banner de Onboarding */
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <CardTitle className="text-2xl">¡Bienvenido a Archub!</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Completa estos pasos para comenzar:
              </p>
              
              <div className="space-y-3">
                {onboardingSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/60 hover:bg-background/80 transition-colors cursor-pointer"
                    onClick={() => {
                      // Toggle completed state (mock)
                      setOnboardingSteps(steps => 
                        steps.map(s => s.id === step.id ? {...s, completed: !s.completed} : s)
                      );
                    }}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={cn(
                      "font-medium",
                      step.completed ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setSidebarLevel('learning');
                  navigate('/learning/dashboard');
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Ver lección de 5 min
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Banner de Novedades */
          <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Novedades de Archub</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Nueva funcionalidad: Gestión de Tareas Mejorada</h4>
                <p className="text-sm text-muted-foreground">
                  Ahora puedes asignar múltiples responsables, establecer dependencias entre tareas y recibir notificaciones automáticas.
                </p>
              </div>
              
              <Button variant="outline" className="w-full sm:w-auto">
                Ver más novedades
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Grid de 6 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Continuar donde lo dejaste */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-accent" />
                Continuar donde lo dejaste
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProjectId ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Seguí en <span className="font-medium text-foreground">Proyecto Ejemplo</span> · Dashboard
                  </p>
                  <Button className="w-full" onClick={() => {
                    setSidebarLevel('project');
                    navigate('/project/dashboard');
                  }}>
                    <Play className="w-4 h-4 mr-2" />
                    Continuar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No hay proyectos recientes
                  </p>
                  <Button className="w-full" onClick={() => {
                    setSidebarLevel('organization');
                    navigate('/organization/projects');
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear proyecto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Acciones rápidas */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Acciones rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => {
                    setSidebarLevel('organization');
                    navigate('/organization/projects');
                  }}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Crear proyecto</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => {
                    toast({ title: "Crear tarea", description: "Funcionalidad próximamente" });
                  }}
                >
                  <CheckSquare className="w-5 h-5" />
                  <span className="text-xs">Crear tarea</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => {
                    toast({ title: "Subir presupuesto", description: "Funcionalidad próximamente" });
                  }}
                >
                  <FileUp className="w-5 h-5" />
                  <span className="text-xs">Subir presup.</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-3 flex flex-col items-center gap-2"
                  onClick={() => {
                    setSidebarLevel('organization');
                    navigate('/organization/contacts');
                  }}
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="text-xs">Invitar miembro</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 3. Proyectos activos */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-accent" />
                Proyectos activos
              </CardTitle>
              <Button
                size="sm"
                onClick={() => {
                  setSidebarLevel('organization');
                  navigate('/organization/projects');
                }}
              >
                Ir a Proyectos
              </Button>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">Cargando proyectos...</p>
                </div>
              ) : activeProjects.length > 0 ? (
                <div className="space-y-3">
                  {activeProjects.slice(0, 4).map((project) => {
                    const isCurrentProject = project.id === selectedProjectId;
                    
                    return (
                      <div
                        key={project.id}
                        className={cn(
                          "p-3 rounded-lg hover:bg-accent/5 transition-colors cursor-pointer",
                          isCurrentProject ? "border-2" : "border"
                        )}
                        style={isCurrentProject ? { borderColor: 'hsl(var(--accent))' } : undefined}
                        onClick={() => {
                          selectProjectMutation.mutate(project.id);
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{project.name}</h4>
                          {isCurrentProject && (
                            <Badge 
                              style={{ backgroundColor: 'hsl(var(--accent))', color: 'white' }}
                              className="text-xs"
                            >
                              Activo
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {project.project_data?.project_type?.name || 'Sin tipo'} - {project.project_data?.modality?.name || 'Sin modalidad'}
                        </div>
                      </div>
                    );
                  })}
                  {activeProjects.length > 4 && (
                    <Button 
                      variant="link" 
                      className="w-full p-0 h-auto text-sm"
                      onClick={() => {
                        setSidebarLevel('organization');
                        navigate('/organization/projects');
                      }}
                    >
                      Ver todos los proyectos ({activeProjects.length}) →
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-3">
                    No hay proyectos activos
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSidebarLevel('organization');
                      navigate('/organization/projects');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear proyecto
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Tareas próximas */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-accent" />
                Tareas próximas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingTasks.length > 0 ? (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2 font-medium">Tarea</th>
                          <th className="text-left pb-2 font-medium">Proyecto</th>
                          <th className="text-left pb-2 font-medium">Responsable</th>
                          <th className="text-left pb-2 font-medium">Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingTasks.slice(0, 5).map((task) => (
                          <tr key={task.id} className="border-b last:border-0">
                            <td className="py-2">{task.title}</td>
                            <td className="py-2 text-muted-foreground">{task.project_name}</td>
                            <td className="py-2 text-muted-foreground">{task.assigned_to}</td>
                            <td className="py-2 text-muted-foreground">
                              {task.due_date ? format(new Date(task.due_date), 'dd/MM', { locale: es }) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button variant="link" className="w-full p-0 h-auto text-sm">
                    Ver todas las tareas →
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No hay tareas próximas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Academia */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-accent" />
                Academia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <h4 className="font-medium text-sm mb-1">Recomendado</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Primer presupuesto en 30 min
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSidebarLevel('learning');
                      navigate('/learning/dashboard');
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Ver curso
                  </Button>
                </div>
                <Button
                  variant="link"
                  className="w-full p-0 h-auto text-sm"
                  onClick={() => {
                    setSidebarLevel('learning');
                    navigate('/learning/dashboard');
                  }}
                >
                  Ir a Academia →
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 6. Comunidad / Feedback */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                Comunidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => window.open('https://discord.gg/your-discord', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Entrar a Discord
                </Button>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => toast({ title: "Sugerir idea", description: "Formulario próximamente" })}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Sugerir una idea
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => toast({ title: "Reportar bug", description: "Formulario próximamente" })}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Reportar un bug
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
