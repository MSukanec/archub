import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface TaskTemplate {
  id: string
  name: string
  code: string
  unit_id?: string
  task_category_id?: string
  task_kind_id?: string
  name_expression: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at?: string
  version?: number
  is_system?: boolean
  unit?: {
    id: string
    name: string
  }
  parameters?: TaskTemplateParameter[]
}

export interface TaskTemplateParameter {
  id: string
  template_id: string
  parameter_id: string
  order_index: number
  is_required: boolean
  condition_json?: any
  created_at: string
  parameter?: {
    id: string
    slug: string
    label: string
    type: string
  }
}

export function useTaskTemplates() {
  return useQuery({
    queryKey: ['task-templates'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      try {
        const { data, error } = await supabase
          .from('task_templates')
          .select(`
            *,
            unit:units(id, name),
            parameters:task_template_parameters(
              *,
              parameter:task_parameters(id, slug, label, type)
            )
          `)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.warn('Error fetching task templates:', error)
          return []
        }
        return data as TaskTemplate[]
      } catch (err) {
        console.warn('Task templates table may not exist yet:', err)
        return []
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export function useTaskTemplate(id: string) {
  return useQuery({
    queryKey: ['task-template', id],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { data, error } = await supabase
        .from('task_templates')
        .select(`
          *,
          unit:units(id, name),
          parameters:task_template_parameters(
            *,
            parameter:task_parameters(id, slug, label, type)
          )
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data as TaskTemplate
    },
    enabled: !!id,
  })
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: Partial<TaskTemplate>) => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { data: template, error } = await supabase
        .from('task_templates')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      return template
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] })
      toast({
        title: "Plantilla creada",
        description: "La plantilla de tarea se ha creado correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al crear plantilla",
        description: "No se pudo crear la plantilla. Inténtalo de nuevo.",
        variant: "destructive"
      })
      console.error('Error creating task template:', error)
    }
  })
}

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskTemplate> }) => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { data, error } = await supabase
        .from('task_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] })
      toast({
        title: "Plantilla actualizada",
        description: "Los cambios se han guardado correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar la plantilla. Inténtalo de nuevo.",
        variant: "destructive"
      })
      console.error('Error updating task template:', error)
    }
  })
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase not available')
      
      const { error } = await supabase
        .from('task_templates')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-templates'] })
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente.",
      })
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description: "No se pudo eliminar la plantilla. Inténtalo de nuevo.",
        variant: "destructive"
      })
      console.error('Error deleting task template:', error)
    }
  })
}