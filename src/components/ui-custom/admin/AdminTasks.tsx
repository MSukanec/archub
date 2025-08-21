import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
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
  is_required?: boolean
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
  onOrderChange?: (order: string[]) => void
  onCreateTask?: (data: { selections: ParameterSelection[], preview: string, paramValues: Record<string, string>, paramOrder: string[], availableParameters: string[] }) => void
  initialParameters?: string | null
  initialParameterOrder?: string[] | null
}

// Variable para mantener la última vista previa
let lastPreview = ''

export const ParametricTaskBuilder = forwardRef<
  { executeCreateTaskCallback: () => void },
  ParametricTaskBuilderProps
>(({ onSelectionChange, onPreviewChange, onOrderChange, onCreateTask, initialParameters, initialParameterOrder }, ref) => {
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [availableParameters, setAvailableParameters] = useState<string[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})
  const [parameterOrder, setParameterOrder] = useState<string[]>([])

  // Función para ejecutar el callback de creación de tarea con datos completos
  const executeCreateTaskCallback = () => {

    
    if (onCreateTask) {
      const paramValues: Record<string, string> = {};
      selections.forEach(selection => {
        paramValues[selection.parameterSlug] = selection.optionId;
      });

      // Obtener los parámetros ordenados actual
      const orderedParameterIds = getOrderedParameters();
      const paramOrder = orderedParameterIds.map(paramId => {
        const parameter = parameters.find(p => p.id === paramId);
        return parameter?.slug || '';
      }).filter(Boolean);

      const taskData = {
        selections,
        preview: taskPreview,
        paramValues,
        paramOrder,
        availableParameters
      };

      onCreateTask(taskData);
    }
  };

  // Exponer la función al componente padre
  useImperativeHandle(ref, () => ({
    executeCreateTaskCallback
  }));

  // Hook para obtener todos los parámetros
  const { data: parameters = [] } = useQuery({
    queryKey: ['parametric-builder-parameters'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      const { data, error } = await supabase
        .from('task_parameters')
        .select('*')
        .eq('type', 'select')
        .order('label')
      
      if (error) {
        console.error('Error loading parameters:', error)
        throw error
      }

      return data as TaskParameter[]
    }
  })

  // Hook para obtener opciones de parámetros
  const { data: options = [] } = useQuery({
    queryKey: ['parametric-builder-options'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      const { data, error } = await supabase
        .from('task_parameter_options')
        .select('*')
        .order('label')
      
      if (error) {
        console.error('Error loading options:', error)
        throw error
      }

      return data as TaskParameterOption[]
    }
  })

  // Hook para obtener dependencias
  const { data: dependencies = [] } = useQuery({
    queryKey: ['parametric-builder-dependencies'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      const { data, error } = await supabase
        .from('task_parameter_dependencies')
        .select('*')
        .order('created_at')
      
      if (error) {
        console.error('Error loading dependencies:', error)
        throw error
      }

      return data as TaskParameterDependency[]
    }
  })

  // Hook para obtener opciones de dependencias
  const { data: dependencyOptions = [] } = useQuery({
    queryKey: ['parametric-builder-dependency-options'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      const { data, error } = await supabase
        .from('task_parameter_dependency_options')
        .select('*')
      
      if (error) {
        console.error('Error loading dependency options:', error)
        throw error
      }

      return data as TaskParameterDependencyOption[]
    }
  })

  // Función para obtener las opciones disponibles para un parámetro específico
  const getAvailableOptions = (parameterId: string): TaskParameterOption[] => {
    // Buscar si este parámetro es dependiente de alguno
    const dependency = dependencies.find(dep => dep.child_parameter_id === parameterId)
    
    if (!dependency) {
      // Si no hay dependencia, mostrar todas las opciones
      return options.filter(opt => opt.parameter_id === parameterId)
    }
    
    // Buscar la selección del parámetro padre
    const parentSelection = selections.find(sel => sel.parameterId === dependency.parent_parameter_id)
    
    if (!parentSelection) {
      // Si no hay selección del padre, no mostrar opciones
      return []
    }
    
    // Verificar si la opción del padre coincide con la dependencia
    if (parentSelection.optionId !== dependency.parent_option_id) {
      // Si no coincide, no mostrar opciones
      return []
    }
    
    // Obtener las opciones permitidas para esta dependencia
    const allowedOptions = dependencyOptions
      .filter(depOpt => depOpt.dependency_id === dependency.id)
      .map(depOpt => depOpt.child_option_id)
    
    // Filtrar las opciones del parámetro por las permitidas
    return options.filter(opt => 
      opt.parameter_id === parameterId && allowedOptions.includes(opt.id)
    )
  }

  // Función para obtener parámetros ordenados según la lógica compleja
  const getOrderedParameters = (): string[] => {
    console.log('🔀 Parameter ordering:', {
      parameterOrder,
      enhancedOrder: [...parameterOrder],
      availableParameters,
      orderedIds: parameterOrder.map(slug => {
        const param = parameters.find(p => p.slug === slug)
        return param?.id
      }).filter(Boolean),
      slugToIdMap: parameters.reduce((acc, p) => ({ ...acc, [p.slug]: p.id }), {})
    })

    // Convertir slugs a IDs usando el array de parámetros
    const orderedIds = parameterOrder.map(slug => {
      const param = parameters.find(p => p.slug === slug)
      return param?.id
    }).filter(Boolean) as string[]

    // Agregar parámetros que no están en el order pero están disponibles
    const missingParams = availableParameters.filter(id => !orderedIds.includes(id))
    
    return [...orderedIds, ...missingParams]
  }

  // Función para determinar si un parámetro debería estar disponible
  const shouldParameterBeAvailable = (parameterId: string): boolean => {
    // Buscar si este parámetro es dependiente de alguno
    const dependency = dependencies.find(dep => dep.child_parameter_id === parameterId)
    
    if (!dependency) {
      // Si no hay dependencia, está disponible
      return true
    }
    
    // Buscar la selección del parámetro padre
    const parentSelection = selections.find(sel => sel.parameterId === dependency.parent_parameter_id)
    
    if (!parentSelection) {
      // Si no hay selección del padre, no está disponible
      return false
    }
    
    // Verificar si la opción del padre coincide con la dependencia
    return parentSelection.optionId === dependency.parent_option_id
  }

  // Efecto para calcular parámetros disponibles
  useEffect(() => {
    const available = parameters
      .filter(param => shouldParameterBeAvailable(param.id))
      .map(param => param.id)
    
    setAvailableParameters(available)
  }, [parameters, dependencies, selections])

  // Función para generar vista previa
  const generateTaskPreview = (currentSelections: ParameterSelection[]) => {
    console.log('🎯 Generando vista previa con selecciones:', currentSelections)
    
    // Crear un mapa de reemplazos usando optionLabel
    const replacements: Record<string, string> = {}
    currentSelections.forEach(selection => {
      replacements[`{{${selection.parameterSlug}}}`] = selection.optionLabel
      console.log(`📝 Mapeando: {{${selection.parameterSlug}}} → ${selection.optionLabel}`)
    })

    // No hay template base, construir con expression_templates
    console.log('🎯 Construyendo frase sin template base, solo con expression_templates')
    
    // Obtener los parámetros ordenados
    const orderedParameterIds = getOrderedParameters()
    
    // Generar las partes usando expression_template de cada parámetro en orden
    const parts: string[] = []
    
    orderedParameterIds.forEach(paramId => {
      // Buscar el parámetro
      const parameter = parameters.find(p => p.id === paramId)
      if (!parameter) return
      
      console.log(`🔍 Procesando parámetro en orden: ${parameter.slug}`)
      
      // Buscar la selección para este parámetro
      const selection = currentSelections.find(s => s.parameterId === paramId)
      if (!selection) return // Si no hay selección, saltar
      
      // Obtener el expression_template del parámetro
      const template = parameter.expression_template || '{value}'
      console.log(`📋 Expression template del parámetro: ${template}`)
      
      // Reemplazar {value} con el optionLabel
      const processedText = template.replace(/{value}/g, selection.optionLabel)
      console.log(`🔄 Texto generado: ${processedText}`)
      
      if (processedText.trim()) {
        parts.push(processedText)
      }
    })
    
    // Unir las partes con espacios y agregar punto final
    const result = parts.join(' ') + '.'
    console.log('✅ Vista previa final concatenada:', result)
    
    return result
  }

  // Función para manejar selección
  const handleSelection = (parameterId: string, optionId: string) => {
    const parameter = parameters.find(p => p.id === parameterId)
    const option = options.find(o => o.id === optionId)
    
    if (!parameter || !option) return

    const newSelection: ParameterSelection = {
      parameterId,
      optionId,
      parameterSlug: parameter.slug,
      parameterLabel: parameter.label,
      optionName: option.name,
      optionLabel: option.label
    }

    const updatedSelections = selections.filter(s => s.parameterId !== parameterId)
    updatedSelections.push(newSelection)
    setSelections(updatedSelections)

    // Generar vista previa
    const preview = generateTaskPreview(updatedSelections)
    setTaskPreview(preview)
    lastPreview = preview

    // Llamar callbacks
    onSelectionChange?.(updatedSelections)
    onPreviewChange?.(preview)

    // Cerrar popover
    setOpenPopovers(prev => ({ ...prev, [parameterId]: false }))
  }

  // Función para remover selección
  const removeSelection = (parameterId: string) => {
    const updatedSelections = selections.filter(s => s.parameterId !== parameterId)
    setSelections(updatedSelections)

    // También remover selecciones de parámetros dependientes
    const dependentParams = dependencies
      .filter(dep => dep.parent_parameter_id === parameterId)
      .map(dep => dep.child_parameter_id)
    
    const finalSelections = updatedSelections.filter(s => !dependentParams.includes(s.parameterId))
    setSelections(finalSelections)

    // Generar vista previa
    const preview = generateTaskPreview(finalSelections)
    setTaskPreview(preview)
    lastPreview = preview

    // Llamar callbacks
    onSelectionChange?.(finalSelections)
    onPreviewChange?.(preview)
  }

  // Función para manejar orden de parámetros
  const handleParameterOrderChange = (newOrder: string[]) => {
    setParameterOrder(newOrder)
    onOrderChange?.(newOrder)
    
    // Regenerar vista previa con nuevo orden
    const preview = generateTaskPreview(selections)
    setTaskPreview(preview)
    onPreviewChange?.(preview)
  }

  // Inicializar con parámetros existentes si están disponibles
  useEffect(() => {
    if (initialParameters && parameters.length > 0 && options.length > 0 && selections.length === 0) {
      try {
        const parsedParams = JSON.parse(initialParameters)
        console.log('📊 Parsing existing param values:', parsedParams)
        
        const initialSelections: ParameterSelection[] = []
        
        Object.entries(parsedParams).forEach(([slug, optionId]) => {
          const parameter = parameters.find(p => p.slug === slug)
          const option = options.find(o => o.id === optionId)
          
          if (parameter && option) {
            initialSelections.push({
              parameterId: parameter.id,
              optionId: option.id,
              parameterSlug: parameter.slug,
              parameterLabel: parameter.label,
              optionName: option.name,
              optionLabel: option.label
            })
          }
        })
        
        // Filtrar el order inicial para incluir solo parámetros que existen en parsedParams
        const filteredOrder = (initialParameterOrder || []).filter(slug => parsedParams.hasOwnProperty(slug))
        console.log('📊 Using filtered saved parameter order:', filteredOrder)
        
        setSelections(initialSelections)
        setParameterOrder(filteredOrder)
        
        // Generar vista previa inicial
        const preview = generateTaskPreview(initialSelections)
        setTaskPreview(preview)
        onPreviewChange?.(preview)
        onSelectionChange?.(initialSelections)
        onOrderChange?.(filteredOrder)
        
        console.log('🎯 Initial selections set:', initialSelections.length, 'parameters')
      } catch (error) {
        console.error('Error parsing initial parameters:', error)
      }
    }
  }, [parameters, options, initialParameters, initialParameterOrder])

  // Función para detectar parámetros faltantes y reorganizar inteligentemente
  useEffect(() => {
    if (availableParameters.length === 0 || parameters.length === 0) return

    // Detectar parámetros que están disponibles pero no están en el orden actual
    const missingFromOrder = availableParameters.filter(paramId => {
      const param = parameters.find(p => p.id === paramId)
      return param && !parameterOrder.includes(param.slug)
    })

    if (missingFromOrder.length > 0) {
      // Mapear IDs a slugs
      const missingSlugs = missingFromOrder.map(paramId => {
        const param = parameters.find(p => p.id === paramId)
        return param?.slug
      }).filter(Boolean) as string[]
      
      console.log('🔄 Detected missing parameters in order:', missingSlugs)
      
      // Lógica inteligente de inserción
      const newOrder = [...parameterOrder]
      
      missingSlugs.forEach(slug => {
        // Insertar en la posición apropiada (por ahora al final)
        const insertPosition = newOrder.length
        newOrder.splice(insertPosition, 0, slug)
        console.log(`🎯 Intelligently inserted ${slug} at position ${insertPosition}`)
      })
      
      setParameterOrder(newOrder)
      onOrderChange?.(newOrder)
    }
  }, [availableParameters, parameters, parameterOrder])

  // Controlar popovers
  const togglePopover = (parameterId: string) => {
    setOpenPopovers(prev => ({
      ...prev,
      [parameterId]: !prev[parameterId]
    }))
  }

  // Función para obtener el valor seleccionado para un parámetro
  const getSelectedValue = (parameterId: string): string => {
    const selection = selections.find(s => s.parameterId === parameterId)
    return selection ? selection.optionLabel : ''
  }

  // Ordenar parámetros según el orden establecido
  const orderedParameterIds = getOrderedParameters()

  return (
    <div className="space-y-3">
      {/* Renderizar parámetros en orden */}
      {orderedParameterIds.map(parameterId => {
        const parameter = parameters.find(p => p.id === parameterId)
        const availableOptions = getAvailableOptions(parameterId)
        const selectedValue = getSelectedValue(parameterId)
        const hasSelection = selections.some(s => s.parameterId === parameterId)
        const isOpen = openPopovers[parameterId] || false
        
        if (!parameter || !shouldParameterBeAvailable(parameterId)) return null

        return (
          <div key={parameterId} className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {parameter.label}
              {parameter.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            <Popover open={isOpen} onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [parameterId]: open }))}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={`w-full justify-between text-left font-normal h-9 ${
                    hasSelection 
                      ? 'bg-accent text-accent-foreground border-accent' 
                      : 'hover:bg-muted hover:text-muted-foreground'
                  }`}
                  onClick={() => togglePopover(parameterId)}
                >
                  <span className="truncate">
                    {selectedValue || `Seleccionar ${parameter.label.toLowerCase()}...`}
                  </span>
                  <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              
              <PopoverContent className="w-80 p-0" align="start">
                <div className="max-h-64 overflow-y-auto">
                  {availableOptions.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No hay opciones disponibles
                    </div>
                  ) : (
                    <div className="p-2">
                      {availableOptions.map(option => (
                        <Button
                          key={option.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-8 px-2 font-normal"
                          onClick={() => handleSelection(parameterId, option.id)}
                        >
                          <span className="truncate">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Footer con opción de limpiar */}
                {hasSelection && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeSelection(parameterId)}
                    >
                      <X className="h-3 w-3 mr-2" />
                      Limpiar selección
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        )
      })}

      {/* Vista previa */}
      {taskPreview && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                Vista previa de la tarea
              </Label>
              <p className="text-sm font-medium text-foreground italic">
                {taskPreview}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

ParametricTaskBuilder.displayName = 'ParametricTaskBuilder'