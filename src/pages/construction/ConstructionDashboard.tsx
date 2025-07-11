import { Layout } from '@/components/layout/desktop/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building, FileText, Users, Package, Calculator, Clock } from 'lucide-react'
import { CustomEmptyState } from '@/components/ui-custom/misc/CustomEmptyState'

export default function ConstructionDashboard() {
  const headerProps = {
    title: "Resumen de Obra",
    showSearch: false,
    showFilters: false,
  }

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Métricas Principales - Desktop */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Planificación</div>
              <p className="text-xs text-muted-foreground">
                fase actual
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progreso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                avance general
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                trabajadores activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                entradas de bitácora
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Principales - Mobile (Compactas) */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <Building className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                Planificación
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Estado
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <Clock className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                0%
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Progreso
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <Users className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                0
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Equipos
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm min-h-[80px]">
            <div className="flex items-center justify-between mb-1">
              <FileText className="h-4 w-4 text-gray-500" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xl font-bold text-gray-900">
                0
              </div>
              <div className="text-xs text-gray-500 font-medium leading-tight">
                Actividad
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Obra */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomEmptyState 
                title="Sin actividad registrada"
                description="Comienza registrando entradas en la bitácora de obra para ver la actividad aquí."
                action={
                  <button 
                    onClick={() => window.location.href = '/construction/logs'}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Ir a Bitácora
                  </button>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Presupuestos</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomEmptyState 
                title="Sin presupuestos creados"
                description="Crea presupuestos para organizar y controlar los costos de tu proyecto."
                action={
                  <button 
                    onClick={() => window.location.href = '/construction/budgets'}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Crear Presupuesto
                  </button>
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button 
                onClick={() => window.location.href = '/construction/budgets'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Calculator className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Presupuestos</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/construction/materials'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Materiales</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/construction/logs'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Bitácora</span>
              </button>
              
              <button 
                onClick={() => window.location.href = '/construction/personnel'}
                className="flex flex-col items-center p-4 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Users className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Asistencia</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}