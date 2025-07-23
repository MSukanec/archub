import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, Calculator, BarChart3 } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'

export default function ConstructionBudgets() {
  const [searchValue, setSearchValue] = useState("")

  const headerProps = {
    title: "Presupuestos de Construcción",
    subtitle: "Gestiona y controla los costos de tu proyecto de construcción",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    filters: [
      { label: "Sin agrupación", onClick: () => {} },
      { label: "Por rubros", onClick: () => {} },
      { label: "Por fases", onClick: () => {} }
    ],
    onClearFilters: () => setSearchValue(""),
    actions: (
      <div className="flex gap-2">
        <Button variant="secondary">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarea
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Presupuesto
        </Button>
      </div>
    )
  }

  return (
    <Layout headerProps={headerProps}>
      {/* Features Introduction */}
      <FeatureIntroduction
        title="Gestión de Presupuestos"
        features={[
          {
            icon: <Calculator className="w-4 h-4" />,
            title: "Presupuestos Detallados",
            description: "Crea presupuestos completos con tareas, cantidades y costos unitarios para un control preciso."
          },
          {
            icon: <Plus className="w-4 h-4" />,
            title: "Librería de Tareas",
            description: "Accede a una amplia biblioteca de tareas predefinidas para agilizar la creación de presupuestos."
          },
          {
            icon: <BarChart3 className="w-4 h-4" />,
            title: "Control de Costos",
            description: "Monitorea el progreso y los totales de tu presupuesto en tiempo real con actualizaciones automáticas."
          }
        ]}
      />

      {/* Empty State */}
      <EmptyState
        icon={<Calculator className="w-12 h-12 text-muted-foreground" />}
        title="No hay presupuestos creados"
        description="Comienza creando tu primer presupuesto para gestionar los costos del proyecto"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear Primer Presupuesto
          </Button>
        }
      />
    </Layout>
  )
}