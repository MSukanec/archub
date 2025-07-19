import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Plus, ListTodo, CheckSquare, Clock, Users } from 'lucide-react'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { EmptyState } from '@/components/ui-custom/EmptyState'

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")

  // Por ahora simulamos que no hay tareas
  const tasks = []

  const headerProps = {
    title: "Tareas",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    filters: [
      { label: "Activas", onClick: () => {} },
      { label: "Completadas", onClick: () => {} },
      { label: "En Progreso", onClick: () => {} }
    ],
    onClearFilters: () => setSearchValue(""),
    actions: (
      <Button className="h-8 px-3 text-sm">
        <Plus className="w-4 h-4 mr-2" />
        Nueva Tarea
      </Button>
    )
  }

  const features = [
    {
      icon: <ListTodo className="w-5 h-5" />,
      title: "Gestión Completa de Tareas",
      description: "Crea, edita y organiza todas las tareas de construcción con descripción detallada, fechas de inicio y finalización."
    },
    {
      icon: <CheckSquare className="w-5 h-5" />,
      title: "Control de Progreso",
      description: "Marca tareas como completadas, en progreso o pendientes. Visualiza el avance general de la obra."
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Planificación Temporal",
      description: "Establece fechas límite, dependencias entre tareas y secuencias de trabajo para optimizar los tiempos."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Integración con Presupuestos",
      description: "Las tareas creadas aquí se integran automáticamente con el sistema de presupuestos para costeo preciso."
    }
  ]

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        {/* Feature Introduction */}
        <FeatureIntroduction
          title="Gestión de Tareas de Construcción"
          icon={<ListTodo className="w-6 h-6" />}
          features={features}
        />

        {/* Content Area */}
        {tasks.length === 0 ? (
          <EmptyState
            icon={<ListTodo className="w-12 h-12" />}
            title="No hay tareas creadas"
            description="Crea tu primera tarea de construcción para comenzar a organizar el trabajo de la obra."
            action={
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Tarea
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {/* Aquí irá el contenido cuando haya tareas */}
          </div>
        )}
      </div>
    </Layout>
  )
}