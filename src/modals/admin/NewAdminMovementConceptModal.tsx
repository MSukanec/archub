import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CustomModalLayout } from "@/components/modal/legacy/CustomModalLayout"
import { CustomModalHeader } from "@/components/modal/legacy/CustomModalHeader"
import { CustomModalBody } from "@/components/modal/legacy/CustomModalBody"
import { CustomModalFooter } from "@/components/modal/legacy/CustomModalFooter"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const { userData } = useCurrentUser()
  const { data: parentConcepts } = useParentMovementConcepts()
  const createConceptMutation = useCreateMovementConcept()
  const updateConceptMutation = useUpdateMovementConcept()

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
    if (!userData?.organization) return

    try {
      if (editingConcept) {
        await updateConceptMutation.mutateAsync({
          id: editingConcept.id,
          ...data
        })
      } else {
        await createConceptMutation.mutateAsync({
          ...data,
          organization_id: data.is_system ? undefined : userData.organization.id
        })
      }
      
      form.reset()
      onClose()
    } catch (error) {
      console.error('Error saving concept:', error)
    }
  }

  const isLoading = createConceptMutation.isPending || updateConceptMutation.isPending

  return (
    <CustomModalLayout open={open} onClose={onClose}>
      <CustomModalHeader 
        title={editingConcept ? "Editar Concepto" : "Nuevo Concepto"}
        onClose={onClose}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CustomModalBody columns={1}>
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
                      className="min-h-[80px]"
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
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar concepto padre (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin concepto padre</SelectItem>
                      {parentConcepts?.map((concept) => (
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
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Concepto del Sistema
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Los conceptos del sistema son globales y no se pueden eliminar
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
          </CustomModalBody>

          <CustomModalFooter
            onSave={() => form.handleSubmit(onSubmit)()}
            saveText={editingConcept ? "Actualizar" : "Crear"}
            saveDisabled={isLoading}
            onCancel={onClose}
          />
        </form>
      </Form>
    </CustomModalLayout>
  )
}