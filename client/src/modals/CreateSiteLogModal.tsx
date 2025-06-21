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

const createSiteLogSchema = z.object({
  log_date: z.date({
    required_error: "La fecha es requerida",
  }),
  title: z.string().min(1, 'El título es requerido'),
  entry_type: z.string().min(1, 'El tipo de entrada es requerido'),
  comments: z.string().min(1, 'Los comentarios son requeridos'),
  weather: z.string().optional(),
  is_public: z.boolean().default(false),
  is_favorite: z.boolean().default(false)
})

type CreateSiteLogForm = z.infer<typeof createSiteLogSchema>

interface CreateSiteLogModalProps {
  open: boolean
  onClose: () => void
}

export function CreateSiteLogModal({ open, onClose }: CreateSiteLogModalProps) {
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const projectId = userData?.preferences?.last_project_id
  
  const form = useForm<CreateSiteLogForm>({
    resolver: zodResolver(createSiteLogSchema),
    defaultValues: {
      log_date: new Date(),
      title: '',
      entry_type: '',
      comments: '',
      weather: '',
      is_public: false,
      is_favorite: false
    }
  })

  const createSiteLogMutation = useMutation({
    mutationFn: async (formData: CreateSiteLogForm) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      if (!projectId || !userData?.user?.id) {
        throw new Error('Project ID or User ID not available')
      }

      const siteLogData = {
        log_date: formData.log_date.toISOString().split('T')[0], // Format as date string
        title: formData.title,
        entry_type: formData.entry_type,
        comments: formData.comments,
        weather: formData.weather || null,
        is_public: formData.is_public,
        is_favorite: formData.is_favorite,
        project_id: projectId,
        created_by: userData.user.id,
        created_at: new Date().toISOString()
      }

      console.log('Creating site log with data:', siteLogData)

      const { data, error } = await supabase
        .from('site_logs')
        .insert([siteLogData])
        .select()

      if (error) {
        console.error('Supabase error creating site log:', error)
        throw new Error(`Error al crear bitácora: ${error.message}`)
      }

      console.log('Site log created successfully:', data[0])
      return data[0]
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Entrada de bitácora creada correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['bitacora', projectId] })
      form.reset()
      onClose()
    },
    onError: (error: any) => {
      console.error('Error creating site log:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la entrada de bitácora",
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
      title="Nueva Entrada de Bitácora"
      description="Registra una nueva entrada en la bitácora del proyecto"
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

            {/* 2. Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Título de la entrada..."
                      {...field}
                    />
                  </FormControl>
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

            {/* 4. Comentarios */}
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

            {/* 5. Clima */}
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
      submitLabel="Guardar"
      disabled={createSiteLogMutation.isPending}
    />
  )

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {{ header, body, footer }}
    </CustomModalLayout>
  )
}