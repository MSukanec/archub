import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Clock, Calendar, AlertTriangle } from 'lucide-react'
import { format, addDays, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TimelineTask {
  id: string
  title: string
  description?: string
  dueDate: Date
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  category: string
  assignee?: string
}

interface UpcomingTasksTimelineProps {
  tasks?: TimelineTask[]
  className?: string
}

// Datos de ejemplo - en un caso real estos vendrían de la API
const defaultTasks: TimelineTask[] = [
  {
    id: '1',
    title: 'Revisión de presupuestos Q4',
    description: 'Analizar y aprobar los presupuestos para el último trimestre',
    dueDate: new Date(),
    status: 'pending',
    priority: 'high',
    category: 'Finanzas',
    assignee: 'Equipo Financiero'
  },
  {
    id: '2',
    title: 'Inspección de seguridad - Obra Centro',
    description: 'Evaluación mensual de protocolos de seguridad',
    dueDate: addDays(new Date(), 1),
    status: 'in-progress',
    priority: 'high',
    category: 'Construcción',
    assignee: 'Supervisor de Obra'
  },
  {
    id: '3',
    title: 'Reunión con proveedores',
    description: 'Negociación de contratos para materiales de construcción',
    dueDate: addDays(new Date(), 3),
    status: 'pending',
    priority: 'medium',
    category: 'Compras',
    assignee: 'Gerente de Compras'
  },
  {
    id: '4',
    title: 'Entrega documentación técnica',
    description: 'Planos y especificaciones técnicas actualizadas',
    dueDate: addDays(new Date(), 5),
    status: 'pending',
    priority: 'medium',
    category: 'Diseño',
    assignee: 'Arquitecto Principal'
  },
  {
    id: '5',
    title: 'Auditoría interna mensual',
    description: 'Revisión de procesos y cumplimiento normativo',
    dueDate: addDays(new Date(), 7),
    status: 'pending',
    priority: 'low',
    category: 'Administración',
    assignee: 'Auditor Interno'
  }
]

export const UpcomingTasksTimeline: React.FC<UpcomingTasksTimelineProps> = ({
  tasks = defaultTasks,
  className
}) => {
  const getStatusIcon = (status: TimelineTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: TimelineTask['status']) => {
    const variants = {
      'completed': 'default',
      'in-progress': 'secondary',
      'overdue': 'destructive',
      'pending': 'outline'
    } as const

    const labels = {
      'completed': 'Completado',
      'in-progress': 'En progreso',
      'overdue': 'Atrasado',
      'pending': 'Pendiente'
    }

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    )
  }

  const getPriorityColor = (priority: TimelineTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-300'
    }
  }

  const formatDueDate = (date: Date) => {
    if (isToday(date)) {
      return 'Hoy'
    }
    if (isTomorrow(date)) {
      return 'Mañana'
    }
    
    const days = differenceInDays(date, new Date())
    if (days > 0 && days <= 7) {
      return `En ${days} día${days > 1 ? 's' : ''}`
    }
    
    return format(date, "d 'de' MMM", { locale: es })
  }

  const sortedTasks = [...tasks].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Objetivos y Tareas Próximas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Actividades programadas para los próximos días
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTasks.slice(0, 5).map((task, index) => {
            const isOverdue = isPast(task.dueDate) && task.status !== 'completed'
            const actualStatus = isOverdue ? 'overdue' : task.status
            
            return (
              <div
                key={task.id}
                className={cn(
                  "relative flex items-start gap-4 p-4 rounded-lg border-l-4 bg-card hover:bg-accent/5 transition-colors",
                  getPriorityColor(task.priority)
                )}
              >
                {/* Timeline Line */}
                {index < sortedTasks.length - 1 && (
                  <div className="absolute left-6 top-12 w-px h-8 bg-border"></div>
                )}
                
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(actualStatus)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(actualStatus)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{task.category}</span>
                      {task.assignee && (
                        <span>• {task.assignee}</span>
                      )}
                    </div>
                    <div className={cn(
                      "font-medium",
                      isOverdue && "text-red-600",
                      isToday(task.dueDate) && "text-accent"
                    )}>
                      {formatDueDate(task.dueDate)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No hay tareas programadas próximamente</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}