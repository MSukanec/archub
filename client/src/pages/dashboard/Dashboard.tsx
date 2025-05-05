import { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { SearchInput } from "@/components/common/SearchInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LucideFileText, LucidePackage, LucideCheckSquare } from "lucide-react";
import { DASHBOARD_TABS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch projects data
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
  });

  // Fetch materials data
  const { data: materials = [] } = useQuery({
    queryKey: ['/api/materials'],
  });

  // Fetch tasks data
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
  });

  // Sample stock images for projects
  const projectImages = [
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=600&h=300",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&h=300",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=600&h=300",
    "https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?auto=format&fit=crop&w=600&h=300"
  ];

  // Filter materials based on search term
  const filteredMaterials = materials.filter((material) => 
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter tasks based on search term
  const filteredTasks = tasks.filter((task) => 
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      {/* Main Content Tabs */}
      <Tabs 
        defaultValue="dashboard" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <div className="border-b border-gray-200">
          <TabsList className="-mb-px flex space-x-8">
            {DASHBOARD_TABS.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="border-primary text-primary data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700 data-[state=inactive]:hover:border-gray-300"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <StatsCard 
              title="Presupuestos Activos"
              value={projects.length}
              change={{ value: "12%", isPositive: true }}
              icon={<LucideFileText className="h-6 w-6" />}
              iconBackground="bg-green-100"
              iconColor="text-green-600"
            />
            
            <StatsCard 
              title="Total de Materiales"
              value={materials.length}
              change={{ value: "4%", isPositive: true }}
              icon={<LucidePackage className="h-6 w-6" />}
              iconBackground="bg-blue-100"
              iconColor="text-blue-600"
            />
            
            <StatsCard 
              title="Total de Tareas"
              value={tasks.length}
              change={{ value: "8%", isPositive: true }}
              icon={<LucideCheckSquare className="h-6 w-6" />}
              iconBackground="bg-indigo-100"
              iconColor="text-indigo-600"
            />
          </div>

          {/* Projects Grid */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Proyectos Recientes</h2>
              <Button 
                variant="link" 
                className="text-sm font-medium text-primary hover:text-primary-dark"
                onClick={() => setLocation('/projects')}
              >
                Ver todos
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {projects.slice(0, 3).map((project, index) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  totalBudget={8920000 / (index + 1)} // Mock budget data
                  status={project.status}
                  imageUrl={projectImages[index % projectImages.length]}
                  updatedAt={new Date(project.updatedAt)}
                  onClick={() => setLocation(`/projects/${project.id}`)}
                />
              ))}
            </div>
          </div>

          {/* Recent Materials Table */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Materiales Recientes</h2>
              <Button 
                variant="link" 
                className="text-sm font-medium text-primary hover:text-primary-dark"
                onClick={() => setActiveTab("materials")}
              >
                Ver todos
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Precio Unitario</TableHead>
                    <TableHead>Última Actualización</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.slice(0, 4).map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.name}</TableCell>
                      <TableCell>{material.category}</TableCell>
                      <TableCell>{material.unit}</TableCell>
                      <TableCell>${Number(material.unitPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(material.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => setLocation(`/materials/${material.id}/edit`)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Recent Tasks Table */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Tareas de Obra Recientes</h2>
              <Button 
                variant="link" 
                className="text-sm font-medium text-primary hover:text-primary-dark"
                onClick={() => setActiveTab("tasks")}
              >
                Ver todas
              </Button>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarea</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Materiales</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.slice(0, 4).map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{task.category}</TableCell>
                      <TableCell>{task.unit}</TableCell>
                      <TableCell>${Number(task.unitPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        {/* We'd fetch task materials count here in a real app */}
                        {Math.floor(Math.random() * 5) + 1} materiales
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="link"
                          className="text-primary hover:text-primary-dark"
                          onClick={() => setLocation(`/tasks/${task.id}/edit`)}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Materiales Unitarios</h2>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setLocation('/materials/new')}
              >
                Agregar Material
              </Button>
            </div>
            
            <div className="mb-4">
              <SearchInput 
                placeholder="Buscar materiales..." 
                onSearch={setSearchTerm}
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Última Actualización</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.name}</TableCell>
                        <TableCell>{material.category}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>${Number(material.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(material.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="link"
                            className="text-primary hover:text-primary-dark"
                            onClick={() => setLocation(`/materials/${material.id}/edit`)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredMaterials.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          No se encontraron materiales
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Tareas de Obra</h2>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setLocation('/tasks/new')}
              >
                Agregar Tarea
              </Button>
            </div>
            
            <div className="mb-4">
              <SearchInput 
                placeholder="Buscar tareas..." 
                onSearch={setSearchTerm}
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarea</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Materiales</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>{task.category}</TableCell>
                        <TableCell>{task.unit}</TableCell>
                        <TableCell>${Number(task.unitPrice).toFixed(2)}</TableCell>
                        <TableCell>
                          {/* We'd fetch task materials count here in a real app */}
                          {Math.floor(Math.random() * 5) + 1} materiales
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="link"
                            className="text-primary hover:text-primary-dark"
                            onClick={() => setLocation(`/tasks/${task.id}/edit`)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTasks.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                          No se encontraron tareas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budgets">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Presupuestos</h2>
              <Button 
                variant="default" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setLocation('/budgets/new')}
              >
                Crear Presupuesto
              </Button>
            </div>
            
            {/* Budgets would be listed here */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              Selecciona un proyecto para ver sus presupuestos
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
