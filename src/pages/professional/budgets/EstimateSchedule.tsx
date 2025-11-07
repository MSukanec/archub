import { useState, useMemo, useEffect } from 'react'
import { Layout } from '@/components/layout/desktop/Layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Trash2, BarChart3, CheckSquare } from 'lucide-react'
import { Plus } from 'lucide-react'

import { EmptyState } from '@/components/ui-custom/security/EmptyState'
import { Table } from '@/components/ui-custom/tables-and-trees/Table'

import { useConstructionTasksView, useDeleteConstructionTask } from '@/hooks/use-construction-tasks'
import { useConstructionProjectPhases } from '@/hooks/use-construction-phases'
import { useConstructionDependencies } from '@/hooks/use-construction-dependencies'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useProjectContext } from '@/stores/projectContext'
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore'
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation'
import { useNavigationStore } from '@/stores/navigationStore'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { GanttContainer } from '@/components/gantt/GanttContainer'
import { GanttRowProps } from '@/components/gantt/types'
import { LoadingSpinner } from '@/components/ui-custom/LoadingSpinner'

import { PlanRestricted } from "@/components/ui-custom/security/PlanRestricted"

// Función para limpiar nombres de tareas eliminando códigos y variables
function cleanTaskDisplayName(name: string): string {
  if (!name) return 'Estimación sin nombre'
  
  // Eliminar códigos al inicio (ej: "RPE-000001: ")
  let cleanedName = name.replace(/^[A-Z]{2,4}-[0-9]{6}:\s*/, '')
  
  // Eliminar variables template (ej: "{{aditivos}}", "{{mortar_type}}")
  cleanedName = cleanedName.replace(/\{\{[^}]*\}\}\.?/g, '')
  
  // Eliminar puntos sobrantes al final
  cleanedName = cleanedName.replace(/\.\s*$/, '')
  
  // Limpiar espacios múltiples y trim
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim()
  
  return cleanedName || 'Estimación sin nombre'
}

export function EstimateSchedule() {
  const [activeTab, setActiveTab] = useState("gantt")
  const [groupingType, setGroupingType] = useState('rubros')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  
  const { data: userData } = useCurrentUser()
  const { selectedProjectId, currentOrganizationId } = useProjectContext()
  const { openModal } = useGlobalModalStore()
  const deleteTask = useDeleteConstructionTask()
  const { showDeleteConfirmation } = useDeleteConfirmation()
  const { setSidebarContext } = useNavigationStore()

  // Set sidebar context on mount
  useEffect(() => {
    setSidebarContext('construction')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Usar ProjectContext como fuente única de verdad para org/project IDs
  const projectId = selectedProjectId
  const organizationId = currentOrganizationId

  const { data: tasks = [], isLoading } = useConstructionTasksView(projectId || '', organizationId || '')

  // Obtener las fases del proyecto y dependencias
  const { data: projectPhases = [] } = useConstructionProjectPhases(projectId || '')
  const { data: dependencies = [] } = useConstructionDependencies(projectId || '')

  // Usar todas las tareas sin filtro de búsqueda
  const filteredTasks = tasks

  // Crear estructura Gantt simplificada con las tareas de la vista
  const ganttData = useMemo(() => {
    const ganttRows: any[] = [];

    // Agrupar tareas por phase_name usando los datos de la vista
    const tasksByPhase = filteredTasks.reduce((acc, task) => {
      const phaseName = task.phase_name || 'ESTIMACIONES SIN FASE ASIGNADA';
      if (!acc[phaseName]) {
        acc[phaseName] = [];
      }
      acc[phaseName].push(task);
      return acc;
    }, {} as Record<string, typeof filteredTasks>);

    // Procesar cada fase
    Object.entries(tasksByPhase).forEach(([phaseName, tasksInPhase]) => {
      // Agregar encabezado de fase
      ganttRows.push({
        id: `phase-${phaseName.replace(/\s+/g, '-')}`,
        name: phaseName,
        type: 'phase',
        level: 0,
        isHeader: true,
        startDate: undefined,
        endDate: undefined,
        durationInDays: undefined
      });

      // Agregar las tareas de esta fase
      tasksInPhase.forEach((task) => {
        let validStartDate = task.start_date;
        let validEndDate = task.end_date;
        let validDuration = task.duration_in_days;

        // No forzar fecha de hoy si no hay start_date
        // Dejar validStartDate como null si no existe

        // Si hay start_date pero no end_date ni duration, establecer duración de 1 día
        if (validStartDate && !validEndDate && !validDuration) {
          validDuration = 1;
        }

        ganttRows.push({
          id: task.id,
          name: cleanTaskDisplayName(task.custom_name || 'Estimación sin nombre'),
          type: 'task',
          level: 1,
          startDate: validStartDate,
          endDate: validEndDate,
          durationInDays: validDuration,
          quantity: task.quantity,
          taskData: task
        });
      });
    });

    return ganttRows;
  }, [filteredTasks]);

  // Mostrar loading state sin Layout complejo para evitar renderizados costosos
  if (isLoading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  // Crear tabs para el header
  const headerTabs = [
    {
      id: "gantt",
      label: "Vista Gantt",
      isActive: activeTab === "gantt"
    },
    {
      id: "list", 
      label: "Listado de Estimaciones",
      isActive: activeTab === "list",
      disabled: true // Bloquear esta tab
    },
    {
      id: "analytics",
      label: "Análisis Visual", 
      isActive: activeTab === "analytics",
      disabled: true // Bloquear esta tab
    }
  ]

  return (
    <div className="space-y-6">
      {/* Tab Content */}
      {activeTab === 'gantt' && (
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-16 w-16" />}
              title="No hay estimaciones en el cronograma"
              description="Comienza agregando estimaciones de construcción para visualizar el cronograma del proyecto."
            />
          ) : (
            <GanttContainer
              data={ganttData}
              dependencies={dependencies}
              onItemEdit={(item) => {
                const task = filteredTasks.find(t => t.id === item.id)
                if (task) {
                  openModal('construction-task-schedule', { 
                    projectId: projectId || '',
                    organizationId: organizationId || '',
                    editingTask: task,
                    isEditing: true
                  })
                }
              }}
              onItemDelete={(item) => {
                const task = filteredTasks.find(t => t.id === item.id)
                showDeleteConfirmation({
                  title: 'Eliminar Estimación',
                  description: `¿Estás seguro de que quieres eliminar "${task?.custom_name || 'esta estimación'}"?`,
                  onConfirm: () => deleteTask.mutate({
                    id: item.id,
                    project_id: task?.project_id || '',
                    organization_id: organizationId || ''
                  })
                })
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="space-y-6">
          <PlanRestricted reason="coming_soon">
            <div className="flex flex-col items-center justify-center py-16">
              <CheckSquare className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Listado de Estimaciones</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Esta funcionalidad estará disponible próximamente. Aquí podrás ver y gestionar todas las estimaciones 
                del proyecto en formato de tabla con filtros avanzados.
              </p>
            </div>
          </PlanRestricted>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <PlanRestricted reason="coming_soon">
            <div className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Análisis Visual</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Esta funcionalidad estará disponible próximamente. Aquí podrás ver gráficos de progreso, 
                burndown charts y análisis de rutas críticas del cronograma.
              </p>
            </div>
          </PlanRestricted>
        </div>
      )}
    </div>
  )
}