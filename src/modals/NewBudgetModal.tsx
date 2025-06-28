import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'

import { CustomModalLayout } from '@/components/ui-custom/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  status: z.string().min(1, 'El estado es requerido'),
  created_at: z.date()
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface NewBudgetModalProps {
  open: boolean
  onClose: () => void
  editingBudget?: any
}

export function NewBudgetModal({ open, onClose, editingBudget }: NewBudgetModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: userData } = useCurrentUser()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'draft',
      created_at: new Date()
    }
  })

  // Pre-populate form when editing
  useEffect(() => {
    if (editingBudget) {
      form.reset({
        name: editingBudget.name || '',
        description: editingBudget.description || '',
        status: editingBudget.status || 'draft',
        created_at: editingBudget.created_at ? new Date(editingBudget.created_at) : new Date()
      })
    } else {
      form.reset({
        name: '',
        description: '',
        status: 'draft',
        created_at: new Date()
      })
    }
  }, [editingBudget, form])

  const createBudgetMutation = useMutation({
    mutationFn: async (data: BudgetFormData) => {
      if (!supabase || !userData?.organization?.id || !userData?.preferences?.last_project_id) {
        throw new Error('Missing required data')
      }

      const budgetData = {
        name: data.name,
        description: data.description || null,
        project_id: userData.preferences.last_project_id,
        organization_id: userData.organization.id,
        status: data.status,
        created_at: data.created_at.toISOString(),
        created_by: userData.user.id
      }

      if (editingBudget) {
        const { data: result, error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingBudget.id)
          .select()
          .single()

        if (error) throw error
        return result
      } else {
        const { data: result, error } = await supabase
          .from('budgets')
          .insert(budgetData)
          .select()
          .single()

        if (error) throw error
        return result
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({
        title: editingBudget ? "Presupuesto actualizado" : "Presupuesto creado",
        description: editingBudget 
          ? "El presupuesto ha sido actualizado correctamente"
          : "El presupuesto ha sido creado correctamente",
      })
      onClose()
      form.reset()
    },
    onError: (error) => {
      console.error('Error saving budget:', error)
      toast({
        title: "Error",
        description: editingBudget 
          ? "No se pudo actualizar el presupuesto"
          : "No se pudo crear el presupuesto",
        variant: "destructive",
      })
    },
    onSettled: () => {
      setIsLoading(false)
    }
  })

  const onSubmit = (data: BudgetFormData) => {
    setIsLoading(true)
    createBudgetMutation.mutate(data)
  }

  const handleCancel = () => {
    form.reset()
    onClose()
  }

  const modalContent = {
    header: (
      <CustomModalHeader
        title={editingBudget ? "Editar Presupuesto" : "Nuevo Presupuesto"}
        description={editingBudget 
          ? "Modifica los datos del presupuesto" 
          : "Crea un nuevo presupuesto para el proyecto"
        }
        onClose={onClose}
      />
    ),
    body: (
      <CustomModalBody padding="md">
        <Form {...form}>
          <form id="budget-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Fecha de creación */}
            <FormField
              control={form.control}
              name="created_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="required-asterisk">Fecha de creación</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
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

            {/* Nombre del presupuesto */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required-asterisk">Nombre del presupuesto</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ej: Presupuesto Obra Gruesa"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción opcional del presupuesto..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Estado */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="required-asterisk">Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CustomModalBody>
    ),
    footer: (
      <CustomModalFooter
        onCancel={handleCancel}
        onSave={form.handleSubmit(onSubmit)}
        saveText={editingBudget ? "Actualizar" : "Crear"}
        saveForm="budget-form"
        isLoading={isLoading}
      />
    )
  }

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      {modalContent}
    </CustomModalLayout>
  )
}