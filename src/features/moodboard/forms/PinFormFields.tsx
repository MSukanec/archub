import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useCreatePin } from '../hooks/use-create-pin'
import { useBoards } from '../hooks/use-boards'
import { cn } from '@/lib/utils'

const pinSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  source_url: z.string().url('URL inválida').optional().or(z.literal('')),
  board_id: z.string().optional(),
})

type PinFormData = z.infer<typeof pinSchema>

export interface PinFormFieldsProps {
  projectId?: string
  organizationId?: string
  mode?: 'create' | 'edit' | 'view'
  onSuccess: () => void
  onCancel: () => void
  hideActions?: boolean
  formRef?: React.RefObject<HTMLFormElement>
}

export function PinFormFields({
  projectId,
  mode = 'create',
  onSuccess,
  onCancel,
  hideActions = false,
  formRef,
}: PinFormFieldsProps) {
  const { toast } = useToast()
  const createMutation = useCreatePin()
  const { data: boards = [] } = useBoards(projectId)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const form = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      title: '',
      source_url: '',
      board_id: '',
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const removeImage = () => {
    setSelectedFile(null)
    setPreview(null)
  }

  const isSubmitting = createMutation.isPending

  const onSubmit = async (data: PinFormData) => {
    if (!projectId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No hay proyecto seleccionado' })
      return
    }

    if (!selectedFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar una imagen' })
      return
    }

    try {
      await createMutation.mutateAsync({
        title: data.title,
        source_url: data.source_url || undefined,
        project_id: projectId,
        board_id: data.board_id || undefined,
        file: selectedFile,
      })
      toast({ 
        title: 'Pin guardado', 
        description: `"${data.title}" se agregó a tu moodboard.`,
        variant: 'default'
      })
      onSuccess()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error al crear pin', description: error.message })
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
        <div className="space-y-2">
          <FormLabel>Imagen</FormLabel>
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              )}
              data-testid="dropzone-pin-image"
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-muted">
                  {isDragActive ? (
                    <Upload className="h-6 w-6 text-primary" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isDragActive ? (
                    <span className="text-primary font-medium">Suelta la imagen aquí</span>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">Haz clic para subir</span>
                      {' '}o arrastra una imagen
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF o WEBP (máx. 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Ej: Fachada moderna con madera"
                  data-testid="input-pin-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de origen (opcional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://..."
                  data-testid="input-pin-source-url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {boards.length > 0 && (
          <FormField
            control={form.control}
            name="board_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tablero (opcional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-pin-board">
                      <SelectValue placeholder="Selecciona un tablero o deja vacío para 'Inspiración'" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {boards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {!hideActions && (
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedFile} className="flex-[3]">
              {isSubmitting ? 'Creando...' : 'Crear Pin'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}
