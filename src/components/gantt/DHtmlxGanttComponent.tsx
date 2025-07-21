import { useEffect, useRef } from 'react'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'

interface DHtmlxGanttComponentProps {
  tasks: any[]
  phases: any[]
}

export const DHtmlxGanttComponent = ({ tasks, phases }: DHtmlxGanttComponentProps) => {
  const ganttRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ganttRef.current) return

    // Configuración básica del Gantt
    gantt.config.date_format = "%Y-%m-%d"
    gantt.config.scale_unit = "day"
    gantt.config.step = 1
    gantt.config.date_scale = "%d %M"
    gantt.config.subscales = [
      { unit: "month", step: 1, date: "%F, %Y" }
    ]
    gantt.config.grid_width = 350
    gantt.config.row_height = 35
    
    // Configuración de columnas
    gantt.config.columns = [
      { name: "text", label: "Tarea", width: 200, tree: true },
      { name: "start_date", label: "Inicio", width: 80, align: "center" },
      { name: "duration", label: "Días", width: 50, align: "center" }
    ]

    // Inicializar el Gantt
    gantt.init(ganttRef.current)

    // Convertir nuestros datos al formato de DHTMLX
    const dhtmlxData: any = {
      data: [],
      links: []
    }

    // Agregar fases como tareas padre
    phases.forEach((projectPhase, index) => {
      const startDate = projectPhase.start_date || new Date().toISOString().split('T')[0]
      const duration = projectPhase.duration_in_days || 7
      
      dhtmlxData.data.push({
        id: `phase_${projectPhase.id}`,
        text: projectPhase.phase.name.toUpperCase(),
        start_date: startDate,
        duration: duration,
        progress: 0,
        open: true,
        type: gantt.config.types.project
      })
    })

    // Agregar tareas
    tasks.forEach((task, index) => {
      const startDate = task.start_date || new Date().toISOString().split('T')[0]
      const duration = task.duration_in_days || 1
      
      // Encontrar la fase padre
      const parentPhase = phases.find(p => p.phase.name === task.phase_name)
      const parentId = parentPhase ? `phase_${parentPhase.id}` : 0
      
      dhtmlxData.data.push({
        id: task.id,
        text: task.task.processed_display_name || task.task.display_name || task.task.code || 'Tarea sin nombre',
        start_date: startDate,
        duration: duration,
        progress: (task.progress_percent || 0) / 100,
        parent: parentId
      })
    })

    // Cargar datos
    gantt.parse(dhtmlxData)

    // Cleanup function
    return () => {
      gantt.clearAll()
    }
  }, [tasks, phases])

  return (
    <div className="w-full">
      <div className="mb-4 p-4 border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📊 Versión con DHTMLX Gantt (Experimental)
        </h3>
        <p className="text-sm text-blue-600">
          Esta es una comparación con la librería DHTMLX Gantt usando los mismos datos de Supabase
        </p>
      </div>
      <div 
        ref={ganttRef} 
        className="w-full border border-gray-200 rounded-lg"
        style={{ height: '400px' }}
      />
    </div>
  )
}