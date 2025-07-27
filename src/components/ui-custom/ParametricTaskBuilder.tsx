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
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})

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
    
    // Siempre incluir parámetros que ya están seleccionados (para poder cambiarlos)
    selections.forEach(selection => {
      if (!newAvailableParams.includes(selection.parameterId)) {
        newAvailableParams.push(selection.parameterId)
      }
    })

    // Siempre incluir el primer parámetro si no está seleccionado
    const tipoTareaParam = parameters.find(p => p.slug === 'tipo-de-tarea')
    if (tipoTareaParam && !selections.some(s => s.parameterId === tipoTareaParam.id)) {
      newAvailableParams.push(tipoTareaParam.id)
    }

    // Para cada selección actual, buscar qué parámetros puede desbloquear
    selections.forEach(selection => {
      console.log('🔍 Buscando dependencias para:', selection.parameterSlug, '→', selection.optionLabel)
      
      const relevantDependencies = dependencies.filter(
        dep => dep.parent_parameter_id === selection.parameterId && 
               dep.parent_option_id === selection.optionId
      )

      console.log('📋 Dependencias encontradas:', relevantDependencies.length)

      relevantDependencies.forEach(dep => {
        console.log('🔗 Evaluando dependencia:', dep.child_parameter_id)
        
        // Verificar si este parámetro hijo ya está seleccionado
        const alreadySelected = selections.some(s => s.parameterId === dep.child_parameter_id)
        if (!alreadySelected && !newAvailableParams.includes(dep.child_parameter_id)) {
          // Agregar directamente el parámetro hijo sin verificar opciones específicas
          // Esto permite que aparezca el badge hijo
          newAvailableParams.push(dep.child_parameter_id)
          console.log('✅ Parámetro hijo agregado:', dep.child_parameter_id)
        }
      })
    })

    console.log('🎯 Parámetros disponibles actualizados:', newAvailableParams)
    setAvailableParameters(newAvailableParams)
  }, [selections, parameters, dependencies, dependencyOptions])

  // Generar vista previa
  useEffect(() => {
    if (selections.length === 0) {
      setTaskPreview('')
      onPreviewChange?.('')
      return
    }

    console.log('🎯 Generando vista previa con selecciones:', selections)

    // Crear un mapa de parámetros para reemplazo usando labels legibles
    const paramMap: Record<string, string> = {}
    selections.forEach(selection => {
      paramMap[selection.parameterSlug] = selection.optionLabel
      console.log(`📝 Mapeando: {{${selection.parameterSlug}}} → ${selection.optionLabel}`)
    })

    // Obtener template base del primer parámetro (tipo-de-tarea)
    const tipoTareaSelection = selections.find(s => 
      parameters.find(p => p.id === s.parameterId)?.slug === 'tipo-de-tarea'
    )

    if (tipoTareaSelection) {
      const tipoTareaParam = parameters.find(p => p.id === tipoTareaSelection.parameterId)
      console.log('📋 Template encontrado:', tipoTareaParam?.expression_template)
      
      if (tipoTareaParam?.expression_template) {
        // Usar la misma lógica que AdminTaskGroups - implementación exacta
        let processedTemplate = tipoTareaParam.expression_template
        
        console.log(`🎯 Template base encontrado: ${processedTemplate}`)

        // Procesar cada parámetro seleccionado
        selections.forEach(selection => {
          const parameter = parameters.find(p => p.id === selection.parameterId)
          if (!parameter) return

          const placeholder = `{{${parameter.slug}}}`
          console.log(`🔍 Procesando parámetro: ${parameter.slug}`)
          
          // Aplicar expression_template del parámetro o usar {value} como fallback
          const expressionTemplate = parameter.expression_template || '{value}'
          console.log(`📋 Expression template del parámetro: ${expressionTemplate}`)
          
          // Reemplazar {value} con el label de la opción seleccionada
          const generatedText = expressionTemplate.replace('{value}', selection.optionLabel)
          console.log(`🔄 Texto generado: ${generatedText}`)
          
          // Reemplazar el placeholder en el template principal
          processedTemplate = processedTemplate.replace(placeholder, generatedText)
          console.log(`✨ Template después de reemplazar ${placeholder}: ${processedTemplate}`)
        })

        // Limpiar espacios extra
        processedTemplate = processedTemplate.replace(/\s+/g, ' ').trim()
        
        preview = processedTemplate
        console.log('✅ Vista previa final:', preview)
        setTaskPreview(preview)
        onPreviewChange?.(preview)
        lastPreview = preview
      } else {
        console.log('❌ No se encontró expression_template')
      }
    } else {
      console.log('❌ No se encontró selección de tipo-de-tarea')
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

    // Cerrar el popover
    setOpenPopovers(prev => ({ ...prev, [parameterId]: false }))
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
                <Popover 
                  open={openPopovers[paramId] || false}
                  onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [paramId]: open }))}
                >
                  <PopoverTrigger asChild>
                    <Button 
                      variant={selection ? "default" : "outline"}
                      className="px-3 py-1.5 h-auto text-xs flex items-center gap-2 rounded-full"
                    >
                      <span>{selection ? selection.optionLabel : parameter.label}</span>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2 rounded-lg bg-[var(--popover-bg)] shadow-lg border-0">
                    <div className="space-y-1">
                      {selection && (
                        <>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              removeSelection(paramId)
                              setOpenPopovers(prev => ({ ...prev, [paramId]: false }))
                            }}
                          >
                            <X className="w-3 h-3 mr-2" />
                            Limpiar selección
                          </Button>
                          <div className="border-t border-[var(--popover-border)] my-1" />
                        </>
                      )}
                      {options.map(option => (
                        <Button
                          key={option.id}
                          variant={selection?.optionId === option.id ? "secondary" : "ghost"}
                          className="w-full justify-start text-xs h-8 hover:bg-[var(--accent-hover)]"
                          onClick={() => handleParameterSelect(paramId, option.id)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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