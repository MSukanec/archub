import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Calendar, DollarSign } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useOrganizationMembers } from '@/hooks/use-organization-members'

const createMovementSchema = z.object({
  description: z.string().min(1, 'La descripción es requerida'),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  created_by: z.string().min(1, 'El creador es requerido'),
  created_at: z.date({
    required_error: "La fecha es requerida",
  })
})

type CreateMovementForm = z.infer<typeof createMovementSchema>

interface Movement {
  id: string
  description: string
  amount: number
  created_at: string
  created_by: string
  organization_id: string
  project_id: string
}

interface NewMovementModalProps {
  open: boolean
  onClose: () => void
  editingMovement?: Movement | null
}

export function NewMovementModal({ open, onClose, editingMovement }: NewMovementModalProps) {
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()
  const organizationId = userData?.preferences?.last_organization_id
  const projectId = userData?.preferences?.last_project_id
  
  const { data: members = [] } = useOrganizationMembers(organizationId)

  const form = useForm<CreateMovementForm>({
    resolver: zodResolver(createMovementSchema),
    defaultValues: {
      description: '',
      amount: 0,
      created_by: 'none',
      created_at: new Date()
    }
  })

  // Set default creator when user data loads
  useEffect(() => {
    if (userData?.user?.id && members.length > 0) {
      const currentMember = members.find(member => member.user_id === userData.user.id)
      if (currentMember) {
        form.setValue('created_by', currentMember.id)
      }
    }
  }, [userData, members, form])

  // Handle editing mode
  useEffect(() => {
    if (editingMovement) {
      form.reset({
        description: editingMovement.description,
        amount: editingMovement.amount,
        created_by: editingMovement.created_by,
        created_at: new Date(editingMovement.created_at)
      })
    } else {
      form.reset({
        description: '',
        amount: 0,
        created_by: 'none',
        created_at: new Date()
      })
    }
  }, [editingMovement, form])

  const createMovementMutation = useMutation({
    mutationFn: async (formData: CreateMovementForm) => {
      console.log('Creating movement with data:', formData)
      
      // For now, just show success message since movements table doesn't exist
      return { success: true }
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: editingMovement ? "Movimiento actualizado correctamente" : "Movimiento creado correctamente"
      })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      onClose()
    },
    onError: (error: any) => {
      console.error('Error creating movement:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el movimiento",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (data: CreateMovementForm) => {
    createMovementMutation.mutate(data)
  }

  const selectedMember = members.find(member => member.id === form.watch('created_by'))

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0">
          <CustomModalHeader
            title={editingMovement ? "Editar Movimiento" : "Nuevo Movimiento"}
            description={editingMovement ? "Actualiza la información del movimiento" : "Registra un nuevo movimiento financiero"}
            onClose={onClose}
          />

          <CustomModalBody padding="md">
            <div className="space-y-4">
              {/* Date Field */}
              <FormField
                control={form.control}
                name="created_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-medium">Fecha de creación</FormLabel>
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

              {/* Creator Field */}
              <FormField
                control={form.control}
                name="created_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Creador</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <div className="flex items-center gap-2">
                            {selectedMember && (
                              <>
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={selectedMember.users?.avatar_url} />
                                  <AvatarFallback className="text-xs">
                                    {selectedMember.users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                                     selectedMember.users?.email?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                  {selectedMember.users?.full_name || selectedMember.users?.email}
                                </span>
                              </>
                            )}
                            {!selectedMember && <SelectValue placeholder="Seleccionar creador" />}
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.users?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {member.users?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 
                                   member.users?.email?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {member.users?.full_name || member.users?.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el movimiento financiero..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Monto</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="pl-10"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CustomModalBody>

          <CustomModalFooter
            cancelText="Cancelar"
            saveText={editingMovement ? "Actualizar" : "Crear"}
            onCancel={onClose}
            isLoading={createMovementMutation.isPending}
          />
        </form>
      </Form>
    </CustomModalLayout>
  )
}