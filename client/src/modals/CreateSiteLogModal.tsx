import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'

const createSiteLogSchema = z.object({
  log_date: z.date({
    required_error: "La fecha es requerida",
  }),
  created_by: z.string().min(1, 'El creador es requerido'),
  entry_type: z.string().min(1, 'El tipo de entrada es requerido'),
  weather: z.string().optional(),
  comments: z.string().min(1, 'Los comentarios son requeridos'),
  is_public: z.boolean().default(false),
  is_favorite: z.boolean().default(false)
})

type CreateSiteLogForm = z.infer<typeof createSiteLogSchema>

interface CreateSiteLogModalProps {
  open: boolean
  onClose: () => void
  editingSiteLog?: any | null
}

export function CreateSiteLogModal({ open, onClose, editingSiteLog }: CreateSiteLogModalProps) {
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id
  const organizationId = userData?.preferences?.last_organization_id
  const { data: organizationMembers = [] } = useOrganizationMembers(organizationId)
  
  const form = useForm<CreateSiteLogForm>({
    resolver: zodResolver(createSiteLogSchema),
    defaultValues: {
      log_date: editingSiteLog ? new Date(editingSiteLog.log_date) : new Date(),
      created_by: editingSiteLog?.created_by || userData?.user?.id || '',
      entry_type: editingSiteLog?.entry_type || '',
      weather: editingSiteLog?.weather || '',
      comments: editingSiteLog?.comments || '',
      is_public: editingSiteLog?.is_public || false,
      is_favorite: editingSiteLog?.is_favorite || false
    }
  })

  const createSiteLogMutation = useMutation({
    mutationFn: async (formData: CreateSiteLogForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      if (!projectId) {
        throw new Error('Project ID not available')
      }

      const siteLogData = {
        log_date: formData.log_date.toISOString().split('T')[0], // Format as date string
        entry_type: formData.entry_type,
        comments: formData.comments,
        weather: formData.weather || null,
        is_public: formData.is_public,
        is_favorite: formData.is_favorite,
        project_id: projectId,
        created_by: formData.created_by,
        ...(!editingSiteLog && { created_at: new Date().toISOString() })
      }

      console.log(editingSiteLog ? 'Updating site log with data:' : 'Creating site log with data:', siteLogData)

      let data, error
      
      if (editingSiteLog) {
        const result = await supabase
          .from('site_logs')
          .update(siteLogData)
          .eq('id', editingSiteLog.id)
          .select()
        data = result.data
        error = result.error
      } else {
        const result = await supabase
          .from('site_logs')
          .insert([siteLogData])
          .select()
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('Supabase error with site log:', error)
        throw new Error(`Error al ${editingSiteLog ? 'actualizar' : 'crear'} bitácora: ${error.message}`)
      }

      console.log('Site log saved successfully:', data[0])
      return data[0]
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: `Entrada de bitácora ${editingSiteLog ? 'actualizada' : 'creada'} correctamente`
      })
      queryClient.invalidateQueries({ queryKey: ['bitacora', projectId] })
      form.reset()
      onClose()
    },
    onError: (error: any) => {
      console.error(`Error ${editingSiteLog ? 'updating' : 'creating'} site log:`, error)
      toast({
        title: "Error",
        description: error.message || `No se pudo ${editingSiteLog ? 'actualizar' : 'crear'} la entrada de bitácora`,
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (data: CreateSiteLogForm) => {
    createSiteLogMutation.mutate(data)
  }

  const entryTypeOptions = [
    { value: 'avance', label: 'Avance' },
    { value: 'incidente', label: 'Incidente' },
    { value: 'entrega', label: 'Entrega' },
    { value: 'nota', label: 'Nota' }
  ]

  const header = (
    <CustomModalHeader
      title={editingSiteLog ? "Editar Entrada de Bitácora" : "Nueva Entrada de Bitácora"}
      description={editingSiteLog ? "Modifica la entrada de bitácora" : "Registra una nueva entrada en la bitácora del proyecto"}
      onClose={onClose}
    />
  )

  const body = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0" id="site-log-form">
        <CustomModalBody padding="md">
          <div className="space-y-4">
            {/* 1. Fecha del Log */}
            <FormField
              control={form.control}
              name="log_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium">Fecha del log</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Creador */}
            <FormField
              control={form.control}
              name="created_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Creador</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar creador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {organizationMembers.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                              {member.users?.full_name?.charAt(0) || member.users?.email?.charAt(0)}
                            </div>
                            <span>{member.users?.full_name || member.users?.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 3. Tipo de Entrada */}
            <FormField
              control={form.control}
              name="entry_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tipo de entrada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de entrada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entryTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 4. Clima */}
            <FormField
              control={form.control}
              name="weather"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Clima</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Condiciones climáticas (opcional)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 5. Comentarios */}
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Comentarios</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe los detalles de esta entrada..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. Es Público */}
            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Entrada pública
                    </FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Esta entrada será visible para todos los miembros del proyecto
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* 7. Es Favorito */}
            <FormField
              control={form.control}
              name="is_favorite"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium">
                      Marcar como favorito
                    </FormLabel>
                    <div className="text-xs text-muted-foreground">
                      Esta entrada aparecerá destacada en la bitácora
                    </div>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </CustomModalBody>
      </form>
    </Form>
  )

  const footer = (
    <CustomModalFooter
      onCancel={onClose}
      onSubmit={() => {
        const formElement = document.getElementById('site-log-form') as HTMLFormElement
        if (formElement) {
          formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
        }
      }}
      submitLabel={editingSiteLog ? "Actualizar" : "Guardar"}
      disabled={createSiteLogMutation.isPending}
    />
  )

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  )
}