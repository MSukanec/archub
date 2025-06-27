import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Building, Calendar, Users, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function ConstructionDashboard() {
  const headerProps = {
    title: "Resumen de Obra",
    showSearch: false,
    showFilters: false,
  }

  return (
    <Layout >
      <div className="space-y-6">
        {/* Estado General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado de la Obra</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">En Progreso</div>
              <p className="text-xs text-muted-foreground">
                Fase de estructura
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avance General</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">68%</div>
              <Progress value={68} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal en Obra</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                Trabajadores activos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actividades Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Actividades Recientes
            </CardTitle>
            <CardDescription>
              Últimos registros de bitácora y actividades importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Inspección de estructura</span>
                    <Badge variant="secondary" className="text-xs">Hoy</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Revisión de columnas y vigas del segundo nivel. Todo conforme a planos.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <AlertCircle className="h-4 w-4 mt-1 text-amber-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Retraso en entrega de materiales</span>
                    <Badge variant="outline" className="text-xs">Ayer</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Demora de 2 días en entrega de acero. Reprogramación de actividades pendiente.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-4 w-4 mt-1 text-green-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Vaciado de concreto completado</span>
                    <Badge variant="outline" className="text-xs">2 días</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Finalización exitosa del vaciado de losa del primer nivel. 180 m³ de concreto.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Avance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Avance por Etapas</CardTitle>
              <CardDescription>Progreso de las principales fases constructivas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Cimentación</span>
                  <span>100%</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Estructura</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Mampostería</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Instalaciones</span>
                  <span>20%</span>
                </div>
                <Progress value={20} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Acabados</span>
                  <span>0%</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cronograma Semanal</CardTitle>
              <CardDescription>Actividades programadas para esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Lunes - Instalación de acero</div>
                    <div className="text-xs text-muted-foreground">Columnas nivel 2</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Miércoles - Vaciado de concreto</div>
                    <div className="text-xs text-muted-foreground">Vigas nivel 2</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 rounded bg-green-50 dark:bg-green-950/20">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Viernes - Inspección técnica</div>
                    <div className="text-xs text-muted-foreground">Revisión estructural</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}