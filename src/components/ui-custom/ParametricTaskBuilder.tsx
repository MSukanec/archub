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
  onOrderChange?: (order: string[]) => void
  initialParameters?: string | null
  initialParameterOrder?: string[] | null
}

// Variable para mantener la última vista previa
let lastPreview = ''

export function ParametricTaskBuilder({ onSelectionChange, onPreviewChange, onOrderChange, initialParameters, initialParameterOrder }: ParametricTaskBuilderProps) {
  const [selections, setSelections] = useState<ParameterSelection[]>([])
  const [availableParameters, setAvailableParameters] = useState<string[]>([])
  const [taskPreview, setTaskPreview] = useState<string>('')
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})
  const [parameterOrder, setParameterOrder] = useState<string[]>([])

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
      console.log('📋 Parameters loaded:', data?.length || 0)
      return data as TaskParameter[]
    }
  })

  // Hook para obtener todas las opciones
  const { data: allOptions = [] } = useQuery({
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
      console.log('🎯 Options loaded:', data?.length || 0)
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
      
      if (error) {
        console.error('Error loading dependencies:', error)
        throw error
      }
      console.log('🔗 Dependencies loaded:', data?.length || 0)
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
      console.log('🎲 Dependency options loaded:', data?.length || 0)
      return data as TaskParameterDependencyOption[]
    }
  })

  // Inicializar con "TIPO DE TAREA" al cargar
  useEffect(() => {
    const tipoTareaParam = parameters.find(p => p.slug === 'tipo_tarea')
    if (tipoTareaParam && availableParameters.length === 0) {
      console.log('🎯 Parámetro inicial encontrado:', tipoTareaParam)
      setAvailableParameters([tipoTareaParam.id])
    }
  }, [parameters, availableParameters.length])

  // Calcular parámetros disponibles basado en selecciones actuales
  useEffect(() => {
    if (selections.length === 0) {
      const tipoTareaParam = parameters.find(p => p.slug === 'tipo_tarea')
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
    const tipoTareaParam = parameters.find(p => p.slug === 'tipo_tarea')
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

  // Load initial parameters if provided (after parameters and options are loaded)
  useEffect(() => {
    if (initialParameters && typeof initialParameters === 'string' && parameters.length > 0 && allOptions.length > 0 && selections.length === 0) {
      try {
        const parsedParams = JSON.parse(initialParameters);
        console.log('🔄 PROCESANDO PARÁMETROS INICIALES:', parsedParams);
        console.log('📋 Available parameters:', parameters.map(p => ({ id: p.id, slug: p.slug })));
        console.log('🎯 Available options:', allOptions.slice(0, 5).map(o => ({ id: o.id, parameter_id: o.parameter_id, label: o.label })));
        
        // Convert parsedParams to ParameterSelection format
        const initialSelections: ParameterSelection[] = [];
        const initialAvailableParams: string[] = [];
        
        for (const [key, value] of Object.entries(parsedParams)) {
          let parameter: TaskParameter | undefined;
          let option: TaskParameterOption | undefined;
          
          // Check if the key is a parameter ID (UUID format)
          if (key.length === 36 && key.includes('-')) {
            // New format: key is parameter ID, value is option ID
            parameter = parameters.find(p => p.id === key);
            if (parameter && typeof value === 'string' && value.length === 36 && value.includes('-')) {
              option = allOptions.find(opt => opt.id === value && opt.parameter_id === parameter.id);
            }
          } else {
            // Legacy format: key is parameter slug, value is option label/name
            parameter = parameters.find(p => p.slug === key);
            if (parameter) {
              // Find the option that matches the value (try multiple approaches)
              option = allOptions.find(opt => 
                opt.parameter_id === parameter.id && 
                (opt.label === value || opt.name === value)
              );
              
              // If not found, try case-insensitive search
              if (!option) {
                option = allOptions.find(opt => 
                  opt.parameter_id === parameter.id && 
                  (opt.label?.toLowerCase() === (value as string)?.toLowerCase() || 
                   opt.name?.toLowerCase() === (value as string)?.toLowerCase())
                );
              }
            }
          }
          
          if (parameter && option) {
            initialSelections.push({
              parameterId: parameter.id,
              optionId: option.id,
              parameterSlug: parameter.slug,
              parameterLabel: parameter.label,
              optionName: option.name,
              optionLabel: option.label
            });
            initialAvailableParams.push(parameter.id);
            console.log('✅ Loaded parameter:', key, '→', value, `(${parameter.slug} → ${option.label})`);
          } else {
            if (!parameter) {
              console.log('❌ Parameter not found:', key);
            } else {
              console.log('❌ Option not found for:', key, '→', value, 'in parameter:', parameter.id);
            }
          }
        }
        
        if (initialSelections.length > 0) {
          setSelections(initialSelections);
          setAvailableParameters(initialAvailableParams);
          
          // Establecer el orden inicial - siempre usar orden inteligente que incluya parámetros nuevos
          const standardOrder = ['tipo_tarea', 'tipo_de_muro', 'tipo_elemento', 'tipo_ladrillo', 'tipo_mortero', 'aditivos'];
          const availableSlugs = initialSelections.map(sel => sel.parameterSlug);
          
          // Si tenemos un orden guardado, usarlo como base pero insertar parámetros nuevos inteligentemente
          let initialOrder: string[];
          if (initialParameterOrder && initialParameterOrder.length > 0) {
            // Comenzar con el orden guardado
            const savedOrder = [...initialParameterOrder];
            
            // Encontrar parámetros que están disponibles pero no en el orden guardado
            const missingParams = availableSlugs.filter(slug => !savedOrder.includes(slug));
            
            if (missingParams.length > 0) {
              console.log('🔄 Inserting missing parameters:', missingParams);
              
              // Para cada parámetro faltante, insertarlo en la posición correcta según standardOrder
              missingParams.forEach(missingParam => {
                const standardIndex = standardOrder.indexOf(missingParam);
                if (standardIndex !== -1) {
                  // Encontrar la posición correcta para insertar
                  let insertIndex = savedOrder.length; // Por defecto al final
                  
                  // Buscar hacia atrás en standardOrder para encontrar un parámetro que ya esté en savedOrder
                  for (let i = standardIndex - 1; i >= 0; i--) {
                    const beforeParam = standardOrder[i];
                    const beforeIndex = savedOrder.indexOf(beforeParam);
                    if (beforeIndex !== -1) {
                      insertIndex = beforeIndex + 1;
                      break;
                    }
                  }
                  
                  // Insertar el parámetro en la posición correcta
                  savedOrder.splice(insertIndex, 0, missingParam);
                  console.log(`🎯 Inserted ${missingParam} at position ${insertIndex}`);
                } else {
                  // Si no está en standardOrder, agregarlo al final
                  savedOrder.push(missingParam);
                }
              });
            }
            
            initialOrder = savedOrder;
            console.log('📊 Using enhanced saved parameter order:', initialOrder);
          } else {
            // Filtrar el orden estándar para incluir solo los parámetros disponibles
            const filteredStandardOrder = standardOrder.filter(slug => availableSlugs.includes(slug));
            
            // Agregar parámetros que no están en el orden estándar al final
            const remainingSlugs = availableSlugs.filter(slug => !standardOrder.includes(slug));
            
            initialOrder = [...filteredStandardOrder, ...remainingSlugs];
            console.log('📊 Using standard parameter order for new task:', initialOrder);
          }
          
          setParameterOrder(initialOrder);
          console.log('🎯 Initial selections set:', initialSelections.length, 'parameters');
        }
      } catch (e) {
        console.error('❌ Error parsing initial parameters:', e);
      }
    }
  }, [initialParameters, parameters, allOptions, selections.length]);

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

    // NUEVA LÓGICA: Construir frase concatenando expression_templates de parámetros seleccionados
    const processedParts: string[] = []
    
    console.log('🎯 Construyendo frase sin template base, solo con expression_templates')

    // Procesar cada parámetro en el orden correcto 
    const orderedParameterIds = getOrderedParameters()
    const orderedSelections = orderedParameterIds
      .map(paramId => selections.find(s => s.parameterId === paramId))
      .filter(selection => selection !== undefined) as ParameterSelection[]
    
    orderedSelections.forEach(selection => {
      const parameter = parameters.find(p => p.id === selection.parameterId)
      if (!parameter) return

      console.log(`🔍 Procesando parámetro en orden: ${parameter.slug}`)
      
      // Aplicar expression_template del parámetro o usar {value} como fallback
      const expressionTemplate = parameter.expression_template || '{value}'
      console.log(`📋 Expression template del parámetro: ${expressionTemplate}`)
      
      // Reemplazar {value} con el label de la opción seleccionada
      const generatedText = expressionTemplate.replace('{value}', selection.optionLabel)
      console.log(`🔄 Texto generado: ${generatedText}`)
      
      // Agregar a las partes procesadas
      processedParts.push(generatedText)
    })

    // Unir todas las partes en una frase completa
    let finalText = processedParts.join(' ')
    
    // Limpiar espacios extra y comas/puntos duplicados
    finalText = finalText.replace(/\s+/g, ' ').trim()
    finalText = finalText.replace(/,\s*,/g, ',') // Eliminar comas duplicadas
    finalText = finalText.replace(/\.\s*\./g, '.') // Eliminar puntos duplicados
    
    // Asegurar que termine con punto si no tiene
    if (finalText && !finalText.endsWith('.') && !finalText.endsWith(',')) {
      finalText += '.'
    }
    
    console.log('✅ Vista previa final concatenada:', finalText)
    setTaskPreview(finalText)
    onPreviewChange?.(finalText)
    lastPreview = finalText
  }, [selections, parameters, onPreviewChange])

  // Notificar cambios de selección al componente padre
  useEffect(() => {
    onSelectionChange?.(selections)
  }, [selections, onSelectionChange])

  // Notificar cambios de orden al componente padre
  useEffect(() => {
    onOrderChange?.(parameterOrder)
  }, [parameterOrder, onOrderChange])

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

    // Actualizar el orden de parámetros
    const updatedOrder = [...parameterOrder]
    if (!updatedOrder.includes(parameter.slug)) {
      updatedOrder.push(parameter.slug)
      setParameterOrder(updatedOrder)
      console.log('🎯 Parameter order updated:', updatedOrder)
    }

    // Cerrar el popover
    setOpenPopovers(prev => ({ ...prev, [parameterId]: false }))
  }

  const removeSelection = (parameterId: string) => {
    const parameter = parameters.find(p => p.id === parameterId)
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

    // Actualizar el orden removiendo el parámetro eliminado
    if (parameter) {
      const updatedOrder = parameterOrder.filter(slug => slug !== parameter.slug)
      setParameterOrder(updatedOrder)
      console.log('🗑️ Parameter removed from order:', parameter.slug, '→ New order:', updatedOrder)
    }
  }

  const getOptionsForParameter = (parameterId: string): TaskParameterOption[] => {
    // Si es el primer parámetro, mostrar todas sus opciones
    const isFirstParam = parameters.find(p => p.id === parameterId)?.slug === 'tipo_tarea'
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

  // Función para ordenar parámetros según parameterOrder
  const getOrderedParameters = () => {
    if (parameterOrder.length === 0) {
      // Si no hay orden definido, usar el orden de availableParameters
      return availableParameters
    }
    
    // Crear un mapa de slug a ID para facilitar el ordenamiento
    const slugToIdMap: Record<string, string> = {}
    parameters.forEach(param => {
      slugToIdMap[param.slug] = param.id
    })
    
    // Ordenar según parameterOrder, agregando al final los parámetros no especificados
    const orderedIds: string[] = []
    
    // Primero, agregar parámetros en el orden especificado
    parameterOrder.forEach(slug => {
      const paramId = slugToIdMap[slug]
      if (paramId && availableParameters.includes(paramId)) {
        orderedIds.push(paramId)
      }
    })
    
    // Luego, agregar parámetros no especificados en parameterOrder
    availableParameters.forEach(paramId => {
      if (!orderedIds.includes(paramId)) {
        orderedIds.push(paramId)
      }
    })
    
    console.log('🔀 Parameter ordering:', {
      parameterOrder,
      availableParameters,
      orderedIds,
      slugToIdMap
    })
    
    return orderedIds
  }

  return (
    <div className="space-y-6">
      {/* Badges de parámetros seleccionados */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Configuración de parámetros</Label>
        <div className="flex flex-wrap gap-2">
          {getOrderedParameters().map(paramId => {
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
      {taskPreview && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground italic">
              {taskPreview}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}