import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui-custom/EmptyState'
import { ChevronRight, ChevronDown, Search, TreePine, Target, Info } from 'lucide-react'
import { useGeneratedTasks } from '@/hooks/use-generated-tasks'
import { useTaskParametersAdmin } from '@/hooks/use-task-parameters-admin'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface TaskParameterValue {
  id: string
  parameter_id: string
  name: string
  label: string
  description?: string
}

interface TaskBranch {
  id: string
  branchName: string
  categoryName: string
  tasks: TaskWithValues[]
  totalTasks: number
}

interface TaskWithValues {
  id: string
  code: string
  display_name: string
  param_order: string[]
  param_values: Record<string, string>
  unit_name?: string
  category_name?: string
  parameterChain: ParameterWithValue[]
}

interface ParameterWithValue {
  slug: string
  label: string
  valueLabel: string
  level: number
}

export default function TaskBranchesView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  // Obtener datos
  const { data: generatedTasks = [], isLoading: isLoadingTasks } = useGeneratedTasks()
  const { data: parameters = [], isLoading: isLoadingParams } = useTaskParametersAdmin()
  
  // Obtener valores de parámetros
  const { data: parameterValues = [], isLoading: isLoadingValues } = useQuery({
    queryKey: ['all-task-parameter-values-for-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_values')
        .select('id, parameter_id, name, label, description')

      if (error) throw error
      return data || []
    }
  })

  // Crear mapas para eficiencia
  const parameterMap = useMemo(() => {
    const map = new Map()
    parameters.forEach(param => map.set(param.slug, param))
    return map
  }, [parameters])

  const valueMap = useMemo(() => {
    const map = new Map()
    parameterValues.forEach(value => map.set(value.id, value))
    return map
  }, [parameterValues])

  // Procesar tareas en ramas
  const taskBranches = useMemo(() => {
    if (!generatedTasks.length || !parameters.length || !parameterValues.length) {
      return []
    }

    console.log('🌳 Procesando', generatedTasks.length, 'tareas en ramas jerárquicas')

    const branchesMap = new Map<string, TaskWithValues[]>()

    generatedTasks.forEach(task => {
      if (!task.param_order || !task.param_values) return

      // Crear cadena de parámetros con valores
      const parameterChain: ParameterWithValue[] = []
      task.param_order.forEach((slug: string, index: number) => {
        const parameter = parameterMap.get(slug)
        const valueId = task.param_values[slug]
        const value = valueMap.get(valueId)

        if (parameter && value) {
          parameterChain.push({
            slug,
            label: parameter.label,
            valueLabel: value.label,
            level: index
          })
        }
      })

      // Determinar rama principal (primer parámetro)
      const mainBranch = parameterChain[0]?.label || 'Sin categoría'
      const branchKey = mainBranch

      if (!branchesMap.has(branchKey)) {
        branchesMap.set(branchKey, [])
      }

      const taskWithValues: TaskWithValues = {
        id: task.id,
        code: task.code || '',
        display_name: task.display_name || task.name_rendered || '',
        param_order: task.param_order,
        param_values: task.param_values,
        unit_name: task.unit_name,
        category_name: task.category_name,
        parameterChain
      }

      branchesMap.get(branchKey)?.push(taskWithValues)
    })

    // Convertir a array de ramas
    const branches: TaskBranch[] = Array.from(branchesMap.entries()).map(([branchName, tasks]) => ({
      id: branchName.toLowerCase().replace(/\s+/g, '-'),
      branchName,
      categoryName: tasks[0]?.category_name || '',
      tasks,
      totalTasks: tasks.length
    }))

    // Ordenar por nombre de rama
    branches.sort((a, b) => a.branchName.localeCompare(b.branchName))

    console.log('✅ Creadas', branches.length, 'ramas principales')
    return branches
  }, [generatedTasks, parameterMap, valueMap])

  // Filtrar ramas por búsqueda
  const filteredBranches = useMemo(() => {
    if (!searchQuery) return taskBranches

    return taskBranches.filter(branch => 
      branch.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.tasks.some(task => 
        task.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.parameterChain.some(param => 
          param.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          param.valueLabel.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    )
  }, [taskBranches, searchQuery])

  function toggleBranch(branchId: string) {
    setExpandedBranches(prev => {
      const newSet = new Set(prev)
      if (newSet.has(branchId)) {
        newSet.delete(branchId)
      } else {
        newSet.add(branchId)
      }
      return newSet
    })
  }

  function toggleTask(taskId: string) {
    setExpandedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  function renderParameterChain(chain: ParameterWithValue[]) {
    return (
      <div className="ml-6 mt-2 space-y-1">
        {chain.map((param, index) => (
          <div 
            key={`${param.slug}-${index}`} 
            className="flex items-center gap-2 text-sm"
            style={{ paddingLeft: `${index * 16}px` }}
          >
            {index > 0 && (
              <div className="w-4 h-4 flex items-center justify-center">
                <div className="h-px w-3 bg-muted-foreground/30" />
              </div>
            )}
            <span className="text-muted-foreground">{param.label}:</span>
            <Badge variant="secondary" className="text-xs">
              {param.valueLabel}
            </Badge>
          </div>
        ))}
      </div>
    )
  }

  function renderTask(task: TaskWithValues) {
    const isExpanded = expandedTasks.has(task.id)

    return (
      <div key={task.id} className="border border-muted-foreground/20 rounded-lg ml-4 mb-2">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => toggleTask(task.id)}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
              
              <Target className="h-4 w-4 text-blue-500 flex-shrink-0" />
              
              <div className="flex-1">
                <div className="font-medium text-sm">{task.display_name}</div>
                <div className="flex items-center gap-2 mt-1">
                  {task.code && (
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">{task.code}</code>
                  )}
                  {task.unit_name && (
                    <Badge variant="outline" className="text-xs">{task.unit_name}</Badge>
                  )}
                </div>
              </div>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {task.parameterChain.length} parámetros
            </Badge>
          </div>

          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-muted-foreground/20">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                <div>ID: <code className="text-xs">{task.id}</code></div>
                <div>Categoría: {task.category_name || 'N/A'}</div>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium text-sm">Cadena de parámetros:</div>
                {renderParameterChain(task.parameterChain)}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderBranch(branch: TaskBranch) {
    const isExpanded = expandedBranches.has(branch.id)

    return (
      <div key={branch.id} className="border border-muted-foreground/20 rounded-lg mb-4">
        <div className="p-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleBranch(branch.id)}>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              
              <TreePine className="h-5 w-5 text-green-600 flex-shrink-0" />
              
              <div>
                <div className="font-semibold text-lg">{branch.branchName}</div>
                {branch.categoryName && (
                  <div className="text-sm text-muted-foreground">{branch.categoryName}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-sm">
                {branch.totalTasks} tareas
              </Badge>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-muted-foreground/20">
              <div className="space-y-2">
                {branch.tasks.map(task => renderTask(task))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoadingTasks || isLoadingParams || isLoadingValues) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando ramas de tareas...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ramas de Tareas Generadas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Vista jerárquica agrupada por tipo de tarea principal
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {taskBranches.length} ramas principales
          </Badge>
        </div>
        
        {/* Búsqueda */}
        <div className="flex items-center gap-2 mt-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en ramas de tareas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
      </CardHeader>

      <CardContent>
        {filteredBranches.length === 0 ? (
          <EmptyState
            icon={TreePine}
            title="No hay ramas de tareas"
            description={searchQuery ? "No se encontraron ramas que coincidan con tu búsqueda." : "No hay tareas generadas para mostrar."}
          />
        ) : (
          <div className="space-y-4">
            {filteredBranches.map(branch => renderBranch(branch))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}