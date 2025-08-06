import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ParameterDependencyNode {
  id: string
  parameterId: string
  parameterSlug: string
  parameterLabel: string
  level: number
  children: ParameterDependencyChild[]
}

export interface ParameterDependencyChild {
  dependencyId: string
  parentOptionId: string
  parentOptionName: string
  parentOptionLabel: string
  childParameter: {
    id: string
    slug: string
    label: string
  }
  childOptions: Array<{
    id: string
    name: string
    label: string
  }>
}

// Hook para obtener todas las dependencias de parámetros en estructura de árbol
export function useParameterDependenciesTree() {
  return useQuery({
    queryKey: ['parameter-dependencies-tree'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available')
      
      // 1. Obtener todos los parámetros
      const { data: parameters, error: parametersError } = await supabase
        .from('task_parameters')
        .select('*')
        .order('label')
      
      if (parametersError) throw parametersError
      
      // 2. Obtener todas las dependencias con información completa
      const { data: dependencies, error: dependenciesError } = await supabase
        .from('task_parameter_dependencies')
        .select(`
          *,
          parent_parameter:task_parameters!parent_parameter_id(*),
          parent_option:task_parameter_options!parent_option_id(*),
          child_parameter:task_parameters!child_parameter_id(*)
        `)
      
      if (dependenciesError) throw dependenciesError
      
      // 3. Obtener opciones configuradas para cada dependencia
      const { data: dependencyOptions, error: dependencyOptionsError } = await supabase
        .from('task_parameter_dependency_options')
        .select(`
          *,
          child_option:task_parameter_options(*)
        `)
      
      if (dependencyOptionsError) throw dependencyOptionsError
      
      // 4. Construir estructura de árbol
      const tree: ParameterDependencyNode[] = []
      const processedParams = new Set<string>()
      
      // Encontrar parámetros raíz (que no son hijos de ningún otro)
      const childParameterIds = new Set((dependencies || []).map(d => d.child_parameter_id))
      const rootParameters = (parameters || []).filter(p => !childParameterIds.has(p.id))
      
      function buildNode(parameter: any, level: number): ParameterDependencyNode {
        const children: ParameterDependencyChild[] = []
        
        // Encontrar todas las dependencias donde este parámetro es padre
        const parameterDependencies = (dependencies || []).filter(d => d.parent_parameter_id === parameter.id)
        
        for (const dep of parameterDependencies) {
          // Obtener opciones configuradas para esta dependencia
          const configuredOptions = (dependencyOptions || [])
            .filter(opt => opt.dependency_id === dep.id)
            .map(opt => opt.child_option)
            .filter(Boolean)
          
          children.push({
            dependencyId: dep.id,
            parentOptionId: dep.parent_option_id,
            parentOptionName: dep.parent_option.name,
            parentOptionLabel: dep.parent_option.label,
            childParameter: {
              id: dep.child_parameter.id,
              slug: dep.child_parameter.slug,
              label: dep.child_parameter.label
            },
            childOptions: configuredOptions
          })
        }
        
        return {
          id: parameter.id,
          parameterId: parameter.id,
          parameterSlug: parameter.slug,
          parameterLabel: parameter.label,
          level,
          children
        }
      }
      
      // Construir nodos raíz
      for (const rootParam of rootParameters) {
        if (!processedParams.has(rootParam.id)) {
          tree.push(buildNode(rootParam, 0))
          processedParams.add(rootParam.id)
        }
      }
      
      return tree
    }
  })
}

// Hook para obtener parámetros que no tienen dependencias padre (raíz)
export function useRootParameters() {
  return useQuery({
    queryKey: ['root-parameters'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available')
      
      // Obtener todos los parámetros
      const { data: parameters, error: parametersError } = await supabase
        .from('task_parameters')
        .select('*')
        .order('label')
      
      if (parametersError) throw parametersError
      
      // Obtener IDs de parámetros que son hijos
      const { data: dependencies, error: dependenciesError } = await supabase
        .from('task_parameter_dependencies')
        .select('child_parameter_id')
      
      if (dependenciesError) throw dependenciesError
      
      const childParameterIds = new Set(dependencies.map(d => d.child_parameter_id))
      
      // Filtrar parámetros que no son hijos de ningún otro
      return parameters.filter(p => !childParameterIds.has(p.id))
    }
  })
}