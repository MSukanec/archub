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
        </CardHeader>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
      </CardHeader>
          {networkData.slice(0, 5).map((connection) => {
            if (!connection) return null
            
            return (
                {/* Tarea Predecesora */}
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
                  {connection.lagDays > 0 && (
                      +{connection.lagDays}d
                    </span>
                  )}
                </div>

                {/* Tarea Sucesora */}
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
              Y {networkData.length - 5} dependencias más...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}