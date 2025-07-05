import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout"
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader"
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody"
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useCreateMovementConcept, useUpdateMovementConcept, useParentMovementConcepts, type MovementConceptAdmin } from "@/hooks/use-movement-concepts-admin"
import { useCurrentUser } from "@/hooks/use-current-user"

const conceptSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  parent_id: z.string().optional(),
  is_system: z.boolean().default(false)
})

type ConceptForm = z.infer<typeof conceptSchema>

interface NewAdminMovementConceptModalProps {
  open: boolean
  onClose: () => void
  editingConcept?: MovementConceptAdmin | null
}

export function NewAdminMovementConceptModal({
  open,
  onClose,
  editingConcept
}: NewAdminMovementConceptModalProps) {
  const { data: userData } = useCurrentUser()
  const { data: parentConcepts = [] } = useParentMovementConcepts()
  const createMutation = useCreateMovementConcept()
  const updateMutation = useUpdateMovementConcept()

  const form = useForm<ConceptForm>({
    resolver: zodResolver(conceptSchema),
    defaultValues: {
      name: editingConcept?.name || "",
      description: editingConcept?.description || "",
      parent_id: editingConcept?.parent_id || "",
      is_system: editingConcept?.is_system || false
    }
  })

  const onSubmit = async (data: ConceptForm) => {
    try {
      const conceptData = {
        ...data,
        parent_id: data.parent_id || undefined,
        organization_id: userData?.organization?.id
      }

      if (editingConcept) {
        await updateMutation.mutateAsync({
          id: editingConcept.id,
          name: conceptData.name,
          description: conceptData.description,
          parent_id: conceptData.parent_id || undefined,
          is_system: conceptData.is_system
        })
      } else {
        await createMutation.mutateAsync(conceptData)
      }

      form.reset()
      onClose()
    } catch (error) {
      console.error('Error saving movement concept:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <CustomModalLayout 
      open={open} 
      onClose={handleClose}
      children={{
        header: (
          <CustomModalHeader 
            title={editingConcept ? "Editar Concepto de Movimiento" : "Nuevo Concepto de Movimiento"} 
            onClose={handleClose} 
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="concept-form">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del concepto" {...field} />
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
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción del concepto"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concepto Padre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar concepto padre (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin concepto padre</SelectItem>
                          {parentConcepts.map((concept: any) => (
                            <SelectItem key={concept.id} value={concept.id}>
                              {concept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_system"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Concepto del Sistema</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Los conceptos del sistema no pueden ser eliminados por usuarios
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CustomModalBody>
        ),
        footer: (
          <div className="p-2 border-t border-[var(--card-border)] mt-auto">
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="w-1/4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="concept-form"
                className="w-3/4"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : (editingConcept ? "Actualizar Concepto" : "Crear Concepto")}
              </Button>
            </div>
          </div>
        )
      }}
    />
  )
}