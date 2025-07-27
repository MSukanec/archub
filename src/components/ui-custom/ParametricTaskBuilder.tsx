import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { supabase } from '@/lib/supabase'
import { X, Sparkles, ChevronDown } from 'lucide-react'

interface TaskParameter {
  id: string
  slug: string
  label: string
  type: string
  expression_template: string
}

interface TaskParameterOption {
  id: string
  parameter_id: string
  name: string
  label: string
}

interface TaskParameterDependency {
  id: string
  parent_parameter_id: string
  parent_option_id: string
  child_parameter_id: string
}

interface TaskParameterDependencyOption {
  id: string
  dependency_id: string
  child_option_id: string
}

interface ParameterSelection {
  parameterId: string
  optionId: string
  parameterSlug: string
  parameterLabel: string
  optionName: string
  optionLabel: string
}

interface ParametricTaskBuilderProps {
  onSelectionChange?: (selections: ParameterSelection[]) => void
  onPreviewChange?: (preview: string) => void
}

// Variable para mantener la última vista previa
let lastPreview = ''

export function ParametricTaskBuilder({ onSelectionChange, onPreviewChange }: ParametricTaskBuilderProps) {
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [availableParameters, setAvailableParameters] = useState<string[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')

  // Hook para obtener todos los parámetros
  const { data: parameters = [] } = useQuery({
    queryKey: ['parametric-builder-parameters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .eq('type', 'select')
        .order('label')
      
      if (error) throw error
      return data as TaskParameter[]
    }
  })

  // Hook para obtener todas las opciones
  const { data: allOptions = [] } = useQuery({
    queryKey: ['parametric-builder-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select('*')
        .order('label')
      
      if (error) throw error
      return data as TaskParameterOption[]
    }
  })

  // Hook para obtener dependencias
  const { data: dependencies = [] } = useQuery({
    queryKey: ['parametric-builder-dependencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_dependencies')
        .select('*')
      
      if (error) throw error
      return data as TaskParameterDependency[]
    }
  })

  // Hook para obtener opciones de dependencias
  const { data: dependencyOptions = [] } = useQuery({
    queryKey: ['parametric-builder-dependency-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parameter_dependency_options')
        .select('*')
      
      if (error) throw error
      return data as TaskParameterDependencyOption[]
    }
  })

  // Inicializar con "TIPO DE TAREA" al cargar
  useEffect(() => {
    const tipoTareaParam = parameters.find(p => p.slug === 'tipo-de-tarea')
    if (tipoTareaParam && availableParameters.length === 0) {
      setAvailableParameters([tipoTareaParam.id])
    }
  }, [parameters, availableParameters.length])

  // Calcular parámetros disponibles basado en selecciones actuales
  useEffect(() => {
    if (selections.length === 0) {
      const tipoTareaParam = parameters.find(p => p.slug === 'tipo-de-tarea')
      if (tipoTareaParam) {
        setAvailableParameters([tipoTareaParam.id])
      }
      return
    }

    const newAvailableParams: string[] = []
    
    // Siempre incluir el primer parámetro si no está seleccionado
    const tipoTareaParam = parameters.find(p => p.slug === 'tipo-de-tarea')
    if (tipoTareaParam && !selections.some(s => s.parameterId === tipoTareaParam.id)) {
      newAvailableParams.push(tipoTareaParam.id)
    }

    // Para cada selección actual, buscar qué parámetros puede desbloquear
    selections.forEach(selection => {
      const relevantDependencies = dependencies.filter(
        dep => dep.parent_parameter_id === selection.parameterId && 
               dep.parent_option_id === selection.optionId
      )

      relevantDependencies.forEach(dep => {
        // Verificar si este parámetro hijo ya está seleccionado
        const alreadySelected = selections.some(s => s.parameterId === dep.child_parameter_id)
        if (!alreadySelected && !newAvailableParams.includes(dep.child_parameter_id)) {
          // Verificar si hay opciones específicas permitidas para esta dependencia
          const allowedOptions = dependencyOptions.filter(opt => opt.dependency_id === dep.id)
          if (allowedOptions.length > 0) {
            newAvailableParams.push(dep.child_parameter_id)
          }
        }
      })
    })

    setAvailableParameters(newAvailableParams)
  }, [selections, parameters, dependencies, dependencyOptions])

  // Generar vista previa
  useEffect(() => {
    if (selections.length === 0) {
      onPreviewChange?.('')
      return
    }

    // Crear un mapa de parámetros para reemplazo
    const paramMap: Record<string, string> = {}
    selections.forEach(selection => {
      paramMap[selection.parameterSlug] = selection.optionName
    })

    // Obtener template base del primer parámetro (tipo-de-tarea)
    const tipoTareaSelection = selections.find(s => 
      parameters.find(p => p.id === s.parameterId)?.slug === 'tipo-de-tarea'
    )

    if (tipoTareaSelection) {
      const tipoTareaParam = parameters.find(p => p.id === tipoTareaSelection.parameterId)
      if (tipoTareaParam?.expression_template) {
        let preview = tipoTareaParam.expression_template

        // Reemplazar todos los parámetros en el template
        Object.entries(paramMap).forEach(([slug, value]) => {
          const regex = new RegExp(`{{${slug}}}`, 'g')
          preview = preview.replace(regex, value.toLowerCase())
        })

        // Reemplazar parámetros no seleccionados con placeholders
        const placeholderRegex = /{{([^}]+)}}/g
        preview = preview.replace(placeholderRegex, (match, slug) => {
          const param = parameters.find(p => p.slug === slug)
          return param ? `[${param.label}]` : match
        })

        setTaskPreview(preview)
        onPreviewChange?.(preview)
        lastPreview = preview
      }
    }
  }, [selections, parameters, onPreviewChange])

  // Notificar cambios de selección al componente padre
  useEffect(() => {
    onSelectionChange?.(selections)
  }, [selections, onSelectionChange])

  const handleParameterSelect = (parameterId: string, optionId: string) => {
    const parameter = parameters.find(p => p.id === parameterId)
    const option = allOptions.find(o => o.id === optionId)
    
    if (!parameter || !option) return

    const newSelection: ParameterSelection = {
      parameterId,
      optionId,
      parameterSlug: parameter.slug,
      parameterLabel: parameter.label,
      optionName: option.name,
      optionLabel: option.label
    }

    // Remover selección anterior del mismo parámetro si existe
    const updatedSelections = selections.filter(s => s.parameterId !== parameterId)
    setSelections([...updatedSelections, newSelection])
  }

  const removeSelection = (parameterId: string) => {
    const updatedSelections = selections.filter(s => s.parameterId !== parameterId)
    setSelections(updatedSelections)
    
    // También remover cualquier selección que dependía de este parámetro
    const dependentParams = dependencies
      .filter(dep => dep.parent_parameter_id === parameterId)
      .map(dep => dep.child_parameter_id)
    
    const finalSelections = updatedSelections.filter(s => 
      !dependentParams.includes(s.parameterId)
    )
    setSelections(finalSelections)
  }

  const getOptionsForParameter = (parameterId: string): TaskParameterOption[] => {
    // Si es el primer parámetro, mostrar todas sus opciones
    const isFirstParam = parameters.find(p => p.id === parameterId)?.slug === 'tipo-de-tarea'
    if (isFirstParam) {
      return allOptions.filter(opt => opt.parameter_id === parameterId)
    }

    // Para parámetros dependientes, filtrar opciones según dependencias
    const allowedOptionIds: string[] = []
    
    selections.forEach(selection => {
      const dependency = dependencies.find(
        dep => dep.parent_parameter_id === selection.parameterId &&
               dep.parent_option_id === selection.optionId &&
               dep.child_parameter_id === parameterId
      )
      
      if (dependency) {
        const allowedOptions = dependencyOptions
          .filter(opt => opt.dependency_id === dependency.id)
          .map(opt => opt.child_option_id)
        allowedOptionIds.push(...allowedOptions)
      }
    })

    return allOptions.filter(opt => 
      opt.parameter_id === parameterId && 
      (allowedOptionIds.length === 0 || allowedOptionIds.includes(opt.id))
    )
  }

  return (
    <div className="space-y-6">
      {/* Badges de parámetros seleccionados */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Configuración de parámetros</Label>
        <div className="flex flex-wrap gap-2">
          {availableParameters.map(paramId => {
            const parameter = parameters.find(p => p.id === paramId)
            const selection = selections.find(s => s.parameterId === paramId)
            const options = getOptionsForParameter(paramId)
            
            if (!parameter) return null

            return (
              <div key={paramId} className="flex items-center gap-2">
                {!selection ? (
                  // Badge con dropdown integrado cuando no hay selección
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline"
                        className="px-3 py-1.5 h-auto text-xs flex items-center gap-2 rounded-full"
                      >
                        <span>{parameter.label}</span>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <div className="p-1">
                        {options.map(option => (
                          <Button
                            key={option.id}
                            variant="ghost"
                            className="w-full justify-start text-xs h-8"
                            onClick={() => handleParameterSelect(paramId, option.id)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  // Badge con selección y opción de eliminar
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="default"
                      className="px-3 py-1.5 text-xs flex items-center gap-2"
                    >
                      <span>{parameter.label}</span>
                      <button
                        onClick={() => removeSelection(paramId)}
                        className="hover:bg-white/20 rounded-sm p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {selection.optionLabel}
                    </Badge>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Vista previa de la tarea */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <Label className="text-sm font-medium">Vista previa de la tarea</Label>
        </div>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground italic min-h-[3rem] flex items-center">
              {taskPreview || "Selecciona parámetros para generar la vista previa de la tarea..."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}