import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useCreateBoard } from '../hooks/use-boards'

const boardSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

type BoardFormData = z.infer<typeof boardSchema>

export interface BoardFormFieldsProps {
  projectId?: string
  organizationId?: string
  mode?: 'create' | 'edit' | 'view'
  onSuccess: () => void
  onCancel: () => void
  hideActions?: boolean
  formRef?: React.RefObject<HTMLFormElement>
}

export function BoardFormFields({
  projectId,
  mode = 'create',
  onSuccess,
  onCancel,
  hideActions = false,
  formRef,
}: BoardFormFieldsProps) {
  const { toast } = useToast()
  const createMutation = useCreateBoard()

  const form = useForm<BoardFormData>({
    resolver: zodResolver(boardSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const isSubmitting = createMutation.isPending

  const onSubmit = async (data: BoardFormData) => {
    if (!projectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay proyecto seleccionado' })
      return
    }

    try {
      await createMutation.mutateAsync({
        name: data.name,
        description: data.description || null,
        project_id: projectId,
      })
      toast({ 
        title: 'Tablero creado', 
        description: `"${data.name}" está listo. Puedes agregar pins.`,
        variant: 'default'
      })
      onSuccess()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al crear tablero', description: error.message })
    }
  }

  if (mode === 'view') {
    return (
      <div className="w-full space-y-6">
        {!hideActions && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del tablero</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Referencias de fachadas"
                  data-testid="input-board-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción (opcional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe el propósito de este tablero..."
                  rows={3}
                  data-testid="input-board-description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-[3]">
              {isSubmitting ? 'Creando...' : 'Crear Tablero'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
