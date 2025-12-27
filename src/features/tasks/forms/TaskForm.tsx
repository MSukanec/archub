import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2 } from 'lucide-react'
import { ComboBox } from '@/components/shared/fields/ComboBoxWriteField'

import {
  useCreateGeneratedTask,
  useUpdateGeneratedTask,
  useTaskMaterials,
  useCreateTaskMaterial,
  useDeleteTaskMaterial,
  useGeneratedTasks,
  useCreateTaskLabor,
  useTaskCategories,
  useTaskLabor,
} from '@/features/tasks'
import { useMaterials } from '@/features/materials'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useUnits } from '@/hooks/use-units'

const taskSchema = z.object({
  customName: z.string().min(1, 'El nombre es requerido'),
  taskDivisionId: z.string().optional(),
  unitId: z.string().optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>

interface ParameterSelection {
  parameterId: string
  optionId: string
  parameterSlug: string
  parameterLabel: string
  optionName: string
  optionLabel: string
}

interface MaterialEditRowProps {
  material: any
  index: number
  onEdit: (material: any) => void
  onRemove: () => void
  disabled: boolean
}

export function MaterialEditRow({ material, index, onEdit, onRemove, disabled }: MaterialEditRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(material.amount.toString())

  const handleSaveEdit = () => {
    const newAmount = parseFloat(editAmount)
    if (newAmount > 0) {
      onEdit({ ...material, amount: newAmount })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditAmount(material.amount.toString())
    setIsEditing(false)
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-sm leading-tight">
            {material.material_name}
          </p>
          {!isEditing && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {material.amount} {material.unit_name}
            </p>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="h-7 text-xs w-20"
                step="0.01"
                min="0"
                autoFocus
              />
              <span className="text-xs text-muted-foreground">{material.unit_name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                  disabled={disabled}
                >
                  ✓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  disabled={disabled}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
              disabled={disabled}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface FormPanelProps {
  taskDivisionId: string
  setTaskDivisionId: (id: string) => void
  unitId: string
  setUnitId: (id: string) => void
  customName: string
  setCustomName: (name: string) => void
  taskDivisions: any[]
  units: any[]
  divisionsLoaded: boolean
  unitsLoaded: boolean
  isDataReady: boolean
  isDuplicationLoading: boolean
}

export function FormPanel({
  taskDivisionId,
  setTaskDivisionId,
  unitId,
  setUnitId,
  customName,
  setCustomName,
  taskDivisions,
  units,
  divisionsLoaded,
  unitsLoaded,
  isDataReady,
  isDuplicationLoading,
}: FormPanelProps) {
  const stepContent = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="task-division">Rubro</Label>
          <ComboBox
            value={taskDivisionId}
            onValueChange={setTaskDivisionId}
            options={taskDivisions.map(division => ({
              value: division.id,
              label: division.name
            }))}
            placeholder={divisionsLoaded ? "Seleccionar rubro..." : "Cargando rubros..."}
            searchPlaceholder="Buscar rubro..."
            emptyMessage="No se encontraron rubros"
            disabled={!divisionsLoaded}
          />
        </div>
        
        <div>
          <Label htmlFor="unit-select">Unidad</Label>
          <ComboBox
            value={unitId}
            onValueChange={setUnitId}
            options={units.map(unit => ({
              value: unit.id,
              label: unit.name
            }))}
            placeholder={unitsLoaded ? "Seleccionar unidad..." : "Cargando unidades..."}
            searchPlaceholder="Buscar unidad..."
            emptyMessage="No se encontraron unidades"
            disabled={!unitsLoaded}
          />
        </div>
        
        <div>
          <Label htmlFor="custom-name">Nombre Personalizado</Label>
          <Textarea
            id="custom-name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Nombre personalizado para la tarea..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )

  return isDataReady ? (
    isDuplicationLoading ? (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando costos originales para duplicación...</p>
          </div>
        </div>
      </div>
    ) : stepContent
  ) : (
    <div className="space-y-6">
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    </div>
  )
}

interface UseTaskFormOptions {
  task?: any
  taskData?: any
  taskId?: string
  isEditing?: boolean
  isDuplicating?: boolean
  onSuccess: () => void
}

export function useTaskForm({ task, taskData, taskId, isEditing, isDuplicating, onSuccess }: UseTaskFormOptions) {
  const queryClient = useQueryClient()
  const { data: userData, isSuccess: userLoaded } = useCurrentUser()
  const organizationId = userData?.organization?.id

  const { data: tasksData } = useGeneratedTasks()
  const [customName, setCustomName] = useState<string>('')
  const [taskDivisionId, setTaskDivisionId] = useState<string>('')
  const [unitId, setUnitId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null)
  const [taskMaterials, setTaskMaterials] = useState<any[]>([])
  const [originalTaskMaterials, setOriginalTaskMaterials] = useState<any[]>([])
  const [originalTaskLabor, setOriginalTaskLabor] = useState<any[]>([])
  const [selections, setSelections] = useState<ParameterSelection[]>([])

  const actualTask = React.useMemo(() => {
    if (task || taskData) {
      return task || taskData
    }
    if (taskId && tasksData) {
      return tasksData.find(t => t.id === taskId)
    }
    return null
  }, [task, taskData, taskId, tasksData])

  const isEditingMode = !isDuplicating && (isEditing || (taskId && actualTask))

  const createTaskMutation = useCreateGeneratedTask()
  const updateTaskMutation = useUpdateGeneratedTask()
  const createTaskMaterialMutation = useCreateTaskMaterial()
  const createTaskLaborMutation = useCreateTaskLabor()

  const { data: materials = [], isSuccess: materialsLoaded } = useMaterials(organizationId)
  const { data: existingTaskMaterials = [] } = useTaskMaterials(savedTaskId || actualTask?.id)
  const { data: originalTaskMaterialsData = [], isSuccess: originalMaterialsLoaded, isLoading: originalMaterialsLoading } = useTaskMaterials(isDuplicating && actualTask?.id ? actualTask.id : null)
  const { data: originalTaskLaborData = [], isSuccess: originalLaborLoaded, isLoading: originalLaborLoading } = useTaskLabor(isDuplicating && actualTask?.id ? actualTask.id : null)

  const { data: categories = [] } = useTaskCategories()
  const { data: units = [], isSuccess: unitsLoaded } = useUnits()

  const { data: taskDivisions = [], isSuccess: divisionsLoaded } = useQuery({
    queryKey: ['task-divisions'],
    queryFn: async () => {
      if (!supabase) return []
      const { data, error } = await supabase
        .from('task_divisions')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data || []
    },
    enabled: !!supabase
  })

  const isDataReady = divisionsLoaded && unitsLoaded && materialsLoaded
  const isDuplicationDataReady = isDuplicating ? (originalMaterialsLoaded && originalLaborLoaded) : true
  const isBasicFormReady = customName.trim() && taskDivisionId && unitId && isDataReady && userLoaded
  const isDuplicationLoading = isDuplicating && (originalMaterialsLoading || originalLaborLoading)

  useEffect(() => {
    if ((isEditingMode || isDuplicating) && actualTask) {
      if (actualTask.custom_name) {
        const duplicatedName = isDuplicating ? `${actualTask.custom_name} - Copia` : actualTask.custom_name
        setCustomName(duplicatedName)
      }
      if (actualTask.task_division_id) {
        setTaskDivisionId(actualTask.task_division_id)
      }
      if (actualTask.unit_id) {
        setUnitId(actualTask.unit_id)
      }
    }
  }, [isEditingMode, isDuplicating, actualTask])

  useEffect(() => {
    if (isEditingMode && actualTask?.id) {
      setSavedTaskId(actualTask.id)
    }
  }, [isEditingMode, actualTask?.id])

  useEffect(() => {
    if (existingTaskMaterials.length > 0) {
      setTaskMaterials(existingTaskMaterials.map(tm => ({
        id: tm.id,
        material_id: tm.material_id,
        amount: tm.amount,
        material_name: (tm as any).material_view?.name || 'Material sin nombre',
        unit_name: (tm as any).material_view?.unit_of_computation || 'Sin unidad'
      })))
    }
  }, [existingTaskMaterials])

  useEffect(() => {
    if (isDuplicating) {
      setOriginalTaskMaterials(originalTaskMaterialsData)
      setOriginalTaskLabor(originalTaskLaborData)
    }
  }, [originalTaskMaterialsData, originalTaskLaborData, isDuplicating])

  const handleSubmit = async () => {
    if (!customName.trim()) {
      toast({
        title: "Error",
        description: "Debes especificar un nombre personalizado para la tarea.",
        variant: "destructive",
      })
      return
    }

    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información de la organización.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      let taskIdToSave = savedTaskId
      const generateTaskCode = () => `CU-${Date.now()}`

      if (isEditingMode && actualTask) {
        const updateData: any = {
          custom_name: customName,
          unit_id: unitId || null,
          task_division_id: taskDivisionId || null,
          is_completed: false
        }

        const { error: updateError } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', actualTask.id)

        if (updateError) throw updateError
        taskIdToSave = actualTask.id
      } else {
        const newTask = {
          code: generateTaskCode(),
          custom_name: customName,
          unit_id: unitId || null,
          task_division_id: taskDivisionId || null,
          organization_id: userData.organization.id,
          is_system: false,
          is_completed: false
        }

        const { data, error } = await supabase
          .from('tasks')
          .insert([newTask])
          .select()
          .single()

        if (error) throw error
        taskIdToSave = data.id
      }

      if (taskMaterials.length > 0 && taskIdToSave && userData?.organization?.id) {
        for (const material of taskMaterials) {
          if (!material.id) {
            const materialData = {
              task_id: taskIdToSave,
              material_id: material.material_id,
              amount: material.amount,
              organization_id: userData.organization.id
            }
            await createTaskMaterialMutation.mutateAsync(materialData)
          }
        }
      }

      if (isDuplicating && actualTask && taskIdToSave && userData?.organization?.id) {
        for (const material of originalTaskMaterials) {
          const materialData = {
            task_id: taskIdToSave,
            material_id: material.material_id,
            amount: material.amount,
            organization_id: userData.organization.id
          }
          await createTaskMaterialMutation.mutateAsync(materialData)
        }

        for (const labor of originalTaskLabor) {
          const laborData = {
            task_id: taskIdToSave,
            labor_type_id: labor.labor_type_id,
            quantity: labor.quantity,
            organization_id: userData.organization.id
          }
          await createTaskLaborMutation.mutateAsync(laborData)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['tasks-view'] })
      queryClient.invalidateQueries({ queryKey: ['task-materials', taskIdToSave] })
      queryClient.invalidateQueries({ queryKey: ['task-labor', taskIdToSave] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })

      const successTitle = isDuplicating ? "Tarea duplicada" : (isEditingMode ? "Tarea actualizada" : "Tarea creada")
      const materialCount = taskMaterials.length + (isDuplicating ? originalTaskMaterials.length : 0)
      const costsMsg = materialCount > 0 ? ` con ${materialCount} materiales` : ''

      toast({
        title: successTitle,
        description: `Tarea ${isDuplicating ? 'duplicada' : (isEditingMode ? 'actualizada' : 'creada')} exitosamente: "${customName}"${costsMsg}.`,
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la tarea.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    customName,
    setCustomName,
    taskDivisionId,
    setTaskDivisionId,
    unitId,
    setUnitId,
    taskDivisions,
    units,
    divisionsLoaded,
    unitsLoaded,
    isDataReady,
    isDuplicationLoading,
    handleSubmit,
    isLoading,
    canSubmit: isBasicFormReady,
    isDuplicating,
    isEditingMode,
  }
}
