import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link as WouterLink } from "wouter";
import { Edit, ArrowLeft, Plus, FileText, ListTodo } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { SidebarTypes } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectTransactionsSummary } from "@/components/projects/ProjectTransactionsSummary";

import { Project, Budget } from "@shared/schema";
import { PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

interface ProjectDetailsPageProps {
  projectId: string;
}

export default function ProjectDetailsPage({ projectId }: ProjectDetailsPageProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!user && !!projectId,
  });

  // Fetch project budgets
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery<Budget[]>({
    queryKey: [`/api/projects/${projectId}/budgets`],
    enabled: !!user && !!projectId,
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-blue-500 hover:bg-blue-600";
      case "inProgress":
        return "bg-amber-500 hover:bg-amber-600";
      case "completed":
        return "bg-green-500 hover:bg-green-600";
      case "onHold":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return "-";
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat("es", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Forzamos el tipo de sidebar a ProjectSidebar
  useEffect(() => {
    console.log("Setting ProjectSidebar for project:", projectId);
  }, [projectId]);

  return (
    <MainLayout
      sidebarType={SidebarTypes.ProjectSidebar}
      selectedProject={projectId}
    >
      <div className="px-4 md:px-6 py-4">
        {/* Back button and actions */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/projects")}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Proyectos
          </Button>
          
          {!isLoadingProject && project && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => setLocation(`/projects/${projectId}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar Proyecto
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setLocation(`/projects/${projectId}/budgets/new`)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Presupuesto
              </Button>
            </div>
          )}
        </div>

        {/* Project details */}
        {isLoadingProject ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : project ? (
          <>
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <Badge className={getStatusBadgeColor(project.status)}>
                {PROJECT_STATUS_OPTIONS.find((option) => option.value === project.status)?.label || project.status}
              </Badge>
              {project.description && (
                <p className="mt-4 text-gray-600">{project.description}</p>
              )}
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Creado:</span>{" "}
                  {formatDate(project.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Última actualización:</span>{" "}
                  {formatDate(project.updatedAt)}
                </div>
              </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-8">
              <TabsList>
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="budgets">Presupuestos</TabsTrigger>
                <TabsTrigger value="materials">Lista de Materiales</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del Proyecto</CardTitle>
                    <CardDescription>Información general sobre el proyecto y su estado actual.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Estadísticas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-3xl font-bold mb-1">{budgets.length}</div>
                              <div className="text-sm text-gray-500">Presupuestos</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-3xl font-bold mb-1">0</div>
                              <div className="text-sm text-gray-500">Materiales Totales</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-3xl font-bold mb-1">$0</div>
                              <div className="text-sm text-gray-500">Costo Estimado</div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      {/* Agregar el resumen de transacciones */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Movimientos del Proyecto</h3>
                        <ProjectTransactionsSummary projectId={projectId} />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Actividad Reciente</h3>
                        <div className="text-gray-500 italic">
                          No hay actividad reciente para mostrar.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="budgets" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Presupuestos</CardTitle>
                      <CardDescription>Lista de presupuestos asociados a este proyecto.</CardDescription>
                    </div>
                    <Button 
                      onClick={() => setLocation(`/projects/${projectId}/budgets/new`)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Presupuesto
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBudgets ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : budgets.length === 0 ? (
                      <div className="text-center py-12 border rounded-md">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Sin presupuestos</h3>
                        <p className="text-gray-500 mb-4">No hay presupuestos creados para este proyecto.</p>
                        <Button 
                          onClick={() => setLocation(`/projects/${projectId}/budgets/new`)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Crear Presupuesto
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {budgets.map((budget) => (
                          <Card key={budget.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h3 className="font-medium text-lg">{budget.name}</h3>
                                  <p className="text-sm text-gray-500">
                                    Creado el {formatDate(budget.createdAt)}
                                  </p>
                                </div>
                                <Button 
                                  className="bg-primary hover:bg-primary/90 text-white"
                                  size="sm"
                                  onClick={() => setLocation(`/budgets/${budget.id}`)}
                                >
                                  Ver Detalles
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="materials" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Lista de Materiales</CardTitle>
                      <CardDescription>Resumen de todos los materiales necesarios para este proyecto.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 border rounded-md">
                      <ListTodo className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Lista de Materiales Vacía</h3>
                      <p className="text-gray-500 mb-4">
                        Añade presupuestos al proyecto para generar automáticamente la lista de materiales.
                      </p>
                      <Button 
                        onClick={() => setLocation(`/projects/${projectId}/budgets/new`)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Presupuesto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-bold mb-2">Proyecto no encontrado</h2>
            <p className="text-gray-600 mb-6">
              No se pudo encontrar el proyecto solicitado. Es posible que haya sido eliminado o que no tengas permisos para verlo.
            </p>
            <Button onClick={() => setLocation("/projects")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Proyectos
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}