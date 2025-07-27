import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface TaskGroupParameterOption {
  id: string
  created_at: string
  updated_at: string
  group_id: string
  parameter_id: string
  parameter_option_id: string
  position: number
}

export function useTaskGroupParameterOptions(groupId?: string) {
  return useQuery({
    queryKey: ['task-group-parameter-options', groupId],
    queryFn: async () => {
      if (!supabase || !groupId) return []

      const { data, error } = await supabase
        .from('task_group_parameter_options')
        .select('*')
        .eq('group_id', groupId)
        .order('position', { ascending: true })

      if (error) throw error
      return data as TaskGroupParameterOption[]
    },
    enabled: !!supabase && !!groupId,
  })
}

export function useSaveTaskGroupParameterOptions() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      groupId,
      parameterOptions
    }: {
      groupId: string
      parameterOptions: Array<{
        parameter_id: string
        parameter_option_ids: string[]
        position: number
      }>
    }) => {
      if (!supabase) throw new Error('Supabase not initialized')

      console.log('💾 Guardando opciones de parámetros para grupo:', groupId)
      console.log('📋 Opciones a guardar:', parameterOptions)

      // First, delete existing options for this group
      const { error: deleteError } = await supabase
        .from('task_group_parameter_options')
        .delete()
        .eq('group_id', groupId)

      if (deleteError) {
        console.error('❌ Error eliminando opciones existentes:', deleteError)
        throw deleteError
      }

      // Prepare new records to insert
      const recordsToInsert = parameterOptions.flatMap(({ parameter_id, parameter_option_ids, position }) =>
        parameter_option_ids.map(parameter_option_id => ({
          group_id: groupId,
          parameter_id,
          parameter_option_id,
          position
        }))
      )

      console.log('📝 Registros a insertar:', recordsToInsert)

      if (recordsToInsert.length > 0) {
        const { data, error: insertError } = await supabase
          .from('task_group_parameter_options')
          .insert(recordsToInsert)
          .select()

        if (insertError) {
          console.error('❌ Error insertando nuevas opciones:', insertError)
          throw insertError
        }

        console.log('✅ Opciones guardadas exitosamente:', data)
        return data
      }

      return []
    },
    onSuccess: (data, variables) => {
      console.log('✅ Opciones de parámetros guardadas exitosamente')
      
      // Invalidate all relevant queries for complete UI refresh
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['task-group-parameter-options'] }),
        queryClient.invalidateQueries({ queryKey: ['task-group-parameter-options', variables.groupId] }),
        queryClient.invalidateQueries({ queryKey: ['task-group-parameter-options-loaded'] }),
        queryClient.invalidateQueries({ queryKey: ['task-group-parameter-options-loaded', variables.groupId] }),
        queryClient.invalidateQueries({ queryKey: ['task-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['task-templates'] }),
        queryClient.invalidateQueries({ queryKey: ['adminTaskGroups'] }),
      ])

      toast({
        title: "Éxito",
        description: "Las opciones de parámetros se guardaron correctamente.",
      })
    },
    onError: (error) => {
      console.error('❌ Error guardando opciones de parámetros:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las opciones de parámetros.",
        variant: "destructive",
      })
    }
  })
}

export function useLoadTaskGroupParameterOptions(groupId?: string) {
  return useQuery({
    queryKey: ['task-group-parameter-options-loaded', groupId],
    queryFn: async () => {
      if (!supabase || !groupId) return {}

      console.log('🔍 Cargando opciones guardadas para grupo:', groupId)

      const { data, error } = await supabase
        .from('task_group_parameter_options')
        .select('parameter_id, parameter_option_id')
        .eq('group_id', groupId)

      if (error) {
        console.error('❌ Error cargando opciones:', error)
        throw error
      }

      console.log('📋 Opciones cargadas desde BD:', data)

      // Group options by parameter_id
      const optionsMap: Record<string, string[]> = {}
      
      data?.forEach((option: any) => {
        if (!optionsMap[option.parameter_id]) {
          optionsMap[option.parameter_id] = []
        }
        optionsMap[option.parameter_id].push(option.parameter_option_id)
      })

      console.log('🗂️ Mapa de opciones procesado:', optionsMap)
      return optionsMap
    },
    enabled: !!supabase && !!groupId,
  })
}