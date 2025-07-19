import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { CheckSquare, Plus } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { FeatureIntroduction } from '@/components/ui-custom/FeatureIntroduction'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'

export default function ConstructionTasks() {
  const [searchValue, setSearchValue] = useState("")
  const { setSidebarContext, setActiveSidebarSection } = useNavigationStore()
  const { data: userData } = useCurrentUser()
  const { openModal } = useGlobalModalStore()

  // Set navigation context
  setSidebarContext('construction')
  setActiveSidebarSection('obra')

  const headerProps = {
    title: "Tareas",
    showSearch: true,
    searchValue,
    onSearchChange: setSearchValue,
    showFilters: true,
    filters: [
      { label: "Todas", onClick: () => {} },
      { label: "Pendientes", onClick: () => {} },
      { label: "En Progreso", onClick: () => {} },
      { label: "Completadas", onClick: () => {} }
    ],
    onClearFilters: () => setSearchValue(""),
    actions: (
      <Button 
        className="h-8 px-3 text-sm"
        onClick={() => openModal('construction-task', { open: true })}
      >
        <Plus className="h-4 w-4 mr-2" />
        Agregar Tareas
      </Button>
    )
  }

  // Mock data - replace with real data when hooks are implemented
  const tasks = []

  return (
    <Layout headerProps={headerProps}>
      <div className="space-y-6">
        <FeatureIntroduction
          icon={CheckSquare}
          title="Gestión de Tareas de Obra"
          description="Administra y controla todas las tareas específicas de esta obra para una gestión eficiente del proyecto."
          features={[
            "Creación y asignación de tareas específicas de construcción",
            "Seguimiento del progreso y estado de cada actividad",
            "Integración directa con presupuestos y cronogramas",
            "Control de dependencias entre tareas y fases de obra"
          ]}
        />

        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No hay tareas creadas"
            description="Comienza agregando las primeras tareas de construcción para esta obra. Las tareas te permitirán organizar mejor el trabajo y vincularlas con los presupuestos."
            actionLabel="Agregar Primera Tarea"
            onAction={() => openModal('construction-task', { open: true })}
          />
        ) : (
          <div>
            {/* Aquí irá la tabla/lista de tareas cuando se implemente */}
            <p className="text-center text-muted-foreground py-8">
              Tabla de tareas se implementará aquí
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}