import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Compass, Calendar, FileText, Users, CheckCircle2, Clock, Palette, Layers } from 'lucide-react'

export default function DesignDashboard() {
  const headerProps = {
    title: "Resumen de Diseño",
    showSearch: false,
    showFilters: false,
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Estado General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado del Diseño</CardTitle>
              <Compass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">En Progreso</div>
              <p className="text-xs text-muted-foreground">
                Anteproyecto en revisión
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avance de Diseño</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45%</div>
              <Progress value={45} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipo de Diseño</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Profesionales activos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Fases de Diseño */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Fases de Diseño
              </CardTitle>
              <CardDescription>
                Progreso por etapas del proceso de diseño
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Completado
                    </Badge>
                    <span className="text-sm font-medium">Relevamiento</span>
                  </div>
                  <span className="text-sm text-muted-foreground">100%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      En progreso
                    </Badge>
                    <span className="text-sm font-medium">Anteproyecto</span>
                  </div>
                  <span className="text-sm text-muted-foreground">70%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Pendiente
                    </Badge>
                    <span className="text-sm font-medium">Proyecto Ejecutivo</span>
                  </div>
                  <span className="text-sm text-muted-foreground">0%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Pendiente
                    </Badge>
                    <span className="text-sm font-medium">Detalles Constructivos</span>
                  </div>
                  <span className="text-sm text-muted-foreground">0%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentación
              </CardTitle>
              <CardDescription>
                Estado de planos y documentos técnicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Planos de Arquitectura</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    8 planos
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Planos de Estructura</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    3 planos
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Planos de Instalaciones</span>
                  <Badge variant="outline">
                    Pendiente
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memoria Descriptiva</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Completa
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actividad Reciente y Próximas Tareas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Últimas actualizaciones en el diseño
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Revisión de fachada principal</p>
                    <p className="text-xs text-muted-foreground">Arq. María González - Hace 2 horas</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Actualización de planimetría</p>
                    <p className="text-xs text-muted-foreground">Arq. Carlos Ruiz - Ayer</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Reunión con cliente</p>
                    <p className="text-xs text-muted-foreground">Arq. Ana López - Hace 2 días</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Tareas
              </CardTitle>
              <CardDescription>
                Actividades programadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-red-100 text-red-800">
                    Urgente
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Entrega de anteproyecto</p>
                    <p className="text-xs text-muted-foreground">Vence mañana</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    Esta semana
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Revisión estructural</p>
                    <p className="text-xs text-muted-foreground">Viernes 28</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    Próxima semana
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Inicio proyecto ejecutivo</p>
                    <p className="text-xs text-muted-foreground">Lunes 7</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Rendimiento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Entregados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">11</div>
              <p className="text-xs text-muted-foreground">
                +3 esta semana
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revisiones</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                En este mes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Diseño</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">186</div>
              <p className="text-xs text-muted-foreground">
                Total invertidas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eficiencia</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                Tareas a tiempo
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}