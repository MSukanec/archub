import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre del material es requerido'),
  unit_id: z.string().optional(),
  cost: z.number().min(0, 'El costo debe ser mayor o igual a 0'),
  category_id: z.string().optional()
})

type MaterialForm = z.infer<typeof materialSchema>

interface Material {
  id: string
  name: string
  unit_id: string
  cost: number
  category_id: string
  created_at: string
}

interface NewAdminMaterialModalProps {
  open: boolean
  onClose: () => void
  material?: Material | null
}

export function NewAdminMaterialModal({ open, onClose, material }: NewAdminMaterialModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      unit_id: '',
      cost: 0,
      category_id: ''
    }
  })

  // Reset form when modal opens or material changes
  useEffect(() => {
    if (open) {
      if (material) {
        form.reset({
          name: material.name,
          unit_id: material.unit_id || '',
          cost: material.cost || 0,
          category_id: material.category_id || ''
        })
      } else {
        form.reset({
          name: '',
          unit_id: '',
          cost: 0,
          category_id: ''
        })
      }
    }
  }, [open, material, form])

  const saveMaterialMutation = useMutation({
    mutationFn: async (data: MaterialForm) => {
      if (!supabase) throw new Error('Supabase not initialized')

      const materialData = {
        name: data.name,
        unit_id: data.unit_id || null,
        cost: data.cost || 0,
        category_id: data.category_id || null
      }

      if (material) {
        const { error } = await supabase
          .from('materials')
          .update(materialData)
          .eq('id', material.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('materials')
          .insert([materialData])
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-materials'] })
      toast({
        title: material ? "Material actualizado" : "Material creado",
        description: material ? "El material ha sido actualizado correctamente." : "El material ha sido creado correctamente."
      })
      onClose()
    },
    onError: () => {
      toast({
        title: "Error",
        description: material ? "No se pudo actualizar el material." : "No se pudo crear el material.",
        variant: "destructive"
      })
    }
  })

  const onSubmit = (data: MaterialForm) => {
    saveMaterialMutation.mutate(data)
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={material ? 'Editar Material' : 'Nuevo Material'}
            onClose={handleClose}
          />
        ),
        body: (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="material-form">
              <CustomModalBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="required-asterisk">Nombre del Material</FormLabel>
                          <FormControl>
                            <Input placeholder="Ingresa el nombre del material" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Costo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-1">
                    <FormField
                      control={form.control}
                      name="unit_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidad</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar unidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="m2">Metro cuadrado (m²)</SelectItem>
                              <SelectItem value="m3">Metro cúbico (m³)</SelectItem>
                              <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                              <SelectItem value="un">Unidad (un)</SelectItem>
                              <SelectItem value="m">Metro (m)</SelectItem>
                              <SelectItem value="lt">Litro (lt)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="construction">Construcción</SelectItem>
                              <SelectItem value="electrical">Eléctrico</SelectItem>
                              <SelectItem value="plumbing">Plomería</SelectItem>
                              <SelectItem value="painting">Pintura</SelectItem>
                              <SelectItem value="flooring">Pisos</SelectItem>
                              <SelectItem value="roofing">Techos</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CustomModalBody>
            </form>
          </Form>
        ),
        footer: (
          <CustomModalFooter
            onClose={handleClose}
            isSubmitting={saveMaterialMutation.isPending}
            submitForm="material-form"
            submitLabel={material ? 'Actualizar' : 'Crear'}
          />
        )
      }}
    </CustomModalLayout>
  )
}