import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'

interface DependencyNetworkProps {
  data: any[]
  dependencies?: any[]
}

export default function DependencyNetwork({ data, dependencies = [] }: DependencyNetworkProps) {
  const networkData = useMemo(() => {
    if (!dependencies || dependencies.length === 0) return []

    // Crear mapa de tareas para búsqueda rápida
    const taskMap = new Map(data.map(task => [task.id, task]))

    return dependencies.map(dep => {
      // Intentar obtener las tareas de la dependencia directa o desde nested data
      const predecessorTask = taskMap.get(dep.predecessor_task_id) || dep.predecessor_task
      const successorTask = taskMap.get(dep.successor_task_id) || dep.successor_task

      if (!predecessorTask || !successorTask) return null

      return {
        id: dep.id,
        predecessor: {
          id: predecessorTask.id,
          name: predecessorTask.display_name 
            ? (predecessorTask.display_name.length > 30 ? predecessorTask.display_name.substring(0, 30) + '...' : predecessorTask.display_name)
            : (predecessorTask.task?.display_name 
                ? (predecessorTask.task.display_name.length > 30 ? predecessorTask.task.display_name.substring(0, 30) + '...' : predecessorTask.task.display_name)
                : 'Tarea sin nombre'),
          code: predecessorTask.code || predecessorTask.task?.code || 'SIN-CÓDIGO',
          progress: predecessorTask.progress_percent || 0
        },
        successor: {
          id: successorTask.id,
          name: successorTask.display_name 
            ? (successorTask.display_name.length > 30 ? successorTask.display_name.substring(0, 30) + '...' : successorTask.display_name)
            : (successorTask.task?.display_name 
                ? (successorTask.task.display_name.length > 30 ? successorTask.task.display_name.substring(0, 30) + '...' : successorTask.task.display_name)
                : 'Tarea sin nombre'),
          code: successorTask.code || successorTask.task?.code || 'SIN-CÓDIGO',
          progress: successorTask.progress_percent || 0
        },
        type: dep.type || 'finish-to-start',
        lagDays: dep.lag_days || 0
      }
    }).filter(Boolean)
  }, [data, dependencies])

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-600 dark:text-green-400'
    if (progress > 0) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (networkData.length === 0) {
    return (
      <Card className="h-[350px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Red de Dependencias</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No hay dependencias configuradas</p>
            <p className="text-xs mt-1">Las dependencias aparecerán aquí cuando se configuren entre tareas</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[350px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Red de Dependencias</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 overflow-y-auto">
        <div className="space-y-3">
          {networkData.slice(0, 5).map((connection) => {
            if (!connection) return null
            
            return (
            <div key={connection.id} className="relative">
              <div className="flex items-center gap-2 p-2 rounded border bg-muted/5">
                {/* Tarea Predecesora */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {connection.predecessor.code}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {connection.predecessor.name}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getProgressColor(connection.predecessor.progress)}`}
                  >
                    {connection.predecessor.progress}%
                  </Badge>
                </div>

                {/* Flecha */}
                <div className="flex flex-col items-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  {connection.lagDays > 0 && (
                    <span className="text-xs text-muted-foreground">
                      +{connection.lagDays}d
                    </span>
                  )}
                </div>

                {/* Tarea Sucesora */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {connection.successor.code}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {connection.successor.name}
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getProgressColor(connection.successor.progress)}`}
                  >
                    {connection.successor.progress}%
                  </Badge>
                </div>
              </div>
            </div>
          )})}

          {networkData.length > 5 && (
            <div className="text-center text-xs text-muted-foreground py-2">
              Y {networkData.length - 5} dependencias más...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}