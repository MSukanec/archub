import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Project } from "@shared/schema";
import { PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Filter projects based on search term
  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    const statusOption = PROJECT_STATUS_OPTIONS.find((option) => option.value === status);
    if (!statusOption) return "bg-gray-500";
    
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

  return (
    <MainLayout>
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <Button onClick={() => setLocation("/projects/new")} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Lista de Proyectos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <Search className="mr-2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar proyectos..."
                className="max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoadingProjects ? (
              <div className="text-center py-8">Cargando proyectos...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No se encontraron proyectos que coincidan con la búsqueda" : "No hay proyectos disponibles. Crea uno nuevo para comenzar."}
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Creado</TableHead>
                      <TableHead>Actualizado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow 
                        key={project.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setLocation(`/projects/${project.id}`)}
                      >
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{project.description || "—"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(project.status)}>
                            {PROJECT_STATUS_OPTIONS.find((option) => option.value === project.status)?.label || project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(project.createdAt)}</TableCell>
                        <TableCell>{formatDate(project.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              className="bg-primary hover:bg-primary/90 text-white"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/projects/${project.id}`);
                              }}
                            >
                              Ver Detalles
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("¿Estás seguro de que deseas eliminar este proyecto?")) {
                                  // Lógica para eliminar el proyecto
                                  fetch(`/api/projects/${project.id}`, {
                                    method: 'DELETE',
                                  }).then(() => {
                                    // Refrescar la lista de proyectos
                                    window.location.reload();
                                  });
                                }
                              }}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
