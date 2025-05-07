import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DASHBOARD_TABS } from "@/lib/constants";
import { ArrowUp, ArrowDown, TrendingUp, Layers, Package, FileText, Clock, Calendar, DollarSign } from "lucide-react";

// Datos de demostración
const mostUsedMaterials = [
  { name: "Ladrillos", value: 1200, unit: "unidades", color: "#FF6B6B" },
  { name: "Cemento", value: 850, unit: "kg", color: "#4ECDC4" },
  { name: "Arena", value: 750, unit: "kg", color: "#FFD166" },
  { name: "Hierro", value: 500, unit: "kg", color: "#6A0572" },
  { name: "Cal", value: 300, unit: "kg", color: "#5E60CE" },
];

const projectsProgress = [
  { name: "Casa de Ejemplo", progress: 65, budget: 1200000, spent: 780000 },
  { name: "Edificio Gurruchaga", progress: 25, budget: 3500000, spent: 875000 },
  { name: "Casa Dos", progress: 10, budget: 950000, spent: 95000 },
];

const monthlySpendings = [
  { month: "Ene", amount: 150000 },
  { month: "Feb", amount: 180000 },
  { month: "Mar", amount: 250000 },
  { month: "Abr", amount: 300000 },
  { month: "May", amount: 280000 },
  { month: "Jun", amount: 350000 },
  { month: "Jul", amount: 450000 },
];

const tasksByCategory = [
  { name: "Mampostería", completed: 24, pending: 8 },
  { name: "Estructura", completed: 18, pending: 4 },
  { name: "Acabados", completed: 12, pending: 16 },
  { name: "Plomería", completed: 8, pending: 6 },
  { name: "Eléctrica", completed: 10, pending: 4 },
];

const upcomingTasks = [
  { id: 1, name: "Columna de Hormigón Armado", project: "Casa de Ejemplo", dueDate: "2025-05-08", status: "pending" },
  { id: 2, name: "Instalación de Cañerías", project: "Edificio Gurruchaga", dueDate: "2025-05-10", status: "pending" },
  { id: 3, name: "Pintura Interior", project: "Casa Dos", dueDate: "2025-05-12", status: "pending" },
  { id: 4, name: "Colocación de Pisos", project: "Casa de Ejemplo", dueDate: "2025-05-15", status: "pending" },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState("month");

  // Formatear números a moneda Argentina
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-500">Una visión general de tus proyectos y materiales</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Select defaultValue={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="quarter">Este trimestre</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md mb-4">
            {DASHBOARD_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* Dashboard general */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Resumen numérico */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Proyectos Activos</p>
                      <h3 className="text-2xl font-bold mt-1">3</h3>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        <span>+1 nuevo este mes</span>
                      </p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Layers className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total de Materiales</p>
                      <h3 className="text-2xl font-bold mt-1">86</h3>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        <span>+12 agregados recientemente</span>
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Package className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tareas Pendientes</p>
                      <h3 className="text-2xl font-bold mt-1">38</h3>
                      <p className="text-xs text-red-600 flex items-center mt-1">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        <span>5 atrasadas</span>
                      </p>
                    </div>
                    <div className="p-2 bg-red-100 rounded-full">
                      <Clock className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Presupuesto Utilizado</p>
                      <h3 className="text-2xl font-bold mt-1">{formatCurrency(1750000)}</h3>
                      <p className="text-xs text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>31% del total</span>
                      </p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos principales */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Gastos Mensuales</CardTitle>
                  <CardDescription>Evolución de los gastos durante el año</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlySpendings}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis
                          tickFormatter={(value) => 
                            new Intl.NumberFormat("es-AR", {
                              notation: "compact",
                              compactDisplay: "short",
                              currency: "ARS"
                            }).format(value)
                          }
                        />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(value as number), "Gasto"]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="amount" 
                          name="Gasto"
                          stroke="#92c900" 
                          strokeWidth={2}
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Materiales Más Utilizados</CardTitle>
                  <CardDescription>Los 5 materiales más utilizados en todos los proyectos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mostUsedMaterials}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {mostUsedMaterials.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const material = props.payload;
                            return [`${value} ${material.unit}`, material.name];
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progreso de proyectos */}
            <Card>
              <CardHeader>
                <CardTitle>Progreso de Proyectos</CardTitle>
                <CardDescription>Estado actual de los proyectos en curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projectsProgress.map((project) => (
                    <div key={project.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            <span>{formatCurrency(project.spent)}</span>
                            <span>/</span>
                            <span>{formatCurrency(project.budget)}</span>
                            <span className="text-xs ml-2">
                              ({Math.round((project.spent / project.budget) * 100)}% del presupuesto)
                            </span>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {project.progress}%
                        </div>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tareas por categoría y próximas tareas */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tareas por Categoría</CardTitle>
                  <CardDescription>Distribución de tareas por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={tasksByCategory}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="completed" name="Completadas" stackId="a" fill="#92c900" />
                        <Bar dataKey="pending" name="Pendientes" stackId="a" fill="#ff6b6b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Próximas Tareas</CardTitle>
                  <CardDescription>Tareas programadas para los próximos días</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => {
                      // Calcular días restantes
                      const dueDate = new Date(task.dueDate);
                      const today = new Date();
                      const diffTime = dueDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-gray-500">{task.project}</p>
                          </div>
                          <div className="text-sm flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <span className={diffDays <= 3 ? "text-red-500 font-medium" : "text-gray-500"}>
                              {diffDays > 0 ? `${diffDays} día${diffDays !== 1 ? 's' : ''}` : 'Hoy'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Materiales */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Materiales</CardTitle>
                <CardDescription>Información detallada sobre el uso de materiales en todos los proyectos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-2xl font-medium text-gray-500">
                    Selecciona "Dashboard" para ver un resumen de los materiales más utilizados
                  </h3>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tareas */}
          <TabsContent value="tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Tareas</CardTitle>
                <CardDescription>Información detallada sobre el progreso de tareas en todos los proyectos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-2xl font-medium text-gray-500">
                    Selecciona "Dashboard" para ver un resumen de las tareas pendientes y completadas
                  </h3>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presupuestos */}
          <TabsContent value="budgets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Presupuestos</CardTitle>
                <CardDescription>Información detallada sobre el estado financiero de todos los proyectos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <h3 className="text-2xl font-medium text-gray-500">
                    Selecciona "Dashboard" para ver un resumen de los presupuestos y gastos
                  </h3>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}